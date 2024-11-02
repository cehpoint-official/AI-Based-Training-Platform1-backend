const express = require('express');
const router = express.Router();
const testUserController = require('../controllers/testUserController');

router.post('/testusers', testUserController.createTestUser);
router.get('/testuser/getalltestuser', testUserController.getAllTestUsers);
router.put('/updaterecordings', testUserController.updateRecordings);

module.exports = router;