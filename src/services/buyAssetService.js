const { getDbConnection } = require('../utils/db');
const assetRepositoryFactory = require('../repositories/assetRepository');
const transactionRepositoryFactory = require('../repositories/transactionRepository');

module.exports = () => {
  return {
    async buyAsset(assetData) {
      const db = await getDbConnection();
      const assetRepository = assetRepositoryFactory(db);
      const transactionRepository = transactionRepositoryFactory(db);

      const { AssetName, AssetSymbol, AssetTypeID, Quantity, PricePerUnit, ExchangeRateUSD_BRL } = assetData;

      if (!AssetName || !AssetSymbol || !AssetTypeID || !Quantity || !PricePerUnit || ExchangeRateUSD_BRL == null) {
        throw new Error('Missing required fields');
      }

      const Currency = [2, 3, 7, 8].includes(AssetTypeID) ? 'BRL' : 'USD';
      const existingAsset = await assetRepository.getAssetBySymbol(AssetSymbol);

      let assetId;
      if (existingAsset) {
        let newAmountInWallet = parseFloat(existingAsset.AmountInWallet + Quantity);
        let newAvgPrice = ((existingAsset.AvgPrice * existingAsset.AmountInWallet) + (PricePerUnit * Quantity)) / newAmountInWallet;

        if (existingAsset.AssetTypeID === 8) {
          newAmountInWallet = existingAsset.AmountInWallet + PricePerUnit;
          newAvgPrice = 1;
        }

        await assetRepository.updateAsset(existingAsset.AssetID, newAmountInWallet, newAvgPrice);
        assetId = existingAsset.AssetID;
      } else {
        assetId = await assetRepository.createAsset(AssetName, AssetSymbol, AssetTypeID, Quantity, PricePerUnit, Currency);
      }

      await transactionRepository.createTransaction(assetId, Quantity, PricePerUnit, "Buy", ExchangeRateUSD_BRL);
      return { message: "Asset purchased successfully", assetId };
    }
  };
};
