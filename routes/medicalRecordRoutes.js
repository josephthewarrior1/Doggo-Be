const express = require('express');
const router = express.Router();
const medicalRecordController = require('../controllers/medicalRecordController');
const { verifyCustomToken } = require('../middleware/auth');

// Create medical record
router.post(
  '/medical-records',
  verifyCustomToken,
  medicalRecordController.addMedicalRecord.bind(medicalRecordController)
);

// Get all medical records for logged-in user
router.get(
  '/medical-records',
  verifyCustomToken,
  medicalRecordController.getMyMedicalRecords.bind(medicalRecordController)
);

// Get medical records by dog ID
router.get(
  '/medical-records/dog/:dogId',
  verifyCustomToken,
  medicalRecordController.getMedicalRecordsByDog.bind(medicalRecordController)
);

// Get upcoming medical records (next 30 days)
router.get(
  '/medical-records/upcoming',
  verifyCustomToken,
  medicalRecordController.getUpcomingMedicalRecords.bind(
    medicalRecordController
  )
);

// Get overdue medical records
router.get(
  '/medical-records/overdue',
  verifyCustomToken,
  medicalRecordController.getOverdueMedicalRecords.bind(medicalRecordController)
);

// Get single medical record by ID
router.get(
  '/medical-records/:id',
  verifyCustomToken,
  medicalRecordController.getMedicalRecordById.bind(medicalRecordController)
);

// Update medical record
router.put(
  '/medical-records/:id',
  verifyCustomToken,
  medicalRecordController.updateMedicalRecord.bind(medicalRecordController)
);

// Delete medical record
router.delete(
  '/medical-records/:id',
  verifyCustomToken,
  medicalRecordController.deleteMedicalRecord.bind(medicalRecordController)
);

module.exports = router;
