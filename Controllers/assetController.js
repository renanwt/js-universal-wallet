const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

module.exports = (db) => {
  // Create a new Asset
  router.post('/', (req, res) => {
    const { AssetName, AssetSymbol, AssetTypeID } = req.body;
    db.run(
      'INSERT INTO Assets (AssetName, AssetSymbol, AssetTypeID) VALUES (?, ?, ?)',
      [AssetName, AssetSymbol, AssetTypeID],
      function (err) {
        if (err) {
          console.error(err.message);
          return res.status(500).send('Error creating asset');
        }
        res.send('Asset created with ID: ' + this.lastID);
      }
    );
  });

  // Read all Assets
  router.get('/', (req, res) => {
    db.all('SELECT * FROM Assets', [], (err, rows) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Error fetching assets');
      }
      res.json(rows);
    });
  });

  // Update an Asset
  router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { AssetName, AssetSymbol, AssetTypeID } = req.body;
    db.run(
      'UPDATE Assets SET AssetName = ?, AssetSymbol = ?, AssetTypeID = ? WHERE AssetID = ?',
      [AssetName, AssetSymbol, AssetTypeID, id],
      function (err) {
        if (err) {
          console.error(err.message);
          return res.status(500).send('Error updating asset');
        }
        res.send('Asset updated');
      }
    );
  });

  // Delete an Asset
  router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.run(
      'DELETE FROM Assets WHERE AssetID = ?',
      [id],
      function (err) {
        if (err) {
          console.error(err.message);
          return res.status(500).send('Error deleting asset');
        }
        res.send('Asset deleted');
      }
    );
  });

  return router;
};

// const express = require('express');
// const router = express.Router();

// module.exports = (pool) => {
//   // Create a new Asset
//   router.post('/', (req, res) => {
//     const { AssetName, AssetSymbol, AssetTypeID } = req.body;
//     pool.query('INSERT INTO Assets (AssetName, AssetSymbol, AssetTypeID) VALUES (?, ?, ?)', [AssetName, AssetSymbol, AssetTypeID], (err, result) => {
//       if (err) throw err;
//       res.send('Asset created with ID: ' + result.insertId);
//     });
//   });

//   // Read all Assets
//   router.get('/', (req, res) => {
//     pool.query('SELECT * FROM Assets', (err, results) => {
//       if (err) throw err;
//       res.json(results);
//     });
//   });

//   // Update an Asset
//   router.put('/:id', (req, res) => {
//     const { id } = req.params;
//     const { AssetName, AssetSymbol, AssetTypeID } = req.body;
//     pool.query('UPDATE Assets SET AssetName = ?, AssetSymbol = ?, AssetTypeID = ? WHERE AssetID = ?', [AssetName, AssetSymbol, AssetTypeID, id], (err, result) => {
//       if (err) throw err;
//       res.send('Asset updated');
//     });
//   });

//   // Delete an Asset
//   router.delete('/:id', (req, res) => {
//     const { id } = req.params;
//     pool.query('DELETE FROM Assets WHERE AssetID = ?', [id], (err, result) => {
//       if (err) throw err;
//       res.send('Asset deleted');
//     });
//   });

//   return router;
// };
