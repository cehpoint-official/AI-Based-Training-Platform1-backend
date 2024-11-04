import express from 'express';
import { createQuizResult, getQuizResults, getUserQuizResults } from '../controllers/quizController.js'; 

const router = express.Router();

router.post('/quiz-results', createQuizResult);
router.get('/getquizresults', getQuizResults);
router.get('/quiz-results/user/:userId', getUserQuizResults);

export default router;