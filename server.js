const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Inisialisasi Firebase Admin
let serviceAccount;
if (process.env.NODE_ENV === 'production') {
  // For Vercel - menggunakan environment variables
  serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID || "doggoapp-d4a68",
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
  };
} else {
  // For local development
  serviceAccount = require('./serviceAccountKey.json');
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://doggoapp-d4a68-default-rtdb.asia-southeast1.firebasedatabase.app"
  });
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.log('❌ Firebase Admin initialization failed:', error.message);
}

const auth = admin.auth();
const db = admin.database();

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Doggo Backend API is running!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    service: 'Doggo Authentication API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Sign Up - Dengan AUTO-INCREMENT ID + UID
app.post('/api/signup', async (req, res) => {
  try {
    console.log('📨 Sign up attempt:', req.body.email);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Please fill all fields' 
      });
    }

    // 1. Dapatkan next ID dari counter
    const counterRef = db.ref('counters/users');
    const counterSnapshot = await counterRef.once('value');
    let nextId = 1;
    
    if (counterSnapshot.exists()) {
      nextId = counterSnapshot.val() + 1;
    }
    
    // 2. Update counter untuk next time
    await counterRef.set(nextId);

    // 3. Firebase Auth - Create user (akan generate UID)
    console.log('🔐 Creating user in Firebase Auth...');
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      emailVerified: false,
      disabled: false
    });

    console.log('✅ User created in Auth with UID:', userRecord.uid);

    // 4. ✅ REALTIME DATABASE - Save user data dengan BOTH ID dan UID
    console.log('💾 Saving user data with ID:', nextId);
    
    const userRef = db.ref('users/' + nextId);  // PAKAI AUTO-INCREMENT ID sebagai key
    
    await userRef.set({
      id: nextId,           // ← AUTO-INCREMENT ID (1, 2, 3, ...) - untuk tampilan
      uid: userRecord.uid,  // ← Firebase UID - untuk authentication
      email: email,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    });

    console.log('✅ User data saved with ID:', nextId, 'and UID:', userRecord.uid);

    // Create custom token (pakai UID)
    const customToken = await auth.createCustomToken(userRecord.uid);

    console.log('🎉 Sign up completed for:', email, 'with ID:', nextId);
    
    res.json({
      success: true,
      message: 'Account created successfully!',
      token: customToken,
      userId: nextId,       // Kirim ID (1, 2, 3) ke Android untuk display
      userDbId: nextId,
      uid: userRecord.uid   // Kirim juga UID untuk reference
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
      error: errorMessage
    });
  }
});

// Sign In - Dengan AUTO-INCREMENT ID + UID
app.post('/api/signin', async (req, res) => {
  try {
    console.log('📨 Sign in attempt:', req.body.email);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Please fill all fields' 
      });
    }

    // Get user by email from Firebase Auth (pakai UID)
    console.log('🔍 Looking up user by email...');
    const user = await auth.getUserByEmail(email);
    
    console.log('✅ User found in Auth with UID:', user.uid);

    // Cari user by email di database untuk dapat ID-nya
    const usersRef = db.ref('users');
    const snapshot = await usersRef.orderByChild('email').equalTo(email).once('value');
    
    let userDbId = null;
    let userData = null;
    
    snapshot.forEach((childSnapshot) => {
      userDbId = childSnapshot.key;  // Ini ID-nya (1, 2, 3, ...)
      userData = childSnapshot.val();
    });

    if (!userData) {
      return res.status(400).json({
        success: false,
        error: 'User data not found in database'
      });
    }

    // Update last login
    await usersRef.child(userDbId).update({
      lastLogin: new Date().toISOString()
    });

    // Create custom token (pakai UID)
    const customToken = await auth.createCustomToken(user.uid);

    console.log('✅ Sign in successful for:', email, 'ID:', userDbId, 'UID:', user.uid);
    
    res.json({
      success: true,
      message: 'Welcome back!',
      token: customToken,
      userId: userDbId,     // Kirim ID (1, 2, 3) ke Android untuk display
      userDbId: userDbId,
      uid: user.uid        // Kirim juga UID untuk reference
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
      error: errorMessage
    });
  }
});

