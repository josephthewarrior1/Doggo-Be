const admin = require('firebase-admin');

let serviceAccount;
if (process.env.NODE_ENV === 'production') {
  serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID || 'doggoapp-d4a68',
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  };
} else {
  serviceAccount = require('../serviceAccountKey.json');
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL:
      'https://doggoapp-d4a68-default-rtdb.asia-southeast1.firebasedatabase.app',
  });
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.log('❌ Firebase Admin initialization failed:', error.message);
}

const auth = admin.auth();
const db = admin.database();

module.exports = { admin, auth, db };
