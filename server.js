const express = require('express');
const { getDbConnection } = require('./src/utils/db');
const assetRepository = require('./src/repositories/assetRepository');
const assetService = require('./src/services/getAssetService');
const assetController = require('./src/controllers/getAssetController');
const assetRoutes = require('./src/routes/assetRoutes');

const app = express();
app.use(express.json());

(async () => {
  try {
    const db = await getDbConnection();

    // Initialize controllers and routes
    const controller = assetController(db, { assetService: assetService(db, { assetRepository: assetRepository(db) }) });
    app.use('/assets', assetRoutes(db, { assetController: controller }));

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down...');
      await closeDbConnection(db);
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
})();
