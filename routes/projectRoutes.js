const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

// Project routes
router.get('/getprojectsAdmin', projectController.getProjectForAdmin);
router.post('/projectSaved', projectController.saveProject);
router.get('/getprojects', projectController.getUserProjects);
router.get('/getmyprojects', projectController.getMyProjects);
router.post('/updateuserproject', projectController.updateUserProject);

router.post('/project/approve', projectController.approveProject);
router.post('/project/reject', projectController.rejectProject);


module.exports = router;