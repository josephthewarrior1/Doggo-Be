const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { verifyCustomToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Profile picture upload (protected route)
router.post(
  '/profile-picture',
  verifyCustomToken,
  upload.single('image'),
  uploadController.uploadProfilePicture.bind(uploadController)
);

// Post image upload (protected route)
router.post(
  '/post-image',
  verifyCustomToken,
  upload.single('image'),
  uploadController.uploadPostImage.bind(uploadController)
);

module.exports = router;