const totalPositionServiceFactory = require('../services/totalPositionService');

module.exports = (() => {
  const totalPositionService = totalPositionServiceFactory();

  return {
    async getTotalPosition(req, res) {
      try {
        const summary = await totalPositionService.getTotalPosition();
        return res.json(summary);
      } catch (error) {
        console.error('TotalPositionController#getTotalPosition', error.message);
        return res.status(500).json({ error: 'Error calculating wallet balance.' });
      }
    },
  };
})();
