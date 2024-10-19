-- Table structure for table `AssetTypes`

DROP TABLE IF EXISTS `AssetTypes`;
CREATE TABLE `AssetTypes` (
  `AssetTypeID` INTEGER PRIMARY KEY AUTOINCREMENT,
  `AssetTypeName` TEXT NOT NULL
);

-- Table structure for table `Assets`

DROP TABLE IF EXISTS `Assets`;
CREATE TABLE `Assets` (
  `AssetID` INTEGER PRIMARY KEY AUTOINCREMENT,
  `AssetName` TEXT NOT NULL,
  `AssetSymbol` TEXT NOT NULL,
  `AssetTypeID` INTEGER,
  `AmountInWallet` REAL NOT NULL DEFAULT 0.0,
  `AvgPrice` REAL NOT NULL DEFAULT 0.0,
  `Currency` TEXT,
  FOREIGN KEY (`AssetTypeID`) REFERENCES `AssetTypes` (`AssetTypeID`)
);

-- Table structure for table `Transactions`

DROP TABLE IF EXISTS `Transactions`;
CREATE TABLE `Transactions` (
  `TransactionID` INTEGER PRIMARY KEY AUTOINCREMENT,
  `AssetID` INTEGER,
  `TransactionDate` TEXT NOT NULL,
  `Quantity` REAL NOT NULL,
  `PricePerUnit` REAL NOT NULL,
  `TransactionType` TEXT NOT NULL,
  `ExchangeRateUSD_BRL` REAL NOT NULL,
  FOREIGN KEY (`AssetID`) REFERENCES `Assets` (`AssetID`)
);

-- Table structure for table `AssetStatus`

DROP TABLE IF EXISTS `AssetStatus`;
CREATE TABLE IF NOT EXISTS AssetStatus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assetSymbol TEXT NOT NULL,
  amountInWallet REAL NOT NULL,
  avgPrice REAL NOT NULL,
  valueInBRL REAL NOT NULL,
  exchangeRate REAL NOT NULL,
  recordedDate DATE NOT NULL
);

-- Dumping data for table `AssetTypes`

INSERT INTO AssetTypes (AssetTypeName) VALUES
('Cryptos'),
('BR Assets'),
('BR FIIs'),
('US Stocks'),
('US REITs'),
('US ETFs'),
('BR ETFs'),
('Cash');