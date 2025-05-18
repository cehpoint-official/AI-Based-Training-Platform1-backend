import express from "express";
import {
  handlePrompt,
  generateContent,
  handleChat,
  getImage,
  getYouTubeVideo,
  getYouTubeTranscript,
  sendEmail,
  aiGeneratedExplanation,
  getProjectSuggestions,
  checkApiQuota,
  searchYouTubeVideos,
} from "../controllers/aiController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/prompt", verifyToken, handlePrompt);
router.post("/generate-content", verifyToken, generateContent);
router.post("/chat", verifyToken, handleChat);
router.post("/getimage", verifyToken, getImage);
router.post("/email", verifyToken, sendEmail);
router.post("/ai-explanation", verifyToken, aiGeneratedExplanation);
router.post("/get-youtube", verifyToken, getYouTubeVideo);
router.post("/get-youtube-transcript", verifyToken, getYouTubeTranscript);
router.post("/projectSuggestions", verifyToken, getProjectSuggestions);
router.post("/search-youtube", verifyToken, searchYouTubeVideos);

router.get("/quota-check", checkApiQuota);

export default router;
