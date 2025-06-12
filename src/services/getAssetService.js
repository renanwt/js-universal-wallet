const { getDbConnection } = require('../utils/db');
const assetRepositoryFactory = require('../repositories/assetRepository');
const yahooFinanceHelper = require('../utils/yahooFinanceHelper');

module.exports = () => {
  return {
    async getAssetData(assetTypeID) {
      const db = await getDbConnection();
      const assetRepository = assetRepositoryFactory(db);
      const assets = await assetRepository.getAssets(assetTypeID);

      const exchangeRateUSD_BRL = await yahooFinanceHelper.getExchangeRateUSD_BRL();

      const assetData = [];
      let totalValueBRL = 0;

      for (const asset of assets) {
        let assetValue = 0;
        let currentPrice = 0;

        if ([1, 4, 5, 6].includes(asset.AssetTypeID)) {
          const quote = await yahooFinanceHelper.getQuote(asset.AssetSymbol + (asset.AssetTypeID === 1 ? "-USD" : ""));
          currentPrice = quote.regularMarketPrice;
          assetValue = asset.AmountInWallet * currentPrice * exchangeRateUSD_BRL;
        } else if ([2, 3, 7].includes(asset.AssetTypeID)) {
          const quote = await yahooFinanceHelper.getQuote(asset.AssetSymbol + ".SA");
          currentPrice = quote.regularMarketPrice;
          assetValue = asset.AmountInWallet * currentPrice;
        } else if (asset.AssetTypeID === 8) {
          assetValue = parseFloat(asset.AmountInWallet);
        }

        totalValueBRL += assetValue;

        assetData.push({
          assetSymbol: asset.AssetSymbol,
          currentPrice: currentPrice,
          amount: asset.AmountInWallet,
          totalValueBRL: assetValue.toFixed(2),
          assetPercentage: totalValueBRL > 0 ? ((assetValue / totalValueBRL) * 100).toFixed(2) : 0
        });
      }

      return { totalValueBRL: totalValueBRL.toFixed(2), assets: assetData };
    }
  };
};
