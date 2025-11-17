const cloudinary = require('../config/cloudinary');
const userDao = require('../daos/userDao');

class UploadController {
  async uploadProfilePicture(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
      }

      const userId = req.userId; // Dari auth middleware
      
      console.log('📤 Uploading profile picture for user:', userId);

      // Upload ke Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'profile_pictures',
            public_id: `user_${userId}_${Date.now()}`,
            overwrite: true,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        uploadStream.end(req.file.buffer);
      });

      console.log('✅ Image uploaded to Cloudinary:', result.secure_url);

      // Update user data di Firebase dengan URL gambar
      await userDao.updateUser(userId, {
        profilePicture: result.secure_url,
        updatedAt: new Date().toISOString(),
      });

      console.log('✅ Profile picture updated for user:', userId);

      res.json({
        success: true,
        message: 'Profile picture uploaded successfully',
        imageUrl: result.secure_url,
      });
    } catch (error) {
      console.error('❌ Upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Upload failed: ' + error.message,
      });
    }
  }

  async uploadPostImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
      }

      const userId = req.userId;
      
      console.log('📤 Uploading post image for user:', userId);

      // Upload ke Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'post_images',
            public_id: `post_${userId}_${Date.now()}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        uploadStream.end(req.file.buffer);
      });

      res.json({
        success: true,
        message: 'Image uploaded successfully',
        imageUrl: result.secure_url,
      });
    } catch (error) {
      console.error('❌ Upload error:', error);
      res.status(500).json({
        success: false,
        error: 'Upload failed: ' + error.message,
      });
    }
  }
}

module.exports = new UploadController();