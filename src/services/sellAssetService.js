const { getDbConnection } = require('../utils/dbHelper');
const assetRepositoryFactory = require('../repositories/assetRepository');
const transactionRepositoryFactory = require('../repositories/transactionRepository');
const { runStatement } = require('../utils/sqliteHelper');

module.exports = () => {
  return {
    async sellAsset(requestBody) {
      const db = await getDbConnection();
      const assetRepository = assetRepositoryFactory(db);
      const transactionRepository = transactionRepositoryFactory(db);

      const {
        AssetSymbol,
        Quantity,
        PricePerUnit,
        ExchangeRateUSD_BRL,
        Info,
      } = requestBody;

      const quantity = Number(Quantity);
      const rawPricePerUnit = Number(PricePerUnit);
      const exchangeRate = Number(ExchangeRateUSD_BRL);

      if (Number.isNaN(quantity) || quantity <= 0) {
        throw new Error('Quantity must be a positive number.');
      }

      if (Number.isNaN(rawPricePerUnit) || rawPricePerUnit < 0) {
        throw new Error('PricePerUnit must be a valid number.');
      }

      if (Number.isNaN(exchangeRate)) {
        throw new Error('ExchangeRateUSD_BRL must be a valid number.');
      }

      const existingAsset = await assetRepository.getAssetBySymbol(AssetSymbol);
      if (!existingAsset) {
        throw new Error('Asset not found.');
      }

      const currentAmount = Number(existingAsset.AmountInWallet) || 0;
      const currency =
        existingAsset.Currency || ([2, 3, 7, 8].includes(existingAsset.AssetTypeID) ? 'BRL' : 'USD');

      if (currency === 'USD' && (Number.isNaN(exchangeRate) || exchangeRate <= 0)) {
        throw new Error('ExchangeRateUSD_BRL must be a valid positive number for USD assets.');
      }

      const pricePerUnit =
        existingAsset.AssetTypeID === 8
          ? rawPricePerUnit
          : currency === 'USD'
            ? rawPricePerUnit / exchangeRate
            : rawPricePerUnit;

      let newAmountInWallet = currentAmount - quantity;
      let newAvgPrice = Number(existingAsset.AvgPrice) || 0;

      if (existingAsset.AssetTypeID === 8) {
        if (currentAmount < rawPricePerUnit) {
          throw new Error('Not enough balance to sell from cash asset.');
        }
        newAmountInWallet = currentAmount - rawPricePerUnit;
        newAvgPrice = 1;
      } else if (currentAmount < quantity) {
        throw new Error('Not enough assets in wallet to sell.');
      }

      await runStatement(db, 'BEGIN TRANSACTION');
      try {
        await assetRepository.updateAsset(existingAsset.AssetID, {
          AmountInWallet: newAmountInWallet,
          AvgPrice: newAvgPrice,
        });

        await transactionRepository.createTransaction({
          AssetID: existingAsset.AssetID,
          Quantity: quantity,
          PricePerUnit: pricePerUnit,
          TransactionType: 'Sell',
          ExchangeRateUSD_BRL: exchangeRate,
          Info: Info ?? null,
        });

        await runStatement(db, 'COMMIT');
      } catch (error) {
        await runStatement(db, 'ROLLBACK');
        throw error;
      }

      return {
        message: 'Asset successfully sold.',
        assetId: existingAsset.AssetID,
      };
    },
  };
};
