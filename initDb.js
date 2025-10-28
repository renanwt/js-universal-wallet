const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const databaseName = process.env.DATABASE_NAME || 'database.sqlite';
const resolvedPath = path.resolve(databaseName);

console.log(`Initializing SQLite database at ${resolvedPath}...`);

const db = new sqlite3.Database(resolvedPath, (err) => {
  if (err) {
    console.error('Error opening database ' + err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// Read SQL script
const sqlScript = fs.readFileSync('db/initsqlite.sql', 'utf8');

// Execute SQL script
db.exec(sqlScript, (err) => {
  if (err) {
    console.error('Error executing SQL script: ' + err.message);
  } else {
    console.log('Database initialized successfully.');
  }
  db.close();
});
