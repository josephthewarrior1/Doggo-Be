const { auth } = require('../config/firebase');
const userDao = require('../daos/userDao');

class AuthController {
  /**
   * Validate password - BALANCED VERSION (aman tapi ga ribet)
   */
  validatePassword(password, username = '', email = '') {
    // 1. Password harus ada
    if (!password) {
      return { valid: false, error: 'Password is required' };
    }

    // 2. Minimal 8 karakter (standar yang reasonable)
    if (password.length < 8) {
      return { 
        valid: false, 
        error: 'Password must be at least 8 characters long' 
      };
    }

    // 3. Maksimal 128 karakter (prevent DoS)
    if (password.length > 128) {
      return { 
        valid: false, 
        error: 'Password is too long (maximum 128 characters)' 
      };
    }

    // 4. Harus ada huruf (a-z atau A-Z)
    if (!/[a-zA-Z]/.test(password)) {
      return { 
        valid: false, 
        error: 'Password must contain at least one letter' 
      };
    }

    // 5. Harus ada angka (0-9)
    if (!/[0-9]/.test(password)) {
      return { 
        valid: false, 
        error: 'Password must contain at least one number' 
      };
    }

    // 6. Cek password super weak/common
    const weakPasswords = [
      '12345678',
      '123456789',
      'password',
      'password1',
      'password123',
      'qwerty123',
      'abc12345',
      'abcd1234',
      '11111111',
      'welcome123',
      'admin123',
      'user1234',
      'letmein1'
    ];
    
    if (weakPasswords.includes(password.toLowerCase())) {
      return { 
        valid: false, 
        error: 'This password is too common. Please choose a different one' 
      };
    }

    // 7. Ga boleh sama dengan username (kalo ada)
    if (username && username.length > 0) {
      const normalizedPassword = password.toLowerCase();
      const normalizedUsername = username.toLowerCase();
      
      if (normalizedPassword.includes(normalizedUsername) || 
          normalizedUsername.includes(normalizedPassword)) {
        return { 
          valid: false, 
          error: 'Password cannot contain your username' 
        };
      }
    }

    // 8. Ga boleh sama dengan bagian email (kalo ada)
    if (email && email.length > 0) {
      const normalizedPassword = password.toLowerCase();
      const emailParts = email.toLowerCase().split('@');
      const emailUsername = emailParts[0];
      
      // Only check if email username is meaningful (> 3 chars)
      if (emailUsername.length > 3) {
        if (normalizedPassword.includes(emailUsername) || 
            emailUsername.includes(normalizedPassword)) {
          return { 
            valid: false, 
            error: 'Password cannot be similar to your email' 
          };
        }
      }
    }

    // ALL CHECKS PASSED! 🎉
    return { valid: true, error: null };
  }

  async signUp(req, res) {
    try {
      console.log('📨 Sign up attempt:', req.body.email);
  
      const { email, password, username, name } = req.body;
  
      // ===== BASIC VALIDATION =====
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
      }

      // ===== PASSWORD VALIDATION (BALANCED) =====
      const validation = this.validatePassword(password, username, email);
      
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error,
        });
      }

      console.log('✅ Password validation passed');

      // ===== CREATE ACCOUNT =====
  
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
  
      // Save user data to database (WITHOUT PASSWORD!)
      console.log('💾 Saving user data with ID:', nextId);
  
      const userData = {
        id: nextId,
        uid: userRecord.uid,
        email: email,
        username: username || '',
        name: name || '',
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
        username: username || '',
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
          error: 'Email and password are required',
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
        username: userData.username || '',
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