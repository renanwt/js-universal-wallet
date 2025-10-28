const { getDbConnection } = require('../utils/dbHelper');
const assetStatusRepositoryFactory = require('../repositories/assetStatusRepository');

const toMoneyString = (value) => {
  const numeric = Number(value);
  return Number.isNaN(numeric) ? '0.00' : numeric.toFixed(2);
};

module.exports = () => {
  const buildContext = async () => {
    const db = await getDbConnection();
    return {
      assetStatusRepository: assetStatusRepositoryFactory(db),
    };
  };

  return {
    async getDailyTotals() {
      const { assetStatusRepository } = await buildContext();
      const rows = await assetStatusRepository.getAggregatedTotals();
      return rows.map((row) => ({
        recordedDate: row.recordedDate,
        totalValue: toMoneyString(row.totalValue),
      }));
    },

    async getTotalsByDateRange(startDate, endDate) {
      const { assetStatusRepository } = await buildContext();
      const rows = await assetStatusRepository.getAggregatedTotals({
        startDate,
        endDate,
      });

      return rows.map((row) => ({
        recordedDate: row.recordedDate,
        totalValue: toMoneyString(row.totalValue),
      }));
    },

    async getLatestTotal() {
      const { assetStatusRepository } = await buildContext();
      const latest = await assetStatusRepository.getLatestTotal();
      if (!latest) {
        return null;
      }
      return {
        recordedDate: latest.recordedDate,
        totalValue: toMoneyString(latest.totalValue),
      };
    },
  };
};
