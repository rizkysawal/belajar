const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/modules (fetch active learning modules with grade & category filtering)
router.get('/', (req, res) => {
  try {
    const { target, grade, category, userId } = req.query;

    let query = 'SELECT * FROM modules WHERE is_active = 1';
    const params = [];

    // If specific grade provided:
    if (grade && grade !== 'all') {
      if (target) {
        query += " AND (target_grade = ? OR target_grade = 'all' OR LOWER(target_grade) = ?)";
        params.push(grade, target.toLowerCase());
      } else {
        query += " AND (target_grade = ? OR target_grade = 'all')";
        params.push(grade);
      }
    } else if (target && ['hebat', 'heven'].includes(target.toLowerCase())) {
      // Find user's assigned grade if exists
      const user = db.prepare('SELECT grade FROM users WHERE LOWER(name) = ?').get(target.toLowerCase());
      if (user && user.grade) {
        query += " AND (target_grade = ? OR target_grade = 'all' OR LOWER(target_grade) = ?)";
        params.push(user.grade, target.toLowerCase());
      } else {
        query += " AND (target_grade = ? OR target_grade = 'all')";
        params.push(target.toLowerCase());
      }
    }

    if (category && category !== 'Semua') {
      query += " AND LOWER(category) = LOWER(?)";
      params.push(category);
    }

    query += ' ORDER BY id ASC';

    const modules = db.prepare(query).all(...params);

    // If userId provided, attach user's best score and star status
    const enrichedModules = modules.map(mod => {
      let userBest = null;
      if (userId) {
        userBest = db.prepare(`
          SELECT 
            MAX(percentage) as best_percentage,
            MAX(score) as best_score,
            COUNT(id) as attempts
          FROM quiz_results 
          WHERE user_id = ? AND module_id = ?
        `).get(userId, mod.id);
      }

      const bestPercentage = userBest && userBest.best_percentage != null ? userBest.best_percentage : null;
      let stars = 0;
      if (bestPercentage != null) {
        if (bestPercentage >= 85) stars = 5;
        else if (bestPercentage >= 70) stars = 4;
        else if (bestPercentage >= 50) stars = 3;
        else if (bestPercentage >= 25) stars = 2;
        else stars = 1;
      }

      return {
        ...mod,
        bestPercentage,
        stars,
        attempts: userBest ? userBest.attempts : 0
      };
    });

    res.json({ success: true, modules: enrichedModules });
  } catch (err) {
    console.error('Error fetching modules:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat materi pembelajaran' });
  }
});

// GET /api/modules/:id
router.get('/:id', (req, res) => {
  try {
    const moduleItem = db.prepare('SELECT * FROM modules WHERE id = ?').get(req.params.id);
    if (!moduleItem) {
      return res.status(404).json({ success: false, message: 'Materi tidak ditemukan' });
    }
    res.json({ success: true, module: moduleItem });
  } catch (err) {
    console.error('Error fetching module:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat detail materi' });
  }
});

module.exports = router;
