const express = require('express');
const yahooFinance = require('yahoo-finance2').default;
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();


module.exports = (db) => {
    const router = express.Router();
    
    router.get('/', async (req, res) => {
        try {
        // Fetch current USD/BRL exchange rate
        const exchangeRateResponse = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/USDBRL=X');
        const exchangeRateUSD_BRL = exchangeRateResponse.data.chart.result[0].meta.regularMarketPrice;      
        
        // Fetch all assets from the database
        db.all('SELECT * FROM Assets', [], async (err, assets) => {
            if (err) {
            console.error(err.message);
            res.status(500).send('Error fetching assets');
            return;
            }
    
            let totalValueBRL = 0;
            const assetValues = {};  // Store each asset's value
            const profitPercentages = [];  // Store profit percentages for each asset
            const lossPercentages = [];  // Store loss percentages for each asset
            
            let totalCryptoValue = 0;
            let totalBRAssetValue = 0;
            let totalBRFiiValue = 0;
            let totalUSStockValue = 0;
            let totalUSReitValue = 0;
            let totalUSETFValue = 0
            let totalBRETFValue = 0
            let totalCashValue = 0
    
            // Iterate over each asset
            for (const asset of assets) {
                let assetValue = 0;
                let avgValue = asset.AmountInWallet * parseFloat(asset.AvgPrice);
                if (asset.AssetTypeID === 1 & asset.AmountInWallet !== 0) {
                    const quote = await yahooFinance.quote(asset.AssetSymbol + "-USD");
                    const { regularMarketPrice } = quote;
                    assetValue = asset.AmountInWallet * regularMarketPrice * exchangeRateUSD_BRL;
                    avgValue *= exchangeRateUSD_BRL;
                    totalValueBRL += assetValue;
                    totalCryptoValue += assetValue;
                } else if ([2, 3, 7].includes(asset.AssetTypeID) & asset.AmountInWallet !== 0) {
                    const quote = await yahooFinance.quote(asset.AssetSymbol + ".SA");
                    const { regularMarketPrice, currency } = quote;
                    assetValue = asset.AmountInWallet * regularMarketPrice;
                    if (currency === 'BRL') {
                    totalValueBRL += assetValue;
                    } else if (currency === 'USD') {
                    assetValue *= exchangeRateUSD_BRL;
                    avgValue *= exchangeRateUSD_BRL;
                    totalValueBRL += assetValue;
                    }
                    if (asset.AssetTypeID === 2) {
                        totalBRAssetValue += assetValue;
                    } else if (asset.AssetTypeID === 3) {
                        totalBRFiiValue += assetValue;
                    } else if (asset.AssetTypeID === 7) {
                        totalBRETFValue += assetValue;
                    }
                } else if ([4, 5, 6].includes(asset.AssetTypeID) & asset.AmountInWallet !== 0) {
                    const quote = await yahooFinance.quote(asset.AssetSymbol);
                    const { regularMarketPrice } = quote;
                    assetValue = asset.AmountInWallet * regularMarketPrice * exchangeRateUSD_BRL;
                    avgValue *= exchangeRateUSD_BRL;
                    totalValueBRL += assetValue;
                    if (asset.AssetTypeID === 4) {
                        totalUSStockValue += assetValue;
                    } else if (asset.AssetTypeID === 5) {
                        totalUSReitValue += assetValue;
                    } else if (asset.AssetTypeID === 6) {
                        totalUSETFValue += assetValue;
                    }

                } else if ([8].includes(asset.AssetTypeID) & asset.AmountInWallet !== 0) {
                    assetValue = parseFloat(asset.AmountInWallet);
                    totalValueBRL += assetValue;
                    totalCashValue += assetValue
                }
        
                assetValues[asset.AssetSymbol] = assetValue;
        
                const profitPercentage = ((assetValue - avgValue) / avgValue) * 100;
                if (profitPercentage >= 0  & asset.AmountInWallet !== 0) {
                    profitPercentages.push({
                    ticker: asset.AssetSymbol,
                    value: assetValue.toFixed(2),
                    profitPercentage: profitPercentage.toFixed(2)
                    });
                } else if (asset.AmountInWallet !== 0) {
                    lossPercentages.push({
                    ticker: asset.AssetSymbol,
                    value: assetValue.toFixed(2),
                    lossPercentage: profitPercentage.toFixed(2)  // Profit percentage is negative for losses
                    });
                }
            }
    
            // Calculate each asset's percentage of total patrimony
            const assetPercentages = Object.keys(assetValues).map(ticker => ({
            ticker: ticker,
            value: assetValues[ticker].toFixed(2),
            percentage: ((assetValues[ticker] / totalValueBRL) * 100).toFixed(2)
            }));
    
            // Sort by percentage and get top 5 patrimony positions
            const top5Positions = assetPercentages.sort((a, b) => b.percentage - a.percentage).slice(0, 5);
    
            // Sort by profit percentage and get top 5 profitable positions
            const top5Profitable = profitPercentages.sort((a, b) => b.profitPercentage - a.profitPercentage).slice(0, 5);
    
            // Sort by loss percentage and get top 5 loss positions
            const top5Loss = lossPercentages.sort((a, b) => a.lossPercentage - b.lossPercentage).slice(0, 5);

            const distribution = { 
                cryptos: { total: parseFloat(totalCryptoValue.toFixed(2)), percentage: ((totalCryptoValue / totalValueBRL) * 100).toFixed(2) + '%'},
                ações: { total: parseFloat(totalBRAssetValue.toFixed(2)), percentage: ((totalBRAssetValue / totalValueBRL) * 100).toFixed(2) + '%'},
                fiis: { total: parseFloat(totalBRFiiValue.toFixed(2)), percentage: ((totalBRFiiValue / totalValueBRL) * 100).toFixed(2) + '%'},
                BR_etfs: { total: parseFloat(totalBRETFValue.toFixed(2)), percentage: ((totalBRETFValue / totalValueBRL) * 100).toFixed(2) + '%'},
                stocks: { total: parseFloat(totalUSStockValue.toFixed(2)), percentage: ((totalUSStockValue / totalValueBRL) * 100).toFixed(2) + '%'},
                reits: { total: parseFloat(totalUSReitValue.toFixed(2)), percentage: ((totalUSReitValue / totalValueBRL) * 100).toFixed(2) + '%'},
                US_etfs: { total: parseFloat(totalUSETFValue.toFixed(2)), percentage: ((totalUSETFValue / totalValueBRL) * 100).toFixed(2) + '%'},
                cash: { total: parseFloat(totalCashValue.toFixed(2)), percentage: ((totalCashValue / totalValueBRL) * 100).toFixed(2) + '%'},
            }
            // Convert the object to an array of key-value pairs
            const sortedDistributionArray = Object.entries(distribution).sort(([, a], [, b]) => b.total - a.total);
            const sortedDistribution = Object.fromEntries(sortedDistributionArray);
    
            res.json({
                totalValueBRL: parseFloat(totalValueBRL.toFixed(2)),
                totalValueUSD: parseFloat((totalValueBRL/exchangeRateUSD_BRL).toFixed(2)),
                exchangeRateUSD_BRL: parseFloat(exchangeRateUSD_BRL.toFixed(2)),
                top5Positions: top5Positions,
                top5Profitable: top5Profitable,
                top5Loss: top5Loss,
                distribution: sortedDistribution
            });
        });
        res.setHeader('Access-Control-Allow-Origin', '*');
        } catch (err) {
        console.error(err);
        res.status(500).send('Error calculating wallet balance');
        }
    });
    return router;
};