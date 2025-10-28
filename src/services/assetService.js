const { getDbConnection } = require('../utils/dbHelper');
const assetRepositoryFactory = require('../repositories/assetRepository');

const deriveCurrency = (assetTypeId, explicitCurrency) => {
  if (explicitCurrency) {
    return explicitCurrency;
  }

  return [2, 3, 7, 8].includes(assetTypeId) ? 'BRL' : 'USD';
};

const toNumeric = (value, fieldName) => {
  if (value === undefined || value === null) {
    return undefined;
  }
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }
  return numericValue;
};

module.exports = () => {
  const buildContext = async () => {
    const db = await getDbConnection();
    return {
      db,
      assetRepository: assetRepositoryFactory(db),
    };
  };

  return {
    async listAssets(filters = {}) {
      const { assetRepository } = await buildContext();
      return assetRepository.getAssets(filters);
    },

    async getAsset(AssetID) {
      const { assetRepository } = await buildContext();
      return assetRepository.getAssetById(Number(AssetID));
    },

    async createAsset(payload) {
      const { assetRepository } = await buildContext();
      const AssetTypeID = toNumeric(payload.AssetTypeID, 'AssetTypeID');
      if (!payload.AssetName || !payload.AssetSymbol || Number.isNaN(AssetTypeID)) {
        throw new Error('AssetName, AssetSymbol, and AssetTypeID are required.');
      }

      const AmountInWallet = toNumeric(payload.AmountInWallet ?? 0, 'AmountInWallet') ?? 0;
      const AvgPrice = toNumeric(payload.AvgPrice ?? 0, 'AvgPrice') ?? 0;

      const assetId = await assetRepository.createAsset({
        AssetName: payload.AssetName,
        AssetSymbol: payload.AssetSymbol,
        AssetTypeID,
        AmountInWallet,
        AvgPrice,
        Currency: deriveCurrency(AssetTypeID, payload.Currency),
      });

      return assetRepository.getAssetById(assetId);
    },

    async updateAsset(AssetID, updates) {
      const { assetRepository } = await buildContext();
      const existing = await assetRepository.getAssetById(Number(AssetID));
      if (!existing) {
        throw new Error('Asset not found.');
      }

      const normalizedUpdates = {};

      if (updates.AssetName !== undefined) {
        normalizedUpdates.AssetName = updates.AssetName;
      }
      if (updates.AssetSymbol !== undefined) {
        normalizedUpdates.AssetSymbol = updates.AssetSymbol;
      }
      if (updates.AssetTypeID !== undefined) {
        normalizedUpdates.AssetTypeID = toNumeric(updates.AssetTypeID, 'AssetTypeID');
      }
      if (updates.AmountInWallet !== undefined) {
        normalizedUpdates.AmountInWallet = toNumeric(updates.AmountInWallet, 'AmountInWallet');
      }
      if (updates.AvgPrice !== undefined) {
        normalizedUpdates.AvgPrice = toNumeric(updates.AvgPrice, 'AvgPrice');
      }
      if (updates.Currency !== undefined) {
        normalizedUpdates.Currency =
          updates.Currency ||
          deriveCurrency(
            normalizedUpdates.AssetTypeID ?? existing.AssetTypeID,
            updates.Currency
          );
      }

      if (!Object.keys(normalizedUpdates).length) {
        throw new Error('No valid fields provided for update.');
      }

      await assetRepository.updateAsset(existing.AssetID, normalizedUpdates);
      return assetRepository.getAssetById(existing.AssetID);
    },

    async deleteAsset(AssetID) {
      const { assetRepository } = await buildContext();
      await assetRepository.deleteAsset(Number(AssetID));
    },
  };
};
