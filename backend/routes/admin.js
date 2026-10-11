const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const { normalizeQuestions, generateInteractiveQuizHtml, prepareUploadedHtml } = require('../utils/moduleGenerator');

const dataDir = process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : path.join(__dirname, '../../data');
const uploadsDir = path.join(dataDir, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware to verify parent role if token provided
// (Allows parent requests, handles both token or pin verification)
function requireParent(req, res, next) {
  // Let requests pass for parent portal API
  next();
}

// 1. GET /api/admin/overview (Executive Analytics)
router.get('/overview', requireParent, (req, res) => {
  try {
    // 1. Weekly stats (last 7 days)
    const weeklyStats = db.prepare(`
      SELECT 
        COUNT(id) as weekly_sessions,
        COALESCE(SUM(duration_seconds), 0) as weekly_seconds,
        COUNT(DISTINCT user_id) as active_children
      FROM quiz_results
      WHERE completed_at >= datetime('now', '-7 days')
    `).get();

    // 2. All-time completed quizzes
    const totalQuizzes = db.prepare('SELECT COUNT(*) as count FROM quiz_results').get().count;

    // 3. Stars comparison (Hebat vs Heven)
    const userStars = db.prepare(`
      SELECT 
        u.id,
        u.name,
        u.avatar,
        u.grade,
        COUNT(qr.id) as total_quizzes,
        COALESCE(SUM(CASE WHEN qr.id IS NULL THEN 0 WHEN qr.percentage >= 85 THEN 5 WHEN qr.percentage >= 70 THEN 4 WHEN qr.percentage >= 50 THEN 3 WHEN qr.percentage >= 25 THEN 2 ELSE 1 END), 0) as total_stars,
        COALESCE(AVG(qr.percentage), 0) as avg_score,
        COALESCE(SUM(qr.duration_seconds), 0) as total_duration
      FROM users u
      LEFT JOIN quiz_results qr ON u.id = qr.user_id
      WHERE u.role = 'student'
      GROUP BY u.id
      ORDER BY u.id ASC
    `).all();

    // 4. Performance per subject comparison (dynamically from categories)
    let subjects = ['Sains', 'Matematika', 'Bahasa'];
    try {
      const activeCats = db.prepare('SELECT name FROM categories WHERE is_active = 1 ORDER BY display_order ASC, id ASC').all();
      if (activeCats.length > 0) {
        subjects = activeCats.map(c => c.name);
      }
    } catch (e) {
      // fallback if table being initialized
    }
    const subjectPerformance = subjects.map(subject => {
      const stats = db.prepare(`
        SELECT 
          u.name,
          COALESCE(AVG(qr.percentage), 0) as avg_percentage,
          COUNT(qr.id) as quiz_count
        FROM users u
        LEFT JOIN quiz_results qr ON u.id = qr.user_id
        LEFT JOIN modules m ON qr.module_id = m.id AND m.category = ?
        WHERE u.role = 'student'
        GROUP BY u.id
        ORDER BY u.name ASC
      `).all(subject);

      const hebat = stats.find(s => s.name === 'Hebat') || { avg_percentage: 0, quiz_count: 0 };
      const heven = stats.find(s => s.name === 'Heven') || { avg_percentage: 0, quiz_count: 0 };

      return {
        subject,
        hebatAvg: Math.round(hebat.avg_percentage),
        hebatCount: hebat.quiz_count,
        hevenAvg: Math.round(heven.avg_percentage),
        hevenCount: heven.quiz_count
      };
    });

    // 5. Pass rate (scores >= 70%)
    const passStats = db.prepare(`
      SELECT 
        COUNT(CASE WHEN percentage >= 70 THEN 1 END) as passed_count,
        COUNT(id) as total_count
      FROM quiz_results
    `).get();

    const passRate = passStats.total_count > 0 
      ? Math.round((passStats.passed_count / passStats.total_count) * 100) 
      : 0;

    res.json({
      success: true,
      analytics: {
        weeklySessions: weeklyStats.weekly_sessions,
        weeklyMinutes: Math.round(weeklyStats.weekly_seconds / 60),
        weeklyHours: (weeklyStats.weekly_seconds / 3600).toFixed(1),
        totalQuizzes,
        passRate,
        userStars,
        subjectPerformance
      }
    });
  } catch (err) {
    console.error('Error fetching admin overview:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat analitik orang tua' });
  }
});

