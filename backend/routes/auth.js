const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'belajar_super_secret_key_2026';

// GET /api/auth/users (public profile list for user selection)
router.get('/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, role, avatar, grade FROM users ORDER BY id ASC').all();
    
    // Also attach star count for each student profile
    const usersWithStats = users.map(user => {
      if (user.role === 'student') {
        const stats = db.prepare(`
          SELECT 
            COUNT(id) as total_quizzes,
            COALESCE(SUM(CASE WHEN percentage >= 85 THEN 5 WHEN percentage >= 70 THEN 4 WHEN percentage >= 50 THEN 3 WHEN percentage >= 25 THEN 2 ELSE 1 END), 0) as total_stars
          FROM quiz_results
          WHERE user_id = ?
        `).get(user.id);
        return { ...user, totalStars: stats.total_stars, totalQuizzes: stats.total_quizzes };
      }
      return user;
    });

    res.json({ success: true, users: usersWithStats });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat profil pengguna' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { userId, pin } = req.body;

  if (!userId || !pin) {
    return res.status(400).json({ success: false, message: 'User ID dan PIN wajib diisi' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Profil tidak ditemukan' });
    }

    const isMatch = bcrypt.compareSync(pin.toString(), user.pin_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'PIN salah, coba lagi ya!' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role, grade: user.grade },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Calculate stars if student
    let totalStars = 0;
    if (user.role === 'student') {
      const stats = db.prepare(`
        SELECT COALESCE(SUM(CASE WHEN percentage >= 85 THEN 5 WHEN percentage >= 70 THEN 4 WHEN percentage >= 50 THEN 3 WHEN percentage >= 25 THEN 2 ELSE 1 END), 0) as total_stars
        FROM quiz_results
        WHERE user_id = ?
      `).get(user.id);
      totalStars = stats.total_stars;
    }

    res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        grade: user.grade,
        totalStars
      }
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat login' });
  }
});

// GET /api/auth/me (validate token)
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token tidak valid' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, name, role, avatar, grade FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    let totalStars = 0;
    if (user.role === 'student') {
      const stats = db.prepare(`
        SELECT COALESCE(SUM(CASE WHEN percentage >= 85 THEN 5 WHEN percentage >= 70 THEN 4 WHEN percentage >= 50 THEN 3 WHEN percentage >= 25 THEN 2 ELSE 1 END), 0) as total_stars
        FROM quiz_results
        WHERE user_id = ?
      `).get(user.id);
      totalStars = stats.total_stars;
    }

    res.json({ success: true, user: { ...user, totalStars } });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Sesi berakhir, silakan masuk kembali' });
  }
});

module.exports = router;
