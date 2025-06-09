 const { Pool } = require('pg');
 require('dotenv').config();

const pool = new Pool({
  host: PGHOST,
  port: PGPORT,
  user: PGUSER,
  password: "Setu@123",  // chage here PGPASSWORDs
  database: PGDATABASE
}); 
 
// direct connection 
// const pool = new Pool({
//   connectionString: 'postgresql://postgres:SKqTcQtPohmCkonIcSGnyLaFWYzVZZie@crossover.proxy.rlwy.net:59877/railway',
//   ssl: {
//     rejectUnauthorized: false // Needed if Railway uses SSL
//   }
// }); 
module.exports = pool;
