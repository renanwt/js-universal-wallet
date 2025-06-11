const yahooFinance = require('yahoo-finance2').default;

/**
 * Fetches the current market quote for an asset symbol.
 * @param {string} symbol - The symbol of the asset (e.g., 'AAPL', 'BTC-USD').
 * @returns {Promise<object>} - The quote data for the asset.
 */
async function getQuote(symbol) {
  try {
    const quote = await yahooFinance.quote(symbol);
    return quote;
  } catch (error) {
    console.error(`Error fetching quote for symbol ${symbol}:`, error);
    throw new Error('Error fetching asset quote from Yahoo Finance');
  }
}

/**
 * Fetches the current USD/BRL exchange rate.
 * @returns {Promise<number>} - The current USD to BRL exchange rate.
 */
async function getExchangeRateUSD_BRL() {
  try {
    const exchangeRateResponse = await yahooFinance.quote('USDBRL=X');
    const exchangeRateUSD_BRL = exchangeRateResponse.regularMarketPrice;
    return exchangeRateUSD_BRL;
  } catch (error) {
    console.error('Error fetching USD/BRL exchange rate:', error);
    throw new Error('Error fetching exchange rate from Yahoo Finance');
  }
}

module.exports = {
  getQuote,
  getExchangeRateUSD_BRL
};
