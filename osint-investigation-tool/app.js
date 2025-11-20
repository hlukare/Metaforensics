const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const SocialMediaService = require('./services/socialMediaService');


const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error('❌ MONGODB_URI is not defined in .env file');
  process.exit(1);
}

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('✅ Connected to MongoDB Atlas');
});

// Debug endpoint to check API key
app.get('/api/debug', (req, res) => {
  const apiKeyFromHeader = req.headers['x-api-key'];
  const expectedApiKey = process.env.API_KEY;
  
  res.json({
    received_key: apiKeyFromHeader || 'No API key provided',
    expected_key: expectedApiKey || 'No API key set in .env',
    match: apiKeyFromHeader === expectedApiKey,
    message: apiKeyFromHeader === expectedApiKey ? 'API keys match!' : 'API keys do not match!'
  });
});

// Debug endpoint for social media
app.get('/api/debug/social', async (req, res) => {
  const { name, location } = req.query;
  const socialService = new SocialMediaService();
  
  try {
    const results = await socialService.searchPerson(name || 'Kishan Mali', location || 'Nashik');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await socialService.close();
  }
});

// Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`💾 Reports are being saved to MongoDB Atlas`);
});