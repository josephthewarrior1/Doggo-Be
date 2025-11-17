const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// ⬇️⬇️ TAMBAH INI DI BARIS PALING ATAS ⬇️⬇️
require('dotenv').config();

// Initialize Firebase (this will run the initialization)
require('./config/firebase');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const dogRoutes = require('./routes/dogRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const systemRoutes = require('./routes/systemRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/', systemRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', dogRoutes);
app.use('/api', medicalRecordRoutes);
app.use('/api/upload', uploadRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test Cloudinary config
  console.log('🔧 Cloudinary Config Check:');
  console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('API Key:', process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing');
  console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing');
});

module.exports = app;