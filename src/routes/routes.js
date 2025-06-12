const express = require('express');
const router = express.Router();
const buyAssetController = require('../controllers/buyAssetController');
const getAssetController = require('../controllers/getAssetController');

// Rota de compra de ativos
router.post('/buy', buyAssetController.buyAsset);

// Rota para consultar ativos
router.get('/assets', getAssetController.getAssets);

module.exports = router;
