const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');

// Course routes
router.post('/course', courseController.createCourse);
router.post('/update', courseController.updateCourse);
router.post('/finish', courseController.finishCourse);
router.post('/sendcertificate', courseController.sendCertificate);
router.get('/courses', courseController.getCourses);
router.get('/getcourses', courseController.getAllCourses);
router.post('/updateProgress', courseController.updateProgress);

module.exports = router;