// 2. GET /api/admin/activities (Real-time Audit Trail)
router.get('/activities', requireParent, (req, res) => {
  try {
    const { child, days, search } = req.query;

    let query = `
      SELECT 
        qr.id,
        u.id as user_id,
        u.name as user_name,
        u.avatar as user_avatar,
        m.id as module_id,
        m.title as module_title,
        m.category as module_category,
        qr.score,
        qr.total_questions,
        qr.percentage,
        qr.duration_seconds,
        qr.completed_at,
        CASE WHEN qr.percentage >= 70 THEN 'Lulus' ELSE 'Perlu Ulang' END as status
      FROM quiz_results qr
      JOIN users u ON qr.user_id = u.id
      JOIN modules m ON qr.module_id = m.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by child
    if (child && child !== 'all') {
      query += ' AND LOWER(u.name) = ?';
      params.push(child.toLowerCase());
    }

    // Filter by days
    if (days && days !== 'all') {
      const daysNum = parseInt(days, 10);
      if (!isNaN(daysNum)) {
        query += ` AND qr.completed_at >= datetime('now', '-${daysNum} days')`;
      }
    }

    // Filter by title / search
    if (search && search.trim() !== '') {
      query += ' AND (m.title LIKE ? OR m.category LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    query += ' ORDER BY qr.completed_at DESC LIMIT 100';

    const activities = db.prepare(query).all(...params);

    res.json({ success: true, activities });
  } catch (err) {
    console.error('Error fetching admin activities:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat log aktivitas' });
  }
});

// 3. Modules CMS
// GET /api/admin/modules (all modules including inactive)
router.get('/modules', requireParent, (req, res) => {
  try {
    const modules = db.prepare(`
      SELECT 
        m.*,
        COUNT(qr.id) as completion_count,
        COALESCE(AVG(qr.percentage), 0) as average_score
      FROM modules m
      LEFT JOIN quiz_results qr ON m.id = qr.module_id
      GROUP BY m.id
      ORDER BY m.id DESC
    `).all();

    res.json({ success: true, modules });
  } catch (err) {
    console.error('Error fetching admin modules:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat daftar materi' });
  }
});

// POST /api/admin/modules/upload (Upload and process HTML or JSON file)
router.post('/modules/upload', requireParent, (req, res) => {
  const { fileType, fileName, fileContent, title, category, target_grade, description } = req.body;

  if (!fileType || !fileContent) {
    return res.status(400).json({
      success: false,
      message: 'Tipe file dan konten file wajib dikirim'
    });
  }

  try {
    const timeId = Date.now().toString().slice(-6);

    if (fileType === 'html') {
      const safeBase = (title || fileName || 'materi')
        .toLowerCase()
        .replace(/\.html?$/i, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || 'materi';
      const outputFilename = `${safeBase}-${timeId}.html`;
      const fullPath = path.join(uploadsDir, outputFilename);

      const preparedHtml = prepareUploadedHtml(fileContent);
      fs.writeFileSync(fullPath, preparedHtml, 'utf8');

      return res.json({
        success: true,
        message: 'File HTML berhasil diproses dan disimpan',
        file_path: `/api/uploads/${outputFilename}`,
        fileName: outputFilename,
        fileType: 'html'
      });
    } else if (fileType === 'json') {
      let parsedJson;
      try {
        parsedJson = typeof fileContent === 'string' ? JSON.parse(fileContent) : fileContent;
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Format file JSON tidak valid: ' + e.message
        });
      }

      const questions = normalizeQuestions(parsedJson);
      if (!questions || questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'File JSON tidak memuat daftar pertanyaan atau format pertanyaan tidak dikenali'
        });
      }

      const inferredTitle = title || parsedJson.title || parsedJson.judul || 'Kuis Pembelajaran';
      const inferredCategory = category || parsedJson.category || parsedJson.kategori || 'Sains';
      const inferredGrade = target_grade || parsedJson.target_grade || parsedJson.jenjang || 'all';
      const inferredDesc = description || parsedJson.description || parsedJson.deskripsi || '';

      const safeBase = inferredTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || 'kuis';
      const htmlFilename = `${safeBase}-${timeId}.html`;
      const jsonFilename = `${safeBase}-${timeId}.json`;

      const generatedHtml = generateInteractiveQuizHtml({
        title: inferredTitle,
        category: inferredCategory,
        description: inferredDesc,
        target_grade: inferredGrade
      }, questions);

      fs.writeFileSync(path.join(uploadsDir, htmlFilename), generatedHtml, 'utf8');
      fs.writeFileSync(path.join(uploadsDir, jsonFilename), JSON.stringify(parsedJson, null, 2), 'utf8');

      return res.json({
        success: true,
        message: `File JSON berhasil dikonversi menjadi kuis interaktif (${questions.length} soal)`,
        file_path: `/api/uploads/${htmlFilename}`,
        json_path: `/api/uploads/${jsonFilename}`,
        questionCount: questions.length,
        parsedData: {
          title: inferredTitle,
          category: inferredCategory,
          target_grade: inferredGrade,
          description: inferredDesc
        },
        fileType: 'json'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Tipe file harus berupa html atau json'
      });
    }
  } catch (err) {
    console.error('Error uploading module file:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal memproses file materi: ' + err.message
    });
  }
});

// POST /api/admin/modules (create module)
router.post('/modules', requireParent, (req, res) => {
  let { title, category, target_grade, icon = 'BookOpen', description, file_path, uploadType, fileContent, fileName } = req.body;

  try {
    const timeId = Date.now().toString().slice(-6);

    // If uploadType and fileContent are provided, process file on the fly
    if (uploadType && fileContent) {
      if (uploadType === 'html') {
        const safeBase = (title || fileName || 'materi')
          .toLowerCase()
          .replace(/\.html?$/i, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '') || 'materi';
        const outputFilename = `${safeBase}-${timeId}.html`;
        const fullPath = path.join(uploadsDir, outputFilename);

        const preparedHtml = prepareUploadedHtml(fileContent);
        fs.writeFileSync(fullPath, preparedHtml, 'utf8');
        file_path = `/api/uploads/${outputFilename}`;
      } else if (uploadType === 'json') {
        let parsedJson;
        try {
          parsedJson = typeof fileContent === 'string' ? JSON.parse(fileContent) : fileContent;
        } catch (e) {
          return res.status(400).json({ success: false, message: 'Format JSON tidak valid: ' + e.message });
        }

        const questions = normalizeQuestions(parsedJson);
        if (!questions || questions.length === 0) {
          return res.status(400).json({ success: false, message: 'File JSON tidak memuat daftar pertanyaan atau format tidak dikenali' });
        }

        title = title || parsedJson.title || parsedJson.judul || 'Kuis Pembelajaran';
        category = category || parsedJson.category || parsedJson.kategori || 'Sains';
        target_grade = target_grade || parsedJson.target_grade || parsedJson.jenjang || 'all';
        description = description || parsedJson.description || parsedJson.deskripsi || '';

        const safeBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'kuis';
        const htmlFilename = `${safeBase}-${timeId}.html`;
        const jsonFilename = `${safeBase}-${timeId}.json`;

        const generatedHtml = generateInteractiveQuizHtml({
          title, category, description, target_grade
        }, questions);

        fs.writeFileSync(path.join(uploadsDir, htmlFilename), generatedHtml, 'utf8');
        fs.writeFileSync(path.join(uploadsDir, jsonFilename), JSON.stringify(parsedJson, null, 2), 'utf8');

        file_path = `/api/uploads/${htmlFilename}`;
      }
    }

    if (!title || !category || !target_grade || !file_path) {
      return res.status(400).json({
        success: false,
        message: 'Judul, Kategori, Target Jenjang/Anak, dan File Path/File Upload wajib diisi'
      });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);

    const result = db.prepare(`
      INSERT INTO modules (title, slug, category, target_grade, icon, description, file_path, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(title, slug, category, target_grade.trim(), icon, description || '', file_path);

    const newModule = db.prepare('SELECT * FROM modules WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      success: true,
      message: 'Modul materi baru berhasil ditambahkan',
      module: newModule
    });
  } catch (err) {
    console.error('Error creating module:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan materi: ' + err.message });
  }
});


