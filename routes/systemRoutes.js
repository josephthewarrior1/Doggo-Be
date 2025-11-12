const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');

router.get('/', systemController.getRoot.bind(systemController));
router.get('/health', systemController.getHealth.bind(systemController));
router.get(
  '/database-status',
  systemController.getDatabaseStatus.bind(systemController)
);

module.exports = router;
