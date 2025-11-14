const medicalRecordDao = require('../daos/medicalRecordDao');
const dogDao = require('../daos/dogDao');

class MedicalRecordController {
  async addMedicalRecord(req, res) {
    try {
      console.log('🏥 Add medical record attempt for user:', req.userId);

      const {
        dogId,
        type,
        name,
        date,
        nextDueDate,
        veterinarian,
        clinic,
        notes,
        documents,
        status,
        reminderEnabled,
        reminderDays,
      } = req.body;

      if (!dogId || !type || !name || !date) {
        return res.status(400).json({
          success: false,
          error: 'dogId, type, name, and date are required',
        });
      }

      // Verify dog belongs to user
      const dog = await dogDao.getDogById(dogId);
      if (!dog) {
        return res.status(404).json({
          success: false,
          error: 'Dog not found',
        });
      }

      if (dog.ownerId !== req.userId) {
        return res.status(403).json({
          success: false,
          error:
            'You do not have permission to add medical records for this dog',
        });
      }

      // Get next ID from counter
      const nextId = await medicalRecordDao.getNextMedicalRecordId();

      // Save medical record data to database
      const medicalData = {
        medicalId: nextId,
        dogId: parseInt(dogId),
        ownerId: req.userId,
        type: type, // vaccine, checkup, treatment, surgery, medication
        name: name,
        date: date,
        nextDueDate: nextDueDate || null,
        veterinarian: veterinarian || '',
        clinic: clinic || '',
        notes: notes || '',
        documents: documents || [],
        status: status || 'completed', // completed, upcoming, overdue
        reminderEnabled: reminderEnabled !== undefined ? reminderEnabled : true,
        reminderDays: reminderDays || 7,
        reminderSent: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await medicalRecordDao.createMedicalRecord(nextId, medicalData);

      console.log(
        '✅ Medical record saved with ID:',
        nextId,
        'for dog:',
        dogId
      );

      res.json({
        success: true,
        message: 'Medical record added successfully!',
        medicalId: nextId,
        medicalRecord: medicalData,
      });
    } catch (error) {
      console.error('❌ Add medical record error:', error.message);

      res.status(400).json({
        success: false,
        error: `Add medical record failed: ${error.message}`,
      });
    }
  }

  async updateMedicalRecord(req, res) {
    try {
      console.log('🏥 Update medical record attempt:', req.params.id);

      const medicalId = req.params.id;
      const {
        type,
        name,
        date,
        nextDueDate,
        veterinarian,
        clinic,
        notes,
        documents,
        status,
        reminderEnabled,
        reminderDays,
      } = req.body;

      // Check if medical record exists and belongs to user
      const existingRecord = await medicalRecordDao.getMedicalRecordById(
        medicalId
      );

      if (!existingRecord) {
        return res.status(404).json({
          success: false,
          error: 'Medical record not found',
        });
      }

      if (existingRecord.ownerId !== req.userId) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to update this medical record',
        });
      }

      // Update medical record data
      const updateData = {
        ...(type !== undefined && { type }),
        ...(name !== undefined && { name }),
        ...(date !== undefined && { date }),
        ...(nextDueDate !== undefined && { nextDueDate }),
        ...(veterinarian !== undefined && { veterinarian }),
        ...(clinic !== undefined && { clinic }),
        ...(notes !== undefined && { notes }),
        ...(documents !== undefined && { documents }),
        ...(status !== undefined && { status }),
        ...(reminderEnabled !== undefined && { reminderEnabled }),
        ...(reminderDays !== undefined && { reminderDays }),
        updatedAt: new Date().toISOString(),
      };

      await medicalRecordDao.updateMedicalRecord(medicalId, updateData);

      console.log('✅ Medical record updated with ID:', medicalId);

      res.json({
        success: true,
        message: 'Medical record updated successfully!',
        medicalId: medicalId,
      });
    } catch (error) {
      console.error('❌ Update medical record error:', error.message);

      res.status(400).json({
        success: false,
        error: `Update medical record failed: ${error.message}`,
      });
    }
  }

  async getMedicalRecordById(req, res) {
    try {
      const medicalId = req.params.id;
      const medicalData = await medicalRecordDao.getMedicalRecordById(
        medicalId
      );

      if (!medicalData) {
        return res.status(404).json({
          success: false,
          error: 'Medical record not found',
        });
      }

      // Check if belongs to user
      if (medicalData.ownerId !== req.userId) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to view this medical record',
        });
      }

      res.json({
        success: true,
        medicalRecord: medicalData,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getMedicalRecordsByDog(req, res) {
    try {
      const dogId = parseInt(req.params.dogId);

      // Verify dog belongs to user
      const dog = await dogDao.getDogById(dogId);
      if (!dog) {
        return res.status(404).json({
          success: false,
          error: 'Dog not found',
        });
      }

      if (dog.ownerId !== req.userId) {
        return res.status(403).json({
          success: false,
          error:
            'You do not have permission to view medical records for this dog',
        });
      }

      const medicalRecords = await medicalRecordDao.getMedicalRecordsByDogId(
        dogId
      );

      res.json({
        success: true,
        medicalRecords: medicalRecords,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getMyMedicalRecords(req, res) {
    try {
      const ownerId = req.userId;
      const medicalRecords = await medicalRecordDao.getMedicalRecordsByOwnerId(
        ownerId
      );

      res.json({
        success: true,
        medicalRecords: medicalRecords,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getUpcomingMedicalRecords(req, res) {
    try {
      const ownerId = req.userId;
      const upcomingRecords = await medicalRecordDao.getUpcomingMedicalRecords(
        ownerId
      );

      res.json({
        success: true,
        upcomingRecords: upcomingRecords,
        count: Object.keys(upcomingRecords).length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getOverdueMedicalRecords(req, res) {
    try {
      const ownerId = req.userId;
      const overdueRecords = await medicalRecordDao.getOverdueMedicalRecords(
        ownerId
      );

      res.json({
        success: true,
        overdueRecords: overdueRecords,
        count: Object.keys(overdueRecords).length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async deleteMedicalRecord(req, res) {
    try {
      const medicalId = req.params.id;

      // Check if medical record exists and belongs to user
      const existingRecord = await medicalRecordDao.getMedicalRecordById(
        medicalId
      );

      if (!existingRecord) {
        return res.status(404).json({
          success: false,
          error: 'Medical record not found',
        });
      }

      if (existingRecord.ownerId !== req.userId) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to delete this medical record',
        });
      }

      await medicalRecordDao.deleteMedicalRecord(medicalId);

      console.log('✅ Medical record deleted with ID:', medicalId);

      res.json({
        success: true,
        message: 'Medical record deleted successfully!',
      });
    } catch (error) {
      console.error('❌ Delete medical record error:', error.message);

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new MedicalRecordController();
