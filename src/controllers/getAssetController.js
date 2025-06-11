module.exports = (db, { assetService }) => {
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
};
