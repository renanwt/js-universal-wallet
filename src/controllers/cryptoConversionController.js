const cryptoConversionServiceFactory = require('../services/cryptoConversionService');
const { validateConversionPayload } = require('../utils/validators');

module.exports = (() => {
  const cryptoConversionService = cryptoConversionServiceFactory();

  return {
    async convert(req, res) {
      try {
        const validationError = validateConversionPayload(req.body);
        if (validationError) {
          return res.status(400).json({ error: validationError });
        }

        const result = await cryptoConversionService.convert(req.body);
        return res.json(result);
      } catch (error) {
        console.error('CryptoConversionController#convert', error.message);
        const message = error.message || 'Error performing conversion.';
        if (/not found/i.test(message)) {
          return res.status(404).json({ error: message });
        }
        if (/insufficient|must be/i.test(message)) {
          return res.status(400).json({ error: message });
        }
        return res.status(500).json({ error: 'Unexpected error performing conversion.' });
      }
    },
  };
})();
