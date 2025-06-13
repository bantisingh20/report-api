const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors');  
const app = express();
const PORT = 3000;
const metadataRoutes = require('./src/routes/metadata.routes.js'); 
const { handleError  } = require('./src/middlewares/ErrorHandler.js');

app.get("/", (req, res) => {
    res.status(200).json("Welcome , to Home page ");
});

// app.use(express.json());
// app.use('/api/metadata', metadataRoutes);
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use('/api/metadata', metadataRoutes);


app.get("/home", (req, res) => {
    res.status(200).json("Welcome , you  app is aawokring ");
});


app.listen(PORT, () => {
 console.log(`Server is running on PORT ${PORT}`);
});

app.use(handleError);

module.exports = app;

