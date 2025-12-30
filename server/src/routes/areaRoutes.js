const express = require('express');
const router = express.Router();
const { getAreas, createArea, toggleAreaStatus, deleteArea } = require('../controllers/areaController');

router.get('/', getAreas);
router.post('/', createArea);
router.put('/:id/status', toggleAreaStatus);
router.delete('/:id', deleteArea);

module.exports = router;
