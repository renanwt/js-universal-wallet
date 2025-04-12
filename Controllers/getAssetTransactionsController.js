const express = require('express');
const router = express.Router();
const yahooFinance = require('yahoo-finance2').default;

module.exports = (db) => {
  router.get('/:assetSymbol', async (req, res) => {
    const { assetSymbol } = req.params;

    try {
      // Fetch all transactions for the specified asset
      db.all(
        `SELECT t.TransactionID, t.TransactionDate, t.Quantity, t.PricePerUnit, t.TransactionType, t.ExchangeRateUSD_BRL,
               a.AssetSymbol, a.AssetName, a.AvgPrice, a.AssetTypeID
        FROM Transactions t
        JOIN Assets a ON t.AssetID = a.AssetID
        WHERE a.AssetSymbol = ?
        ORDER BY t.TransactionDate ASC`,
        [assetSymbol],
        async (err, transactions) => {
          if (err) {
            console.error(err.message);
            return res.status(500).send('Error fetching transactions');
          }

          if (transactions.length === 0) {
            return res.status(404).send('No transactions found for the specified asset');
          }

          const asset = transactions[0];
          const isUSDAsset = [1, 4, 5, 6].includes(asset.AssetTypeID); // Cryptos, US Stocks, US REITs, US ETFs

          // Fetch current price for the asset using Yahoo Finance
          let currentPrice;
          try {
            if (isUSDAsset) {
              const quote = await yahooFinance.quote(assetSymbol + (asset.AssetTypeID === 1 ? '-USD' : ''));
              currentPrice = quote.regularMarketPrice;
            } else {
              const quote = await yahooFinance.quote(assetSymbol + '.SA');
              currentPrice = quote.regularMarketPrice;
            }
          } catch (error) {
            console.error('Error fetching current price:', error.message);
            return res.status(500).send('Error fetching current price for the asset');
          }

          // Initialize totals for Buy and Sell transactions
          let totalBuyQuantity = 0;
          let totalBuyValueUSD = 0;
          let totalBuyValueBRL = 0;
          let totalSellQuantity = 0;
          let totalSellValueUSD = 0;
          let totalSellValueBRL = 0;

          // Iterate over transactions to accumulate totals and calculate the averages
          transactions.forEach((transaction) => {
            if (transaction.TransactionType === 'Buy') {
              const quantity = Math.abs(transaction.Quantity);
              const price = transaction.PricePerUnit;
              const exchangeRate = transaction.ExchangeRateUSD_BRL;
              
              // Update total quantities and values in USD and BRL
              totalBuyQuantity += quantity;
              totalBuyValueUSD += quantity * price;
              totalBuyValueBRL += quantity * price * exchangeRate;
            } else if (transaction.TransactionType === 'Sell') {
              const quantity = Math.abs(transaction.Quantity);
              const price = transaction.PricePerUnit;
              const exchangeRate = transaction.ExchangeRateUSD_BRL;

              // Update total sell quantities and values in USD and BRL
              totalSellQuantity += quantity;
              totalSellValueUSD += quantity * price;
              totalSellValueBRL += quantity * price * exchangeRate;
            }
          });

          // Calculate the new averages
          const usdAvg = totalBuyQuantity > 0 ? totalBuyValueUSD / totalBuyQuantity : 0;
          const brlAvg = totalBuyQuantity > 0 ? totalBuyValueBRL / totalBuyQuantity : 0;

          // Calculate total amount and current value in USD and BRL
          const totalAmount = totalBuyQuantity - totalSellQuantity;
          const currentValueUSD = totalAmount * currentPrice;
          const currentValueBRL = totalAmount * currentPrice * (transactions[0].ExchangeRateUSD_BRL || 1);
          const profitUSD = currentValueUSD - totalBuyValueUSD;
          const profitBRL = currentValueBRL - totalBuyValueBRL;

          res.send({
            asset: {
              symbol: assetSymbol,
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
          });
        }
      );
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Error processing request: ' + error.message);
    }
  });

  return router;
};
