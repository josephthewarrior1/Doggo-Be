// dogRoutes.js - Tambahkan route ini

const express = require('express');
const router = express.Router();
const dogController = require('../controllers/dogController');
const { verifyCustomToken } = require('../middleware/auth');

// Dog routes
router.post('/dogs', verifyCustomToken, dogController.addDog.bind(dogController));
router.get('/my-dogs', verifyCustomToken, dogController.getMyDogs.bind(dogController));
router.get('/dogs/:id', verifyCustomToken, dogController.getDogById.bind(dogController));
router.put('/dogs/:id', verifyCustomToken, dogController.updateDog.bind(dogController));
router.delete('/dogs/:id', verifyCustomToken, dogController.deleteDog.bind(dogController));

// Schedule routes
router.get('/dogs/:id/schedules', verifyCustomToken, dogController.getSchedules.bind(dogController)); // NEW
router.post('/dogs/:id/schedule', verifyCustomToken, dogController.addSchedule.bind(dogController));
router.put('/dogs/:id/schedule', verifyCustomToken, dogController.updateSchedule.bind(dogController));
router.delete('/dogs/:id/schedule', verifyCustomToken, dogController.deleteSchedule.bind(dogController));

module.exports = router;