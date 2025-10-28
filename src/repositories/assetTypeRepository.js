module.exports = (db) => {
  const run = (query, params = []) =>
    new Promise((resolve, reject) => {
      db.run(
        query,
        params,
        function (err) {
          if (err) {
            console.error(err.message);
            return reject(err);
          }
          resolve(this);
        }
      );
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
    async createAssetType(AssetTypeName) {
      const result = await run('INSERT INTO AssetTypes (AssetTypeName) VALUES (?)', [
        AssetTypeName,
      ]);
      return result.lastID;
    },

    async getAssetTypeById(AssetTypeID) {
      return get('SELECT * FROM AssetTypes WHERE AssetTypeID = ?', [AssetTypeID]);
    },

    async getAssetTypes() {
      return all('SELECT * FROM AssetTypes ORDER BY AssetTypeID ASC');
    },

    async updateAssetType(AssetTypeID, AssetTypeName) {
      await run('UPDATE AssetTypes SET AssetTypeName = ? WHERE AssetTypeID = ?', [
        AssetTypeName,
        AssetTypeID,
      ]);
    },

    async deleteAssetType(AssetTypeID) {
      await run('DELETE FROM AssetTypes WHERE AssetTypeID = ?', [AssetTypeID]);
    },
  };
};
