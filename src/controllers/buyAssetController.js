module.exports = (db) => {
  const assetRepository = require('../repositories/assetRepository')(db);
  const transactionRepository = require('../repositories/transactionRepository')(db);
  const buyAssetService = require('../services/buyAssetService')(db, { assetRepository, transactionRepository });

  return {
    async buyAsset(req, res) {
      try {
        const result = await buyAssetService.buyAsset(req.body);
        res.status(201).json(result);
      } catch (error) {
        console.error('Controller Error:', error.message);
        res.status(400).json({ error: error.message });
      }
    }
  };
};
