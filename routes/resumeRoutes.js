import express from 'express';
import * as resumeController from '../controllers/resumeController.js';

const router = express.Router();

router.post('/resume', resumeController.createResume);
router.get('/resume/:uid', resumeController.getResume);
router.post('/upload-resume', resumeController.uploadResume);
router.get('/getallresumes', resumeController.getAllResumes);

export default router;