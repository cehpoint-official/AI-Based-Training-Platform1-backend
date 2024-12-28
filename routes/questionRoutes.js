import express from 'express';
import * as questionController from '../controllers/questionController.js';

const router = express.Router();

router.post('/fetch-questions', questionController.fetchQuestions);

export default router;