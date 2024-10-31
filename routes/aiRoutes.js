const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/prompt', aiController.handlePrompt);
router.post('/generate', aiController.generateContent);
router.post('/chat', aiController.handleChat);
router.post('/project-suggestions', aiController.getProjectSuggestions);
router.post('/image', aiController.getImage);
router.post('/yt', aiController.getYouTubeVideo);
router.post('/transcript', aiController.getYouTubeTranscript);
router.post('/data', aiController.sendEmail);

module.exports = router;