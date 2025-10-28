const { getDbConnection } = require('../utils/dbHelper');
const assetRepositoryFactory = require('../repositories/assetRepository');
const assetStatusRepositoryFactory = require('../repositories/assetStatusRepository');
const portfolioServiceFactory = require('./portfolioService');
const { runStatement } = require('../utils/sqliteHelper');

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatDate = (date) => {
  if (date) {
    return date;
  }
  return new Date().toISOString().slice(0, 10);
};

module.exports = () => {
  return {
    async recordCurrentStatus(recordDate) {
      const db = await getDbConnection();
      const assetRepository = assetRepositoryFactory(db);
      const assetStatusRepository = assetStatusRepositoryFactory(db);
      const portfolioService = portfolioServiceFactory(db);

      const assets = await assetRepository.getAssets();
      if (!assets.length) {
        return;
      }

      const portfolioSummary = await portfolioService.getAssetBreakdown();
      const exchangeRate = toNumber(portfolioSummary.exchangeRateUSD_BRL);
      const portfolioMap = new Map(
        portfolioSummary.assets.map((asset) => [asset.assetSymbol, asset])
      );

      const recordedDate = formatDate(recordDate);

      await runStatement(db, 'BEGIN TRANSACTION');

      try {
        for (const asset of assets) {
          const valuation = portfolioMap.get(asset.AssetSymbol);
          const valueInBRL = valuation ? toNumber(valuation.totalBRL) : 0;

          await assetStatusRepository.insertStatus({
            assetSymbol: asset.AssetSymbol,
            amountInWallet: toNumber(asset.AmountInWallet),
            avgPrice: toNumber(asset.AvgPrice),
            valueInBRL,
            exchangeRate,
            recordedDate,
          });
        }

        await runStatement(db, 'COMMIT');
      } catch (error) {
        await runStatement(db, 'ROLLBACK');
        throw error;
      }
    },

    async getStatusByDate(recordedDate) {
      const db = await getDbConnection();
      const assetStatusRepository = assetStatusRepositoryFactory(db);

      const rows = await assetStatusRepository.getStatusesByDate(recordedDate);
      if (!rows.length) {
        return null;
      }

      const totals = await assetStatusRepository.getTotalsByDate(recordedDate);
      const totalAmount = toNumber(totals?.totalAmount);
      const totalInUSD = toNumber(totals?.totalInUSD);
      const exchangeRate = toNumber(rows[0].exchangeRate);

      const assetStatuses = rows.map((row) => {
        const percentage =
          totalAmount > 0 ? (row.valueInBRL / totalAmount) * 100 : 0;

        return {
          assetSymbol: row.assetSymbol,
          amountInWallet: row.amountInWallet,
          avgPrice: toNumber(row.avgPrice),
          valueInBRL: toNumber(row.valueInBRL),
          recordedDate: row.recordedDate,
          percentageInWallet: `${percentage.toFixed(2)}%`,
        };
      });

      return {
        totalAmount: totalAmount.toFixed(2),
        totalInUSD: totalInUSD.toFixed(2),
        exchangeRate: exchangeRate.toFixed(2),
        assetStatuses,
      };
    },
  };
};
