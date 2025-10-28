const transactionServiceFactory = require('../services/transactionService');
const {
  validateTransactionPayload,
  validateTransactionIdParam,
} = require('../utils/validators');

module.exports = (() => {
  const transactionService = transactionServiceFactory();

  return {
    async createTransaction(req, res) {
      try {
        const validationError = validateTransactionPayload(req.body);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }

        await transactionService.createTransaction(req.body);
        return res.status(201).json({ message: 'Transaction created.' });
      } catch (error) {
        console.error('TransactionController#createTransaction', error.message);
        return res.status(500).json({ error: error.message });
      }
    },

    async listTransactions(req, res) {
      try {
        const transactions = await transactionService.listTransactions(req.query);
        return res.json(transactions);
      } catch (error) {
        console.error('TransactionController#listTransactions', error.message);
        return res.status(500).json({ error: 'Failed to fetch transactions.' });
      }
    },

    async getTransaction(req, res) {
      try {
        const { id } = req.params;
        const validationError = validateTransactionIdParam(id);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }

        const transaction = await transactionService.getTransaction(id);
        if (!transaction) {
          return res.status(404).json({ error: 'Transaction not found.' });
        }
        return res.json(transaction);
      } catch (error) {
        console.error('TransactionController#getTransaction', error.message);
        return res.status(500).json({ error: error.message });
      }
    },

    async updateTransaction(req, res) {
      try {
        const { id } = req.params;
        const validationError = validateTransactionIdParam(id);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }

        if (!Object.keys(req.body || {}).length) {
          return res.status(400).json({ error: 'At least one field must be provided for update.' });
        }

        const updatedTransaction = await transactionService.updateTransaction(id, req.body);
        return res.json(updatedTransaction);
      } catch (error) {
        console.error('TransactionController#updateTransaction', error.message);
        const status = error.message === 'Transaction not found.' ? 404 : 500;
        return res.status(status).json({ error: error.message });
      }
    },

    async deleteTransaction(req, res) {
      try {
        const { id } = req.params;
        const validationError = validateTransactionIdParam(id);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }

        await transactionService.deleteTransaction(id);
        return res.status(204).send();
      } catch (error) {
        console.error('TransactionController#deleteTransaction', error.message);
        return res.status(500).json({ error: error.message });
      }
    },
  };
})();
