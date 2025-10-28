const assetStatusServiceFactory = require('../services/assetStatusService');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

module.exports = (() => {
  const assetStatusService = assetStatusServiceFactory();

  return {
    async recordStatus(req, res) {
      try {
        const { recordDate } = req.body || {};
        if (recordDate && !DATE_REGEX.test(recordDate)) {
          return res
            .status(400)
            .json({ error: 'recordDate must be provided in YYYY-MM-DD format.' });
        }

        await assetStatusService.recordCurrentStatus(recordDate);
        return res.status(200).json({ message: 'Asset status recorded successfully.' });
      } catch (error) {
        console.error('AssetStatusController#recordStatus', error.message);
        return res.status(500).json({ error: 'Error recording asset status.' });
      }
    },

    async getStatusByDate(req, res) {
      try {
        const { date } = req.query;
        if (!date || !DATE_REGEX.test(date)) {
          return res
            .status(400)
            .json({ error: 'Please provide a date in YYYY-MM-DD format.' });
        }

        const status = await assetStatusService.getStatusByDate(date);
        if (!status) {
          return res
            .status(404)
            .json({ error: 'No asset statuses found for the given date.' });
        }

        return res.json(status);
      } catch (error) {
        console.error('AssetStatusController#getStatusByDate', error.message);
        return res.status(500).json({ error: 'Error fetching asset status.' });
      }
    },
  };
})();
