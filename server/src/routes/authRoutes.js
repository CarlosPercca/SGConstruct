const express = require('express');
const router = express.Router();
const { login, recoverPassword } = require('../controllers/authController');

router.post('/login', login);
router.post('/recover-password', recoverPassword);

module.exports = router;
