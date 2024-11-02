const express = require('express');
const router = express.Router();
const resumeController = require('../controllers/resumeController');

router.post('/resume', resumeController.createResume);
router.get('/resume/:uid', resumeController.getResume);
router.post('/upload-resume', resumeController.uploadResume);
router.get('/getallresumes', resumeController.getAllResumes); 

module.exports = router;