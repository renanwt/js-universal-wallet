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
const historyController = require('./Controllers/historyController');
const cryptoConversionController = require('./Controllers/cryptoConversionController');
const revertTransactionController = require('./Controllers/revertTransactionController');
const getAssetTransactionsController = require('./Controllers/getAssetTransactionsController');

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

// Get History Patrimony By Date
app.use('/history', historyController(db));

// Get transactions for a specific asset
app.use('/transactions', getAssetTransactionsController(db));

//
app.use('/api/convert', cryptoConversionController(db));

//
app.use('/api/convert', revertTransactionController(db));

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
