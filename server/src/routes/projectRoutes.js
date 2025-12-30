const express = require('express');
const router = express.Router();
const { getProjects, createProject, getMilestones, getVersions } = require('../controllers/projectController');

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:projectId/milestones', getMilestones);
router.get('/:projectId/versions', getVersions);

module.exports = router;