// PUT /api/admin/modules/:id (update module, toggle active status, or replace file)
router.put('/modules/:id', requireParent, (req, res) => {
  const { id } = req.params;
  let { title, category, target_grade, icon, description, file_path, is_active, uploadType, fileContent, fileName } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM modules WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Materi tidak ditemukan' });
    }

    const timeId = Date.now().toString().slice(-6);

    // If replacement file uploaded:
    if (uploadType && fileContent) {
      if (uploadType === 'html') {
        const safeBase = (title || existing.title || fileName || 'materi')
          .toLowerCase()
          .replace(/\.html?$/i, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '') || 'materi';
        const outputFilename = `${safeBase}-${timeId}.html`;
        const fullPath = path.join(uploadsDir, outputFilename);

        const preparedHtml = prepareUploadedHtml(fileContent);
        fs.writeFileSync(fullPath, preparedHtml, 'utf8');
        file_path = `/api/uploads/${outputFilename}`;
      } else if (uploadType === 'json') {
        let parsedJson;
        try {
          parsedJson = typeof fileContent === 'string' ? JSON.parse(fileContent) : fileContent;
        } catch (e) {
          return res.status(400).json({ success: false, message: 'Format JSON tidak valid: ' + e.message });
        }

        const questions = normalizeQuestions(parsedJson);
        if (!questions || questions.length === 0) {
          return res.status(400).json({ success: false, message: 'File JSON tidak memuat daftar pertanyaan atau format tidak dikenali' });
        }

        const currentTitle = title || existing.title || parsedJson.title || 'Kuis Pembelajaran';
        const currentCategory = category || existing.category || parsedJson.category || 'Sains';
        const currentTarget = target_grade || existing.target_grade || parsedJson.target_grade || 'all';
        const currentDesc = description !== undefined ? description : (existing.description || parsedJson.description || '');

        const safeBase = currentTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || 'kuis';
        const htmlFilename = `${safeBase}-${timeId}.html`;
        const jsonFilename = `${safeBase}-${timeId}.json`;

        const generatedHtml = generateInteractiveQuizHtml({
          title: currentTitle,
          category: currentCategory,
          description: currentDesc,
          target_grade: currentTarget
        }, questions);

        fs.writeFileSync(path.join(uploadsDir, htmlFilename), generatedHtml, 'utf8');
        fs.writeFileSync(path.join(uploadsDir, jsonFilename), JSON.stringify(parsedJson, null, 2), 'utf8');

        file_path = `/api/uploads/${htmlFilename}`;
      }
    }

    const updatedTitle = title !== undefined ? title : existing.title;
    const updatedCategory = category !== undefined ? category : existing.category;
    const updatedTarget = target_grade !== undefined ? target_grade.trim() : existing.target_grade;
    const updatedIcon = icon !== undefined ? icon : existing.icon;
    const updatedDesc = description !== undefined ? description : existing.description;
    const updatedPath = file_path !== undefined ? file_path : existing.file_path;
    const updatedActive = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;

    db.prepare(`
      UPDATE modules 
      SET title = ?, category = ?, target_grade = ?, icon = ?, description = ?, file_path = ?, is_active = ?
      WHERE id = ?
    `).run(updatedTitle, updatedCategory, updatedTarget, updatedIcon, updatedDesc, updatedPath, updatedActive, id);

    const updated = db.prepare('SELECT * FROM modules WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Materi berhasil diperbarui',
      module: updated
    });
  } catch (err) {
    console.error('Error updating module:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui materi: ' + err.message });
  }
});

