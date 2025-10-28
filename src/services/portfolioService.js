const { getDbConnection } = require('../utils/dbHelper');
const assetRepositoryFactory = require('../repositories/assetRepository');
const yahooFinanceHelper = require('../utils/yahooFinanceHelper');

const USD_ASSET_TYPES = new Set([1, 4, 5, 6]);
const BRL_ASSET_TYPES = new Set([2, 3, 7]);
const CASH_ASSET_TYPE = 8;

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const toPercentageString = (value) => value.toFixed(2);
const toMoneyString = (value) => value.toFixed(2);

const buildQuoteSymbol = (asset) => {
  if (asset.AssetTypeID === 1) {
    return `${asset.AssetSymbol}-USD`;
  }
  if (BRL_ASSET_TYPES.has(asset.AssetTypeID)) {
    return `${asset.AssetSymbol}.SA`;
  }
  return asset.AssetSymbol;
};

const computeUsdAssetMetrics = (asset, currentPrice, exchangeRate) => {
  const amount = toNumber(asset.AmountInWallet);
  const avgPriceRaw = toNumber(asset.AvgPrice);
  const currency =
    asset.Currency || (USD_ASSET_TYPES.has(asset.AssetTypeID) ? 'USD' : 'BRL');
  const avgPrice =
    currency === 'BRL' ? avgPriceRaw / (exchangeRate || 1) : avgPriceRaw;

  const totalAvgPriceUSD = avgPrice * amount;
  const currentTotalUSD = amount * currentPrice;
  const totalValueBRL = currentTotalUSD * exchangeRate;

  const profitOrLoss = currentTotalUSD - totalAvgPriceUSD;
  const profitOrLossPercentage =
    totalAvgPriceUSD > 0 ? (profitOrLoss / totalAvgPriceUSD) * 100 : 0;

  return {
    amount,
    currentPrice,
    totalValueBRL,
    avgPriceUSD: avgPrice,
    profitOrLossPercentage,
  };
};

const computeBrlAssetMetrics = (asset, currentPrice, exchangeRate) => {
  const amount = toNumber(asset.AmountInWallet);
  const avgPriceRaw = toNumber(asset.AvgPrice);
  const currency =
    asset.Currency || (BRL_ASSET_TYPES.has(asset.AssetTypeID) ? 'BRL' : 'USD');
  const avgPrice =
    currency === 'USD' ? avgPriceRaw * (exchangeRate || 1) : avgPriceRaw;

  const totalValueBRL = amount * currentPrice;
  const totalAvgPriceBRL = avgPrice * amount;
  const profitOrLoss = totalValueBRL - totalAvgPriceBRL;
  const profitOrLossPercentage =
    totalAvgPriceBRL > 0 ? (profitOrLoss / totalAvgPriceBRL) * 100 : 0;

  return {
    amount,
    currentPrice,
    totalValueBRL,
    avgPriceBRL: avgPrice,
    profitOrLossPercentage,
  };
};

const computeCashMetrics = (asset) => {
  const amount = toNumber(asset.AmountInWallet);
  const avgPrice = toNumber(asset.AvgPrice);

  return {
    amount,
    currentPrice: 1,
    totalValueBRL: amount,
    avgPriceBRL: avgPrice,
    profitOrLossPercentage: 0,
  };
};

module.exports = (dbInstance) => {
  const buildContext = async () => {
    if (dbInstance) {
      return {
        db: dbInstance,
        assetRepository: assetRepositoryFactory(dbInstance),
      };
    }

    const db = await getDbConnection();
    return {
      db,
      assetRepository: assetRepositoryFactory(db),
    };
  };

  return {
    async getAssetBreakdown({ assetTypeIDs } = {}) {
      const { assetRepository } = await buildContext();

      const normalizedTypeIds = Array.isArray(assetTypeIDs)
        ? assetTypeIDs.map((id) => Number(id)).filter((id) => !Number.isNaN(id))
        : undefined;

      const assets = await assetRepository.getAssets({
        assetTypeIDs: normalizedTypeIds,
      });

      if (!assets.length) {
        return {
          totalValueBRL: '0.00',
          totalValueUSD: '0.00',
          exchangeRateUSD_BRL: '0.00',
          assets: [],
        };
      }

      const exchangeRateUSD_BRL = await yahooFinanceHelper.getExchangeRateUSD_BRL();

      const metrics = [];
      let totalValueBRL = 0;

      for (const asset of assets) {
        if (asset.AssetTypeID === CASH_ASSET_TYPE) {
          const cashMetrics = computeCashMetrics(asset);
          metrics.push({ asset, ...cashMetrics });
          totalValueBRL += cashMetrics.totalValueBRL;
          continue;
        }

        const quoteSymbol = buildQuoteSymbol(asset);
        const quote = await yahooFinanceHelper.getQuote(quoteSymbol);
        const currentPrice = toNumber(quote.regularMarketPrice);

        if (USD_ASSET_TYPES.has(asset.AssetTypeID)) {
          const usdMetrics = computeUsdAssetMetrics(
            asset,
            currentPrice,
            exchangeRateUSD_BRL
          );
          metrics.push({ asset, ...usdMetrics });
          totalValueBRL += usdMetrics.totalValueBRL;
        } else if (BRL_ASSET_TYPES.has(asset.AssetTypeID)) {
          const brlMetrics = computeBrlAssetMetrics(asset, currentPrice, exchangeRateUSD_BRL);
          metrics.push({ asset, ...brlMetrics });
          totalValueBRL += brlMetrics.totalValueBRL;
        }
      }

      const totalValueUSD =
        exchangeRateUSD_BRL > 0 ? totalValueBRL / exchangeRateUSD_BRL : 0;

      const assetsWithPercentages = metrics.map((entry) => {
        const percentage =
          totalValueBRL > 0 ? (entry.totalValueBRL / totalValueBRL) * 100 : 0;

        const payload = {
          assetSymbol: entry.asset.AssetSymbol,
          amount: entry.amount,
          currentPrice: entry.currentPrice,
          totalBRL: toMoneyString(entry.totalValueBRL),
          profitOrLossPercentage: toPercentageString(entry.profitOrLossPercentage),
          percentageOfTotal: toPercentageString(percentage),
          assetTypeID: entry.asset.AssetTypeID,
        };

        if (entry.avgPriceUSD !== undefined) {
          payload.avgPriceUSD = toMoneyString(entry.avgPriceUSD);
        }
        if (entry.avgPriceBRL !== undefined) {
          payload.avgPriceBRL = toMoneyString(entry.avgPriceBRL);
        }

        return payload;
      });

      // Include cash-only assets that may not have been added due to zero amount
      const responseAssets = assetsWithPercentages.sort(
        (a, b) => Number(b.percentageOfTotal) - Number(a.percentageOfTotal)
      );

      return {
        totalValueBRL: toMoneyString(totalValueBRL),
        totalValueUSD: toMoneyString(totalValueUSD),
        exchangeRateUSD_BRL: toMoneyString(exchangeRateUSD_BRL),
        assets: responseAssets,
      };
    },
  };
};
