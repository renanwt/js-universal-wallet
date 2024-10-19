const express = require('express');
const axios = require('axios');
const yahooFinance = require('yahoo-finance2').default;

module.exports = (db) => {
  const router = express.Router();

  // Record the current asset status
  router.post('/record', async (req, res) => {
    try {
      const assets = await getAssets(db);
      
      const exchangeRateResponse = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/USDBRL=X');
      const exchangeRateUSD_BRL = exchangeRateResponse.data.chart.result[0].meta.regularMarketPrice; 

      const recordedDate = new Date().toISOString().slice(0, 10); // Get today's date in YYYY-MM-DD format

      // Loop through the assets to record their status
      for (const asset of assets) {
        let currentPrice, valueInBRL;

        if ([1, 4, 5, 6].includes(asset.AssetTypeID)) {
          const quote = await yahooFinance.quote(asset.AssetSymbol + (asset.AssetTypeID === 1 ? "-USD" : ""));
          currentPrice = quote.regularMarketPrice;
          valueInBRL = asset.AmountInWallet * currentPrice * exchangeRateUSD_BRL;
        } else if ([2, 3, 7].includes(asset.AssetTypeID)) {
          const quote = await yahooFinance.quote(asset.AssetSymbol + ".SA");
          currentPrice = quote.regularMarketPrice;
          valueInBRL = asset.AmountInWallet * currentPrice;
        } else if (asset.AssetTypeID === 8) { // Cash in BRL
          valueInBRL = asset.AmountInWallet;
        }

        db.run(
          'INSERT INTO AssetStatus (assetSymbol, amountInWallet, avgPrice, valueInBRL, exchangeRate, recordedDate) VALUES (?, ?, ?, ?, ?, ?)',
          [asset.AssetSymbol, asset.AmountInWallet, parseFloat(asset.AvgPrice.toFixed(2)), parseFloat(valueInBRL.toFixed(2)), parseFloat(exchangeRateUSD_BRL.toFixed(2)), recordedDate],
          (err) => {
            if (err) {
              console.error('Error inserting asset status:', err.message);
            }
          }
        );
      }

      res.status(200).send('Asset status recorded successfully.');
    } catch (error) {
      console.error('Error recording asset status:', error);
      res.status(500).send('Error recording asset status.');
    }
  });

  // Get all assets status by date
  router.get('/', (req, res) => {
    const { date } = req.query;
  
    if (!date) {
      return res.status(400).send('Please provide a date (YYYY-MM-DD).');
    }
  
    // Query to get asset status, total valueInBRL, total in USD, and exchange rate
    const query = `
      SELECT 
        assetSymbol, 
        amountInWallet, 
        avgPrice, 
        valueInBRL, 
        exchangeRate, 
        recordedDate,
        (SELECT SUM(valueInBRL) FROM AssetStatus WHERE recordedDate = ?) AS totalAmount,
        (SELECT SUM(valueInBRL / exchangeRate) FROM AssetStatus WHERE recordedDate = ?) AS totalInUSD
      FROM AssetStatus
      WHERE recordedDate = ?
      ORDER BY valueInBRL DESC
    `;
  
    db.all(query, [date, date, date], (err, rows) => {
      if (err) {
        console.error('Error fetching asset status by date:', err);
        return res.status(500).send('Error fetching asset status.');
      }
  
      // Check if any rows are returned
      if (rows.length === 0) {
        return res.status(404).send('No asset statuses found for the given date.');
      }
  
      // Extract total amounts
      const totalAmount = rows[0].totalAmount;
      const totalInUSD = rows[0].totalInUSD;
      const exchangeRate = rows[0].exchangeRate; // Use the exchange rate from the first row
  
      // Calculate percentage in wallet and format the response
      const assetStatuses = rows.map(row => ({
        assetSymbol: row.assetSymbol,
        amountInWallet: row.amountInWallet,
        avgPrice: row.avgPrice,
        valueInBRL: row.valueInBRL,
        recordedDate: row.recordedDate,
        percentageInWallet: ((row.valueInBRL / totalAmount) * 100).toFixed(2) + '%'
      }));
  
      res.status(200).json({
        totalAmount: parseFloat(totalAmount).toFixed(2),
        totalInUSD: parseFloat(totalInUSD).toFixed(2),
        exchangeRate: parseFloat(exchangeRate).toFixed(2),
        assetStatuses
      });
    });
  });
  
  return router;
};

// Helper function to get assets from the Assets table
async function getAssets(db) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM Assets', [], (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows);
    });
  });
}