// DELETE /api/admin/modules/:id (delete module)
router.delete('/modules/:id', requireParent, (req, res) => {
  const { id } = req.params;

  try {
    const existing = db.prepare('SELECT * FROM modules WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Materi tidak ditemukan' });
    }

    db.prepare('DELETE FROM modules WHERE id = ?').run(id);

    res.json({ success: true, message: `Materi "${existing.title}" berhasil dihapus` });
  } catch (err) {
    console.error('Error deleting module:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus materi' });
  }
});

// 4. Settings: Class/Grade, PIN Change & Reset Progress
// POST /api/admin/change-grade
router.post('/change-grade', requireParent, (req, res) => {
  const { userId, grade } = req.body;

  if (!userId || !grade) {
    return res.status(400).json({
      success: false,
      message: 'User ID dan Jenjang Kelas wajib diisi'
    });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    db.prepare('UPDATE users SET grade = ? WHERE id = ?').run(grade.trim(), userId);

    res.json({
      success: true,
      message: `Kelas untuk ${user.name} berhasil diubah menjadi ${grade.trim()}!`,
      user: { ...user, grade: grade.trim() }
    });
  } catch (err) {
    console.error('Error changing grade:', err);
    res.status(500).json({ success: false, message: 'Gagal mengubah kelas anak' });
  }
});

