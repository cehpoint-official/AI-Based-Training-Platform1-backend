import express from 'express';
import * as courseController from '../controllers/courseController.js';

const router = express.Router();

// Course routes
router.post('/course', courseController.createCourse);
router.post('/update', courseController.updateCourse);
router.post('/finish', courseController.finishCourse);
router.post('/sendcertificate', courseController.sendCertificate);
router.get('/courses', courseController.getCourses);
router.get('/getcourses', courseController.getAllCourses);
router.post('/updateProgress', courseController.updateProgress);

export default router;