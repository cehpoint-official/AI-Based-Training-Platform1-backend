import express from 'express';
import { getTopCandidate_admin } from '../controllers/topCandidateController.js';

const router = express.Router();
router.get('/top-candidates-admin', getTopCandidate_admin);

export default router;