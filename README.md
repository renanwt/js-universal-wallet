# Welcome to the Universal Wallet App

Start the Database (Sqlite):
> node initDb.js to start DB

Start the application:
> npm start


## Buy an asset 
> http://localhost:3000/buy-asset 

Use the body format:
```
{
    "AssetName": "Banco do Brasil",
    "AssetSymbol": "BBSA3",
    "AssetTypeID": 2,
    "Quantity": 100,
    "PricePerUnit": 35.12,
    "ExchangeRateUSD_BRL": 5.6,
    "TransactionType": "Buy"
}
```

## Get all assets
> http://localhost:3000/assets


## Get all positions / Top losses / Top profits / Distribution
> http://localhost:3000/position-comparison

## Freeze Assets Position in current date
> http://localhost:3000/asset-status/record

## Get positons in a specific date
> http://localhost:3000/asset-status?date=yyyy-mm-dd