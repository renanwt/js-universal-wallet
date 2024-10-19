const express = require('express');
const router = express.Router();

module.exports = (db) => {
  // Create a new AssetType
  router.post('/', (req, res) => {
    const { AssetTypeName } = req.body;
    db.run('INSERT INTO AssetTypes (AssetTypeName) VALUES (?)', [AssetTypeName], function(err) {
      if (err) {
        console.error(err.message);
        res.status(500).send('Error creating AssetType');
        return;
      }
      res.send('AssetType created with ID: ' + this.lastID);
    });
  });

  // Read all AssetTypes
  router.get('/', (req, res) => {
    db.all('SELECT * FROM AssetTypes', [], (err, rows) => {
      if (err) {
        console.error(err.message);
        res.status(500).send('Error fetching AssetTypes');
        return;
      }
      res.json(rows);
    });
  });

  // Update an AssetType
  router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { AssetTypeName } = req.body;
    db.run('UPDATE AssetTypes SET AssetTypeName = ? WHERE AssetTypeID = ?', [AssetTypeName, id], function(err) {
      if (err) {
        console.error(err.message);
        res.status(500).send('Error updating AssetType');
        return;
      }
      res.send('AssetType updated');
    });
  });

  // Delete an AssetType
  router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM AssetTypes WHERE AssetTypeID = ?', [id], function(err) {
      if (err) {
        console.error(err.message);
        res.status(500).send('Error deleting AssetType');
        return;
      }
      res.send('AssetType deleted');
    });
  });

  return router;
};

// OLD - MySQL
// const express = require('express');
// const router = express.Router();

// module.exports = (pool) => {
//   // Create a new AssetType
//   router.post('/', (req, res) => {
//     const { AssetTypeName } = req.body;
//     pool.query('INSERT INTO AssetTypes (AssetTypeName) VALUES (?)', [AssetTypeName], (err, result) => {
//       if (err) throw err;
//       res.send('AssetType created with ID: ' + result.insertId);
//     });
//   });

//   // Read all AssetTypes
//   router.get('/', (req, res) => {
//     pool.query('SELECT * FROM AssetTypes', (err, results) => {
//       if (err) throw err;
//       res.json(results);
//     });
//   });

//   // Update an AssetType
//   router.put('/:id', (req, res) => {
//     const { id } = req.params;
//     const { AssetTypeName } = req.body;
//     pool.query('UPDATE AssetTypes SET AssetTypeName = ? WHERE AssetTypeID = ?', [AssetTypeName, id], (err, result) => {
//       if (err) throw err;
//       res.send('AssetType updated');
//     });
//   });

//   // Delete an AssetType
//   router.delete('/:id', (req, res) => {
//     const { id } = req.params;
//     pool.query('DELETE FROM AssetTypes WHERE AssetTypeID = ?', [id], (err, result) => {
//       if (err) throw err;
//       res.send('AssetType deleted');
//     });
//   });

//   return router;
// };