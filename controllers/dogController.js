const dogDao = require('../daos/dogDao');

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
        gender, // NEW: Gender field
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

      // Save dog data to database with new fields
      const dogData = {
        dogId: nextId,
        name: name,
        breed: breed || '',
        age: age || 0,
        birthDate: birthDate || '',
        photo: photo || '',
        weight: weight || 0,
        gender: gender || '', // NEW: Gender field (male/female)
        schedule: schedule || {
          eat: [],
          walk: [],
          sleep: [],
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
        gender, // NEW: Gender field
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

      // Update dog data
      const updateData = {
        ...(name && { name }),
        ...(breed !== undefined && { breed }),
        ...(age !== undefined && { age }),
        ...(birthDate !== undefined && { birthDate }),
        ...(photo !== undefined && { photo }),
        ...(weight !== undefined && { weight }),
        ...(gender !== undefined && { gender }), // NEW: Gender field
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
}

module.exports = new DogController();
