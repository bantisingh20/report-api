const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
 
const pool = new Pool(
  isProduction
    ? {
        connectionString: process.env.PGconnectionString,
        ssl: {
          rejectUnauthorized: false,  
        },
      }
    : {
        host: process.env.PGhost,
        port: process.env.PGport,
        user: process.env.PGuser,
        password: process.env.PGpassword,
        database: process.env.PGdatabase,
      }
);

module.exports = pool;
