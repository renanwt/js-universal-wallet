const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const yahooFinance = require('yahoo-finance2').default;
const assetTypesController = require('./Controllers/assetTypesController');
const buyAssetController = require('./Controllers/buyAssetController');
const sellAssetController = require('./Controllers/sellAssetController');
const getAssetController = require('./Controllers/getAssetController');
const assetStatusController = require('./Controllers/assetStatusController');
const totalPositionController = require('./Controllers/totalPositionComparisonController');

const app = express();
const dbPath = 'database.sqlite'; // SQLite database file

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  res.header('Surrogate-Control', 'no-store');
  next();
});

// Initialize SQLite Database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database ' + err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

app.use(express.json());

// Add new Asset Type if needed (Dev work)
app.use('/asset-types', assetTypesController(db));

// Buy Asset endpoint
app.use('/buy-asset', buyAssetController(db));

// Sell Asset endpoint
app.use('/sell-asset', sellAssetController(db));

// Get Asset endpoint
app.use('/assets', getAssetController(db));

// Asset Status endpoints
app.use('/asset-status', assetStatusController(db));

// Get Wallet Balance endpoint
app.use('/position-comparison', totalPositionController(db));

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

// const express = require('express');
// const mysql = require('mysql2');
// const axios = require('axios');
// const app = express();
// const yahooFinance = require('yahoo-finance2').default;
// const assetTypesController = require('./Controllers/assetTypesController');
// const buyAssetController = require('./Controllers/buyAssetController');
// const getAssetController = require('./Controllers/getAssetController');


// const pool = mysql.createPool({
//   host: 'localhost',
//   user: 'user',
//   password: 'userpassword',
//   port: '3307',
//   database: 'AssetTransactions',
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });

// app.use(express.json());

// // Add new Asset Type if needed (Dev work)
// app.use('/asset-types', assetTypesController(pool));

// // Buy Asset endpoint
// app.use('/buy-asset', buyAssetController(pool));


// app.use('/assets', getAssetController(pool));

// // Get Wallet Balance endpoint (newly created)
// app.get('/wallet-balance', async (req, res) => {
//   try {
//     const connection = await pool.promise().getConnection();

//     // Fetch current USD/BRL exchange rate
//     const exchangeRateResponse = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
//     const exchangeRateUSD_BRL = exchangeRateResponse.data.rates.BRL;

//     // Fetch all assets from the database
//     const [assets] = await connection.query('SELECT * FROM Assets');

//     let totalValueBRL = 0;

//     const assetValues = {};  // Store each asset's value
//     const assetTickers = [];
//     const profitPercentages = [];  // Store profit percentages for each asset
//     const lossPercentages = [];  // Store loss percentages for each asset

//     for (const asset of assets) {
//       assetTickers.push(asset.AssetSymbol);
//       let assetValue = 0;
//       let avgValue = asset.AmountInWallet * parseFloat(asset.AvgPrice);

//       if (asset.AssetTypeID === 1) {
//         const quote = await yahooFinance.quote(asset.AssetSymbol + "-USD");
//         const { regularMarketPrice } = quote;
//         assetValue = asset.AmountInWallet * regularMarketPrice * exchangeRateUSD_BRL;
//         avgValue *= exchangeRateUSD_BRL;
//         totalValueBRL += assetValue;
//       } else if ([2, 3, 7].includes(asset.AssetTypeID)) {
//         const quote = await yahooFinance.quote(asset.AssetSymbol + ".SA");
//         const { regularMarketPrice, currency } = quote;
//         assetValue = asset.AmountInWallet * regularMarketPrice;
//         if (currency === 'BRL') {
//           totalValueBRL += assetValue;
//         } else if (currency === 'USD') {
//           assetValue *= exchangeRateUSD_BRL;
//           avgValue *= exchangeRateUSD_BRL;
//           totalValueBRL += assetValue;
//         }
//       } else if ([4, 5, 6].includes(asset.AssetTypeID)) {
//         const quote = await yahooFinance.quote(asset.AssetSymbol);
//         const { regularMarketPrice } = quote;
//         assetValue = asset.AmountInWallet * regularMarketPrice * exchangeRateUSD_BRL;
//         avgValue *= exchangeRateUSD_BRL;
//         totalValueBRL += assetValue;
//       } else if ([8].includes(asset.AssetTypeID)) {
//         assetValue = parseFloat(asset.AvgPrice);
//         totalValueBRL += assetValue;
//       }

//       assetValues[asset.AssetSymbol] = assetValue;

//       const profitPercentage = ((assetValue - avgValue) / avgValue) * 100;
//       if (profitPercentage >= 0) {
//         profitPercentages.push({
//           ticker: asset.AssetSymbol,
//           value: assetValue.toFixed(2),
//           profitPercentage: profitPercentage.toFixed(2)
//         });
//       } else {
//         lossPercentages.push({
//           ticker: asset.AssetSymbol,
//           value: assetValue.toFixed(2),
//           lossPercentage: profitPercentage.toFixed(2)  // Profit percentage is negative for losses
//         });
//       }
//     }

//     // Calculate each asset's percentage of total patrimony
//     const assetPercentages = Object.keys(assetValues).map(ticker => ({
//       ticker: ticker,
//       value: assetValues[ticker].toFixed(2),
//       percentage: ((assetValues[ticker] / totalValueBRL) * 100).toFixed(2)
//     }));

//     // Sort by percentage and get top 5 patrimony positions
//     const top5Positions = assetPercentages.sort((a, b) => b.percentage - a.percentage).slice(0, 5);

//     // Sort by profit percentage and get top 5 profitable positions
//     const top5Profitable = profitPercentages.sort((a, b) => b.profitPercentage - a.profitPercentage).slice(0, 5);

//     // Sort by loss percentage and get top 5 loss positions
//     const top5Loss = lossPercentages.sort((a, b) => a.lossPercentage - b.lossPercentage).slice(0, 5);

//     res.json({
//       totalValueBRL: totalValueBRL.toFixed(2),
//       exchangeRateUSD_BRL: exchangeRateUSD_BRL.toFixed(4),
//       top5Positions: top5Positions,
//       top5Profitable: top5Profitable,
//       top5Loss: top5Loss
//     });

//     connection.release();
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Error calculating wallet balance');
//   }
// });


// app.listen(3000, () => {
//   console.log('Server running on port 3000');
// });
