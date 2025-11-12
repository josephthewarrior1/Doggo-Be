const { admin, db } = require('../config/firebase');

class SystemController {
  async getRoot(req, res) {
    res.json({
      message: 'Doggo Backend API is running!',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    });
  }

  async getHealth(req, res) {
    res.json({
      status: 'OK',
      service: 'Doggo Authentication API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    });
  }

  async getDatabaseStatus(req, res) {
    try {
      const testRef = db.ref('connection_test');
      await testRef.set({
        test: true,
        timestamp: new Date().toISOString(),
      });

      const snapshot = await testRef.once('value');

      res.json({
        status: 'connected',
        database: 'Realtime Database',
        projectId: admin.app().options.projectId,
        databaseURL: admin.app().options.databaseURL,
        test: 'successful',
      });
    } catch (error) {
      res.json({
        status: 'error',
        message: error.message,
      });
    }
  }
}

module.exports = new SystemController();
