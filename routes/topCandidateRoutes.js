import express from 'express';
import { getTopCandidate_admin, getTopCandidate_user } from '../controllers/topCandidateController.js';

const router = express.Router();
router.get('/top-candidates-admin', getTopCandidate_admin);
router.get('/top-candidates-user', getTopCandidate_user);

export default router;