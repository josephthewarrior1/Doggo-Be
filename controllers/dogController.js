const dogDao = require('../daos/dogDao');
const cloudinary = require('../config/cloudinary');

class DogController {
  async addDog(req, res) {
    try {
      console.log('🐶 Add dog attempt for user:', req.userId);

      const {
        name,
        breed,
        age,
        birthDate,
        photo,
        weight,
        gender,
        schedule,
      } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Dog name is required',
        });
      }

      // Get next ID from counter
      const nextId = await dogDao.getNextDogId();

      // Handle photo upload if provided
      let photoUrl = photo || '';
      
      // If photo is base64 string, upload to Cloudinary
      if (photo && photo.startsWith('data:image')) {
        try {
          console.log('📤 Uploading dog photo to Cloudinary...');
          const uploadResult = await cloudinary.uploader.upload(photo, {
            folder: 'dog_photos',
            public_id: `dog_${nextId}_${Date.now()}`,
            overwrite: true,
          });
          photoUrl = uploadResult.secure_url;
          console.log('✅ Dog photo uploaded:', photoUrl);
        } catch (uploadError) {
          console.error('❌ Photo upload failed:', uploadError.message);
          // Continue without photo if upload fails
        }
      }

      // Save dog data to database with new fields
      const dogData = {
        dogId: nextId,
        name: name,
        breed: breed || '',
        age: age || 0,
        birthDate: birthDate || '',
        photo: photoUrl, // Use uploaded URL or existing URL
        weight: weight || 0,
        gender: gender || '',
        schedule: schedule || {
          eat: [],
          walk: [],
          sleep: [],
          medicine: [],
          groom: []
        },
        ownerId: req.userId,
        createdAt: new Date().toISOString(),
      };

      await dogDao.createDog(nextId, dogData);

      console.log(
        '✅ Dog data saved with ID:',
        nextId,
        'for user:',
        req.userId
      );

      res.json({
        success: true,
        message: 'Dog added successfully!',
        dogId: nextId,
        dog: dogData,
      });
    } catch (error) {
      console.error('❌ Add dog error:', error.message);

      res.status(400).json({
        success: false,
        error: `Add dog failed: ${error.message}`,
      });
    }
  }

  async updateDog(req, res) {
    try {
      console.log('🐶 Update dog attempt for dog:', req.params.id);

      const dogId = req.params.id;
      const {
        name,
        breed,
        age,
        birthDate,
        photo,
        weight,
        gender,
        schedule,
      } = req.body;

      // Check if dog exists and belongs to user
      const existingDog = await dogDao.getDogById(dogId);

      if (!existingDog) {
        return res.status(404).json({
          success: false,
          error: 'Dog not found',
        });
      }

      if (existingDog.ownerId !== req.userId) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to update this dog',
        });
      }

      // Handle photo upload if new photo provided
      let photoUrl = photo;
      
      // If photo is base64 string (new upload), upload to Cloudinary
      if (photo && photo.startsWith('data:image') && photo !== existingDog.photo) {
        try {
          console.log('📤 Uploading updated dog photo to Cloudinary...');
          const uploadResult = await cloudinary.uploader.upload(photo, {
            folder: 'dog_photos',
            public_id: `dog_${dogId}_${Date.now()}`,
            overwrite: true,
          });
          photoUrl = uploadResult.secure_url;
          console.log('✅ Dog photo updated:', photoUrl);
        } catch (uploadError) {
          console.error('❌ Photo upload failed:', uploadError.message);
          // Keep existing photo if upload fails
          photoUrl = existingDog.photo;
        }
      }

      // Update dog data
      const updateData = {
        ...(name && { name }),
        ...(breed !== undefined && { breed }),
        ...(age !== undefined && { age }),
        ...(birthDate !== undefined && { birthDate }),
        ...(photoUrl !== undefined && { photo: photoUrl }),
        ...(weight !== undefined && { weight }),
        ...(gender !== undefined && { gender }),
        ...(schedule !== undefined && { schedule }),
        updatedAt: new Date().toISOString(),
      };

      await dogDao.updateDog(dogId, updateData);

      console.log('✅ Dog updated with ID:', dogId);

      res.json({
        success: true,
        message: 'Dog updated successfully!',
        dogId: dogId,
      });
    } catch (error) {
      console.error('❌ Update dog error:', error.message);

      res.status(400).json({
        success: false,
        error: `Update dog failed: ${error.message}`,
      });
    }
  }

  async getMyDogs(req, res) {
    try {
      const ownerId = req.userId;
      const dogs = await dogDao.getDogsByOwnerId(ownerId);

      res.json({
        success: true,
        dogs: dogs,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getDogById(req, res) {
    try {
      const dogId = req.params.id;
      const dogData = await dogDao.getDogById(dogId);

      if (!dogData) {
        return res.status(404).json({
          success: false,
          error: 'Dog not found',
        });
      }

      res.json({
        success: true,
        dog: dogData,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async deleteDog(req, res) {
    try {
      const dogId = req.params.id;

      // Check if dog exists and belongs to user
      const existingDog = await dogDao.getDogById(dogId);

      if (!existingDog) {
        return res.status(404).json({
          success: false,
          error: 'Dog not found',
        });
      }

      if (existingDog.ownerId !== req.userId) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to delete this dog',
        });
      }

      // Delete photo from Cloudinary if exists
      if (existingDog.photo && existingDog.photo.includes('cloudinary')) {
        try {
          const publicId = existingDog.photo.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId);
          console.log('✅ Dog photo deleted from Cloudinary');
        } catch (deleteError) {
          console.error('❌ Photo deletion failed:', deleteError.message);
          // Continue with dog deletion even if photo deletion fails
        }
      }

      await dogDao.deleteDog(dogId);

      console.log('✅ Dog deleted with ID:', dogId);

      res.json({
        success: true,
        message: 'Dog deleted successfully!',
      });
    } catch (error) {
      console.error('❌ Delete dog error:', error.message);

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getSchedules(req, res) {
    try {
      console.log('📅 Get schedules attempt for dog:', req.params.id);
  
      const dogId = req.params.id;
  
      // Check if dog exists and belongs to user
      const existingDog = await dogDao.getDogById(dogId);
  
      if (!existingDog) {
        return res.status(404).json({
          success: false,
          error: 'Dog not found',
        });
      }
  
      if (existingDog.ownerId !== req.userId) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to view this dog',
        });
      }
  
      const schedules = existingDog.schedule || {
        eat: [],
        walk: [],
        sleep: [],
        medicine: [],
        groom: []
      };
  
      console.log('✅ Schedules retrieved for dog:', dogId);
  
      res.json({
        success: true,
        schedules: schedules,
        dogId: dogId,
      });
    } catch (error) {
      console.error('❌ Get schedules error:', error.message);
  
      res.status(400).json({
        success: false,
        error: `Get schedules failed: ${error.message}`,
      });
    }
  }

  // NEW SCHEDULE METHODS
  async addSchedule(req, res) {
    try {
      console.log('📅 Add schedule attempt for dog:', req.params.id);

      const dogId = req.params.id;
      const { scheduleType, time, description } = req.body;

      // Validasi input
      if (!scheduleType || !time) {
        return res.status(400).json({
          success: false,
          error: 'Schedule type and time are required',
        });
      }

      // Validasi schedule type
      const validScheduleTypes = ['eat', 'walk', 'sleep', 'medicine', 'groom'];
      if (!validScheduleTypes.includes(scheduleType)) {
        return res.status(400).json({
          success: false,
          error: `Invalid schedule type. Must be one of: ${validScheduleTypes.join(', ')}`,
        });
      }

      // Check if dog exists and belongs to user
      const existingDog = await dogDao.getDogById(dogId);

      if (!existingDog) {
        return res.status(404).json({
          success: false,
          error: 'Dog not found',
        });
      }

      if (existingDog.ownerId !== req.userId) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to update this dog',
        });
      }

      // Buat schedule item baru
      const newScheduleItem = {
        id: Date.now().toString(), // ID unik untuk schedule item
        time: time,
        description: description || '',
        createdAt: new Date().toISOString(),
      };

      // Ambil schedule yang ada atau buat yang baru
      const currentSchedule = existingDog.schedule || {
        eat: [],
        walk: [],
        sleep: [],
        medicine: [],
        groom: []
      };

      // Tambahkan schedule item ke type yang sesuai
      if (!currentSchedule[scheduleType]) {
        currentSchedule[scheduleType] = [];
      }

      currentSchedule[scheduleType].push(newScheduleItem);

      // Update dog data dengan schedule baru
      const updateData = {
        schedule: currentSchedule,
        updatedAt: new Date().toISOString(),
      };

      await dogDao.updateDog(dogId, updateData);

      console.log('✅ Schedule added for dog:', dogId, 'Type:', scheduleType);

      res.json({
        success: true,
        message: 'Schedule added successfully!',
        scheduleType: scheduleType,
        scheduleItem: newScheduleItem,
        dogId: dogId,
      });
    } catch (error) {
      console.error('❌ Add schedule error:', error.message);

      res.status(400).json({
        success: false,
        error: `Add schedule failed: ${error.message}`,
      });
    }
  }

  async updateSchedule(req, res) {
    try {
      console.log('📅 Update schedule attempt for dog:', req.params.id);

      const dogId = req.params.id;
      const { scheduleType, scheduleItemId, time, description } = req.body;

      // Validasi input
      if (!scheduleType || !scheduleItemId) {
        return res.status(400).json({
          success: false,
          error: 'Schedule type and schedule item ID are required',
        });
      }

      // Check if dog exists and belongs to user
      const existingDog = await dogDao.getDogById(dogId);

      if (!existingDog) {
        return res.status(404).json({
          success: false,
          error: 'Dog not found',
        });
      }

      if (existingDog.ownerId !== req.userId) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to update this dog',
        });
      }

      // Ambil schedule yang ada
      const currentSchedule = existingDog.schedule || {
        eat: [],
        walk: [],
        sleep: [],
        medicine: [],
        groom: []
      };

      // Cari schedule item berdasarkan ID
      const scheduleItems = currentSchedule[scheduleType] || [];
      const scheduleItemIndex = scheduleItems.findIndex(item => item.id === scheduleItemId);

      if (scheduleItemIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Schedule item not found',
        });
      }

      // Update schedule item
      if (time !== undefined) {
        scheduleItems[scheduleItemIndex].time = time;
      }
      if (description !== undefined) {
        scheduleItems[scheduleItemIndex].description = description;
      }
      scheduleItems[scheduleItemIndex].updatedAt = new Date().toISOString();

      currentSchedule[scheduleType] = scheduleItems;

      // Update dog data
      const updateData = {
        schedule: currentSchedule,
        updatedAt: new Date().toISOString(),
      };

      await dogDao.updateDog(dogId, updateData);

      console.log('✅ Schedule updated for dog:', dogId);

      res.json({
        success: true,
        message: 'Schedule updated successfully!',
        scheduleType: scheduleType,
        scheduleItem: scheduleItems[scheduleItemIndex],
        dogId: dogId,
      });
    } catch (error) {
      console.error('❌ Update schedule error:', error.message);

      res.status(400).json({
        success: false,
        error: `Update schedule failed: ${error.message}`,
      });
    }
  }

  async deleteSchedule(req, res) {
    try {
      console.log('📅 Delete schedule attempt for dog:', req.params.id);

      const dogId = req.params.id;
      const { scheduleType, scheduleItemId } = req.body;

      // Validasi input
      if (!scheduleType || !scheduleItemId) {
        return res.status(400).json({
          success: false,
          error: 'Schedule type and schedule item ID are required',
        });
      }

      // Check if dog exists and belongs to user
      const existingDog = await dogDao.getDogById(dogId);

      if (!existingDog) {
        return res.status(404).json({
          success: false,
          error: 'Dog not found',
        });
      }

      if (existingDog.ownerId !== req.userId) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to update this dog',
        });
      }

      // Ambil schedule yang ada
      const currentSchedule = existingDog.schedule || {
        eat: [],
        walk: [],
        sleep: [],
        medicine: [],
        groom: []
      };

      // Filter out schedule item yang akan dihapus
      const scheduleItems = currentSchedule[scheduleType] || [];
      const filteredItems = scheduleItems.filter(item => item.id !== scheduleItemId);

      if (scheduleItems.length === filteredItems.length) {
        return res.status(404).json({
          success: false,
          error: 'Schedule item not found',
        });
      }

      currentSchedule[scheduleType] = filteredItems;

      // Update dog data
      const updateData = {
        schedule: currentSchedule,
        updatedAt: new Date().toISOString(),
      };

      await dogDao.updateDog(dogId, updateData);

      console.log('✅ Schedule deleted for dog:', dogId);

      res.json({
        success: true,
        message: 'Schedule deleted successfully!',
        scheduleType: scheduleType,
        scheduleItemId: scheduleItemId,
        dogId: dogId,
      });
    } catch (error) {
      console.error('❌ Delete schedule error:', error.message);

      res.status(400).json({
        success: false,
        error: `Delete schedule failed: ${error.message}`,
      });
    }
  }
}

module.exports = new DogController();