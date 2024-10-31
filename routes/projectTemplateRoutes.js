const express = require('express');
const router = express.Router();
const projectTemplateController = require('../controllers/projectTemplateController');

router.get('/getmainprojects', projectTemplateController.getMainProjects);
router.post('/saveProject', projectTemplateController.saveProject);
router.put('/updateproject', projectTemplateController.updateProject);

module.exports = router;