require('dotenv').config();
const { Pool } = require('pg');
const url = require('url');

let pool;

// Parse the provided connection string
const connectionString = process.env.DATABASE_URL || '';
const params = url.parse(connectionString);
const auth = params.auth.split(':');

const sslEnabled = params.hostname !== 'localhost' && params.hostname !== '127.0.0.1';

const config = {
  user: auth[0],
  password: auth[1],
  host: params.hostname,
  port: params.port,
  database: params.pathname.split('/')[1],
  ssl: sslEnabled ? { rejectUnauthorized: false } : false, // Disable SSL verification for local connections
};

if (sslEnabled) {
  console.log('SSL enabled for database connection.');
} else {
  console.log('SSL not enabled for database connection.');
}

pool = new Pool(config);

module.exports = {
  query: (text, params) => pool.query(text, params),
};
