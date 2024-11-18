import express from 'express';
import * as aiController from '../controllers/aiController.js';

const router = express.Router();

router.post('/prompt', aiController.handlePrompt);
router.post('/generate', aiController.generateContent);
router.post('/chat', aiController.handleChat);
router.post('/project-suggestions', aiController.getProjectSuggestions);
router.post('/image', aiController.getImage);
router.post('/yt', aiController.getYouTubeVideo);
router.post('/transcript', aiController.getYouTubeTranscript);
router.post('/data', aiController.sendEmail);
router.post('/aiGeneratedExplanation', aiController. aiGeneratedExplanation);

export default router;