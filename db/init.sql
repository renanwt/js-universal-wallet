-- Create the database (optional as it's already specified in the environment)
USE AssetTransactions;

-- Table for storing information about the asset types
CREATE TABLE AssetTypes (
    AssetTypeID INT AUTO_INCREMENT PRIMARY KEY,
    AssetTypeName VARCHAR(100) NOT NULL
);

-- Table for storing the details of each asset
CREATE TABLE Assets (
    AssetID INT AUTO_INCREMENT PRIMARY KEY,
    AssetName VARCHAR(100) NOT NULL,
    AssetSymbol VARCHAR(10) NOT NULL,
    AssetTypeID INT,
    AmountInWallet DECIMAL(18, 8) DEFAULT 0 NOT NULL,
    AvgPrice DECIMAL(18, 8) DEFAULT 0 NOT NULL,
    Currency ENUM('BRL', 'USD') NOT NULL,
    FOREIGN KEY (AssetTypeID) REFERENCES AssetTypes(AssetTypeID)
);

-- Table for storing the transactions
CREATE TABLE Transactions (
    TransactionID INT AUTO_INCREMENT PRIMARY KEY,
    AssetID INT,
    TransactionDate DATE NOT NULL,
    Quantity DECIMAL(18, 8) NOT NULL,
    PricePerUnit DECIMAL(18, 8) NOT NULL,
    TotalAmount DECIMAL(18, 8) AS (Quantity * PricePerUnit) STORED,
    TransactionType ENUM('Buy', 'Sell') NOT NULL,
    ExchangeRateUSD_BRL DECIMAL(18, 8) NOT NULL,
    FOREIGN KEY (AssetID) REFERENCES Assets(AssetID)
);

CREATE TABLE IF NOT EXISTS AssetStatus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assetSymbol TEXT NOT NULL,
  amountInWallet REAL NOT NULL,
  avgPrice REAL NOT NULL,
  valueInBRL REAL NOT NULL,
  exchangeRate REAL NOT NULL,
  recordedDate DATE NOT NULL
);

-- Insert default asset types
INSERT INTO AssetTypes (AssetTypeName) VALUES
('Cryptos'),
('BR Assets'),
('BR FIIs'),
('US Stocks'),
('US REITs'),
('US ETFs'),
('BR ETFs');
('Cash');
