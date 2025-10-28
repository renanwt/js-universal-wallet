const assetServiceFactory = require('../services/assetService');
const {
  validateAssetPayload,
  validateAssetIdParam,
} = require('../utils/validators');

module.exports = (() => {
  const assetService = assetServiceFactory();

  return {
    async createAsset(req, res) {
      try {
        const validationError = validateAssetPayload(req.body);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }

        const asset = await assetService.createAsset(req.body);
        return res.status(201).json(asset);
      } catch (error) {
        console.error('AssetController#createAsset', error.message);
        return res.status(500).json({ error: error.message });
      }
    },

    async listAssets(req, res) {
      try {
        const assets = await assetService.listAssets(req.query);
        return res.json(assets);
      } catch (error) {
        console.error('AssetController#listAssets', error.message);
        return res.status(500).json({ error: 'Failed to fetch assets.' });
      }
    },

    async getAsset(req, res) {
      try {
        const { id } = req.params;
        const validationError = validateAssetIdParam(id);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }

        const asset = await assetService.getAsset(id);
        if (!asset) {
          return res.status(404).json({ error: 'Asset not found.' });
        }
        return res.json(asset);
      } catch (error) {
        console.error('AssetController#getAsset', error.message);
        return res.status(500).json({ error: error.message });
      }
    },

    async updateAsset(req, res) {
      try {
        const { id } = req.params;
        const validationError = validateAssetIdParam(id);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }

        if (!Object.keys(req.body || {}).length) {
          return res.status(400).json({ error: 'At least one field must be provided for update.' });
        }

        const updatedAsset = await assetService.updateAsset(id, req.body);
        return res.json(updatedAsset);
      } catch (error) {
        console.error('AssetController#updateAsset', error.message);
        const status = error.message === 'Asset not found.' ? 404 : 500;
        return res.status(status).json({ error: error.message });
      }
    },

    async deleteAsset(req, res) {
      try {
        const { id } = req.params;
        const validationError = validateAssetIdParam(id);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }

        await assetService.deleteAsset(id);
        return res.status(204).send();
      } catch (error) {
        console.error('AssetController#deleteAsset', error.message);
        return res.status(500).json({ error: error.message });
      }
    },
  };
})();
