module.exports = (db) => {
  return {
    async getAssetBySymbol(AssetSymbol) {
      return new Promise((resolve, reject) => {
        db.get('SELECT * FROM Assets WHERE AssetSymbol = ?', [AssetSymbol], (err, existingAsset) => {
          if (err) {
            console.error(err.message);
            reject(err);
          } else {
            resolve(existingAsset);
          }
        });
      });
    },

    async getAssets(assetTypeID) {
      return new Promise((resolve, reject) => {
        let query = 'SELECT * FROM Assets';
        const queryParams = [];
        if (assetTypeID) {
          query += ' WHERE AssetTypeID = ?';
          queryParams.push(assetTypeID);
        }

        db.all(query, queryParams, (err, assets) => {
          if (err) {
            console.error(err);
            return reject('Error fetching assets');
          }
          resolve(assets);
        });
      });
    },

    async updateAsset(AssetID, AmountInWallet, AvgPrice) {
      return new Promise((resolve, reject) => {
        db.run(
          'UPDATE Assets SET AmountInWallet = ?, AvgPrice = ? WHERE AssetID = ?',
          [AmountInWallet, AvgPrice, AssetID],
          (err) => {
            if (err) {
              console.error(err.message);
              reject(err);
            } else {
              resolve();
            }
          }
        );
      });
    },

    async createAsset(AssetName, AssetSymbol, AssetTypeID, AmountInWallet, AvgPrice, Currency) {
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO Assets (AssetName, AssetSymbol, AssetTypeID, AmountInWallet, AvgPrice, Currency) VALUES (?, ?, ?, ?, ?, ?)',
          [AssetName, AssetSymbol, AssetTypeID, AmountInWallet, AvgPrice, Currency],
          function (err) {
            if (err) {
              console.error(err.message);
              reject(err);
            } else {
              resolve(this.lastID);
            }
          }
        );
      });
    },
  };
};