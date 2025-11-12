const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/user/:id', userController.getUserById.bind(userController));
router.get('/users', userController.getAllUsers.bind(userController));

module.exports = router;
