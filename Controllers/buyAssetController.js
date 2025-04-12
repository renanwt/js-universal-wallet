const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

module.exports = (db) => {
  router.post('/', (req, res) => {
    const { AssetName, AssetSymbol, AssetTypeID, Quantity, PricePerUnit, ExchangeRateUSD_BRL } = req.body;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION;', (err) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send('Transaction failed');
        }

        // Step 1: Insert or update the Assets table
        db.get('SELECT * FROM Assets WHERE AssetSymbol = ?', [AssetSymbol], (err, existingAsset) => {
          if (err) {
            console.error(err.message);
            db.run('ROLLBACK;', () => res.status(500).send('Error checking asset'));
            return;
          }

          if (existingAsset) {
            // UPDATE EXISTING...
            const AmountInWallet = parseFloat(existingAsset.AmountInWallet);
            const AvgPrice = parseFloat(existingAsset.AvgPrice);

            let newAmountInWallet = parseFloat(AmountInWallet + Quantity);
            let newAvgPrice = ((AvgPrice * AmountInWallet) + (PricePerUnit * Quantity)) / newAmountInWallet;

            if (existingAsset.AssetTypeID === 8 ){
              newAmountInWallet = AmountInWallet + PricePerUnit;
              newAvgPrice = 1;
            }

            db.run(
              'UPDATE Assets SET AmountInWallet = ?, AvgPrice = ? WHERE AssetID = ?',
              [newAmountInWallet, newAvgPrice, existingAsset.AssetID],
              (err) => {
                if (err) {
                  console.error(err.message);
                  db.run('ROLLBACK;', () => res.status(500).send('Error updating asset'));
                  return;
                }

                insertTransaction(existingAsset.AssetID);
              }
            );
          } else {
            // ... OR ADD NEW
            const Currency = [2, 3, 7, 8].includes(AssetTypeID) ? 'BRL' : 'USD';

            db.run(
              'INSERT INTO Assets (AssetName, AssetSymbol, AssetTypeID, AmountInWallet, AvgPrice, Currency) VALUES (?, ?, ?, ?, ?, ?)',
              [AssetName, AssetSymbol, AssetTypeID, Quantity, PricePerUnit, Currency],
              function(err) {
                if (err) {
                  console.error(err.message);
                  db.run('ROLLBACK;', () => res.status(500).send('Error inserting new asset'));
                  return;
                }

                insertTransaction(this.lastID);
              }
            );
          }
        });

        function insertTransaction(assetID) {
          db.run(
            'INSERT INTO Transactions (AssetID, TransactionDate, Quantity, PricePerUnit, TransactionType, ExchangeRateUSD_BRL) VALUES (?, datetime("now"), ?, ?, ?, ?)',
            [assetID, Quantity, PricePerUnit, "Buy", ExchangeRateUSD_BRL],
            (err) => {
              if (err) {
                console.error(err.message);
                db.run('ROLLBACK;', () => res.status(500).send('Error inserting transaction'));
                return;
              }

              db.run('COMMIT;', (err) => {
                if (err) {
                  console.error(err.message);
                  db.run('ROLLBACK;', () => res.status(500).send('Error committing transaction'));
                  return;
                }

                res.send('Transaction and Asset record successfully created/updated');
              });
            }
          );
        }
      });
    });
  });

  return router;
};
