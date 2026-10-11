require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Ensure db initializes on startup
const db = require('./db');

const authRoutes = require('./routes/auth');
const modulesRoutes = require('./routes/modules');
const categoriesRoutes = require('./routes/categories');
const quizRoutes = require('./routes/quiz');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Anti-cache headers for API routes (prevents Cloudflare & browser from serving stale DB data)
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Static directory for uploaded learning modules (.html / .json)
const dataDir = process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : path.join(__dirname, '../data');
const uploadsDir = path.join(dataDir, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/api/uploads', express.static(uploadsDir));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Hebat & Heven EduTech API',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/admin', adminRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan internal pada server' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 EduTech Backend running on http://0.0.0.0:${PORT}`);
});

// Graceful Shutdown to ensure SQLite flushes WAL to disk cleanly before exit
function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  server.close(() => {
    console.log('HTTP server closed.');
    try {
      if (db) {
        console.log('Checkpointing SQLite WAL...');
        db.pragma('wal_checkpoint(TRUNCATE)');
        db.close();
        console.log('✅ SQLite database closed cleanly.');
      }
    } catch (err) {
      console.error('Error closing SQLite database:', err);
    }
    process.exit(0);
  });

  // Force exit if shutdown takes too long (5s timeout)
  setTimeout(() => {
    console.error('⚠️ Force shutdown timed out. Exiting now.');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

