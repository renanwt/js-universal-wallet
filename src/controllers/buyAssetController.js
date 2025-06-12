const buyAssetServiceFactory = require('../services/buyAssetService');

module.exports = (() => {
  const buyAssetService = buyAssetServiceFactory();

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
})();
