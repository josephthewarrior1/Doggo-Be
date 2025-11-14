const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// GET routes
router.get('/user/:id', userController.getUserById.bind(userController));
router.get('/user/username/:username', userController.getUserByUsername.bind(userController));
router.get('/users', userController.getAllUsers.bind(userController));

// POST routes
router.post('/user', userController.createUser.bind(userController));

// PUT routes
router.put('/user/:id', userController.updateUser.bind(userController));

module.exports = router;