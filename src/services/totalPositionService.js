const { getDbConnection } = require('../utils/dbHelper');
const assetRepositoryFactory = require('../repositories/assetRepository');
const portfolioServiceFactory = require('./portfolioService');

const CATEGORY_MAP = {
  1: 'cryptos',
  2: 'acoes',
  3: 'fiis',
  4: 'stocks',
  5: 'reits',
  6: 'US_etfs',
  7: 'BR_etfs',
  8: 'cash',
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

module.exports = () => {
  return {
    async getTotalPosition() {
      const db = await getDbConnection();
      const assetRepository = assetRepositoryFactory(db);
      const portfolioService = portfolioServiceFactory(db);

      const assets = await assetRepository.getAssets();
      if (!assets.length) {
        return {
          totalValueBRL: 0,
          totalValueUSD: 0,
          exchangeRateUSD_BRL: 0,
          top5Positions: [],
          top5Profitable: [],
          top5Loss: [],
          distribution: {},
        };
      }

      const portfolioSummary = await portfolioService.getAssetBreakdown();
      const totalValueBRL = toNumber(portfolioSummary.totalValueBRL);
      const totalValueUSD = toNumber(portfolioSummary.totalValueUSD);
      const exchangeRateUSD_BRL = toNumber(portfolioSummary.exchangeRateUSD_BRL);

      const assetMap = new Map(
        portfolioSummary.assets.map((asset) => [asset.assetSymbol, asset])
      );

      const assetValues = {};
      const profitPercentages = [];
      const lossPercentages = [];
      const distributionTotals = new Map();

      for (const asset of assets) {
        const summary = assetMap.get(asset.AssetSymbol);
        const assetValueBRL = summary ? toNumber(summary.totalBRL) : 0;
        assetValues[asset.AssetSymbol] = assetValueBRL;

        const profitPercentage = summary
          ? toNumber(summary.profitOrLossPercentage)
          : 0;

        if (assetValueBRL > 0 && profitPercentage >= 0) {
          profitPercentages.push({
            ticker: asset.AssetSymbol,
            value: assetValueBRL.toFixed(2),
            profitPercentage: profitPercentage.toFixed(2),
          });
        } else if (assetValueBRL > 0) {
          lossPercentages.push({
            ticker: asset.AssetSymbol,
            value: assetValueBRL.toFixed(2),
            lossPercentage: profitPercentage.toFixed(2),
          });
        }

        const category = CATEGORY_MAP[asset.AssetTypeID] || 'others';
        const currentTotal = distributionTotals.get(category) || 0;
        distributionTotals.set(category, currentTotal + assetValueBRL);
      }

      const assetPercentages = Object.entries(assetValues).map(
        ([ticker, value]) => ({
          ticker,
          value: value.toFixed(2),
          percentage:
            totalValueBRL > 0 ? ((value / totalValueBRL) * 100).toFixed(2) : '0.00',
        })
      );

      const top5Positions = assetPercentages
        .sort((a, b) => Number(b.percentage) - Number(a.percentage))
        .slice(0, 5);

      const top5Profitable = profitPercentages
        .sort((a, b) => Number(b.profitPercentage) - Number(a.profitPercentage))
        .slice(0, 5);

      const top5Loss = lossPercentages
        .sort((a, b) => Number(a.lossPercentage) - Number(b.lossPercentage))
        .slice(0, 5);

      const distributionEntries = Array.from(distributionTotals.entries()).map(
        ([category, value]) => [
          category,
          {
            total: Number(value.toFixed(2)),
            percentage:
              totalValueBRL > 0
                ? `${((value / totalValueBRL) * 100).toFixed(2)}%`
                : '0.00%',
          },
        ]
      );

      distributionEntries.sort((a, b) => Number(b[1].total) - Number(a[1].total));
      const distribution = Object.fromEntries(distributionEntries);

      return {
        totalValueBRL: Number(totalValueBRL.toFixed(2)),
        totalValueUSD: Number(totalValueUSD.toFixed(2)),
        exchangeRateUSD_BRL: Number(exchangeRateUSD_BRL.toFixed(2)),
        top5Positions,
        top5Profitable,
        top5Loss,
        distribution,
      };
    },
  };
};
