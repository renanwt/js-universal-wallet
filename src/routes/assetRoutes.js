const express = require('express');
const router = express.Router();
const controllerFactory = require('../controllers/buyAssetController');

module.exports = (db) => {
  const controller = controllerFactory(db);
  router.post('/', controller.buyAsset);
  return router;
};

module.exports = (db, { assetController }) => {
  router.get('/', assetController.getAssets); // Fetch all assets
  return router;
};