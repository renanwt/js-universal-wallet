exports.validateBuyAsset = (assetData) => {
  const { AssetName, AssetSymbol, AssetTypeID, Quantity, PricePerUnit, ExchangeRateUSD_BRL } = assetData;

  if ( !AssetSymbol || !AssetTypeID || !Quantity || !PricePerUnit || ExchangeRateUSD_BRL == null) {
    return 'Missing required fields';
  }

  return null;
};

exports.validateGetAsset = (query) => {
  const { assetTypeID } = query;

  if (assetTypeID && isNaN(parseInt(assetTypeID))) {
    return 'AssetTypeID must be an integer: 1- Crypto, 2- Ações, 3- FIIs, 4- Stocks, 5- REITs, 6- ETF-US, 7- ETF-BR, 8- Cash';
  }

  return null;
};