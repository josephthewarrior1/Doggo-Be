const userDao = require('../daos/userDao');

class UserController {
  async getUserById(req, res) {
    try {
      const userData = await userDao.getUserById(req.params.id);

      if (!userData) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      res.json({
        success: true,
        user: userData,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getAllUsers(req, res) {
    try {
      const users = await userDao.getAllUsers();

      res.json({
        success: true,
        users: users,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
}

module.exports = new UserController();
