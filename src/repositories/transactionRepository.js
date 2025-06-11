module.exports = (db) => {
  return {
    async createTransaction(AssetID, Quantity, PricePerUnit, TransactionType, ExchangeRateUSD_BRL) {
      return new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO Transactions (AssetID, TransactionDate, Quantity, PricePerUnit, TransactionType, ExchangeRateUSD_BRL) VALUES (?, datetime("now"), ?, ?, ?, ?)',
          [AssetID, Quantity, PricePerUnit, TransactionType, ExchangeRateUSD_BRL],
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
  };
};
