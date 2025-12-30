const express = require('express');
const router = express.Router();
const { registerHours, getValidations, validateAvance } = require('../controllers/validationController');

router.post('/', registerHours);
router.get('/', getValidations);
router.put('/:id/validate', validateAvance);

module.exports = router;
