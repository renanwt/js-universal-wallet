const assetTransactionServiceFactory = require('../services/assetTransactionService');

module.exports = (() => {
  const assetTransactionService = assetTransactionServiceFactory();

  return {
    async getTransactions(req, res) {
      try {
        const { assetSymbol } = req.params;
        if (!assetSymbol) {
          return res.status(400).json({ error: 'Asset symbol is required.' });
        }

        const result = await assetTransactionService.getTransactionsBySymbol(assetSymbol);
        if (!result) {
          return res
            .status(404)
            .json({ error: 'No transactions found for the specified asset.' });
        }

        return res.json(result);
      } catch (error) {
        console.error('GetAssetTransactionsController#getTransactions', error.message);
        return res.status(500).json({ error: 'Error fetching transactions.' });
      }
    },
  };
})();
