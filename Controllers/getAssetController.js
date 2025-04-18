const express = require('express');
const yahooFinance = require('yahoo-finance2').default;
const axios = require('axios');

module.exports = (db) => {
  const router = express.Router();

  // Get all Assets with amount, avgPrice in USD or BRL, and % profit or loss
  router.get('/', async (req, res) => {
    try {
      const { assetTypeID } = req.query;

      let query = 'SELECT * FROM Assets';
      const queryParams = [];

      // Filter by AssetTypeID if provided
      if (assetTypeID) {
        query += ' WHERE AssetTypeID = ?';
        queryParams.push(assetTypeID);
      }

      // Fetch assets from the database
      db.all(query, queryParams, async (err, assets) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error fetching assets');
        }

        try {
          // Fetch current USD/BRL exchange rate
          const exchangeRateResponse = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/USDBRL=X');
          const exchangeRateUSD_BRL = exchangeRateResponse.data.chart.result[0].meta.regularMarketPrice; 

          const assetData = [];
          let totalValueBRL = 0;

          // Calculate total value in BRL for percentage calculation
          for (const asset of assets) {
            let assetValue = 0;

            if ([1, 4, 5, 6].includes(asset.AssetTypeID)) { // Cryptos, US Stocks, US REITs, US ETFs
              const quote = await yahooFinance.quote(asset.AssetSymbol + (asset.AssetTypeID === 1 ? "-USD" : ""));
              const { regularMarketPrice } = quote;
              assetValue = asset.AmountInWallet * regularMarketPrice * exchangeRateUSD_BRL; // Convert USD to BRL
            } else if ([2, 3, 7].includes(asset.AssetTypeID)) { // BR Assets, BR FIIs, BR ETFs
              const quote = await yahooFinance.quote(asset.AssetSymbol + ".SA");
              const { regularMarketPrice } = quote;
              assetValue = asset.AmountInWallet * regularMarketPrice; // Already in BRL
            } else if (asset.AssetTypeID === 8) { // Cash in BRL
              assetValue = parseFloat(asset.AmountInWallet);
            }

            totalValueBRL += assetValue;
          }
          
          // Calculate profit or loss percentages
          for (const asset of assets) {
            const avgPrice = parseFloat(asset.AvgPrice);
            let assetValue = 0;
            let currentPrice = 0;
            let avgPriceBRL = 0;
            let totalBRL = 0;
            let totalUSD = 0;
            let profitOrLoss = 0;
            let profitOrLossPercentage = 0;

            
            if (asset.AssetTypeID === 1 || [4, 5, 6].includes(asset.AssetTypeID)) { // Cryptos, US Stocks, US REITs, US ETFs
              const quote = await yahooFinance.quote(asset.AssetSymbol + (asset.AssetTypeID === 1 ? "-USD" : ""));
              const { regularMarketPrice } = quote;
              currentPrice = regularMarketPrice;
              assetValue = asset.AmountInWallet * currentPrice * exchangeRateUSD_BRL; // Convert USD to BRL

              // Calculate profit/loss in USD
              const totalAvgPriceUSD = avgPrice * asset.AmountInWallet;
              profitOrLoss = (asset.AmountInWallet * currentPrice) - totalAvgPriceUSD;
              profitOrLossPercentage = totalAvgPriceUSD > 0 ? ((profitOrLoss / totalAvgPriceUSD) * 100).toFixed(2) : 0;

              assetData.push({
                assetSymbol: asset.AssetSymbol,
                currentPrice: regularMarketPrice,
                amount: asset.AmountInWallet,
                avgPriceUSD: avgPrice.toFixed(2),
                totalBRL: assetValue.toFixed(2),
                profitOrLossPercentage: profitOrLossPercentage,
                assetPercentage: totalValueBRL > 0 ? ((assetValue / totalValueBRL) * 100).toFixed(2) : 0
              });
            } else if ([2, 3, 7].includes(asset.AssetTypeID)) { // BR Assets, BR FIIs, BR ETFs
              const quote = await yahooFinance.quote(asset.AssetSymbol + ".SA");
              const { regularMarketPrice } = quote;
              currentPrice = regularMarketPrice;
              assetValue = asset.AmountInWallet * currentPrice; // Already in BRL

              // Calculate profit/loss in BRL
              const totalAvgPriceBRL = avgPrice * asset.AmountInWallet;
              profitOrLoss = assetValue - totalAvgPriceBRL;
              profitOrLossPercentage = totalAvgPriceBRL > 0 ? ((profitOrLoss / totalAvgPriceBRL) * 100).toFixed(2) : 0;

              assetData.push({
                assetSymbol: asset.AssetSymbol,
                currentPrice: regularMarketPrice,
                amount: asset.AmountInWallet,
                avgPriceBRL: avgPrice.toFixed(2),
                totalBRL: assetValue.toFixed(2),
                profitOrLossPercentage: profitOrLossPercentage,
                assetPercentage: totalValueBRL > 0 ? ((assetValue / totalValueBRL) * 100).toFixed(2) : 0
              });
            } else if (asset.AssetTypeID === 8) { // Cash in BRL
              assetValue = parseFloat(asset.AmountInWallet);

              assetData.push({
                assetSymbol: asset.AssetSymbol,
                amount: asset.AmountInWallet,
                avgPriceBRL: avgPrice.toFixed(2),
                assetPercentage: totalValueBRL > 0 ? ((assetValue / totalValueBRL) * 100).toFixed(2) : 0
              });
            }
          }

          assetData.sort((a,b) => b.assetPercentage - a.assetPercentage);

          res.json({ totalValueBRL: totalValueBRL.toFixed(2), totalValueUSD: (totalValueBRL/exchangeRateUSD_BRL).toFixed(2), exchangeRateUSD_BRL: exchangeRateUSD_BRL.toFixed(2), assets: assetData });
        } catch (error) {
          console.error(error);
          res.status(500).send('Error fetching exchange rate or asset data');
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching assets');
    }
  });

  // Get all Cryptos
  router.get('/cryptos', async (req, res) => {
    try {
      const { assetTypeID } = req.query;

      let query = 'SELECT * FROM Assets';
      const queryParams = [];

      // Filter by AssetTypeID if provided
      if (assetTypeID) {
        query += ' WHERE AssetTypeID = ?';
        queryParams.push(assetTypeID);
      }

      // Fetch assets from the database
      db.all(query, queryParams, async (err, assets) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error fetching assets');
        }

        try {
          // Fetch current USD/BRL exchange rate
          const exchangeRateResponse = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/USDBRL=X');
          const exchangeRateUSD_BRL = exchangeRateResponse.data.chart.result[0].meta.regularMarketPrice; 

          const assetData = [];
          let totalValueBRL = 0;

          // Calculate total value in BRL for percentage calculation
          for (const asset of assets) {
            let assetValue = 0;

            if (asset.AssetTypeID === 1) { // Cryptos, US Stocks, US REITs, US ETFs
              const quote = await yahooFinance.quote(asset.AssetSymbol + (asset.AssetTypeID === 1 ? "-USD" : ""));
              const { regularMarketPrice } = quote;
              assetValue = asset.AmountInWallet * regularMarketPrice * exchangeRateUSD_BRL; // Convert USD to BRL
            }
            totalValueBRL += assetValue;
          }
          
          // Calculate profit or loss percentages
          for (const asset of assets) {
            const avgPrice = parseFloat(asset.AvgPrice);
            let assetValue = 0;
            let currentPrice = 0;
            let avgPriceBRL = 0;
            let totalBRL = 0;
            let totalUSD = 0;
            let profitOrLoss = 0;
            let profitOrLossPercentage = 0;

            
            if (asset.AssetTypeID === 1) { // Cryptos, US Stocks, US REITs, US ETFs
              const quote = await yahooFinance.quote(asset.AssetSymbol + (asset.AssetTypeID === 1 ? "-USD" : ""));
              const { regularMarketPrice } = quote;
              currentPrice = regularMarketPrice;
              assetValue = asset.AmountInWallet * currentPrice * exchangeRateUSD_BRL; // Convert USD to BRL

              // Calculate profit/loss in USD
              const totalAvgPriceUSD = avgPrice * asset.AmountInWallet;
              profitOrLoss = (asset.AmountInWallet * currentPrice) - totalAvgPriceUSD;
              profitOrLossPercentage = totalAvgPriceUSD > 0 ? ((profitOrLoss / totalAvgPriceUSD) * 100).toFixed(2) : 0;

              assetData.push({
                assetSymbol: asset.AssetSymbol,
                currentPrice: regularMarketPrice,
                amount: asset.AmountInWallet,
                avgPriceUSD: avgPrice.toFixed(2),
                totalBRL: assetValue.toFixed(2),
                profitOrLossPercentage: profitOrLossPercentage,
                classPercentage: totalValueBRL > 0 ? ((assetValue / totalValueBRL) * 100).toFixed(2) : 0
              });
            } 
          }

          assetData.sort((a,b) => b.classPercentage - a.classPercentage);

          res.json({ totalValueBRL: totalValueBRL.toFixed(2), totalValueUSD: (totalValueBRL/exchangeRateUSD_BRL).toFixed(2), exchangeRateUSD_BRL: exchangeRateUSD_BRL.toFixed(2), assets: assetData });
        } catch (error) {
          console.error(error);
          res.status(500).send('Error fetching exchange rate or asset data');
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching assets');
    }
  });

  // Get all Ações
  router.get('/acoes', async (req, res) => {
    try {
      const { assetTypeID } = req.query;

      let query = 'SELECT * FROM Assets';
      const queryParams = [];

      // Filter by AssetTypeID if provided
      if (assetTypeID) {
        query += ' WHERE AssetTypeID = ?';
        queryParams.push(assetTypeID);
      }

      // Fetch assets from the database
      db.all(query, queryParams, async (err, assets) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error fetching assets');
        }

        try {
          // Fetch current USD/BRL exchange rate
          const exchangeRateResponse = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/USDBRL=X');
          const exchangeRateUSD_BRL = exchangeRateResponse.data.chart.result[0].meta.regularMarketPrice; 

          const assetData = [];
          let totalValueBRL = 0;

          // Calculate total value in BRL for percentage calculation
          for (const asset of assets) {
            let assetValue = 0;

            if (asset.AssetTypeID === 2) { // BR Assets, BR FIIs, BR ETFs
              const quote = await yahooFinance.quote(asset.AssetSymbol + ".SA");
              const { regularMarketPrice } = quote;
              assetValue = asset.AmountInWallet * regularMarketPrice; // Already in BRL
            }

            totalValueBRL += assetValue;
          }
          
          // Calculate profit or loss percentages
          for (const asset of assets) {
            const avgPrice = parseFloat(asset.AvgPrice);
            let assetValue = 0;
            let currentPrice = 0;
            let avgPriceBRL = 0;
            let totalBRL = 0;
            let totalUSD = 0;
            let profitOrLoss = 0;
            let profitOrLossPercentage = 0;

            
            if (asset.AssetTypeID === 2) { // BR Assets, BR FIIs, BR ETFs
              const quote = await yahooFinance.quote(asset.AssetSymbol + ".SA");
              const { regularMarketPrice } = quote;
              currentPrice = regularMarketPrice;
              assetValue = asset.AmountInWallet * currentPrice; // Already in BRL

              // Calculate profit/loss in BRL
              const totalAvgPriceBRL = avgPrice * asset.AmountInWallet;
              profitOrLoss = assetValue - totalAvgPriceBRL;
              profitOrLossPercentage = totalAvgPriceBRL > 0 ? ((profitOrLoss / totalAvgPriceBRL) * 100).toFixed(2) : 0;

              assetData.push({
                assetSymbol: asset.AssetSymbol,
                currentPrice: regularMarketPrice,
                amount: asset.AmountInWallet,
                avgPriceBRL: avgPrice.toFixed(2),
                totalBRL: assetValue.toFixed(2),
                profitOrLossPercentage: profitOrLossPercentage,
                assetPercentage: totalValueBRL > 0 ? ((assetValue / totalValueBRL) * 100).toFixed(2) : 0
              });
            } 
          }

          assetData.sort((a,b) => b.classPercentage - a.classPercentage);

          res.json({ totalValueBRL: totalValueBRL.toFixed(2), totalValueUSD: (totalValueBRL/exchangeRateUSD_BRL).toFixed(2), exchangeRateUSD_BRL: exchangeRateUSD_BRL.toFixed(2), assets: assetData });
        } catch (error) {
          console.error(error);
          res.status(500).send('Error fetching exchange rate or asset data');
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching assets');
    }
  });

  // Get all Fiis
  router.get('/fiis', async (req, res) => {
    try {
      const { assetTypeID } = req.query;

      let query = 'SELECT * FROM Assets';
      const queryParams = [];

      // Filter by AssetTypeID if provided
      if (assetTypeID) {
        query += ' WHERE AssetTypeID = ?';
        queryParams.push(assetTypeID);
      }

      // Fetch assets from the database
      db.all(query, queryParams, async (err, assets) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error fetching assets');
        }

        try {
          // Fetch current USD/BRL exchange rate
          const exchangeRateResponse = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/USDBRL=X');
          const exchangeRateUSD_BRL = exchangeRateResponse.data.chart.result[0].meta.regularMarketPrice; 

          const assetData = [];
          let totalValueBRL = 0;

          // Calculate total value in BRL for percentage calculation
          for (const asset of assets) {
            let assetValue = 0;

            if (asset.AssetTypeID === 3) { // BR Assets, BR FIIs, BR ETFs
              const quote = await yahooFinance.quote(asset.AssetSymbol + ".SA");
              const { regularMarketPrice } = quote;
              assetValue = asset.AmountInWallet * regularMarketPrice; // Already in BRL
            }

            totalValueBRL += assetValue;
          }
          
          // Calculate profit or loss percentages
          for (const asset of assets) {
            const avgPrice = parseFloat(asset.AvgPrice);
            let assetValue = 0;
            let currentPrice = 0;
            let avgPriceBRL = 0;
            let totalBRL = 0;
            let totalUSD = 0;
            let profitOrLoss = 0;
            let profitOrLossPercentage = 0;

            
            if (asset.AssetTypeID === 3) { // BR Assets, BR FIIs, BR ETFs
              const quote = await yahooFinance.quote(asset.AssetSymbol + ".SA");
              const { regularMarketPrice } = quote;
              currentPrice = regularMarketPrice;
              assetValue = asset.AmountInWallet * currentPrice; // Already in BRL

              // Calculate profit/loss in BRL
              const totalAvgPriceBRL = avgPrice * asset.AmountInWallet;
              profitOrLoss = assetValue - totalAvgPriceBRL;
              profitOrLossPercentage = totalAvgPriceBRL > 0 ? ((profitOrLoss / totalAvgPriceBRL) * 100).toFixed(2) : 0;

              assetData.push({
                assetSymbol: asset.AssetSymbol,
                currentPrice: regularMarketPrice,
                amount: asset.AmountInWallet,
                avgPriceBRL: avgPrice.toFixed(2),
                totalBRL: assetValue.toFixed(2),
                profitOrLossPercentage: profitOrLossPercentage,
                classPercentage: totalValueBRL > 0 ? ((assetValue / totalValueBRL) * 100).toFixed(2) : 0
              });
            } 
          }

          assetData.sort((a,b) => b.classPercentage - a.classPercentage);

          res.json({ totalValueBRL: totalValueBRL.toFixed(2), totalValueUSD: (totalValueBRL/exchangeRateUSD_BRL).toFixed(2), exchangeRateUSD_BRL: exchangeRateUSD_BRL.toFixed(2), assets: assetData });
        } catch (error) {
          console.error(error);
          res.status(500).send('Error fetching exchange rate or asset data');
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching assets');
    }
  });

  // Get all BR ETFs
  router.get('/br_etfs', async (req, res) => {
    try {
      const { assetTypeID } = req.query;

      let query = 'SELECT * FROM Assets';
      const queryParams = [];

      // Filter by AssetTypeID if provided
      if (assetTypeID) {
        query += ' WHERE AssetTypeID = ?';
        queryParams.push(assetTypeID);
      }

      // Fetch assets from the database
      db.all(query, queryParams, async (err, assets) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error fetching assets');
        }

        try {
          // Fetch current USD/BRL exchange rate
          const exchangeRateResponse = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/USDBRL=X');
          const exchangeRateUSD_BRL = exchangeRateResponse.data.chart.result[0].meta.regularMarketPrice; 

          const assetData = [];
          let totalValueBRL = 0;

          // Calculate total value in BRL for percentage calculation
          for (const asset of assets) {
            let assetValue = 0;

            if (asset.AssetTypeID === 7) { // BR Assets, BR FIIs, BR ETFs
              const quote = await yahooFinance.quote(asset.AssetSymbol + ".SA");
              const { regularMarketPrice } = quote;
              assetValue = asset.AmountInWallet * regularMarketPrice; // Already in BRL
            }

            totalValueBRL += assetValue;
          }
          
          // Calculate profit or loss percentages
          for (const asset of assets) {
            const avgPrice = parseFloat(asset.AvgPrice);
            let assetValue = 0;
            let currentPrice = 0;
            let avgPriceBRL = 0;
            let totalBRL = 0;
            let totalUSD = 0;
            let profitOrLoss = 0;
            let profitOrLossPercentage = 0;

            
            if (asset.AssetTypeID === 7) { // BR Assets, BR FIIs, BR ETFs
              const quote = await yahooFinance.quote(asset.AssetSymbol + ".SA");
              const { regularMarketPrice } = quote;
              currentPrice = regularMarketPrice;
              assetValue = asset.AmountInWallet * currentPrice; // Already in BRL

              // Calculate profit/loss in BRL
              const totalAvgPriceBRL = avgPrice * asset.AmountInWallet;
              profitOrLoss = assetValue - totalAvgPriceBRL;
              profitOrLossPercentage = totalAvgPriceBRL > 0 ? ((profitOrLoss / totalAvgPriceBRL) * 100).toFixed(2) : 0;

              assetData.push({
                assetSymbol: asset.AssetSymbol,
                currentPrice: regularMarketPrice,
                amount: asset.AmountInWallet,
                avgPriceBRL: avgPrice.toFixed(2),
                totalBRL: assetValue.toFixed(2),
                profitOrLossPercentage: profitOrLossPercentage,
                classPercentage: totalValueBRL > 0 ? ((assetValue / totalValueBRL) * 100).toFixed(2) : 0
              });
            } 
          }

          assetData.sort((a,b) => b.classPercentage - a.classPercentage);

          res.json({ totalValueBRL: totalValueBRL.toFixed(2), totalValueUSD: (totalValueBRL/exchangeRateUSD_BRL).toFixed(2), exchangeRateUSD_BRL: exchangeRateUSD_BRL.toFixed(2), assets: assetData });
        } catch (error) {
          console.error(error);
          res.status(500).send('Error fetching exchange rate or asset data');
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching assets');
    }
  });

  // Get all Stocks
  router.get('/stocks', async (req, res) => {
    try {
      const { assetTypeID } = req.query;

      let query = 'SELECT * FROM Assets';
      const queryParams = [];

      // Filter by AssetTypeID if provided
      if (assetTypeID) {
        query += ' WHERE AssetTypeID = ?';
        queryParams.push(assetTypeID);
      }

      // Fetch assets from the database
      db.all(query, queryParams, async (err, assets) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error fetching assets');
        }

        try {
          // Fetch current USD/BRL exchange rate
          const exchangeRateResponse = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/USDBRL=X');
          const exchangeRateUSD_BRL = exchangeRateResponse.data.chart.result[0].meta.regularMarketPrice; 

          const assetData = [];
          let totalValueBRL = 0;

          // Calculate total value in BRL for percentage calculation
          for (const asset of assets) {
            let assetValue = 0;

            if (asset.AssetTypeID === 4) { // Cryptos, US Stocks, US REITs, US ETFs
              const quote = await yahooFinance.quote(asset.AssetSymbol + (asset.AssetTypeID === 1 ? "-USD" : ""));
              const { regularMarketPrice } = quote;
              assetValue = asset.AmountInWallet * regularMarketPrice * exchangeRateUSD_BRL; // Convert USD to BRL
            }
            totalValueBRL += assetValue;
          }
          
          // Calculate profit or loss percentages
          for (const asset of assets) {
            const avgPrice = parseFloat(asset.AvgPrice);
            let assetValue = 0;
            let currentPrice = 0;
            let avgPriceBRL = 0;
            let totalBRL = 0;
            let totalUSD = 0;
            let profitOrLoss = 0;
            let profitOrLossPercentage = 0;

            
            if (asset.AssetTypeID === 4) { // Cryptos, US Stocks, US REITs, US ETFs
              const quote = await yahooFinance.quote(asset.AssetSymbol + (asset.AssetTypeID === 1 ? "-USD" : ""));
              const { regularMarketPrice } = quote;
              currentPrice = regularMarketPrice;
              assetValue = asset.AmountInWallet * currentPrice * exchangeRateUSD_BRL; // Convert USD to BRL

              // Calculate profit/loss in USD
              const totalAvgPriceUSD = avgPrice * asset.AmountInWallet;
              profitOrLoss = (asset.AmountInWallet * currentPrice) - totalAvgPriceUSD;
              profitOrLossPercentage = totalAvgPriceUSD > 0 ? ((profitOrLoss / totalAvgPriceUSD) * 100).toFixed(2) : 0;

              assetData.push({
                assetSymbol: asset.AssetSymbol,
                currentPrice: regularMarketPrice,
                amount: asset.AmountInWallet,
                avgPriceUSD: avgPrice.toFixed(2),
                totalBRL: assetValue.toFixed(2),
                profitOrLossPercentage: profitOrLossPercentage,
                classPercentage: totalValueBRL > 0 ? ((assetValue / totalValueBRL) * 100).toFixed(2) : 0
              });
            } 
          }

          assetData.sort((a,b) => b.classPercentage - a.classPercentage);

          res.json({ totalValueBRL: totalValueBRL.toFixed(2), totalValueUSD: (totalValueBRL/exchangeRateUSD_BRL).toFixed(2), exchangeRateUSD_BRL: exchangeRateUSD_BRL.toFixed(2), assets: assetData });
        } catch (error) {
          console.error(error);
          res.status(500).send('Error fetching exchange rate or asset data');
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching assets');
    }
  });

  // Get all REITs
  router.get('/reits', async (req, res) => {
    try {
      const { assetTypeID } = req.query;

      let query = 'SELECT * FROM Assets';
      const queryParams = [];

      // Filter by AssetTypeID if provided
      if (assetTypeID) {
        query += ' WHERE AssetTypeID = ?';
        queryParams.push(assetTypeID);
      }

      // Fetch assets from the database
      db.all(query, queryParams, async (err, assets) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error fetching assets');
        }

        try {
          // Fetch current USD/BRL exchange rate
          const exchangeRateResponse = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/USDBRL=X');
          const exchangeRateUSD_BRL = exchangeRateResponse.data.chart.result[0].meta.regularMarketPrice; 

          const assetData = [];
          let totalValueBRL = 0;

          // Calculate total value in BRL for percentage calculation
          for (const asset of assets) {
            let assetValue = 0;

            if (asset.AssetTypeID === 5) { // Cryptos, US Stocks, US REITs, US ETFs
              const quote = await yahooFinance.quote(asset.AssetSymbol + (asset.AssetTypeID === 1 ? "-USD" : ""));
              const { regularMarketPrice } = quote;
              assetValue = asset.AmountInWallet * regularMarketPrice * exchangeRateUSD_BRL; // Convert USD to BRL
            }
            totalValueBRL += assetValue;
          }
          
          // Calculate profit or loss percentages
          for (const asset of assets) {
            const avgPrice = parseFloat(asset.AvgPrice);
            let assetValue = 0;
            let currentPrice = 0;
            let avgPriceBRL = 0;
            let totalBRL = 0;
            let totalUSD = 0;
            let profitOrLoss = 0;
            let profitOrLossPercentage = 0;

            
            if (asset.AssetTypeID === 5) { // Cryptos, US Stocks, US REITs, US ETFs
              const quote = await yahooFinance.quote(asset.AssetSymbol + (asset.AssetTypeID === 1 ? "-USD" : ""));
              const { regularMarketPrice } = quote;
              currentPrice = regularMarketPrice;
              assetValue = asset.AmountInWallet * currentPrice * exchangeRateUSD_BRL; // Convert USD to BRL

              // Calculate profit/loss in USD
              const totalAvgPriceUSD = avgPrice * asset.AmountInWallet;
              profitOrLoss = (asset.AmountInWallet * currentPrice) - totalAvgPriceUSD;
              profitOrLossPercentage = totalAvgPriceUSD > 0 ? ((profitOrLoss / totalAvgPriceUSD) * 100).toFixed(2) : 0;

              assetData.push({
                assetSymbol: asset.AssetSymbol,
                currentPrice: regularMarketPrice,
                amount: asset.AmountInWallet,
                avgPriceUSD: avgPrice.toFixed(2),
                totalBRL: assetValue.toFixed(2),
                profitOrLossPercentage: profitOrLossPercentage,
                classPercentage: totalValueBRL > 0 ? ((assetValue / totalValueBRL) * 100).toFixed(2) : 0
              });
            } 
          }

          assetData.sort((a,b) => b.classPercentage - a.classPercentage);

          res.json({ totalValueBRL: totalValueBRL.toFixed(2), totalValueUSD: (totalValueBRL/exchangeRateUSD_BRL).toFixed(2), exchangeRateUSD_BRL: exchangeRateUSD_BRL.toFixed(2), assets: assetData });
        } catch (error) {
          console.error(error);
          res.status(500).send('Error fetching exchange rate or asset data');
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching assets');
    }
  });

  // Get all US ETFs
  router.get('/us_etfs', async (req, res) => {
    try {
      const { assetTypeID } = req.query;

      let query = 'SELECT * FROM Assets';
      const queryParams = [];

      // Filter by AssetTypeID if provided
      if (assetTypeID) {
        query += ' WHERE AssetTypeID = ?';
        queryParams.push(assetTypeID);
      }

      // Fetch assets from the database
      db.all(query, queryParams, async (err, assets) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error fetching assets');
        }

        try {
          // Fetch current USD/BRL exchange rate
          const exchangeRateResponse = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/USDBRL=X');
          const exchangeRateUSD_BRL = exchangeRateResponse.data.chart.result[0].meta.regularMarketPrice; 

          const assetData = [];
          let totalValueBRL = 0;

          // Calculate total value in BRL for percentage calculation
          for (const asset of assets) {
            let assetValue = 0;

            if (asset.AssetTypeID === 6) { // Cryptos, US Stocks, US REITs, US ETFs
              const quote = await yahooFinance.quote(asset.AssetSymbol + (asset.AssetTypeID === 1 ? "-USD" : ""));
              const { regularMarketPrice } = quote;
              assetValue = asset.AmountInWallet * regularMarketPrice * exchangeRateUSD_BRL; // Convert USD to BRL
            }
            totalValueBRL += assetValue;
          }
          
          // Calculate profit or loss percentages
          for (const asset of assets) {
            const avgPrice = parseFloat(asset.AvgPrice);
            let assetValue = 0;
            let currentPrice = 0;
            let avgPriceBRL = 0;
            let totalBRL = 0;
            let totalUSD = 0;
            let profitOrLoss = 0;
            let profitOrLossPercentage = 0;

            
            if (asset.AssetTypeID === 6) { // Cryptos, US Stocks, US REITs, US ETFs
              const quote = await yahooFinance.quote(asset.AssetSymbol + (asset.AssetTypeID === 1 ? "-USD" : ""));
              const { regularMarketPrice } = quote;
              currentPrice = regularMarketPrice;
              assetValue = asset.AmountInWallet * currentPrice * exchangeRateUSD_BRL; // Convert USD to BRL

              // Calculate profit/loss in USD
              const totalAvgPriceUSD = avgPrice * asset.AmountInWallet;
              profitOrLoss = (asset.AmountInWallet * currentPrice) - totalAvgPriceUSD;
              profitOrLossPercentage = totalAvgPriceUSD > 0 ? ((profitOrLoss / totalAvgPriceUSD) * 100).toFixed(2) : 0;

              assetData.push({
                assetSymbol: asset.AssetSymbol,
                currentPrice: regularMarketPrice,
                amount: asset.AmountInWallet,
                avgPriceUSD: avgPrice.toFixed(2),
                totalBRL: assetValue.toFixed(2),
                profitOrLossPercentage: profitOrLossPercentage,
                classPercentage: totalValueBRL > 0 ? ((assetValue / totalValueBRL) * 100).toFixed(2) : 0
              });
            } 
          }

          assetData.sort((a,b) => b.classPercentage - a.classPercentage);

          res.json({ totalValueBRL: totalValueBRL.toFixed(2), totalValueUSD: (totalValueBRL/exchangeRateUSD_BRL).toFixed(2), exchangeRateUSD_BRL: exchangeRateUSD_BRL.toFixed(2), assets: assetData });
        } catch (error) {
          console.error(error);
          res.status(500).send('Error fetching exchange rate or asset data');
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching assets');
    }
  });

  // Update an Asset
  router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { AssetName, AssetSymbol, AssetTypeID } = req.body;
    db.run('UPDATE Assets SET AssetName = ?, AssetSymbol = ?, AssetTypeID = ? WHERE AssetID = ?', [AssetName, AssetSymbol, AssetTypeID, id], (err) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Error updating asset');
      }
      res.send('Asset updated');
    });
  });

  // Delete an Asset
  router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM Assets WHERE AssetID = ?', [id], (err) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Error deleting asset');
      }
      res.send('Asset deleted');
    });
  });

  return router;
};
