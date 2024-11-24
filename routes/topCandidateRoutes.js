import express from 'express';
import { getPerformanceOfAllUser , getPerformanceByUID } from '../controllers/topCandidateController.js';

const router = express.Router();
router.get('/performance/all', getPerformanceOfAllUser );
router.get('/performance/:uid', getPerformanceByUID);

export default router; 