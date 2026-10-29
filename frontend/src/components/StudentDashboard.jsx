import React, { useState, useEffect } from 'react';
import { Star, Trophy, Sparkles, LogOut, Play, BookOpen, Rocket, Calculator, Languages, Award, Flame, GraduationCap, Palette, Code, Microscope, Music, Globe, Compass, Heart, Layers } from 'lucide-react';
import { api } from '../api';

export default function StudentDashboard({ user, modules, onStartModule, onLogout }) {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedGrade, setSelectedGrade] = useState('my_grade');
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Fetch categories allowed for the current grade level
  useEffect(() => {
    const loadGradeCategories = async () => {
      setLoadingCategories(true);
      try {
        const activeGrade = selectedGrade === 'my_grade' ? user.grade : selectedGrade;
        const res = await api.getCategories(activeGrade);
        if (res.success) {
          setCategories(res.categories);
          // If selectedCategory is not among available categories for this grade, reset to Semua
          if (selectedCategory !== 'Semua') {
            const exists = res.categories.some(c => c.name.toLowerCase() === selectedCategory.toLowerCase());
            if (!exists) {
              setSelectedCategory('Semua');
            }
          }
        }
      } catch (err) {
        console.error('Failed to load categories for student:', err);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadGradeCategories();
  }, [selectedGrade, user.grade]);

  const filteredModules = modules.filter(m => {
    // 1. Grade filtering
    if (selectedGrade === 'my_grade') {
      const matchChildGrade = m.target_grade === user.grade;
      const matchAll = m.target_grade === 'all';
      const matchName = m.target_grade?.toLowerCase() === user.name?.toLowerCase();
      if (!matchChildGrade && !matchAll && !matchName) return false;
    } else if (selectedGrade === 'all') {
      // show all
    } else {
      // Specific grade (TK, SD Kelas 1, SD Kelas 2, SMP Kelas 1, etc.)
      if (m.target_grade !== selectedGrade && m.target_grade !== 'all') return false;
    }

    // 2. Category filtering
    if (selectedCategory === 'Semua') return true;
    return m.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const getModuleIcon = (iconName, category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('sains') || cat.includes('science')) {
      return <Rocket className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-400 shrink-0" />;
    }
    if (cat.includes('matematika') || cat.includes('math')) {
      return <Calculator className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400 shrink-0" />;
    }
    if (cat.includes('bahasa') || cat.includes('english') || cat.includes('mandarin')) {
      return <Languages className="w-6 h-6 sm:w-7 sm:h-7 text-pink-400 shrink-0" />;
    }
    if (cat.includes('agama')) {
      return <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400 shrink-0" />;
    }
    if (cat.includes('pancasila')) {
      return <Award className="w-6 h-6 sm:w-7 sm:h-7 text-rose-400 shrink-0" />;
    }
    return <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-sky-400 shrink-0" />;
  };

  const getCategoryColor = (category) => {
    const cat = category?.toLowerCase() || '';
    if (cat.includes('sains') || cat.includes('science')) {
      return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    }
    if (cat.includes('matematika') || cat.includes('math')) {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
    if (cat.includes('bahasa') || cat.includes('english') || cat.includes('mandarin')) {
      return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
    }
    if (cat.includes('agama')) {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
    if (cat.includes('pancasila')) {
      return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }
    return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 md:p-8 overflow-x-hidden w-full">
      {/* Top Header Bar */}
      <header className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-6 rounded-3xl glass-panel shadow-2xl mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-500/30 to-purple-500/40 border border-indigo-400/40 flex items-center justify-center text-4xl sm:text-5xl shadow-lg">
            {user.avatar || '🚀'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                <span>{user.grade || 'SD Kelas 1'}</span>
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Streak Belajar Aktif
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-fun mt-0.5">
              Halo, {user.name}! 🌟
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Ayo selesaikan tantangan belajar dan kumpulkan semua bintangmu!
            </p>
          </div>
        </div>

        {/* Stats Badges & Logout */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Star Counter */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-300 shadow-md">
            <Star className="w-6 h-6 fill-amber-400 text-amber-400 animate-bounce-subtle" />
            <div className="text-left">
              <div className="text-xs text-amber-300/80 font-medium">Total Bintang</div>
              <div className="text-xl font-black font-fun leading-none">{user.totalStars || 0} ⭐</div>
            </div>
          </div>

          {/* Switch Profile Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition-all active:scale-95 text-xs font-bold font-fun"
            title="Keluar / Ganti Profil"
          >
            <LogOut className="w-4 h-4" />
            <span>Ganti Profil</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto space-y-4">
        {/* Filter Controls (Jenjang Kelas & Topik Pembelajaran Dropdowns) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-sm font-bold text-white font-fun">Filter Materi Pembelajaran</h2>
                <p className="text-[11px] text-slate-400">Pilih jenjang kelas dan topik pembelajaran untuk menemukan materi</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700/60 flex items-center gap-1.5 font-fun">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>{filteredModules.length} Modul Tersedia</span>
              </span>
              {(selectedGrade !== 'my_grade' || selectedCategory !== 'Semua') && (
                <button
                  onClick={() => {
                    setSelectedGrade('my_grade');
                    setSelectedCategory('Semua');
                  }}
                  className="px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 transition-all font-fun active:scale-95"
                  title="Kembalikan ke materi kelasku dan semua topik"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dropdown 1: Jenjang Kelas */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-300 font-fun">
                <GraduationCap className="w-4 h-4 text-amber-400" />
                <span>Pilih Jenjang Kelas</span>
              </label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-800/90 border border-slate-700 hover:border-amber-400/50 text-white font-bold text-xs outline-none focus:border-amber-500 cursor-pointer transition-all shadow-inner font-fun"
              >
                <option value="my_grade">⭐ Materi Kelasku ({user.grade || 'Belum Diatur'})</option>
                <option value="all">🌟 Semua Jenjang Kelas</option>
                
                <optgroup label="Taman Kanak-Kanak / PAUD" className="bg-slate-900 text-slate-400 font-bold">
                  <option value="TK" className="text-white font-medium">🧸 TK (Taman Kanak-Kanak)</option>
                </optgroup>

                <optgroup label="Sekolah Dasar (SD)" className="bg-slate-900 text-slate-400 font-bold">
                  <option value="SD Kelas 1" className="text-white font-medium">🎒 SD Kelas 1</option>
                  <option value="SD Kelas 2" className="text-white font-medium">🎒 SD Kelas 2</option>
                  <option value="SD Kelas 3" className="text-white font-medium">🎒 SD Kelas 3</option>
                  <option value="SD Kelas 4" className="text-white font-medium">🎒 SD Kelas 4</option>
                  <option value="SD Kelas 5" className="text-white font-medium">🎒 SD Kelas 5</option>
                  <option value="SD Kelas 6" className="text-white font-medium">🎒 SD Kelas 6</option>
                </optgroup>

                <optgroup label="Sekolah Menengah Pertama (SMP)" className="bg-slate-900 text-slate-400 font-bold">
                  <option value="SMP Kelas 1" className="text-white font-medium">📘 SMP Kelas 1 (Kelas 7)</option>
                  <option value="SMP Kelas 2" className="text-white font-medium">📘 SMP Kelas 2 (Kelas 8)</option>
                  <option value="SMP Kelas 3" className="text-white font-medium">📘 SMP Kelas 3 (Kelas 9)</option>
                </optgroup>

                <optgroup label="Sekolah Menengah Atas (SMA)" className="bg-slate-900 text-slate-400 font-bold">
                  <option value="SMA Kelas 1" className="text-white font-medium">🎓 SMA Kelas 1 (Kelas 10)</option>
                  <option value="SMA Kelas 2" className="text-white font-medium">🎓 SMA Kelas 2 (Kelas 11)</option>
                  <option value="SMA Kelas 3" className="text-white font-medium">🎓 SMA Kelas 3 (Kelas 12)</option>
                </optgroup>
              </select>
            </div>

            {/* Dropdown 2: Topik Pembelajaran */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-300 font-fun">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Pilih Topik Pembelajaran</span>
                {loadingCategories && (
                  <span className="text-[10px] text-slate-400 animate-pulse font-normal">(Memuat...)</span>
                )}
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-800/90 border border-slate-700 hover:border-indigo-400/50 text-white font-bold text-xs outline-none focus:border-indigo-500 cursor-pointer transition-all shadow-inner font-fun"
              >
                <option value="Semua">🌟 Semua Topik ({categories.length} Topik Tersedia)</option>
                {categories.map((cat) => (
                  <option key={cat.id || cat.name} value={cat.name} className="text-white font-medium">
                    📚 {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        {filteredModules.length === 0 ? (
          <div className="text-center py-16 p-8 rounded-3xl glass-panel">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold font-fun text-slate-300">Belum Ada Materi Pembelajaran</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Materi pembelajaran belum ditambahkan. Minta Ayah atau Ibu untuk menambahkan modul materi baru melalui Portal Orang Tua ya! 🌟
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((mod) => {
              const stars = mod.stars || 0;
              const hasCompleted = mod.attempts > 0;

              return (
                <div
                  key={mod.id}
                  className="group relative flex flex-col justify-between rounded-3xl p-5 sm:p-6 glass-card glass-card-hover border border-slate-700/50 hover:border-indigo-400/40 transition-all duration-300 w-full min-w-0 overflow-hidden"
                >
                  {/* Top Tags */}
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                        <span 
                          className={`text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full border leading-tight ${getCategoryColor(mod.category)}`}
                          title={mod.category}
                        >
                          {mod.category}
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                          {mod.target_grade === 'all' ? 'Semua Jenjang' : 
                           mod.target_grade?.toLowerCase() === 'hebat' ? '🚀 Khusus Hebat' :
                           mod.target_grade?.toLowerCase() === 'heven' ? '🦄 Khusus Heven' :
                           mod.target_grade}
                        </span>
                      </div>

                      {/* Stars Earned Rating (1-5 Stars) */}
                      <div 
                        className="flex items-center gap-0.5 bg-slate-900/70 px-2 sm:px-2.5 py-1 rounded-full border border-slate-700/50 shrink-0"
                        title={`${stars} dari 5 bintang`}
                      >
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= stars
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-slate-700 text-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Icon & Title */}
                    <div className="flex items-start gap-3.5 sm:gap-4 mb-3 min-w-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                        {getModuleIcon(mod.icon, mod.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 
                          className="text-base sm:text-lg font-bold font-fun text-white group-hover:text-indigo-300 transition-colors leading-snug break-words line-clamp-3"
                          title={mod.title}
                        >
                          {mod.title}
                        </h3>
                        {hasCompleted && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mt-1">
                            <Award className="w-3.5 h-3.5 shrink-0" />
                            <span>Skor Terbaik: {mod.bestPercentage}%</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 sm:line-clamp-3 mb-5 break-words">
                      {mod.description || 'Materi pembelajaran interaktif seru untuk dieksplorasi!'}
                    </p>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-auto">
                    <span className="text-[11px] text-slate-500 truncate min-w-0">
                      {mod.attempts > 0 ? `Sudah dicoba ${mod.attempts}x` : 'Belum pernah dicoba'}
                    </span>

                    <button
                      onClick={() => onStartModule(mod)}
                      className="btn-fun inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all font-fun shrink-0 active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                      <span>{hasCompleted ? 'Main Lagi' : 'Mulai Belajar'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
