import express from 'express';
import { getPerformanceOfAllUser , getPerformanceByUID, updateCountsForAllUsers } from '../controllers/topCandidateController.js';

const router = express.Router();
router.get('/performance/all', getPerformanceOfAllUser );
router.get('/performance/:uid', getPerformanceByUID);
// router.post("/updateUserCounts/:uid", updateUserCounts);
router.post("/updateCountsForAllUsers", updateCountsForAllUsers);

export default router; 