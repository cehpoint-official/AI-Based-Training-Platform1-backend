import express from 'express';
import * as testReportController from '../controllers/testReportController.js';

const router = express.Router();

router.post('/test-report', testReportController.createTestReport);
router.get('/test-report/:uid', testReportController.getTestReport);
router.put('/update-test-report/:uid', testReportController.updateTestReport);
router.get('/getalltestreports', testReportController.getAllTestReports);

export default router;