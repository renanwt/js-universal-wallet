const { getDbConnection } = require('../utils/dbHelper');
const assetTypeRepositoryFactory = require('../repositories/assetTypeRepository');

module.exports = () => {
  const buildContext = async () => {
    const db = await getDbConnection();
    return {
      db,
      assetTypeRepository: assetTypeRepositoryFactory(db),
    };
  };

  return {
    async listAssetTypes() {
      const { assetTypeRepository } = await buildContext();
      return assetTypeRepository.getAssetTypes();
    },

    async getAssetType(AssetTypeID) {
      const { assetTypeRepository } = await buildContext();
      return assetTypeRepository.getAssetTypeById(Number(AssetTypeID));
    },

    async createAssetType({ AssetTypeName }) {
      if (!AssetTypeName) {
        throw new Error('AssetTypeName is required.');
      }

      const { assetTypeRepository } = await buildContext();
      const id = await assetTypeRepository.createAssetType(AssetTypeName);
      return assetTypeRepository.getAssetTypeById(id);
    },

    async updateAssetType(AssetTypeID, { AssetTypeName }) {
      if (!AssetTypeName) {
        throw new Error('AssetTypeName is required.');
      }

      const { assetTypeRepository } = await buildContext();
      const existing = await assetTypeRepository.getAssetTypeById(Number(AssetTypeID));
      if (!existing) {
        throw new Error('Asset type not found.');
      }

      await assetTypeRepository.updateAssetType(existing.AssetTypeID, AssetTypeName);
      return assetTypeRepository.getAssetTypeById(existing.AssetTypeID);
    },

    async deleteAssetType(AssetTypeID) {
      const { assetTypeRepository } = await buildContext();
      await assetTypeRepository.deleteAssetType(Number(AssetTypeID));
    },
  };
};
