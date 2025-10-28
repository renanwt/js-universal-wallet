const historyServiceFactory = require('../services/historyService');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

module.exports = (() => {
  const historyService = historyServiceFactory();

  return {
    async getDailyTotals(req, res) {
      try {
        const totals = await historyService.getDailyTotals();
        return res.json(totals);
      } catch (error) {
        console.error('HistoryController#getDailyTotals', error.message);
        return res.status(500).json({ error: 'Error fetching asset status data.' });
      }
    },

    async getHistory(req, res) {
      try {
        const { startDate, endDate } = req.query;

        if (!startDate && !endDate) {
          const totals = await historyService.getDailyTotals();
          return res.json(totals);
        }

        if (!startDate || !endDate) {
          return res.status(400).json({
            error: 'Both startDate and endDate must be provided in YYYY-MM-DD format.',
          });
        }

        if (!DATE_REGEX.test(startDate) || !DATE_REGEX.test(endDate)) {
          return res.status(400).json({
            error: 'Invalid date format. Please use YYYY-MM-DD format.',
          });
        }

        const totals = await historyService.getTotalsByDateRange(startDate, endDate);
        return res.json(totals);
      } catch (error) {
        console.error('HistoryController#getHistory', error.message);
        return res.status(500).json({ error: 'Error fetching asset status data.' });
      }
    },

    async getLatest(req, res) {
      try {
        const latest = await historyService.getLatestTotal();
        if (!latest) {
          return res.status(404).json({ error: 'No asset status data found.' });
        }
        return res.json(latest);
      } catch (error) {
        console.error('HistoryController#getLatest', error.message);
        return res.status(500).json({ error: 'Error fetching latest asset status data.' });
      }
    },
  };
})();
