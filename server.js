const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Initialize Firebase (this will run the initialization)
require('./config/firebase');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const dogRoutes = require('./routes/dogRoutes');
const systemRoutes = require('./routes/systemRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/', systemRoutes);
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', dogRoutes);

// Handle Vercel deployment
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Export for Vercel
module.exports = app;
