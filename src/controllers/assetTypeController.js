const assetTypeServiceFactory = require('../services/assetTypeService');
const {
  validateAssetTypePayload,
  validateAssetTypeIdParam,
} = require('../utils/validators');

module.exports = (() => {
  const assetTypeService = assetTypeServiceFactory();

  return {
    async createAssetType(req, res) {
      try {
        const validationError = validateAssetTypePayload(req.body);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }

        const assetType = await assetTypeService.createAssetType(req.body);
        return res.status(201).json(assetType);
      } catch (error) {
        console.error('AssetTypeController#createAssetType', error.message);
        return res.status(500).json({ error: error.message });
      }
    },

    async listAssetTypes(req, res) {
      try {
        const assetTypes = await assetTypeService.listAssetTypes();
        return res.json(assetTypes);
      } catch (error) {
        console.error('AssetTypeController#listAssetTypes', error.message);
        return res.status(500).json({ error: 'Failed to fetch asset types.' });
      }
    },

    async updateAssetType(req, res) {
      try {
        const { id } = req.params;
        const validationError = validateAssetTypeIdParam(id);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }

        const payloadError = validateAssetTypePayload(req.body);
        if (payloadError) {
          return res.status(400).json({ error: payloadError });
        }

        const updatedAssetType = await assetTypeService.updateAssetType(id, req.body);
        return res.json(updatedAssetType);
      } catch (error) {
        console.error('AssetTypeController#updateAssetType', error.message);
        const status = error.message === 'Asset type not found.' ? 404 : 500;
        return res.status(status).json({ error: error.message });
      }
    },

    async deleteAssetType(req, res) {
      try {
        const { id } = req.params;
        const validationError = validateAssetTypeIdParam(id);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }

        await assetTypeService.deleteAssetType(id);
        return res.status(204).send();
      } catch (error) {
        console.error('AssetTypeController#deleteAssetType', error.message);
        return res.status(500).json({ error: error.message });
      }
    },
  };
})();
