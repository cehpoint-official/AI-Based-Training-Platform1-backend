const express = require('express');
const router = express.Router();
const testReportController = require('../controllers/testReportController');

router.post('/test-report', testReportController.createTestReport);
router.get('/test-report/:uid', testReportController.getTestReport);
router.put('/update-test-report/:uid', testReportController.updateTestReport);

module.exports = router;