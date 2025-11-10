const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Inisialisasi Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://doggoapp-d4a68-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const auth = admin.auth();
const db = admin.database();

// Helper function to make email safe for Firebase keys
function makeEmailKey(email) {
  return email.replace(/[.#$\/\[\]]/g, '_');
}

// Sign Up - Store with email as key
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

    // Firebase Auth - Create user
    console.log('🔐 Creating user in Firebase Auth...');
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      emailVerified: false,
      disabled: false
    });

    console.log('✅ User created in Auth:', userRecord.uid);

    // ✅ REALTIME DATABASE - Save user data using email as key
    const emailKey = makeEmailKey(email);
    console.log('💾 Saving user data to Realtime Database with key:', emailKey);
    
    const userRef = db.ref('users/' + emailKey);
    
    await userRef.set({
      email: email,
      uid: userRecord.uid, // Simpan UID juga untuk reference
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    });

    console.log('✅ User data saved to Realtime Database');

    // Create custom token
    const customToken = await auth.createCustomToken(userRecord.uid);

    console.log('🎉 Sign up completed for:', email);
    
    res.json({
      success: true,
      message: 'Account created successfully!',
      token: customToken,
      userId: userRecord.uid
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

// Sign In - Update using email as key
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

    // Get user by email from Firebase Auth
    console.log('🔍 Looking up user by email...');
    const user = await auth.getUserByEmail(email);
    
    console.log('✅ User found in Auth:', user.uid);

    // ✅ REALTIME DATABASE - Update last login using email as key
    const emailKey = makeEmailKey(email);
    const userRef = db.ref('users/' + emailKey);
    
    await userRef.update({
      lastLogin: new Date().toISOString()
    });

    // Create custom token
    const customToken = await auth.createCustomToken(user.uid);

    console.log('✅ Sign in successful for:', email);
    
    res.json({
      success: true,
      message: 'Welcome back!',
      token: customToken,
      userId: user.uid
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

// Get user by email
app.get('/api/user/:email', async (req, res) => {
  try {
    const emailKey = makeEmailKey(req.params.email);
    const userRef = db.ref('users/' + emailKey);
    
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 API ready at http://localhost:${PORT}`);
  console.log(`🏠 Home: http://localhost:${PORT}/`);
  console.log(`💾 Database: Realtime Database (Email as Key)`);
  console.log(`🔧 Status: http://localhost:${PORT}/api/database-status`);
});