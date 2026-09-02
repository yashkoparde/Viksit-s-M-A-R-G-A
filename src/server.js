const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const { initDataset } = require('./utils/datasetLoader');
const { initDatabase } = require('./utils/database');

// Connect to MongoDB & Initialize Persistent Disk Database
connectDB();
initDataset().then(data => {
  initDatabase(data);
  console.log('[Database Engine]: Project database fully configured and persistent.');
}).catch(err => console.error('[Dataset Error]:', err.message));

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static Folders
const portalDist = path.join(__dirname, '../dist');

// Primary Application: MARGA-Y Statutory Platform (Auth -> Landing -> Dashboards)
app.use(express.static(portalDist));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/sequence', express.static(path.join(__dirname, '../sequence')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// Sequence Manifest API
app.get('/api/sequence-manifest', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/sequence_manifest.json'));
});

// API Routes
app.use('/api/works', require('./routes/works'));
app.use('/api/mps', require('./routes/mps'));
app.use('/api/states', require('./routes/states'));
app.use('/api/da-reviews', require('./routes/daReviews'));
app.use('/api/inspections', require('./routes/inspections'));
app.use('/api/photos', require('./routes/photos'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/ai', require('./routes/ai'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'online',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    cluster: 'Cluster0',
    dbName: mongoose.connection.name || process.env.MONGODB_DB || 'mplads_db',
    timestamp: new Date().toISOString(),
    platform: 'MPLADS Monitoring & Analytics System'
  });
});

// Database Connection & Cluster Status endpoint for Frontend
app.get('/api/db-status', async (req, res) => {
  const mongoose = require('mongoose');
  const isConnected = mongoose.connection.readyState === 1;
  const dbName = mongoose.connection.name || process.env.MONGODB_DB || 'mplads_db';
  const host = isConnected && mongoose.connection.host ? mongoose.connection.host : 'disconnected';

  let counts = {
    works: 0,
    mps: 0,
    da_reviews: 0,
    ia_inspections: 0,
    geotagged_photos: 0,
    reports: 0,
    expenditures: 0
  };

  if (isConnected && mongoose.connection.db) {
    try {
      const collections = ['works', 'mps', 'da_reviews', 'ia_inspections', 'geotagged_photos', 'reports', 'expenditures'];
      await Promise.all(
        collections.map(async (c) => {
          try {
            counts[c] = await mongoose.connection.db.collection(c).countDocuments();
          } catch (e) {
            counts[c] = 0;
          }
        })
      );
    } catch (err) {
      console.warn('[DB Status Warning]:', err.message);
    }
  }

  res.json({
    status: isConnected ? 'connected' : 'offline',
    connected: isConnected,
    cluster: 'Cluster0 (cluster0.getm1pv.mongodb.net)',
    host,
    database: dbName,
    counts,
    timestamp: new Date().toISOString()
  });
});


// Primary SPA Fallback to marga-y React application
app.get('*', (req, res) => {
  res.sendFile(path.join(portalDist, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const os = require('os');
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Detect local IPv4 network address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();

app.listen(PORT, HOST, () => {
  console.log(`\n=============================================================`);
  console.log(` MARGA — MPLADS Monitoring Platform (Hackathon Server)`);
  console.log(`=============================================================`);
  console.log(` > Local:            http://localhost:${PORT}`);
  console.log(` > Hackathon Wi-Fi:  http://${localIP}:${PORT}`);
  console.log(` > Public Tunnel:    Run "npm run tunnel" for public HTTPS URL`);
  console.log(` > Health Check:     http://localhost:${PORT}/api/health`);
  console.log(`=============================================================\n`);
});

module.exports = app;
