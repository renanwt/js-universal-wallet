const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // Get aggregated asset status by date
  // Get all daily totals without date filtering
  // This endpoint is kept for backward compatibility
  router.get('/daily-totals', async (req, res) => {
    try {
      const query = `
        SELECT 
          recordedDate,
          SUM(valueInBRL) as totalValue
        FROM AssetStatus 
        GROUP BY recordedDate
        ORDER BY recordedDate ASC
      `;

      db.all(query, [], (err, results) => {
        if (err) {
          console.error('Error fetching asset status:', err);
          return res.status(500).send('Error fetching asset status data');
        }

        // Format the results
        const formattedResults = results.map(row => ({
          recordedDate: row.recordedDate,
          totalValue: parseFloat(row.totalValue).toFixed(2)
        }));

        res.json(formattedResults);
      });
    } catch (error) {
      console.error('Error in daily-totals route:', error);
      res.status(500).send('Internal server error');
    }
  });

  // Get asset status within a date range
  // Example: GET /api/asset-status?startDate=2024-01-01&endDate=2024-12-31
  router.get('/', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      // If no dates provided, return all records
      if (!startDate && !endDate) {
        const query = `
          SELECT 
            recordedDate,
            SUM(valueInBRL) as totalValue
          FROM AssetStatus 
          GROUP BY recordedDate
          ORDER BY recordedDate ASC
        `;

        db.all(query, [], handleResults);
        return;
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if ((startDate && !dateRegex.test(startDate)) || (endDate && !dateRegex.test(endDate))) {
        return res.status(400).json({
          error: 'Invalid date format. Please use YYYY-MM-DD format.'
        });
      }

      const query = `
        SELECT 
          recordedDate,
          SUM(valueInBRL) as totalValue
        FROM AssetStatus 
        WHERE recordedDate BETWEEN ? AND ?
        GROUP BY recordedDate
        ORDER BY recordedDate ASC
      `;

      db.all(query, [startDate, endDate], (err, results) => {
        if (err) {
          console.error('Error fetching asset status:', err);
          return res.status(500).send('Error fetching asset status data');
        }

        const formattedResults = results.map(row => ({
          recordedDate: row.recordedDate,
          totalValue: parseFloat(row.totalValue).toFixed(2)
        }));

        res.json(formattedResults);
      });
    } catch (error) {
      console.error('Error in date-range route:', error);
      res.status(500).send('Internal server error');
    }
  });

  // Get latest asset status total
  router.get('/latest', async (req, res) => {
    try {
      const query = `
        SELECT 
          recordedDate,
          SUM(valueInBRL) as totalValue
        FROM AssetStatus 
        WHERE recordedDate = (
          SELECT MAX(recordedDate) 
          FROM AssetStatus
        )
        GROUP BY recordedDate
      `;

      db.all(query, [], (err, results) => {
        if (err) {
          console.error('Error fetching latest asset status:', err);
          return res.status(500).send('Error fetching latest asset status data');
        }

        if (results.length === 0) {
          return res.status(404).send('No asset status data found');
        }

        const formattedResult = {
          recordedDate: results[0].recordedDate,
          totalValue: parseFloat(results[0].totalValue).toFixed(2)
        };

        res.json(formattedResult);
      });
    } catch (error) {
      console.error('Error in latest route:', error);
      res.status(500).send('Internal server error');
    }
  });

  return router;
};