import express from 'express';
import * as testUserController from '../controllers/testUserController.js';

const router = express.Router();

router.post('/testusers', testUserController.createTestUser);
router.get('/testuser/getalltestuser', testUserController.getAllTestUsers);
router.put('/updaterecordings', testUserController.updateRecordings);
router.get('/testusers/check/:userId', testUserController.checkTestUserExists);

export default router;