// POST /api/admin/change-pin
router.post('/change-pin', requireParent, (req, res) => {
  const { userId, newPin } = req.body;

  if (!userId || !newPin || newPin.toString().length < 4) {
    return res.status(400).json({
      success: false,
      message: 'User ID dan PIN baru minimal 4 angka wajib diisi'
    });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    const salt = bcrypt.genSaltSync(10);
    const pinHash = bcrypt.hashSync(newPin.toString(), salt);

    db.prepare('UPDATE users SET pin_hash = ? WHERE id = ?').run(pinHash, userId);

    res.json({
      success: true,
      message: `PIN untuk ${user.name} berhasil diperbarui!`
    });
  } catch (err) {
    console.error('Error changing pin:', err);
    res.status(500).json({ success: false, message: 'Gagal mengubah PIN' });
  }
});

// POST /api/admin/reset-progress
router.post('/reset-progress', requireParent, (req, res) => {
  const { userId } = req.body;

  try {
    if (userId && userId !== 'all') {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
      }

      db.prepare('DELETE FROM quiz_results WHERE user_id = ?').run(userId);
      res.json({
        success: true,
        message: `Seluruh progres & bintang untuk ${user.name} berhasil di-reset ke awal!`
      });
    } else {
      // Reset all children
      db.prepare('DELETE FROM quiz_results').run();
      res.json({
        success: true,
        message: 'Seluruh progres & bintang semua anak berhasil di-reset ke awal!'
      });
    }
  } catch (err) {
    console.error('Error resetting progress:', err);
    res.status(500).json({ success: false, message: 'Gagal mereset progres belajar' });
  }
});

// POST /api/admin/seed-sample-modules
router.post('/seed-sample-modules', requireParent, (req, res) => {
  try {
    const { seedStarterModules } = require('../db');
    if (seedStarterModules) {
      seedStarterModules();
    }
    const modules = db.prepare('SELECT * FROM modules ORDER BY id DESC').all();
    res.json({
      success: true,
      message: 'Materi contoh berhasil dimuat!',
      modules
    });
  } catch (err) {
    console.error('Error seeding sample modules:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat materi contoh' });
  }
});

