const { runStatement } = require('../utils/sqliteHelper');

module.exports = (db) => {
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

  return {
    async insertStatus(record) {
      const {
        assetSymbol,
        amountInWallet,
        avgPrice,
        valueInBRL,
        exchangeRate,
        recordedDate,
      } = record;

      await runStatement(
        db,
        `INSERT INTO AssetStatus
          (assetSymbol, amountInWallet, avgPrice, valueInBRL, exchangeRate, recordedDate)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [assetSymbol, amountInWallet, avgPrice, valueInBRL, exchangeRate, recordedDate]
      );
    },

    async getStatusesByDate(recordedDate) {
      return all(
        `
        SELECT
          assetSymbol,
          amountInWallet,
          avgPrice,
          valueInBRL,
          exchangeRate,
          recordedDate
        FROM AssetStatus
        WHERE recordedDate = ?
        ORDER BY valueInBRL DESC
        `,
        [recordedDate]
      );
    },

    async getTotalsByDate(recordedDate) {
      return get(
        `
        SELECT
          SUM(valueInBRL) AS totalAmount,
          SUM(valueInBRL / exchangeRate) AS totalInUSD
        FROM AssetStatus
        WHERE recordedDate = ?
        `,
        [recordedDate]
      );
    },

    async getAggregatedTotals(options = {}) {
      const { startDate, endDate } = options;
      let query = `
        SELECT
          recordedDate,
          SUM(valueInBRL) AS totalValue
        FROM AssetStatus
      `;
      const params = [];

      if (startDate && endDate) {
        query += ' WHERE recordedDate BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      query += ' GROUP BY recordedDate ORDER BY recordedDate ASC';
      return all(query, params);
    },

    async getLatestTotal() {
      return get(
        `
        SELECT
          recordedDate,
          SUM(valueInBRL) AS totalValue
        FROM AssetStatus
        WHERE recordedDate = (
          SELECT MAX(recordedDate) FROM AssetStatus
        )
        GROUP BY recordedDate
        `
      );
    },
  };
};
