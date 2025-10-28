module.exports = (db) => {
  const run = (query, params = []) =>
    new Promise((resolve, reject) => {
      db.run(query, params, function (err) {
        if (err) {
          console.error(err.message);
          return reject(err);
        }
        resolve(this);
      });
    });

  const get = (query, params = []) =>
    new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) {
          console.error(err.message);
          return reject(err);
        }
        resolve(row);
      });
    });

  const all = (query, params = []) =>
    new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) {
          console.error(err.message);
          return reject(err);
        }
        resolve(rows);
      });
    });

  return {
    async getAssetBySymbol(AssetSymbol) {
      return get('SELECT * FROM Assets WHERE AssetSymbol = ?', [AssetSymbol]);
    },

    async getAssetById(AssetID) {
      return get('SELECT * FROM Assets WHERE AssetID = ?', [AssetID]);
    },

    async getAssets(options = {}) {
      const { assetTypeID, assetTypeIDs } = options;
      let query = 'SELECT * FROM Assets';
      const params = [];
      if (Array.isArray(assetTypeIDs) && assetTypeIDs.length) {
        const placeholders = assetTypeIDs.map(() => '?').join(', ');
        query += ` WHERE AssetTypeID IN (${placeholders})`;
        params.push(...assetTypeIDs);
      } else if (assetTypeID !== undefined && assetTypeID !== null) {
        query += ' WHERE AssetTypeID = ?';
        params.push(assetTypeID);
      }
      return all(query, params);
    },

    async createAsset(assetData) {
      const {
        AssetName,
        AssetSymbol,
        AssetTypeID,
        AmountInWallet = 0,
        AvgPrice = 0,
        Currency = null,
      } = assetData;

      const result = await run(
        'INSERT INTO Assets (AssetName, AssetSymbol, AssetTypeID, AmountInWallet, AvgPrice, Currency) VALUES (?, ?, ?, ?, ?, ?)',
        [AssetName, AssetSymbol, AssetTypeID, AmountInWallet, AvgPrice, Currency]
      );
      return result.lastID;
    },

    async updateAsset(AssetID, updates) {
      const entries = Object.entries(updates).filter(
        ([, value]) => value !== undefined
      );

      if (!entries.length) {
        throw new Error('No fields supplied to update asset.');
      }

      const setClause = entries.map(([column]) => `${column} = ?`).join(', ');
      const values = entries.map(([, value]) => value);
      await run(`UPDATE Assets SET ${setClause} WHERE AssetID = ?`, [
        ...values,
        AssetID,
      ]);
    },

    async deleteAsset(AssetID) {
      await run('DELETE FROM Assets WHERE AssetID = ?', [AssetID]);
    },
  };
};
