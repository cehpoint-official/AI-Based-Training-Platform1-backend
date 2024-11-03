import express from 'express';
import * as userController from '../controllers/userController.js';

const router = express.Router();

// User routes
router.post('/signup', userController.signup);
router.post('/signin', userController.signin);
router.post('/google/auth', userController.googleAuth);
router.post('/forgot', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);
router.post('/profile', userController.updateProfile);
router.get('/getusers', userController.getUsers);
router.get('/getadmins', userController.getAdmins);
router.post('/addadmin', userController.addAdmin);
router.post('/removeadmin', userController.removeAdmin);
router.get('/user/getUserByID', userController.getUserById);
router.get('/user/getProfile', userController.getProfile);

export default router;