const express = require('express');
const router = express.Router();
const testUserController = require('../controllers/testUserController');

router.post('/testusers', testUserController.createTestUser);

module.exports = router;