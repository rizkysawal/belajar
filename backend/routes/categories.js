const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/categories (fetch active categories, optionally filtered by child grade)
router.get('/', (req, res) => {
  try {
    const { grade } = req.query;

    const categories = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order ASC, id ASC').all();

    const filtered = categories.filter(cat => {
      if (!grade || grade === 'all' || cat.target_grades === 'all') return true;
      try {
        const allowed = JSON.parse(cat.target_grades);
        if (Array.isArray(allowed)) {
          return allowed.includes(grade);
        }
      } catch (e) {
        // Fallback for comma-separated string
        return cat.target_grades.split(',').map(s => s.trim()).includes(grade);
      }
      return true;
    }).map(cat => {
      let parsedGrades = 'all';
      try {
        parsedGrades = cat.target_grades === 'all' ? 'all' : JSON.parse(cat.target_grades);
      } catch (e) {
        parsedGrades = cat.target_grades;
      }
      return {
        ...cat,
        target_grades_parsed: parsedGrades
      };
    });

    res.json({ success: true, categories: filtered });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat daftar kategori' });
  }
});

module.exports = router;