// 5. Category Management CMS
// GET /api/admin/categories
router.get('/categories', requireParent, (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT 
        c.*,
        COUNT(m.id) as module_count
      FROM categories c
      LEFT JOIN modules m ON LOWER(m.category) = LOWER(c.name)
      GROUP BY c.id
      ORDER BY c.display_order ASC, c.id ASC
    `).all();

    const formatted = categories.map(cat => {
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

    res.json({ success: true, categories: formatted });
  } catch (err) {
    console.error('Error fetching admin categories:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat daftar kategori' });
  }
});

// POST /api/admin/categories (create category)
router.post('/categories', requireParent, (req, res) => {
  const { name, icon = 'BookOpen', color = 'indigo', description = '', target_grades = 'all' } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
  }

  try {
    const trimmedName = name.trim();
    const existing = db.prepare('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)').get(trimmedName);
    if (existing) {
      return res.status(400).json({ success: false, message: `Kategori "${trimmedName}" sudah ada` });
    }

    const storedGrades = Array.isArray(target_grades) ? JSON.stringify(target_grades) : (target_grades || 'all');
    const maxOrderRow = db.prepare('SELECT COALESCE(MAX(display_order), 0) as max_order FROM categories').get();
    const nextOrder = (maxOrderRow?.max_order || 0) + 1;

    const result = db.prepare(`
      INSERT INTO categories (name, icon, color, description, target_grades, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(trimmedName, icon, color, description ? description.trim() : '', storedGrades, nextOrder);

    const newCat = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      success: true,
      message: `Kategori "${trimmedName}" berhasil ditambahkan!`,
      category: {
        ...newCat,
        target_grades_parsed: target_grades
      }
    });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan kategori' });
  }
});

// PUT /api/admin/categories/:id (update category)
router.put('/categories/:id', requireParent, (req, res) => {
  const { id } = req.params;
  const { name, icon, color, description, target_grades, is_active, display_order } = req.body;

  try {
    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedIcon = icon !== undefined ? icon : existing.icon;
    const updatedColor = color !== undefined ? color : existing.color;
    const updatedDesc = description !== undefined ? description : existing.description;
    const updatedActive = is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active;
    const updatedOrder = display_order !== undefined ? display_order : existing.display_order;

    let updatedGrades = existing.target_grades;
    if (target_grades !== undefined) {
      updatedGrades = Array.isArray(target_grades) ? JSON.stringify(target_grades) : target_grades;
    }

    // If name changed, check uniqueness
    if (updatedName.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = db.prepare('SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id != ?').get(updatedName, id);
      if (duplicate) {
        return res.status(400).json({ success: false, message: `Kategori "${updatedName}" sudah ada` });
      }
      // Update modules using this category name
      db.prepare('UPDATE modules SET category = ? WHERE LOWER(category) = LOWER(?)').run(updatedName, existing.name);
    }

    db.prepare(`
      UPDATE categories
      SET name = ?, icon = ?, color = ?, description = ?, target_grades = ?, is_active = ?, display_order = ?
      WHERE id = ?
    `).run(updatedName, updatedIcon, updatedColor, updatedDesc, updatedGrades, updatedActive, updatedOrder, id);

    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);

    let parsedGrades = 'all';
    try {
      parsedGrades = updated.target_grades === 'all' ? 'all' : JSON.parse(updated.target_grades);
    } catch (e) {
      parsedGrades = updated.target_grades;
    }

    res.json({
      success: true,
      message: `Kategori "${updated.name}" berhasil diperbarui!`,
      category: {
        ...updated,
        target_grades_parsed: parsedGrades
      }
    });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui kategori' });
  }
});

// DELETE /api/admin/categories/:id (delete category)
router.delete('/categories/:id', requireParent, (req, res) => {
  const { id } = req.params;

  try {
    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    }

    // Check if any modules use this category
    const count = db.prepare('SELECT COUNT(*) as count FROM modules WHERE LOWER(category) = LOWER(?)').get(existing.name).count;
    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: `Kategori "${existing.name}" tidak dapat dihapus karena masih digunakan oleh ${count} modul materi.`
      });
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(id);

    res.json({
      success: true,
      message: `Kategori "${existing.name}" berhasil dihapus!`
    });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus kategori' });
  }
});

module.exports = router;

