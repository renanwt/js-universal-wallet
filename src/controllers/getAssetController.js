const portfolioServiceFactory = require('../services/portfolioService');
const { validateGetAssets } = require('../utils/validators');

const formatSummaryResponse = (summary, percentageKey) => {
  const assets = summary.assets.map(({ percentageOfTotal, ...rest }) => ({
    ...rest,
    [percentageKey]: percentageOfTotal,
  }));

  return {
    totalValueBRL: summary.totalValueBRL,
    totalValueUSD: summary.totalValueUSD,
    exchangeRateUSD_BRL: summary.exchangeRateUSD_BRL,
    assets,
  };
};

const normalizeTypeIdArray = (defaultTypeIds, override) => {
  if (override !== undefined && override !== null) {
    const parsed = Number(override);
    return Number.isNaN(parsed) ? defaultTypeIds : [parsed];
  }
  return defaultTypeIds;
};

module.exports = (() => {
  const portfolioService = portfolioServiceFactory();

  return {
    async getAssets(req, res) {
      try {
        const validationError = validateGetAssets(req.query);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }

        const { assetTypeID } = req.query;
        const assetTypeIDs =
          assetTypeID !== undefined && assetTypeID !== null
            ? [Number(assetTypeID)]
            : undefined;

        const summary = await portfolioService.getAssetBreakdown({
          assetTypeIDs,
        });
        return res.json(formatSummaryResponse(summary, 'assetPercentage'));
      } catch (error) {
        console.error('GetAssetController#getAssets', error.message);
        return res.status(500).json({ error: 'Error fetching asset data' });
      }
    },

    async getCryptos(req, res) {
      try {
        const assetTypeIDs = normalizeTypeIdArray([1], req.query.assetTypeID);
        const summary = await portfolioService.getAssetBreakdown({
          assetTypeIDs,
        });
        return res.json(formatSummaryResponse(summary, 'classPercentage'));
      } catch (error) {
        console.error('GetAssetController#getCryptos', error.message);
        return res.status(500).json({ error: 'Error fetching crypto data' });
      }
    },

    async getAcoes(req, res) {
      try {
        const assetTypeIDs = normalizeTypeIdArray([2], req.query.assetTypeID);
        const summary = await portfolioService.getAssetBreakdown({
          assetTypeIDs,
        });
        return res.json(formatSummaryResponse(summary, 'classPercentage'));
      } catch (error) {
        console.error('GetAssetController#getAcoes', error.message);
        return res.status(500).json({ error: 'Error fetching BR assets data' });
      }
    },

    async getFiis(req, res) {
      try {
        const assetTypeIDs = normalizeTypeIdArray([3], req.query.assetTypeID);
        const summary = await portfolioService.getAssetBreakdown({
          assetTypeIDs,
        });
        return res.json(formatSummaryResponse(summary, 'classPercentage'));
      } catch (error) {
        console.error('GetAssetController#getFiis', error.message);
        return res.status(500).json({ error: 'Error fetching FIIs data' });
      }
    },

    async getBrEtfs(req, res) {
      try {
        const assetTypeIDs = normalizeTypeIdArray([7], req.query.assetTypeID);
        const summary = await portfolioService.getAssetBreakdown({
          assetTypeIDs,
        });
        return res.json(formatSummaryResponse(summary, 'classPercentage'));
      } catch (error) {
        console.error('GetAssetController#getBrEtfs', error.message);
        return res.status(500).json({ error: 'Error fetching BR ETFs data' });
      }
    },

    async getStocks(req, res) {
      try {
        const assetTypeIDs = normalizeTypeIdArray([4], req.query.assetTypeID);
        const summary = await portfolioService.getAssetBreakdown({
          assetTypeIDs,
        });
        return res.json(formatSummaryResponse(summary, 'classPercentage'));
      } catch (error) {
        console.error('GetAssetController#getStocks', error.message);
        return res.status(500).json({ error: 'Error fetching US stocks data' });
      }
    },

    async getReits(req, res) {
      try {
        const assetTypeIDs = normalizeTypeIdArray([5], req.query.assetTypeID);
        const summary = await portfolioService.getAssetBreakdown({
          assetTypeIDs,
        });
        return res.json(formatSummaryResponse(summary, 'classPercentage'));
      } catch (error) {
        console.error('GetAssetController#getReits', error.message);
        return res.status(500).json({ error: 'Error fetching US REITs data' });
      }
    },

    async getUsEtfs(req, res) {
      try {
        const assetTypeIDs = normalizeTypeIdArray([6], req.query.assetTypeID);
        const summary = await portfolioService.getAssetBreakdown({
          assetTypeIDs,
        });
        return res.json(formatSummaryResponse(summary, 'classPercentage'));
      } catch (error) {
        console.error('GetAssetController#getUsEtfs', error.message);
        return res.status(500).json({ error: 'Error fetching US ETFs data' });
      }
    },
  };
})();
