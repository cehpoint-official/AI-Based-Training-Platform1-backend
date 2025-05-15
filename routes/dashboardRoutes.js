import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

router.post('/dashboard', dashboardController.getDashboardData);
router.post("/key",dashboardController.setapikey);
router.get("/terms", dashboardController.getTerms);
router.post("/terms", dashboardController.saveTerms);
router.get("/privacy", dashboardController.getPrivacy);
router.post("/privacy", dashboardController.savePrivacy);

export default router;