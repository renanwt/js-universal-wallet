const revertTransactionServiceFactory = require('../services/revertTransactionService');
const { validateTransactionIdParam } = require('../utils/validators');

module.exports = (() => {
  const revertTransactionService = revertTransactionServiceFactory();

  return {
    async revert(req, res) {
      try {
        const { transactionId } = req.params;
        const validationError = validateTransactionIdParam(transactionId);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }

        const result = await revertTransactionService.revertTransaction(transactionId);
        return res.json(result);
      } catch (error) {
        console.error('RevertTransactionController#revert', error.message);
        const message = error.message || 'Error reverting transaction.';
        if (/not found/i.test(message)) {
          return res.status(404).json({ error: message });
        }
        return res.status(500).json({ error: 'Unexpected error reverting transaction.' });
      }
    },
  };
})();
