import express from 'express';
import * as dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

router.post('/dashboard', dashboardController.getDashboardData);
router.post("/key",dashboardController.setapikey);

export default router;