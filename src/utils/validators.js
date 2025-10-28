function requireFields(payload, fields) {
  for (const field of fields) {
    const value = payload[field];
    if (value === undefined || value === null || value === '') {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

exports.validateBuyAsset = (assetData) => {
  const requiredFields = [
    'AssetSymbol',
    'AssetTypeID',
    'Quantity',
    'PricePerUnit',
    'ExchangeRateUSD_BRL',
  ];
  return requireFields(assetData, requiredFields);
};

exports.validateSellAsset = (assetData) => {
  const requiredFields = ['AssetSymbol', 'Quantity', 'PricePerUnit', 'ExchangeRateUSD_BRL'];
  return requireFields(assetData, requiredFields);
};

exports.validateGetAssets = (query) => {
  const { assetTypeID } = query;
  if (assetTypeID !== undefined && Number.isNaN(parseInt(assetTypeID, 10))) {
    return 'AssetTypeID must be an integer in the range 1-8.';
  }
  return null;
};

exports.validateAssetPayload = (data) => {
  const requiredFields = ['AssetName', 'AssetSymbol', 'AssetTypeID'];
  return requireFields(data, requiredFields);
};

exports.validateAssetTypePayload = (data) => {
  const requiredFields = ['AssetTypeName'];
  return requireFields(data, requiredFields);
};

exports.validateTransactionPayload = (data) => {
  const requiredFields = [
    'AssetID',
    'TransactionDate',
    'Quantity',
    'PricePerUnit',
    'TransactionType',
  ];
  return requireFields(data, requiredFields);
};

exports.validateTransactionIdParam = (id) => {
  if (!id || Number.isNaN(parseInt(id, 10))) {
    return 'Transaction ID must be a valid integer.';
  }
  return null;
};

exports.validateAssetIdParam = (id) => {
  if (!id || Number.isNaN(parseInt(id, 10))) {
    return 'Asset ID must be a valid integer.';
  }
  return null;
};

exports.validateAssetTypeIdParam = (id) => {
  if (!id || Number.isNaN(parseInt(id, 10))) {
    return 'AssetType ID must be a valid integer.';
  }
  return null;
};

exports.validateConversionPayload = (data) => {
  const requiredFields = [
    'FromAssetSymbol',
    'ToAssetSymbol',
    'ConversionAmount',
    'ToAssetAmount',
  ];
  const missingField = requireFields(data, requiredFields);
  if (missingField) {
    return missingField;
  }

  const conversionAmount = Number(data.ConversionAmount);
  const toAssetAmount = Number(data.ToAssetAmount);

  if (Number.isNaN(conversionAmount) || conversionAmount <= 0) {
    return 'ConversionAmount must be a positive number.';
  }

  if (Number.isNaN(toAssetAmount) || toAssetAmount <= 0) {
    return 'ToAssetAmount must be a positive number.';
  }

  return null;
};
