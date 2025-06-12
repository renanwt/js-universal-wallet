const getAssetServiceFactory = require('../services/getAssetService');
const { validateGetAssets } = require('../utils/validators');

module.exports = (() => {
  const getAssetService = getAssetServiceFactory();

  return {
    async getAssets(req, res) {
      try {
        const validationError = validateGetAssets(req.query);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }
        const { assetTypeID } = req.query;
        const result = await getAssetService.getAssetData(assetTypeID);
        res.json(result);
      } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching asset data');
      }
    }
  };
})();
