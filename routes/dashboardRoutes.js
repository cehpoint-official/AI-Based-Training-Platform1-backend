const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.post('/dashboard', dashboardController.getDashboardData);

module.exports = router;