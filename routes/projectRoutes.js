import express from 'express';
import * as projectController from '../controllers/projectController.js';

const router = express.Router();

// Project routes
router.get('/getprojectsAdmin', projectController.getProjectForAdmin);
router.post('/projectSaved', projectController.saveProject);
router.get('/getprojects', projectController.getUserProjects);
router.get('/getmyprojects', projectController.getMyProjects);
router.post('/updateuserproject', projectController.updateUserProject);

router.post('/project/approve', projectController.approveProject);
router.post('/project/reject', projectController.rejectProject);

export default router;