// Get user by ID
app.get('/api/user/:id', async (req, res) => {
  try {
    const userRef = db.ref('users/' + req.params.id);
    
    const snapshot = await userRef.once('value');
    const userData = snapshot.val();
    
    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const usersRef = db.ref('users');
    const snapshot = await usersRef.once('value');
    const users = snapshot.val();
    
    res.json({
      success: true,
      users: users || {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Proper token verification middleware
const verifyToken = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'No token provided'
        });
      }
  
      const token = authHeader.split('Bearer ')[1];
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token format'
        });
      }
  
      // Verify token dengan Firebase Admin
      const decodedToken = await auth.verifyIdToken(token);
      req.user = decodedToken;
      
      console.log('✅ Token verified for user:', decodedToken.uid);
      next();
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
  };
  
  // Get user info from token (untuk dapat user ID)
  const getUserFromToken = async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'No token provided'
        });
      }
  
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await auth.verifyIdToken(token);
      
      // Cari user di database berdasarkan UID dari token
      const usersRef = db.ref('users');
      const snapshot = await usersRef.orderByChild('uid').equalTo(decodedToken.uid).once('value');
      
      let userData = null;
      let userId = null;
      
      snapshot.forEach((childSnapshot) => {
        userId = childSnapshot.key;
        userData = childSnapshot.val();
      });
  
      if (!userData) {
        return res.status(404).json({
          success: false,
          error: 'User not found in database'
        });
      }
  
      req.userId = parseInt(userId);
      req.userData = userData;
      next();
    } catch (error) {
      console.error('❌ Get user from token failed:', error.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
  };
  
  // Add new dog dengan token auth
  app.post('/api/dogs', verifyToken, getUserFromToken, async (req, res) => {
    try {
      console.log('🐶 Add dog attempt for user:', req.userId);
      
      const { name, breed, age, birthDate, photo } = req.body;
  
      if (!name) {
        return res.status(400).json({ 
          success: false,
          error: 'Dog name is required' 
        });
      }
  
      // 1. Dapatkan next ID dari counter
      const counterRef = db.ref('counters/dogs');
      const counterSnapshot = await counterRef.once('value');
      let nextId = 1;
      
      if (counterSnapshot.exists()) {
        nextId = counterSnapshot.val() + 1;
      }
      
      // 2. Update counter untuk next time
      await counterRef.set(nextId);
  
      // 3. Save dog data ke database dengan ownerId dari token
      const dogRef = db.ref('dogs/' + nextId);
      
      await dogRef.set({
        dogId: nextId,
        name: name,
        breed: breed || '',
        age: age || 0,
        birthDate: birthDate || '',
        photo: photo || '',
        ownerId: req.userId, // PAKAI USER ID DARI TOKEN
        createdAt: new Date().toISOString()
      });
  
      console.log('✅ Dog data saved with ID:', nextId, 'for user:', req.userId);
      
      res.json({
        success: true,
        message: 'Dog added successfully!',
        dogId: nextId
      });
  
    } catch (error) {
      console.error('❌ Add dog error:', error.message);
      
      res.status(400).json({
        success: false,
        error: `Add dog failed: ${error.message}`
      });
    }
  });
  
  // Get dogs by owner dengan token auth
  app.get('/api/my-dogs', verifyToken, getUserFromToken, async (req, res) => {
    try {
      const ownerId = req.userId;
      const dogsRef = db.ref('dogs');
      
      const snapshot = await dogsRef.orderByChild('ownerId').equalTo(ownerId).once('value');
      const dogs = snapshot.val();
      
      res.json({
        success: true,
        dogs: dogs || {}
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

// Test Realtime Database connection
app.get('/api/database-status', async (req, res) => {
  try {
    const testRef = db.ref('connection_test');
    await testRef.set({
      test: true,
      timestamp: new Date().toISOString()
    });
    
    const snapshot = await testRef.once('value');
    
    res.json({
      status: 'connected',
      database: 'Realtime Database',
      projectId: admin.app().options.projectId,
      databaseURL: admin.app().options.databaseURL,
      test: 'successful'
    });
  } catch (error) {
    res.json({
      status: 'error',
      message: error.message
    });
  }
});

// Handle Vercel deployment
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Export for Vercel
module.exports = app;