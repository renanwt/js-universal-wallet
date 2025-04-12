const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

module.exports = (db) => {
  router.post('/', (req, res) => {
    const { AssetSymbol, Quantity, PricePerUnit, ExchangeRateUSD_BRL, Info } = req.body;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION;', (err) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send('Transaction failed');
        }

        // Step 1: Check if the asset exists
        db.get('SELECT * FROM Assets WHERE AssetSymbol = ?', [AssetSymbol], (err, existingAsset) => {
          if (err) {
            console.error(err.message);
            db.run('ROLLBACK;', () => res.status(500).send('Error checking asset'));
            return;
          }

          if (existingAsset) {
            // Step 2: Ensure there are enough assets to sell
            const AmountInWallet = parseFloat(existingAsset.AmountInWallet);

            if (AmountInWallet < Quantity) {
              db.run('ROLLBACK;', () => res.status(400).send('Not enough assets in wallet to sell'));
              return;
            }

            // Step 3: Update the wallet with the new amount after selling
            let newAmountInWallet = AmountInWallet - Quantity;
            let newAvgPrice = existingAsset.AvgPrice; // Price does not change on sell

            if (existingAsset.AssetTypeID === 8) {
              newAmountInWallet = AmountInWallet - PricePerUnit;
              newAvgPrice = 1;
            }

            db.run(
              'UPDATE Assets SET AmountInWallet = ? WHERE AssetID = ?',
              [newAmountInWallet, existingAsset.AssetID],
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
            db.run('ROLLBACK;', () => res.status(404).send('Asset not found'));
          }
        });

        function insertTransaction(assetID) {
          const insertQuery = 'INSERT INTO Transactions (AssetID, TransactionDate, Quantity, PricePerUnit, TransactionType, ExchangeRateUSD_BRL, Info) VALUES (?, datetime("now"), ?, ?, ?, ?, ?)';

          db.run(
            insertQuery,
            [assetID, Quantity, PricePerUnit, "Sell", ExchangeRateUSD_BRL, Info || null],  // Set Info to null if not provided
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

                res.send('Transaction and Asset record successfully updated for sale');
              });
            }
          );
        }
      });
    });
  });

  return router;
};
