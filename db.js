require('dotenv').config();
const { Pool } = require('pg');

let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Construct connection parameters from individual environment variables
  connectionString = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: false,
    },
  };
}

const pool = new Pool({
  connectionString,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
