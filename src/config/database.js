const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

let pool;
console.log("DB ENV:", {
  user: process.env.PGuser,
  host: process.env.PGhost,
  database: process.env.PGdatabase,
  password: process.env.PGpassword,
  port: process.env.PGport,
  PG_CONNECTION_STRING: process.env.PG_CONNECTION_STRING,
});

try {
  pool = new Pool(
    isProduction
      ? {
          connectionString: process.env.PG_CONNECTION_STRING,
          ssl: false ,// {            rejectUnauthorized: false,          },
        }
      : {
           host: process.env.PGhost,
           port: process.env.PGport,
           user: process.env.PGuser,
           password: process.env.PGpassword,
           database: process.env.PGdatabase,
           ssl: false, 
           connectionTimeoutMillis: 10000,
           host: "172.18.0.4",    
        }
  );

  pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on PostgreSQL client:', err);
    process.exit(1); // optional: shut down server
  });
} catch (err) {
  console.error('Failed to initialize PostgreSQL pool:', err.message);
  process.exit(1);
}

module.exports = pool;
 