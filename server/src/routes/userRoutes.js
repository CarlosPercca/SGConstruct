const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, getUserStats } = require('../controllers/userController');

router.get('/', getUsers);
router.post('/', createUser);
router.put('/', updateUser);
router.get('/:id/stats', getUserStats);

module.exports = router;
