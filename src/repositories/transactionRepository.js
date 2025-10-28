const { formatDateForSqlite, runStatement } = require('../utils/sqliteHelper');

module.exports = (db) => {
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
    async createTransaction(transaction) {
      const {
        AssetID,
        TransactionDate,
        Quantity,
        PricePerUnit,
        TransactionType,
        ExchangeRateUSD_BRL,
        Info = null,
      } = transaction;

      const formattedDate = formatDateForSqlite(TransactionDate);

      await runStatement(
        db,
        `INSERT INTO Transactions
          (AssetID, TransactionDate, Quantity, PricePerUnit, TransactionType, ExchangeRateUSD_BRL, Info)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          AssetID,
          formattedDate,
          Quantity,
          PricePerUnit,
          TransactionType,
          ExchangeRateUSD_BRL,
          Info,
        ]
      );
    },

    async getTransactionById(TransactionID) {
      return get('SELECT * FROM Transactions WHERE TransactionID = ?', [TransactionID]);
    },

    async getTransactions(filters = {}) {
      const { AssetID } = filters;
      let query = 'SELECT * FROM Transactions';
      const params = [];

      if (AssetID) {
        query += ' WHERE AssetID = ?';
        params.push(AssetID);
      }

      query += ' ORDER BY TransactionDate ASC';
      return all(query, params);
    },

    async getTransactionsWithAssetBySymbol(AssetSymbol) {
      return all(
        `
        SELECT
          t.TransactionID,
          t.AssetID,
          t.TransactionDate,
          t.Quantity,
          t.PricePerUnit,
          t.TransactionType,
          t.ExchangeRateUSD_BRL,
          t.Info,
          a.AssetSymbol,
          a.AssetName,
          a.AvgPrice,
          a.AssetTypeID
        FROM Transactions t
        JOIN Assets a ON t.AssetID = a.AssetID
        WHERE a.AssetSymbol = ?
        ORDER BY t.TransactionDate ASC
        `,
        [AssetSymbol]
      );
    },

    async getTransactionWithAssetById(TransactionID) {
      return get(
        `
        SELECT
          t.TransactionID,
          t.AssetID,
          t.TransactionDate,
          t.Quantity,
          t.PricePerUnit,
          t.TransactionType,
          t.ExchangeRateUSD_BRL,
          t.Info,
          a.AssetSymbol,
          a.AmountInWallet,
          a.AvgPrice,
          a.AssetTypeID
        FROM Transactions t
        JOIN Assets a ON t.AssetID = a.AssetID
        WHERE t.TransactionID = ?
        `,
        [TransactionID]
      );
    },

    async getPairedTransaction(transactionDate, transactionType, excludeId) {
      return get(
        `
        SELECT
          t.TransactionID,
          t.AssetID,
          t.TransactionDate,
          t.Quantity,
          t.PricePerUnit,
          t.TransactionType,
          t.ExchangeRateUSD_BRL,
          t.Info,
          a.AssetSymbol,
          a.AmountInWallet,
          a.AvgPrice,
          a.AssetTypeID
        FROM Transactions t
        JOIN Assets a ON t.AssetID = a.AssetID
        WHERE t.TransactionDate = ?
          AND t.TransactionType = ?
          AND t.TransactionID != ?
        `,
        [transactionDate, transactionType, excludeId]
      );
    },

    async updateTransaction(TransactionID, updates) {
      const entries = Object.entries(updates).filter(
        ([, value]) => value !== undefined
      );

      if (!entries.length) {
        throw new Error('No fields supplied to update transaction.');
      }

      const mappedEntries = entries.map(([key, value]) => {
        if (key === 'TransactionDate') {
          return [key, formatDateForSqlite(value)];
        }
        return [key, value];
      });

      const setClause = mappedEntries.map(([column]) => `${column} = ?`).join(', ');
      const values = mappedEntries.map(([, value]) => value);

      await runStatement(
        db,
        `UPDATE Transactions SET ${setClause} WHERE TransactionID = ?`,
        [...values, TransactionID]
      );
    },

    async deleteTransaction(TransactionID) {
      await runStatement(db, 'DELETE FROM Transactions WHERE TransactionID = ?', [
        TransactionID,
      ]);
    },
  };
};
