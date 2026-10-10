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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 EduTech Backend running on http://0.0.0.0:${PORT}`);
});
