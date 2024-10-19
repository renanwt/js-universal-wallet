const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

module.exports = (db) => {
  // Create a new Transaction
  router.post('/', (req, res) => {
    const { AssetID, TransactionDate, Quantity, PricePerUnit, TransactionType } = req.body;
    db.run(
      'INSERT INTO Transactions (AssetID, TransactionDate, Quantity, PricePerUnit, TransactionType) VALUES (?, ?, ?, ?, ?)',
      [AssetID, TransactionDate, Quantity, PricePerUnit, TransactionType],
      function (err) {
        if (err) {
          console.error(err.message);
          return res.status(500).send('Error creating transaction');
        }
        res.send('Transaction created with ID: ' + this.lastID);
      }
    );
  });

  // Read all Transactions
  router.get('/', (req, res) => {
    db.all('SELECT * FROM Transactions', [], (err, rows) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Error fetching transactions');
      }
      res.json(rows);
    });
  });

  // Update a Transaction
  router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { AssetID, TransactionDate, Quantity, PricePerUnit, TransactionType } = req.body;
    db.run(
      'UPDATE Transactions SET AssetID = ?, TransactionDate = ?, Quantity = ?, PricePerUnit = ?, TransactionType = ? WHERE TransactionID = ?',
      [AssetID, TransactionDate, Quantity, PricePerUnit, TransactionType, id],
      function (err) {
        if (err) {
          console.error(err.message);
          return res.status(500).send('Error updating transaction');
        }
        res.send('Transaction updated');
      }
    );
  });

  // Delete a Transaction
  router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.run(
      'DELETE FROM Transactions WHERE TransactionID = ?',
      [id],
      function (err) {
        if (err) {
          console.error(err.message);
          return res.status(500).send('Error deleting transaction');
        }
        res.send('Transaction deleted');
      }
    );
  });

  return router;
};

// const express = require('express');
// const router = express.Router();

// module.exports = (pool) => {
//   // Create a new Transaction
//   router.post('/', (req, res) => {
//     const { AssetID, TransactionDate, Quantity, PricePerUnit, TransactionType } = req.body;
//     pool.query('INSERT INTO Transactions (AssetID, TransactionDate, Quantity, PricePerUnit, TransactionType) VALUES (?, ?, ?, ?, ?)', [AssetID, TransactionDate, Quantity, PricePerUnit, TransactionType], (err, result) => {
//       if (err) throw err;
//       res.send('Transaction created with ID: ' + result.insertId);
//     });
//   });

//   // Read all Transactions
//   router.get('/', (req, res) => {
//     pool.query('SELECT * FROM Transactions', (err, results) => {
//       if (err) throw err;
//       res.json(results);
//     });
//   });

//   // Update a Transaction
//   router.put('/:id', (req, res) => {
//     const { id } = req.params;
//     const { AssetID, TransactionDate, Quantity, PricePerUnit, TransactionType } = req.body;
//     pool.query('UPDATE Transactions SET AssetID = ?, TransactionDate = ?, Quantity = ?, PricePerUnit = ?, TransactionType = ? WHERE TransactionID = ?', [AssetID, TransactionDate, Quantity, PricePerUnit, TransactionType, id], (err, result) => {
//       if (err) throw err;
//       res.send('Transaction updated');
//     });
//   });

//   // Delete a Transaction
//   router.delete('/:id', (req, res) => {
//     const { id } = req.params;
//     pool.query('DELETE FROM Transactions WHERE TransactionID = ?', [id], (err, result) => {
//       if (err) throw err;
//       res.send('Transaction deleted');
//     });
//   });

//   return router;
// };
