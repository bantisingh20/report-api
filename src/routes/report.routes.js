const express = require('express');
const router = express.Router();
const {  listTablesAndViews ,ListReport ,GetReportById ,CheckRelationAndListOfColumn ,PreviewReport ,SaveReportConfiguration, getRelatedTables} = require('../controller/report.controller');
const { PaginatedReport } = require('../service/report.service');

router.get('/', (req, res) => {
  res.json({ message: 'Metadata API working!' });
});
  
router.get('/tables',listTablesAndViews);
router.post("/related-tables", getRelatedTables);
router.post('/check-table-relations', CheckRelationAndListOfColumn);
router.post('/report/preview', PreviewReport); 
router.get('/report/pagination', PaginatedReport);
router.post('/report/save/:id', SaveReportConfiguration);

router.get('/List-Report', ListReport); 
router.get('/report/:id', GetReportById);
module.exports = router;
