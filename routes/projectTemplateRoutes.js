import express from 'express';
import * as projectTemplateController from '../controllers/projectTemplateController.js';

const router = express.Router();

router.post('/getmainprojects', projectTemplateController.getMainProjects);
router.post('/saveProject', projectTemplateController.saveProject);
router.put('/updateproject', projectTemplateController.updateProject);

export default router;