const express = require('express');
const router = express.Router();
const { getProjectStats } = require('../controllers/reportController');

router.get('/stats', getProjectStats);

module.exports = router;
