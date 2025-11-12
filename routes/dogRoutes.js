const express = require('express');
const router = express.Router();
const dogController = require('../controllers/dogController');
const { verifyCustomToken } = require('../middleware/auth');

router.post(
  '/dogs',
  verifyCustomToken,
  dogController.addDog.bind(dogController)
);
router.get(
  '/my-dogs',
  verifyCustomToken,
  dogController.getMyDogs.bind(dogController)
);
router.get(
  '/dogs/:id',
  verifyCustomToken,
  dogController.getDogById.bind(dogController)
);
router.put(
  '/dogs/:id',
  verifyCustomToken,
  dogController.updateDog.bind(dogController)
); // NEW
router.delete(
  '/dogs/:id',
  verifyCustomToken,
  dogController.deleteDog.bind(dogController)
); // NEW

module.exports = router;
