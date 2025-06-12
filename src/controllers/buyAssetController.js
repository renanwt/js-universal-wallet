const buyAssetServiceFactory = require('../services/buyAssetService');
const { validateBuyAsset } = require('../utils/validators');

module.exports = (() => {
  const buyAssetService = buyAssetServiceFactory();

  return {
    async buyAsset(req, res) {
      try {
        const validationError = validateBuyAsset(req.body);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }
        
        const result = await buyAssetService.buyAsset(req.body);
        res.status(201).json(result);
      } catch (error) {
        console.error('Controller Error:', error.message);
        res.status(400).json({ error: error.message });
      }
    }
  };
})();
