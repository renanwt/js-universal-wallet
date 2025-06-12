const express = require('express');
const router = express.Router();
const buyAssetController = require('../controllers/buyAssetController');
const getAssetController = require('../controllers/getAssetController');

router.post('/buy', buyAssetController.buyAsset);

router.get('/assets', getAssetController.getAssets);

module.exports = router;
