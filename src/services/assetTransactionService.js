const { getDbConnection } = require('../utils/dbHelper');
const assetRepositoryFactory = require('../repositories/assetRepository');
const transactionRepositoryFactory = require('../repositories/transactionRepository');
const yahooFinanceHelper = require('../utils/yahooFinanceHelper');

const USD_ASSET_TYPES = new Set([1, 4, 5, 6]);

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const buildQuoteSymbol = (assetSymbol, assetTypeId) => {
  if (assetTypeId === 1) {
    return `${assetSymbol}-USD`;
  }
  if (USD_ASSET_TYPES.has(assetTypeId)) {
    return assetSymbol;
  }
  return `${assetSymbol}.SA`;
};

module.exports = () => {
  return {
    async getTransactionsBySymbol(assetSymbol) {
      const db = await getDbConnection();
      const assetRepository = assetRepositoryFactory(db);
      const transactionRepository = transactionRepositoryFactory(db);

      const asset = await assetRepository.getAssetBySymbol(assetSymbol);
      if (!asset) {
        return null;
      }

      const transactions = await transactionRepository.getTransactionsWithAssetBySymbol(
        assetSymbol
      );

      if (!transactions.length) {
        return {
          asset: {
            symbol: asset.AssetSymbol,
            name: asset.AssetName,
            usdAvgPrice: '0.00',
            brlAvgPrice: '0.00',
            currentPrice: '0.00',
          },
          totals: {
            totalBuyQuantity: 0,
            totalBuyValueUSD: '0.00',
            totalBuyValueBRL: '0.00',
            totalSellQuantity: 0,
            totalSellValueUSD: '0.00',
            totalSellValueBRL: '0.00',
            totalAmount: 0,
            currentValueUSD: '0.00',
            currentValueBRL: '0.00',
            profitUSD: '0.00',
            profitBRL: '0.00',
          },
          transactions: [],
        };
      }

      const assetTypeId = transactions[0].AssetTypeID;
      const quoteSymbol = buildQuoteSymbol(assetSymbol, assetTypeId);
      const quote = await yahooFinanceHelper.getQuote(quoteSymbol);
      const currentPrice = toNumber(quote.regularMarketPrice);

      let totalBuyQuantity = 0;
      let totalBuyValueUSD = 0;
      let totalBuyValueBRL = 0;
      let totalSellQuantity = 0;
      let totalSellValueUSD = 0;
      let totalSellValueBRL = 0;

      for (const transaction of transactions) {
        const quantity = Math.abs(toNumber(transaction.Quantity));
        const price = toNumber(transaction.PricePerUnit);
        const exchangeRate = toNumber(transaction.ExchangeRateUSD_BRL) || 1;

        if (transaction.TransactionType === 'Buy') {
          totalBuyQuantity += quantity;
          totalBuyValueUSD += quantity * price;
          totalBuyValueBRL += quantity * price * exchangeRate;
        } else if (transaction.TransactionType === 'Sell') {
          totalSellQuantity += quantity;
          totalSellValueUSD += quantity * price;
          totalSellValueBRL += quantity * price * exchangeRate;
        }
      }

      const usdAvg =
        totalBuyQuantity > 0 ? totalBuyValueUSD / totalBuyQuantity : 0;
      const brlAvg =
        totalBuyQuantity > 0 ? totalBuyValueBRL / totalBuyQuantity : 0;

      const totalAmount = totalBuyQuantity - totalSellQuantity;
      const exchangeRateForCurrent =
        toNumber(transactions[0].ExchangeRateUSD_BRL) || 1;
      const currentValueUSD = totalAmount * currentPrice;
      const currentValueBRL = currentValueUSD * exchangeRateForCurrent;
      const profitUSD = currentValueUSD - totalBuyValueUSD;
      const profitBRL = currentValueBRL - totalBuyValueBRL;

      return {
        asset: {
          symbol: asset.AssetSymbol,
          name: asset.AssetName,
          usdAvgPrice: usdAvg.toFixed(2),
          brlAvgPrice: brlAvg.toFixed(2),
          currentPrice: currentPrice.toFixed(2),
        },
        totals: {
          totalBuyQuantity,
          totalBuyValueUSD: totalBuyValueUSD.toFixed(2),
          totalBuyValueBRL: totalBuyValueBRL.toFixed(2),
          totalSellQuantity,
          totalSellValueUSD: totalSellValueUSD.toFixed(2),
          totalSellValueBRL: totalSellValueBRL.toFixed(2),
          totalAmount,
          currentValueUSD: currentValueUSD.toFixed(2),
          currentValueBRL: currentValueBRL.toFixed(2),
          profitUSD: profitUSD.toFixed(2),
          profitBRL: profitBRL.toFixed(2),
        },
        transactions,
      };
    },
  };
};
