const getAssetServiceFactory = require('../services/getAssetService');

module.exports = (() => {
  const assetService = getAssetServiceFactory();

  return {
    async getAssets(req, res) {
      try {
        const { assetTypeID } = req.query;
        const result = await assetService.getAssetData(assetTypeID);
        res.json(result);
      } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching asset data');
      }
    }
  };
})();
