const { getDbConnection } = require('../utils/dbHelper');
const assetRepositoryFactory = require('../repositories/assetRepository');
const transactionRepositoryFactory = require('../repositories/transactionRepository');
const { runStatement } = require('../utils/sqliteHelper');

module.exports = () => {
  return {
    async buyAsset(assetData) {
      const db = await getDbConnection();
      const assetRepository = assetRepositoryFactory(db);
      const transactionRepository = transactionRepositoryFactory(db);

      const {
        AssetName,
        AssetSymbol,
        AssetTypeID,
        Quantity,
        PricePerUnit,
        ExchangeRateUSD_BRL,
      } = assetData;

      const purchaseQuantity = Number(Quantity);
      const rawPricePerUnit = Number(PricePerUnit);
      const exchangeRate = Number(ExchangeRateUSD_BRL);
      const numericAssetTypeId =
        AssetTypeID !== undefined && AssetTypeID !== null ? Number(AssetTypeID) : undefined;

      if (Number.isNaN(purchaseQuantity) || purchaseQuantity <= 0) {
        throw new Error('Quantity must be a positive number.');
      }

      if (Number.isNaN(rawPricePerUnit) || rawPricePerUnit < 0) {
        throw new Error('PricePerUnit must be a valid number.');
      }

      const existingAsset = await assetRepository.getAssetBySymbol(AssetSymbol);
      const assetTypeId = existingAsset ? existingAsset.AssetTypeID : numericAssetTypeId;
      const currency = [2, 3, 7, 8].includes(assetTypeId) ? 'BRL' : 'USD';

      if (currency === 'USD' && (Number.isNaN(exchangeRate) || exchangeRate <= 0)) {
        throw new Error('ExchangeRateUSD_BRL must be a valid positive number for USD assets.');
      }

      if (currency !== 'USD' && Number.isNaN(exchangeRate)) {
        throw new Error('ExchangeRateUSD_BRL must be a valid number.');
      }

      const pricePerUnit =
        currency === 'USD' ? rawPricePerUnit / exchangeRate : rawPricePerUnit;

      const existingAvgPriceRaw = existingAsset ? Number(existingAsset.AvgPrice) || 0 : 0;
      const normalizedExistingAvgPrice = existingAsset
        ? existingAsset.Currency === 'BRL' && currency === 'USD'
          ? existingAvgPriceRaw / exchangeRate
          : existingAsset.Currency === 'USD' && currency === 'BRL'
            ? existingAvgPriceRaw * exchangeRate
            : existingAvgPriceRaw
        : 0;

      await runStatement(db, 'BEGIN TRANSACTION');
      try {
        let assetId;
        if (existingAsset) {
          const existingAmount = Number(existingAsset.AmountInWallet) || 0;
          const existingAvgPrice = normalizedExistingAvgPrice;

          let newAmountInWallet = existingAmount + purchaseQuantity;
          let newAvgPrice =
            (existingAvgPrice * existingAmount + pricePerUnit * purchaseQuantity) /
            (newAmountInWallet || 1);

          if (existingAsset.AssetTypeID === 8) {
            newAmountInWallet = existingAmount + pricePerUnit;
            newAvgPrice = 1;
          }

          await assetRepository.updateAsset(existingAsset.AssetID, {
            AmountInWallet: newAmountInWallet,
            AvgPrice: newAvgPrice,
            Currency: currency,
          });
          assetId = existingAsset.AssetID;
        } else {
          if (!AssetName) {
            throw new Error('AssetName is required when creating a new asset.');
          }
          if (numericAssetTypeId === undefined || Number.isNaN(numericAssetTypeId)) {
            throw new Error('AssetTypeID must be a valid number when creating a new asset.');
          }

          assetId = await assetRepository.createAsset({
            AssetName,
            AssetSymbol,
            AssetTypeID: numericAssetTypeId,
            AmountInWallet: purchaseQuantity,
            AvgPrice: pricePerUnit,
            Currency: currency,
          });
        }

        await transactionRepository.createTransaction({
          AssetID: assetId,
          Quantity: purchaseQuantity,
          PricePerUnit: pricePerUnit,
          TransactionType: 'Buy',
          ExchangeRateUSD_BRL: exchangeRate,
        });

        await runStatement(db, 'COMMIT');
        return { message: 'Asset purchased successfully', assetId };
      } catch (error) {
        await runStatement(db, 'ROLLBACK');
        throw error;
      }
    },
  };
};
