const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper to calculate stars based on percentage (Range 0-100: 0 = 1 star, 100 = 5 stars)
function calculateStars(percentage) {
  const p = Math.max(0, Math.min(100, Number(percentage) || 0));
  if (p >= 85) return 5;
  if (p >= 70) return 4;
  if (p >= 50) return 3;
  if (p >= 25) return 2;
  return 1;
}


// POST /api/quiz/submit (record quiz completion from iframe runner)
router.post('/submit', (req, res) => {
  const { userId, moduleId, score, totalQuestions, durationSeconds = 60 } = req.body;

  if (userId == null || moduleId == null || score == null || totalQuestions == null) {
    return res.status(400).json({
      success: false,
      message: 'Data kuis tidak lengkap (userId, moduleId, score, totalQuestions wajib)'
    });
  }

  try {
    const totalQ = Number(totalQuestions) > 0 ? Number(totalQuestions) : 100;
    const scoreNum = Math.max(0, Math.min(Number(score), totalQ));
    const percentage = Math.round((scoreNum / totalQ) * 100);
    const duration = Math.max(1, Number(durationSeconds) || 60);

    const insertResult = db.prepare(`
      INSERT INTO quiz_results (user_id, module_id, score, total_questions, percentage, duration_seconds)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, moduleId, scoreNum, totalQ, percentage, duration);

    const starsEarned = calculateStars(percentage);

    // Fetch updated total stats for the user (highest stars per unique module)
    const stats = db.getUserQuizStats(userId);

    const moduleInfo = db.prepare('SELECT title, category FROM modules WHERE id = ?').get(moduleId);

    res.json({
      success: true,
      resultId: insertResult.lastInsertRowid,
      score: scoreNum,
      totalQuestions: totalQ,
      percentage,
      starsEarned,
      totalStars: stats.totalStars,
      totalQuizzes: stats.totalQuizzes,
      moduleTitle: moduleInfo ? moduleInfo.title : 'Materi',
      category: moduleInfo ? moduleInfo.category : 'Umum',
      passed: percentage >= 70,
      message: percentage >= 70 ? 'Hebat! Kamu Lulus Kuis!' : 'Terus Semangat! Coba Lagi Ya!'
    });
  } catch (err) {
    console.error('Error submitting quiz result:', err);
    res.status(500).json({ success: false, message: 'Gagal menyimpan hasil kuis' });
  }
});

// GET /api/quiz/user-stats/:userId
router.get('/user-stats/:userId', (req, res) => {
  const { userId } = req.params;

  try {
    const user = db.prepare('SELECT id, name, role, avatar FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    const stats = db.getUserQuizStats(userId);

    const history = db.prepare(`
      SELECT 
        qr.id,
        qr.score,
        qr.total_questions,
        qr.percentage,
        qr.duration_seconds,
        qr.completed_at,
        m.title as module_title,
        m.category
      FROM quiz_results qr
      JOIN modules m ON qr.module_id = m.id
      WHERE qr.user_id = ?
      ORDER BY qr.completed_at DESC
      LIMIT 10
    `).all(userId);

    res.json({
      success: true,
      stats: {
        totalQuizzes: stats.totalQuizzes,
        totalStars: stats.totalStars,
        averageScore: stats.averageScore,
        totalMinutes: Math.round(stats.totalDurationSeconds / 60)
      },
      history
    });
  } catch (err) {
    console.error('Error fetching user stats:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat statistik pengguna' });
  }
});

module.exports = router;
