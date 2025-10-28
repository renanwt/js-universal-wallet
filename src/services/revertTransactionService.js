const { getDbConnection } = require('../utils/dbHelper');
const assetRepositoryFactory = require('../repositories/assetRepository');
const transactionRepositoryFactory = require('../repositories/transactionRepository');
const yahooFinanceHelper = require('../utils/yahooFinanceHelper');
const { runStatement } = require('../utils/sqliteHelper');

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const adjustAssetAfterRevert = (currentAmount, currentAvgPrice, quantity, pricePerUnit, transactionType) => {
  const absQuantity = Math.abs(toNumber(quantity));
  const amountBefore = toNumber(currentAmount);
  const avgPriceBefore = toNumber(currentAvgPrice);

  const newAmount =
    transactionType === 'Buy'
      ? amountBefore - absQuantity
      : amountBefore + absQuantity;

  const newAvgPrice =
    newAmount > 0
      ? (amountBefore * avgPriceBefore - absQuantity * toNumber(pricePerUnit)) /
        newAmount
      : 0;

  return {
    newAmount,
    newAvgPrice,
  };
};

module.exports = () => {
  return {
    async revertTransaction(transactionId) {
      const db = await getDbConnection();
      const assetRepository = assetRepositoryFactory(db);
      const transactionRepository = transactionRepositoryFactory(db);

      const transaction = await transactionRepository.getTransactionWithAssetById(
        transactionId
      );
      if (!transaction) {
        throw new Error('Original transaction not found.');
      }

      const pairedType = transaction.TransactionType === 'Buy' ? 'Sell' : 'Buy';
      const pairedTransaction = await transactionRepository.getPairedTransaction(
        transaction.TransactionDate,
        pairedType,
        transaction.TransactionID
      );

      if (!pairedTransaction) {
        throw new Error('Paired transaction not found.');
      }

      const currentExchangeRate =
        await yahooFinanceHelper.getExchangeRateUSD_BRL();
      const revertDate = new Date().toISOString();

      const primaryAdjustments = adjustAssetAfterRevert(
        transaction.AmountInWallet,
        transaction.AvgPrice,
        transaction.Quantity,
        transaction.PricePerUnit,
        transaction.TransactionType
      );

      const pairedAdjustments = adjustAssetAfterRevert(
        pairedTransaction.AmountInWallet,
        pairedTransaction.AvgPrice,
        pairedTransaction.Quantity,
        pairedTransaction.PricePerUnit,
        pairedTransaction.TransactionType
      );

      await runStatement(db, 'BEGIN TRANSACTION');
      try {
        await assetRepository.updateAsset(transaction.AssetID, {
          AmountInWallet: primaryAdjustments.newAmount,
          AvgPrice: primaryAdjustments.newAvgPrice,
        });

        await assetRepository.updateAsset(pairedTransaction.AssetID, {
          AmountInWallet: pairedAdjustments.newAmount,
          AvgPrice: pairedAdjustments.newAvgPrice,
        });

        await transactionRepository.createTransaction({
          AssetID: transaction.AssetID,
          TransactionDate: revertDate,
          Quantity: -transaction.Quantity,
          PricePerUnit: transaction.PricePerUnit,
          TransactionType: transaction.TransactionType === 'Buy' ? 'Sell' : 'Buy',
          ExchangeRateUSD_BRL: currentExchangeRate,
        });

        await transactionRepository.createTransaction({
          AssetID: pairedTransaction.AssetID,
          TransactionDate: revertDate,
          Quantity: -pairedTransaction.Quantity,
          PricePerUnit: pairedTransaction.PricePerUnit,
          TransactionType:
            pairedTransaction.TransactionType === 'Buy' ? 'Sell' : 'Buy',
          ExchangeRateUSD_BRL: currentExchangeRate,
        });

        await runStatement(db, 'COMMIT');

        return {
          message: 'Conversion successfully reverted',
          details: {
            originalTransaction: {
              asset: transaction.AssetSymbol,
              quantity: transaction.Quantity,
              type: transaction.TransactionType,
            },
            pairedTransaction: {
              asset: pairedTransaction.AssetSymbol,
              quantity: pairedTransaction.Quantity,
              type: pairedTransaction.TransactionType,
            },
            revertDate,
          },
        };
      } catch (error) {
        await runStatement(db, 'ROLLBACK');
        throw error;
      }
    },
  };
};
