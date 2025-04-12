# JS Universal Wallet 🪙📈

A comprehensive application for registering and managing a variety of assets such as stocks, REITs, cryptocurrencies, ETFs, cash, BR assets, and FIIs. It provides real-time quotations, asset positions, and tracks profits and losses—all from a single, local app.

## Features ⚡

- **Multi-Asset Support**: Track stocks, REITs, cryptocurrencies, ETFs, cash, BR assets, and FIIs. 💼📊
- **Real-Time Data**: Fetch real-time quotations and asset information. ⏱️💹
- **Position Management**: Track positions, top profits, losses, and distribution. 💰📉📈
- **Historical Data**: Record and retrieve asset positions for any given date. 📅🗃️
- **Simple API**: Interact with the application through an easy-to-use HTTP API. 🌐💻

## Installation ⚙️

### 1. Clone the Repository

```bash
git clone https://github.com/renanwt/js-universal-wallet.git
cd js-universal-wallet
```

### 2. Install Dependencies

```bash
npm install
```
or
```bash
yarn install
```

### 3. Initialize the Database 🗄️
```bash
node initDb.js
```
### 4. Start the Application 🚀
Run the app using:
```bash
npm start
```
The application will now be accessible at http://localhost:3000. 🌍

## API Usage (Postman) 📬

You can interact with the API using Postman or any other HTTP client.

### 1. Buy an Asset 🛒

**Endpoint**: `POST /buy-asset`  
**Request Body Example**:

```json
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

### 2. Get All Assets 📈

**Endpoint**: `GET /assets`

### 3. Get Positions, Top Losses, Top Profits, Distribution 📊

**Endpoint**: `GET /position-comparison`

### 4. Freeze Asset Position at Current Date ⏳

**Endpoint**: `POST /asset-status/record`

### 5. Get Positions for a Specific Date 📅

**Endpoint**: `GET /asset-status?date=yyyy-mm-dd`

---

## License 📜

This project is licensed under the **GPL-3.0** License.

---

## Acknowledgements 🤝

Special thanks to all contributors and open-source projects that made this app possible. 🌟
