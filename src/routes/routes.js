const express = require('express');

const assetController = require('../controllers/assetController');
const assetStatusController = require('../controllers/assetStatusController');
const assetTransactionsController = require('../controllers/getAssetTransactionsController');
const assetTypeController = require('../controllers/assetTypeController');
const buyAssetController = require('../controllers/buyAssetController');
const cryptoConversionController = require('../controllers/cryptoConversionController');
const getAssetController = require('../controllers/getAssetController');
const historyController = require('../controllers/historyController');
const revertTransactionController = require('../controllers/revertTransactionController');
const sellAssetController = require('../controllers/sellAssetController');
const totalPositionController = require('../controllers/totalPositionComparisonController');
const transactionController = require('../controllers/transactionController');

const router = express.Router();

// Asset types management
router.post('/asset-types', assetTypeController.createAssetType);
router.get('/asset-types', assetTypeController.listAssetTypes);
router.put('/asset-types/:id', assetTypeController.updateAssetType);
router.delete('/asset-types/:id', assetTypeController.deleteAssetType);

// Asset management
router.post('/assets', assetController.createAsset);
router.put('/assets/:id', assetController.updateAsset);
router.delete('/assets/:id', assetController.deleteAsset);
router.get('/assets/raw', assetController.listAssets);

// Portfolio summaries
router.get('/assets', getAssetController.getAssets);
router.get('/assets/cryptos', getAssetController.getCryptos);
router.get('/assets/acoes', getAssetController.getAcoes);
router.get('/assets/fiis', getAssetController.getFiis);
router.get('/assets/br_etfs', getAssetController.getBrEtfs);
router.get('/assets/stocks', getAssetController.getStocks);
router.get('/assets/reits', getAssetController.getReits);
router.get('/assets/us_etfs', getAssetController.getUsEtfs);

// Buy & Sell
router.post('/buy-asset', buyAssetController.buyAsset);
router.post('/sell-asset', sellAssetController.sellAsset);

// Asset status
router.post('/asset-status/record', assetStatusController.recordStatus);
router.get('/asset-status', assetStatusController.getStatusByDate);

// History
router.get('/history/daily-totals', historyController.getDailyTotals);
router.get('/history/latest', historyController.getLatest);
router.get('/history', historyController.getHistory);

// Total position
router.get('/position-comparison', totalPositionController.getTotalPosition);

// Transactions (general)
router.post('/transactions', transactionController.createTransaction);
router.get('/transactions', transactionController.listTransactions);
router.put('/transactions/:id', transactionController.updateTransaction);
router.delete('/transactions/:id', transactionController.deleteTransaction);

// Transactions for a specific asset
router.get('/transactions/:assetSymbol', assetTransactionsController.getTransactions);

// Crypto conversion and revert
router.post('/api/convert', cryptoConversionController.convert);
router.post('/api/convert/revert/:transactionId', revertTransactionController.revert);

module.exports = router;
