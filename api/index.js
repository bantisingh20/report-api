const express = require('express');
const serverless = require('serverless-http');

const app = express();
app.get("/", (req, res) => {
    res.send("Hello first page");
});

app.get("/api", (req, res) => {
    res.send("Hello first page api");
});

app.get('/ping', (req, res) => {
  res.json({ ping: 'pong' });
});

// Export wrapped app
module.exports = serverless(app);
