# 📊 Report API

This is a Node.js API built using PostgreSQL for managing and retrieving report-related data. It supports local and remote database connections and includes environment configuration for easy setup.

## 🚀 Getting Started

### 1. Clone the Repository


git clone <this-repo-url>
cd report-api 


### 2. Install Dependencies
 
npm install

### 3. Setup Environment Variables
Create a .env file in the root directory with the following content:
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=mysecretpassword
PGDATABASE=StoreManagement_v1


### 4. Run the Server
npm run dev

### 5. Database Configuration

The default database configuration is in config/db.js:

const { Pool } = require("pg");

const pool = new Pool({
  host: PGHOST,
  port: PGPORT,
  user: PGUSER,
  password: PGPASSWORD,
  database: PGDATABASE
});


🔁 Remote Database (Optional)
If you want to use a hosted PostgreSQL database (e.g., Railway), use the following connection instead:

const pool = new Pool({
  connectionString: 'postgresql://postgres:SKqTcQtPohmCkonIcSGnyLaFWYzVZZie@crossover.proxy.rlwy.net:59877/railway',
  ssl: {
    rejectUnauthorized: false // Needed if Railway uses SSL
  }
});

✅ Comment/uncomment the appropriate config in db.js based on your setup.


🧰 Tech Stack
-> Node.js
-> Express
-> PostgreSQL
-> pg (node-postgres)
-> dotenv

📂 Notes
A sample database is attached with this project. Please import it into your PostgreSQL setup.

Make sure PostgreSQL is installed on your system. If not, refer to the config/db.js file for alternative remote configuration.