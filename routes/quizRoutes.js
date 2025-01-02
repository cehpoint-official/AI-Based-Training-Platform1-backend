import express from "express";
import {
  createQuizResult,
  getQuizData,
  getQuizResults,
  getUserQuizResults,
} from "../controllers/quizController.js";

const router = express.Router();

router.post("/get-quiz-data", getQuizData);
router.post("/quiz-results", createQuizResult);
router.get("/getquizresults", getQuizResults);
router.get("/quiz-results/user/:userId", getUserQuizResults);

export default router;
