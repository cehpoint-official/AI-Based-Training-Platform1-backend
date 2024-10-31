const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

router.post('/fetch-questions', questionController.fetchQuestions);

module.exports = router;