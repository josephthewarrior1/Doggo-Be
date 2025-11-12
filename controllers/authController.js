const { auth } = require('../config/firebase');
const userDao = require('../daos/userDao');

class AuthController {
  async signUp(req, res) {
    try {
      console.log('📨 Sign up attempt:', req.body.email);

      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Please fill all fields',
        });
      }

      // Get next ID from counter
      const nextId = await userDao.getNextUserId();

      // Create user in Firebase Auth
      console.log('🔐 Creating user in Firebase Auth...');
      const userRecord = await auth.createUser({
        email: email,
        password: password,
        emailVerified: false,
        disabled: false,
      });

      console.log('✅ User created in Auth with UID:', userRecord.uid);

      // Save user data to database
      console.log('💾 Saving user data with ID:', nextId);

      const userData = {
        id: nextId,
        uid: userRecord.uid,
        email: email,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      await userDao.createUser(nextId, userData);

      console.log(
        '✅ User data saved with ID:',
        nextId,
        'and UID:',
        userRecord.uid
      );

      // Create custom token
      const customToken = await auth.createCustomToken(userRecord.uid);

      console.log('🎉 Sign up completed for:', email, 'with ID:', nextId);

      res.json({
        success: true,
        message: 'Account created successfully!',
        token: customToken,
        userId: nextId,
        userDbId: nextId,
        uid: userRecord.uid,
      });
    } catch (error) {
      console.error('❌ Sign up error:', error.message);

      let errorMessage = 'Sign up failed';

      if (error.code === 'auth/email-already-exists') {
        errorMessage = 'Email already exists';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else {
        errorMessage = `Sign up failed: ${error.message}`;
      }

      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }
  }

  async signIn(req, res) {
    try {
      console.log('📨 Sign in attempt:', req.body.email);

      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Please fill all fields',
        });
      }

      // Get user by email from Firebase Auth
      console.log('🔍 Looking up user by email...');
      const user = await auth.getUserByEmail(email);

      console.log('✅ User found in Auth with UID:', user.uid);

      // Get user from database
      const { userId, userData } = await userDao.getUserByEmail(email);

      if (!userData) {
        return res.status(400).json({
          success: false,
          error: 'User data not found in database',
        });
      }

      // Update last login
      await userDao.updateLastLogin(userId);

      // Create custom token
      const customToken = await auth.createCustomToken(user.uid);

      console.log(
        '✅ Sign in successful for:',
        email,
        'ID:',
        userId,
        'UID:',
        user.uid
      );

      res.json({
        success: true,
        message: 'Welcome back!',
        token: customToken,
        userId: userId,
        userDbId: userId,
        uid: user.uid,
      });
    } catch (error) {
      console.error('❌ Sign in error:', error.message);

      let errorMessage = 'Login failed';

      if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      } else {
        errorMessage = `Login failed: ${error.message}`;
      }

      res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }
  }
}

module.exports = new AuthController();
