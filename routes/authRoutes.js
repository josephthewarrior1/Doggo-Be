const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/signup', authController.signUp.bind(authController));
router.post('/signin', authController.signIn.bind(authController));

module.exports = router;
