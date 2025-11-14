const userDao = require('../daos/userDao');

class UserController {
  async createUser(req, res) {
    try {
      const { email, username, password, name } = req.body;

      // Validasi input
      if (!email || !username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email, username, and password are required',
        });
      }

      // Cek apakah email sudah ada
      const existingEmail = await userDao.getUserByEmail(email);
      if (existingEmail.userData) {
        return res.status(409).json({
          success: false,
          error: 'Email already exists',
        });
      }

      // Cek apakah username sudah ada
      const existingUsername = await userDao.getUserByUsername(username);
      if (existingUsername.userData) {
        return res.status(409).json({
          success: false,
          error: 'Username already exists',
        });
      }

      // Generate user ID baru
      const userId = await userDao.getNextUserId();

      // Data user baru
      const userData = {
        id: userId,
        email,
        username,
        password, // Note: dalam production, password harus di-hash dulu!
        name: name || '',
        createdAt: new Date().toISOString(),
        lastLogin: null,
      };

      // Create user
      const newUser = await userDao.createUser(userId, userData);

      res.status(201).json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          name: newUser.name,
          createdAt: newUser.createdAt,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

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

  async getUserByUsername(req, res) {
    try {
      const { userId, userData } = await userDao.getUserByUsername(req.params.username);

      if (!userData) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      res.json({
        success: true,
        user: {
          id: userId,
          ...userData
        },
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

  async updateUser(req, res) {
    try {
      const userId = req.params.id;
      const updateData = req.body;

      // Validasi: user exists
      const existingUser = await userDao.getUserById(userId);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      // Jika update username, cek apakah username sudah dipakai user lain
      if (updateData.username && updateData.username !== existingUser.username) {
        const existingUsername = await userDao.getUserByUsername(updateData.username);
        if (existingUsername.userData) {
          return res.status(409).json({
            success: false,
            error: 'Username already exists',
          });
        }
      }

      // Jika update email, cek apakah email sudah dipakai user lain
      if (updateData.email && updateData.email !== existingUser.email) {
        const existingEmail = await userDao.getUserByEmail(updateData.email);
        if (existingEmail.userData) {
          return res.status(409).json({
            success: false,
            error: 'Email already exists',
          });
        }
      }

      const updatedUser = await userDao.updateUser(userId, {
        ...updateData,
        updatedAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        user: updatedUser,
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