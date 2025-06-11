const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv');
dotenv.config();

const DATABASE_NAME = process.env.DATABASE_NAME;

async function getDbConnection() {
  return new Promise((resolve, reject) => {
    if (!DATABASE_NAME) {
      console.error('DATABASE_NAME environment variable is not set!');
      return reject(new Error('DATABASE_NAME environment variable is not set! Please check your .env file.'));
    }

    console.log(`Attempting to connect to database: ${DATABASE_NAME}`);

    const db = new sqlite3.Database(DATABASE_NAME, (err) => {
      if (err) {
        console.error('Error connecting to database:', err.message);
        reject(err);
      }
      console.log(`Connected to the SQLite database: ${DATABASE_NAME}`);
      resolve(db);
    });
  });
}

async function closeDbConnection(db) {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database connection:', err.message);
          reject(err);
        } else {
          console.log('Database connection closed.');
          resolve();
        }
      });
    } else {
      console.warn('No database connection to close.');
      resolve();
    };
  });
};

module.exports = {
  getDbConnection,
  closeDbConnection,
};
