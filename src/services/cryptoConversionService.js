const { getDbConnection } = require('../utils/dbHelper');
const assetRepositoryFactory = require('../repositories/assetRepository');
const transactionRepositoryFactory = require('../repositories/transactionRepository');
const { runStatement } = require('../utils/sqliteHelper');
const yahooFinanceHelper = require('../utils/yahooFinanceHelper');
const yahooFinance = require('yahoo-finance2').default;

const toNumber = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error('Numeric fields must contain valid numbers.');
  }
  return parsed;
};

const fetchExchangeRate = async (transactionDate) => {
  if (transactionDate) {
    const transactionTime = new Date(transactionDate);
    if (!Number.isNaN(transactionTime.getTime())) {
      const period1 = Math.floor(transactionTime.getTime() / 1000);
      const oneHourLater = new Date(transactionTime);
      oneHourLater.setHours(oneHourLater.getHours() + 1);
      const period2 = Math.floor(oneHourLater.getTime() / 1000);

      try {
        const chartData = await yahooFinance.chart('USDBRL=X', {
          period1,
          period2,
          interval: '1m',
        });

        if (
          chartData &&
          Array.isArray(chartData.close) &&
          chartData.close.length > 0
        ) {
          return Number(chartData.close[chartData.close.length - 1]);
        }
      } catch (error) {
        console.warn('Falling back to current exchange rate:', error.message);
      }
    }
  }

  return yahooFinanceHelper.getExchangeRateUSD_BRL();
};

module.exports = () => {
  return {
    async convert({
      FromAssetSymbol,
      ToAssetSymbol,
      ConversionAmount,
      ToAssetAmount,
      TransactionDate,
    }) {
      const conversionAmount = toNumber(ConversionAmount);
      const toAssetAmount = toNumber(ToAssetAmount);

      if (conversionAmount <= 0 || toAssetAmount <= 0) {
        throw new Error('Conversion amounts must be greater than zero.');
      }

      const exchangeRate = await fetchExchangeRate(TransactionDate);
      if (!exchangeRate) {
        throw new Error('Unable to determine USD/BRL exchange rate.');
      }

      const db = await getDbConnection();
      const assetRepository = assetRepositoryFactory(db);
      const transactionRepository = transactionRepositoryFactory(db);

      const fromAsset = await assetRepository.getAssetBySymbol(FromAssetSymbol);
      if (!fromAsset) {
        throw new Error('Source asset not found.');
      }

      const currentFromAmount = toNumber(fromAsset.AmountInWallet);
      if (currentFromAmount < conversionAmount) {
        throw new Error('Insufficient balance for conversion.');
      }

      let toAsset = await assetRepository.getAssetBySymbol(ToAssetSymbol);
      if (!toAsset) {
        const newAssetId = await assetRepository.createAsset({
          AssetName: ToAssetSymbol === 'USDT' ? 'Tether USD' : ToAssetSymbol,
          AssetSymbol: ToAssetSymbol,
          AssetTypeID: fromAsset.AssetTypeID === 1 ? 1 : fromAsset.AssetTypeID,
          AmountInWallet: 0,
          AvgPrice: 1,
          Currency: 'USD',
        });
        toAsset = await assetRepository.getAssetById(newAssetId);
      }

      const conversionRate = toAssetAmount / conversionAmount;

      await runStatement(db, 'BEGIN TRANSACTION');
      try {
        const updatedFromAmount = currentFromAmount - conversionAmount;

        await assetRepository.updateAsset(fromAsset.AssetID, {
          AmountInWallet: updatedFromAmount,
        });

        const existingToAmount = toNumber(toAsset.AmountInWallet);
        const existingToAvgPrice = Number(toAsset.AvgPrice) || 0;

        const newToAmount = existingToAmount + toAssetAmount;
        const newAvgPrice =
          newToAmount > 0
            ? (existingToAmount * existingToAvgPrice + conversionAmount) /
              newToAmount
            : conversionAmount / toAssetAmount;

        await assetRepository.updateAsset(toAsset.AssetID, {
          AmountInWallet: newToAmount,
          AvgPrice: newAvgPrice,
        });

        const transactionPayload = {
          TransactionDate: TransactionDate,
          ExchangeRateUSD_BRL: exchangeRate,
        };

        await transactionRepository.createTransaction({
          ...transactionPayload,
          AssetID: fromAsset.AssetID,
          Quantity: conversionAmount,
          PricePerUnit: 1,
          TransactionType: 'Sell',
        });

        await transactionRepository.createTransaction({
          ...transactionPayload,
          AssetID: toAsset.AssetID,
          Quantity: toAssetAmount,
          PricePerUnit: conversionAmount / toAssetAmount,
          TransactionType: 'Buy',
        });

        await runStatement(db, 'COMMIT');

        return {
          message: 'Conversion completed successfully',
          details: {
            fromAsset: FromAssetSymbol,
            toAsset: ToAssetSymbol,
            convertedFrom: conversionAmount,
            convertedTo: toAssetAmount,
            rate: conversionRate,
            exchangeRate: exchangeRate,
            transactionDate: TransactionDate || new Date().toISOString(),
          },
        };
      } catch (error) {
        await runStatement(db, 'ROLLBACK');
        throw error;
      }
    },
  };
};
