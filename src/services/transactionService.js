const { getDbConnection } = require('../utils/dbHelper');
const transactionRepositoryFactory = require('../repositories/transactionRepository');

const VALID_TRANSACTION_TYPES = new Set(['Buy', 'Sell']);

const toNumeric = (value, fieldName) => {
  if (value === undefined || value === null) {
    return undefined;
  }
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    throw new Error(`${fieldName} must be a valid number.`);
  }
  return numericValue;
};

module.exports = () => {
  const buildContext = async () => {
    const db = await getDbConnection();
    return {
      db,
      transactionRepository: transactionRepositoryFactory(db),
    };
  };

  const normalizeTransactionPayload = (payload, { requireType = true } = {}) => {
    const normalized = {};

    const AssetID = toNumeric(payload.AssetID, 'AssetID');
    if (!AssetID) {
      throw new Error('AssetID is required.');
    }
    normalized.AssetID = AssetID;

    const Quantity = toNumeric(payload.Quantity, 'Quantity');
    if (Quantity === undefined) {
      throw new Error('Quantity is required.');
    }
    normalized.Quantity = Quantity;

    const PricePerUnit = toNumeric(payload.PricePerUnit, 'PricePerUnit');
    if (PricePerUnit === undefined) {
      throw new Error('PricePerUnit is required.');
    }
    normalized.PricePerUnit = PricePerUnit;

    const exchangeRate = toNumeric(payload.ExchangeRateUSD_BRL, 'ExchangeRateUSD_BRL');
    if (exchangeRate === undefined) {
      throw new Error('ExchangeRateUSD_BRL is required.');
    }
    normalized.ExchangeRateUSD_BRL = exchangeRate;

    if (requireType || payload.TransactionType !== undefined) {
      const { TransactionType } = payload;
      if (!TransactionType || !VALID_TRANSACTION_TYPES.has(TransactionType)) {
        throw new Error(`TransactionType must be one of: ${Array.from(VALID_TRANSACTION_TYPES).join(', ')}`);
      }
      normalized.TransactionType = TransactionType;
    }

    if (payload.TransactionDate) {
      normalized.TransactionDate = payload.TransactionDate;
    }

    if (payload.Info !== undefined) {
      normalized.Info = payload.Info;
    }

    return normalized;
  };

  return {
    async listTransactions(filters = {}) {
      const { transactionRepository } = await buildContext();
      const normalizedFilters = {};
      if (filters.AssetID !== undefined) {
        normalizedFilters.AssetID = toNumeric(filters.AssetID, 'AssetID');
      }
      return transactionRepository.getTransactions(normalizedFilters);
    },

    async getTransaction(TransactionID) {
      const { transactionRepository } = await buildContext();
      return transactionRepository.getTransactionById(Number(TransactionID));
    },

    async createTransaction(payload) {
      const { transactionRepository } = await buildContext();
      const normalized = normalizeTransactionPayload(payload);
      await transactionRepository.createTransaction(normalized);
    },

    async updateTransaction(TransactionID, payload) {
      const { transactionRepository } = await buildContext();
      const existing = await transactionRepository.getTransactionById(Number(TransactionID));
      if (!existing) {
        throw new Error('Transaction not found.');
      }

      const normalizedUpdates = normalizeTransactionPayload(
        { ...existing, ...payload },
        { requireType: false }
      );

      // Remove immutable fields if they were not provided in payload
      if (payload.TransactionType === undefined) {
        delete normalizedUpdates.TransactionType;
      }
      if (payload.ExchangeRateUSD_BRL === undefined) {
        normalizedUpdates.ExchangeRateUSD_BRL = existing.ExchangeRateUSD_BRL;
      }

      await transactionRepository.updateTransaction(existing.TransactionID, normalizedUpdates);
      return transactionRepository.getTransactionById(existing.TransactionID);
    },

    async deleteTransaction(TransactionID) {
      const { transactionRepository } = await buildContext();
      await transactionRepository.deleteTransaction(Number(TransactionID));
    },
  };
};
