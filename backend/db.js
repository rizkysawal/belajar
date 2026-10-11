const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/belajar.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode, foreign keys, & normal sync for reliability
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  // 1. Create Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'parent')),
      avatar TEXT,
      grade TEXT DEFAULT 'SD Kelas 1',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: ensure grade column exists in users
  try {
    const userCols = db.prepare('PRAGMA table_info(users)').all().map(c => c.name);
    if (!userCols.includes('grade')) {
      db.exec("ALTER TABLE users ADD COLUMN grade TEXT DEFAULT 'SD Kelas 1'");
    }
  } catch (err) {
    console.warn('Grade column check:', err.message);
  }

  // 2. Create Modules Table (with flexible target_grade supporting TK, SD 1-6, SMP 1-3, SMA 1-3, all, etc.)
  db.exec(`
    CREATE TABLE IF NOT EXISTS modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE,
      category TEXT NOT NULL,
      target_grade TEXT NOT NULL DEFAULT 'all',
      icon TEXT,
      description TEXT,
      file_path TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Create Quiz Results Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      module_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      percentage REAL NOT NULL,
      duration_seconds INTEGER DEFAULT 0,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(module_id) REFERENCES modules(id) ON DELETE CASCADE
    );
  `);

  // 4. Create Categories Table (with target_grades configuration)
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      icon TEXT DEFAULT 'BookOpen',
      color TEXT DEFAULT 'indigo',
      description TEXT,
      target_grades TEXT DEFAULT 'all',
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: ensure columns exist in categories table
  try {
    const catCols = db.prepare('PRAGMA table_info(categories)').all().map(c => c.name);
    if (!catCols.includes('target_grades')) {
      db.exec("ALTER TABLE categories ADD COLUMN target_grades TEXT DEFAULT 'all'");
    }
    if (!catCols.includes('display_order')) {
      db.exec("ALTER TABLE categories ADD COLUMN display_order INTEGER DEFAULT 0");
    }
    if (!catCols.includes('is_active')) {
      db.exec("ALTER TABLE categories ADD COLUMN is_active INTEGER DEFAULT 1");
    }
  } catch (err) {
    console.warn('Categories column check:', err.message);
  }

  seedUsersOnly();
  seedCategoriesOnly();
}

function seedCategoriesOnly() {
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  if (catCount === 0) {
    const insertCat = db.prepare(`
      INSERT INTO categories (name, icon, color, description, target_grades, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    insertCat.run('Sains', 'Rocket', 'indigo', 'Mempelajari alam, luar angkasa, eksperimen, dan dunia biologi', 'all', 1);
    insertCat.run('Matematika', 'Calculator', 'amber', 'Berhitung cepat, logika matematika, geometri, dan pemecahan masalah', 'all', 2);
    insertCat.run('Bahasa', 'Languages', 'pink', 'Tata bahasa, kosakata, membaca, dan bahasa asing', 'all', 3);
    insertCat.run('Seni & Kreativitas', 'Palette', 'purple', 'Menggambar, mewarnai, musik, dan kerajinan tangan', 'all', 4);
    insertCat.run('Teknologi & Coding', 'Code', 'emerald', 'Logika pemrograman, robotik, dan literasi digital masa depan', 'all', 5);

    console.log('✅ Default learning categories initialized');
  }
}

function seedUsersOnly() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (name, pin_hash, role, avatar, grade)
      VALUES (?, ?, ?, ?, ?)
    `);

    const salt = bcrypt.genSaltSync(10);
    // Hebat (PIN: 1111, Kelas: SD Kelas 3)
    insertUser.run('Hebat', bcrypt.hashSync('1111', salt), 'student', '🚀', 'SD Kelas 3');
    // Heven (PIN: 2222, Kelas: TK)
    insertUser.run('Heven', bcrypt.hashSync('2222', salt), 'student', '🦄', 'TK');
    // Orang Tua / Admin (PIN: 9999)
    insertUser.run('Orang Tua', bcrypt.hashSync('9999', salt), 'parent', '👑', null);

    console.log('✅ Default users initialized with grade levels (Hebat: SD Kelas 3, Heven: TK, Orang Tua: Master)');
  }
}

// Helper to seed sample modules on demand if needed
function seedStarterModules() {
  const insertModule = db.prepare(`
    INSERT INTO modules (title, slug, category, target_grade, icon, description, file_path, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);

  insertModule.run(
    'Petualangan Tata Surya',
    'petualangan-tata-surya-' + Date.now().toString().slice(-4),
    'Sains',
    'all',
    'Rocket',
    'Jelajahi keajaiban matahari, planet-planet, dan luar angkasa dengan kuis interaktif seru!',
    '/materi/contoh-sains.html'
  );

  insertModule.run(
    'Tantangan Berhitung Cepat',
    'tantangan-berhitung-cepat-' + Date.now().toString().slice(-4),
    'Matematika',
    'SD Kelas 3',
    'Calculator',
    'Latih kecepatan berhitung tambah, kurang, dan perkalian ceria untuk pahlawan matematika!',
    '/materi/contoh-matematika.html'
  );

  insertModule.run(
    'Dunia Satwa & Kosakata Inggris',
    'dunia-satwa-inggris-' + Date.now().toString().slice(-4),
    'Bahasa',
    'TK',
    'Languages',
    'Kenali nama hewan dan kosakata bahasa Inggris bersama sahabat satwa yang lucu!',
    '/materi/contoh-bahasa.html'
  );

  console.log('✅ Starter learning modules populated on demand');
}

// Initialize tables and default users
initDatabase();

module.exports = db;
module.exports.seedStarterModules = seedStarterModules;
