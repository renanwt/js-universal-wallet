const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

module.exports = (db) => {
  router.post('/revert/:transactionId', async (req, res) => {
    try {
      // Get current USD/BRL rate
      const exchangeRateResponse = await axios.get(
        'https://query1.finance.yahoo.com/v8/finance/chart/USDBRL=X'
      );
      const currentExchangeRate =
        exchangeRateResponse.data.chart.result[0].meta.regularMarketPrice;

      db.serialize(() => {
        db.run('BEGIN TRANSACTION;', (err) => {
          if (err) {
            console.error(err.message);
            return res.status(500).send('Transaction failed');
          }

          // Get original transaction details
          db.get(
            `
            SELECT t.*, a.AssetSymbol, a.AmountInWallet, a.AvgPrice
            FROM Transactions t 
            JOIN Assets a ON t.AssetID = a.AssetID 
            WHERE t.TransactionID = ?`,
            [req.params.transactionId],
            (err, transaction) => {
              if (err) {
                console.error(err.message);
                db.run('ROLLBACK;', () =>
                  res.status(500).send('Error finding transaction')
                );
                return;
              }

              if (!transaction) {
                db.run('ROLLBACK;', () =>
                  res.status(404).send('Transaction not found')
                );
                return;
              }

              // Get paired transaction (the other side of the conversion)
              const pairedType =
                transaction.TransactionType === 'Buy' ? 'Sell' : 'Buy';
              db.get(
                `
                SELECT t.*, a.AssetSymbol, a.AmountInWallet, a.AvgPrice
                FROM Transactions t 
                JOIN Assets a ON t.AssetID = a.AssetID 
                WHERE t.TransactionDate = ? 
                AND t.TransactionType = ? 
                AND t.TransactionID != ?`,
                [
                  transaction.TransactionDate,
                  pairedType,
                  transaction.TransactionID,
                ],
                (err, pairedTransaction) => {
                  if (err || !pairedTransaction) {
                    console.error(err?.message || 'Paired transaction not found');
                    db.run('ROLLBACK;', () =>
                      res
                        .status(500)
                        .send('Error finding paired transaction')
                    );
                    return;
                  }

                  // Update first asset wallet and AvgPrice
                  const newAmount1 =
                    transaction.TransactionType === 'Buy'
                      ? transaction.AmountInWallet - Math.abs(transaction.Quantity)
                      : transaction.AmountInWallet + Math.abs(transaction.Quantity);

                  // Adjust AvgPrice for the first asset
                  const updatedAvgPrice1 =
                    newAmount1 > 0
                      ? (transaction.AmountInWallet *
                          transaction.AvgPrice -
                          Math.abs(transaction.Quantity) *
                            transaction.PricePerUnit) /
                        newAmount1
                      : 0;

                  db.run(
                    'UPDATE Assets SET AmountInWallet = ?, AvgPrice = ? WHERE AssetID = ?',
                    [newAmount1, updatedAvgPrice1, transaction.AssetID],
                    (err) => {
                      if (err) {
                        console.error(err.message);
                        db.run('ROLLBACK;', () =>
                          res
                            .status(500)
                            .send('Error updating first asset')
                        );
                        return;
                      }

                      // Update second asset wallet and AvgPrice
                      const newAmount2 =
                        pairedTransaction.TransactionType === 'Buy'
                          ? pairedTransaction.AmountInWallet -
                            Math.abs(pairedTransaction.Quantity)
                          : pairedTransaction.AmountInWallet +
                            Math.abs(pairedTransaction.Quantity);

                      // Adjust AvgPrice for the second asset
                      const updatedAvgPrice2 =
                        newAmount2 > 0
                          ? (pairedTransaction.AmountInWallet *
                              pairedTransaction.AvgPrice -
                              Math.abs(pairedTransaction.Quantity) *
                                pairedTransaction.PricePerUnit) /
                            newAmount2
                          : 0;

                      db.run(
                        'UPDATE Assets SET AmountInWallet = ?, AvgPrice = ? WHERE AssetID = ?',
                        [
                          newAmount2,
                          updatedAvgPrice2,
                          pairedTransaction.AssetID,
                        ],
                        (err) => {
                          if (err) {
                            console.error(err.message);
                            db.run('ROLLBACK;', () =>
                              res
                                .status(500)
                                .send('Error updating second asset')
                            );
                            return;
                          }

                          // Record revert transactions
                          const revertDate = new Date()
                            .toISOString()
                            .slice(0, 19)
                            .replace('T', ' ');

                          // First revert transaction
                          db.run(
                            'INSERT INTO Transactions (AssetID, TransactionDate, Quantity, PricePerUnit, TransactionType, ExchangeRateUSD_BRL) VALUES (?, datetime("now", "-3 hours"), ?, ?, ?, ?)',
                            [
                              transaction.AssetID,
                              -transaction.Quantity,
                              transaction.PricePerUnit,
                              transaction.TransactionType === 'Buy'
                                ? 'Sell'
                                : 'Buy',
                              currentExchangeRate,
                            ],
                            (err) => {
                              if (err) {
                                console.error(err.message);
                                db.run('ROLLBACK;', () =>
                                  res
                                    .status(500)
                                    .send(
                                      'Error recording first revert transaction'
                                    )
                                );
                                return;
                              }

                              // Second revert transaction
                              db.run(
                                'INSERT INTO Transactions (AssetID, TransactionDate, Quantity, PricePerUnit, TransactionType, ExchangeRateUSD_BRL) VALUES (?, datetime("now", "-3 hours"), ?, ?, ?, ?)',
                                [
                                  pairedTransaction.AssetID,
                                  -pairedTransaction.Quantity,
                                  pairedTransaction.PricePerUnit,
                                  pairedTransaction.TransactionType === 'Buy'
                                    ? 'Sell'
                                    : 'Buy',
                                  currentExchangeRate,
                                ],
                                (err) => {
                                  if (err) {
                                    console.error(err.message);
                                    db.run('ROLLBACK;', () =>
                                      res
                                        .status(500)
                                        .send(
                                          'Error recording second revert transaction'
                                        )
                                    );
                                    return;
                                  }

                                  db.run('COMMIT;', (err) => {
                                    if (err) {
                                      console.error(err.message);
                                      db.run('ROLLBACK;', () =>
                                        res
                                          .status(500)
                                          .send(
                                            'Error committing transaction'
                                          )
                                      );
                                      return;
                                    }

                                    res.send({
                                      message:
                                        'Conversion successfully reverted',
                                      details: {
                                        originalTransaction: {
                                          asset: transaction.AssetSymbol,
                                          quantity: transaction.Quantity,
                                          type: transaction.TransactionType,
                                        },
                                        pairedTransaction: {
                                          asset: pairedTransaction.AssetSymbol,
                                          quantity:
                                            pairedTransaction.Quantity,
                                          type: pairedTransaction.TransactionType,
                                        },
                                        revertDate: revertDate,
                                      },
                                    });
                                  });
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        });
      });
    } catch (error) {
      console.error('Error:', error);
      res
        .status(500)
        .send('Error in revert process: ' + error.message);
    }
  });

  return router;
};
