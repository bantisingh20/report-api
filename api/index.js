const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const bodyParser = require('body-parser');
//const metadataRoutes = require('../src/routes/metadata.routes');
const { handleError } = require('../src/middlewares/ErrorHandler');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
//app.use('/metadata', metadataRoutes);

// Temporary test route without DB or routes
app.get('/test', (req, res) => {
  res.json({ message: 'API is working without DB connection!' });
});

app.use(handleError);

module.exports = serverless(app);
