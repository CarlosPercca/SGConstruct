const express = require('express');
const router = express.Router();
const { getTasks, getTaskById, createTask, updateTask, updateTaskStatus } = require('../controllers/taskController');

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', createTask);
router.put('/', updateTask); // Frontend sends PUT to /api/tasks with body including id
router.put('/:id/status', updateTaskStatus);

module.exports = router;
