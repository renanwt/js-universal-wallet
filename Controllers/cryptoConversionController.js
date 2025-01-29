const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const yahooFinance = require('yahoo-finance2').default;

module.exports = (db) => {
  router.post('/', async (req, res) => {
    const {
      FromAssetSymbol,
      ToAssetSymbol,
      ConversionAmount,
      ToAssetAmount,
      TransactionDate,
    } = req.body;

    if (isNaN(ConversionAmount) || ConversionAmount <= 0) {
      return res.status(400).send('Invalid or missing ConversionAmount');
    }

    if (isNaN(ToAssetAmount) || ToAssetAmount <= 0) {
      return res.status(400).send('Invalid or missing ToAssetAmount');
    }

    const ConversionRate = ToAssetAmount / ConversionAmount;

    try {
      const exchangeRateResponse = await axios.get(
        'https://query1.finance.yahoo.com/v8/finance/chart/USDBRL=X'
      );
      const exchangeRate =
        exchangeRateResponse.data.chart.result[0].meta.regularMarketPrice;

      db.serialize(() => {
        db.run('BEGIN TRANSACTION;', (err) => {
          if (err) {
            console.error(err.message);
            return res.status(500).send('Transaction failed');
          }

          db.get(
            'SELECT * FROM Assets WHERE AssetSymbol = ?',
            [FromAssetSymbol],
            (err, fromAsset) => {
              if (err) {
                console.error(err.message);
                db.run('ROLLBACK;', () =>
                  res.status(500).send('Error checking source asset')
                );
                return;
              }

              if (!fromAsset) {
                db.run('ROLLBACK;', () =>
                  res.status(404).send('Source asset not found')
                );
                return;
              }

              if (fromAsset.AmountInWallet < ConversionAmount) {
                db.run('ROLLBACK;', () =>
                  res.status(400).send('Insufficient balance for conversion')
                );
                return;
              }

              const processTargetAsset = (toAsset) => {
                const newFromAmount = fromAsset.AmountInWallet - ConversionAmount;
                const newToAmount = (toAsset.AmountInWallet ?? 0) + ToAssetAmount;

                console.log('Updating source asset:', {
                  assetID: fromAsset.AssetID,
                  newAmount: newFromAmount,
                });

                console.log('Updating target asset:', {
                  assetID: toAsset.AssetID,
                  newAmount: newToAmount,
                });

                db.run(
                  'UPDATE Assets SET AmountInWallet = ? WHERE AssetID = ?',
                  [newFromAmount, fromAsset.AssetID],
                  (err) => {
                    if (err) {
                      console.error(err.message);
                      db.run('ROLLBACK;', () =>
                        res.status(500).send('Error updating source asset')
                      );
                      return;
                    }

                    db.run(
                      'UPDATE Assets SET AmountInWallet = ? WHERE AssetID = ?',
                      [newToAmount, toAsset.AssetID],
                      async (err) => {
                        if (err) {
                          console.error(err.message);
                          db.run('ROLLBACK;', () =>
                            res.status(500).send('Error updating target asset')
                          );
                          return;
                        }

                        try {
                          const existingAvgPrice = toAsset.AvgPrice ?? 0.0;
                          const existingAmount = toAsset.AmountInWallet ?? 0.0;

                          const newCostInUSD = ConversionAmount;
                          const totalQuantity = existingAmount + ToAssetAmount;

                          const newAvgPrice =
                            totalQuantity > 0
                              ? (existingAmount * existingAvgPrice + newCostInUSD) / totalQuantity
                              : newCostInUSD / ToAssetAmount;

                          console.log('AvgPrice Calculation:', {
                            existingAvgPrice,
                            existingAmount,
                            newCostInUSD,
                            totalQuantity,
                            newAvgPrice,
                          });

                          db.run(
                            'UPDATE Assets SET AvgPrice = ? WHERE AssetID = ?',
                            [newAvgPrice, toAsset.AssetID],
                            (err) => {
                              if (err) {
                                console.error(err.message);
                                db.run('ROLLBACK;', () =>
                                  res
                                    .status(500)
                                    .send('Error updating AvgPrice for target asset')
                                );
                                return;
                              }

                              const dateToUse = TransactionDate
                                ? `datetime('${TransactionDate}')`
                                : 'datetime("now")';

                              // FROM (Sell) transaction
                              db.run(
                                'INSERT INTO Transactions (AssetID, TransactionDate, Quantity, PricePerUnit, TransactionType, ExchangeRateUSD_BRL) VALUES (?, ' +
                                  dateToUse +
                                  ', ?, ?, ?, ?)',
                                [
                                  fromAsset.AssetID,
                                  ConversionAmount,
                                  1, // USDT price per unit is always 1
                                  'Sell',
                                  exchangeRate,
                                ],
                                (err) => {
                                  if (err) {
                                    console.error(err.message);
                                    db.run('ROLLBACK;', () =>
                                      res
                                        .status(500)
                                        .send('Error recording source transaction')
                                    );
                                    return;
                                  }

                                  // TO (Buy) transaction
                                  const targetPricePerUnit =
                                    ConversionAmount / ToAssetAmount; // Price per unit of SOL in USD

                                  db.run(
                                    'INSERT INTO Transactions (AssetID, TransactionDate, Quantity, PricePerUnit, TransactionType, ExchangeRateUSD_BRL) VALUES (?, ' +
                                      dateToUse +
                                      ', ?, ?, ?, ?)',
                                    [
                                      toAsset.AssetID,
                                      ToAssetAmount,
                                      targetPricePerUnit,
                                      'Buy',
                                      exchangeRate,
                                    ],
                                    (err) => {
                                      if (err) {
                                        console.error(err.message);
                                        db.run('ROLLBACK;', () =>
                                          res
                                            .status(500)
                                            .send('Error recording target transaction')
                                        );
                                        return;
                                      }

                                      db.run('COMMIT;', (err) => {
                                        if (err) {
                                          console.error(err.message);
                                          db.run('ROLLBACK;', () =>
                                            res
                                              .status(500)
                                              .send('Error committing transaction')
                                          );
                                          return;
                                        }

                                        res.send({
                                          message: 'Conversion completed successfully',
                                          details: {
                                            fromAsset: FromAssetSymbol,
                                            toAsset: ToAssetSymbol,
                                            convertedFrom: ConversionAmount,
                                            convertedTo: ToAssetAmount,
                                            rate: ConversionRate,
                                            exchangeRate: exchangeRate,
                                            transactionDate:
                                              TransactionDate || new Date().toISOString(),
                                          },
                                        });
                                      });
                                    }
                                  );
                                }
                              );
                            }
                          );
                        } catch (error) {
                          console.error('Error updating AvgPrice or transactions:', error);
                          db.run('ROLLBACK;', () =>
                            res.status(500).send('Error updating AvgPrice or transactions')
                          );
                        }
                      }
                    );
                  }
                );
              };

              db.get(
                'SELECT * FROM Assets WHERE AssetSymbol = ?',
                [ToAssetSymbol],
                (err, toAsset) => {
                  if (err) {
                    console.error(err.message);
                    db.run('ROLLBACK;', () =>
                      res.status(500).send('Error checking target asset')
                    );
                    return;
                  }

                  if (!toAsset) {
                    const assetName =
                      ToAssetSymbol === 'USDT' ? 'Tether USD' : ToAssetSymbol;
                    db.run(
                      'INSERT INTO Assets (AssetName, AssetSymbol, AssetTypeID, AmountInWallet, AvgPrice, Currency) VALUES (?, ?, ?, ?, ?, ?)',
                      [assetName, ToAssetSymbol, 1, 0.0, 1.0, 'USD'],
                      function (err) {
                        if (err) {
                          console.error(err.message);
                          db.run('ROLLBACK;', () =>
                            res.status(500).send('Error creating target asset')
                          );
                          return;
                        }
                        db.get(
                          'SELECT * FROM Assets WHERE AssetID = ?',
                          [this.lastID],
                          (err, newAsset) => {
                            if (err) {
                              console.error(err.message);
                              db.run('ROLLBACK;', () =>
                                res.status(500).send('Error fetching new asset')
                              );
                              return;
                            }
                            processTargetAsset(newAsset);
                          }
                        );
                      }
                    );
                  } else {
                    processTargetAsset(toAsset);
                  }
                }
              );
            }
          );
        });
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Error in conversion process: ' + error.message);
    }
  });

  return router;
};
