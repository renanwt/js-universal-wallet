const sellAssetServiceFactory = require('../services/sellAssetService');
const { validateSellAsset } = require('../utils/validators');

module.exports = (() => {
  const sellAssetService = sellAssetServiceFactory();

  return {
    async sellAsset(req, res) {
      try {
        const validationError = validateSellAsset(req.body);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }

        const result = await sellAssetService.sellAsset(req.body);
        return res.json(result);
      } catch (error) {
        console.error('SellAssetController#sellAsset', error.message);
        const message = error.message || 'Failed to sell asset.';
        if (/not found/i.test(message)) {
          return res.status(404).json({ error: message });
        }
        if (/not enough|must be/i.test(message)) {
          return res.status(400).json({ error: message });
        }
        return res.status(500).json({ error: 'Unexpected error selling asset.' });
      }
    },
  };
})();
