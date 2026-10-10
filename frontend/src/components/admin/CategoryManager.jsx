import React, { useState } from 'react';
import { 
  Plus, Trash2, Edit3, BookOpen, Rocket, Calculator, Languages, Palette, 
  Code, Microscope, Music, Globe, Compass, Heart, Award, Flame, Sparkles, 
  Check, X, Layers, GraduationCap, AlertTriangle, CheckCircle 
} from 'lucide-react';

export const ALL_GRADE_OPTIONS = [
  { group: 'Taman Kanak-Kanak / PAUD', items: ['TK'] },
  { group: 'Sekolah Dasar (SD)', items: ['SD Kelas 1', 'SD Kelas 2', 'SD Kelas 3', 'SD Kelas 4', 'SD Kelas 5', 'SD Kelas 6'] },
  { group: 'Sekolah Menengah Pertama (SMP)', items: ['SMP Kelas 1', 'SMP Kelas 2', 'SMP Kelas 3'] },
  { group: 'Sekolah Menengah Atas (SMA)', items: ['SMA Kelas 1', 'SMA Kelas 2', 'SMA Kelas 3'] }
];

const AVAILABLE_ICONS = [
  { name: 'Rocket', label: 'Roket (Sains)', icon: Rocket },
  { name: 'Calculator', label: 'Kalkulator (Matematika)', icon: Calculator },
  { name: 'Languages', label: 'Bahasa', icon: Languages },
  { name: 'Palette', label: 'Seni & Warna', icon: Palette },
  { name: 'Code', label: 'Coding & Komputer', icon: Code },
  { name: 'Microscope', label: 'Mikroskop (Eksperimen)', icon: Microscope },
  { name: 'Music', label: 'Musik & Audio', icon: Music },
  { name: 'Globe', label: 'Geografi & Dunia', icon: Globe },
  { name: 'Compass', label: 'Penjelajahan', icon: Compass },
  { name: 'BookOpen', label: 'Buku & Literasi', icon: BookOpen },
  { name: 'Heart', label: 'Budi Pekerti / Karakter', icon: Heart },
  { name: 'Award', label: 'Prestasi', icon: Award },
  { name: 'Flame', label: 'Tantangan Cepat', icon: Flame }
];

const COLOR_PALETTES = [
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/30', hex: 'from-indigo-500 to-purple-600' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30', hex: 'from-amber-500 to-orange-600' },
  { id: 'pink', label: 'Pink', bg: 'bg-pink-500/20', text: 'text-pink-300', border: 'border-pink-500/30', hex: 'from-pink-500 to-rose-600' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30', hex: 'from-emerald-500 to-teal-600' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30', hex: 'from-purple-500 to-indigo-600' },
  { id: 'sky', label: 'Sky', bg: 'bg-sky-500/20', text: 'text-sky-300', border: 'border-sky-500/30', hex: 'from-sky-500 to-cyan-600' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30', hex: 'from-rose-500 to-red-600' }
];

export default function CategoryManager({ categories = [], onAddCategory, onUpdateCategory, onDeleteCategory }) {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('BookOpen');
  const [color, setColor] = useState('indigo');
  const [description, setDescription] = useState('');
  const [isAllGrades, setIsAllGrades] = useState(true);
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Open modal for Create
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setIcon('BookOpen');
    setColor('indigo');
    setDescription('');
    setIsAllGrades(true);
    setSelectedGrades([]);
    setFormError('');
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setIcon(cat.icon || 'BookOpen');
    setColor(cat.color || 'indigo');
    setDescription(cat.description || '');

    const parsed = cat.target_grades_parsed;
    if (parsed === 'all' || !parsed || parsed.length === 0) {
      setIsAllGrades(true);
      setSelectedGrades([]);
    } else {
      setIsAllGrades(false);
      setSelectedGrades(Array.isArray(parsed) ? parsed : [parsed]);
    }

    setFormError('');
    setShowModal(true);
  };

  // Toggle single grade in checklist
  const handleToggleGrade = (gradeItem) => {
    setSelectedGrades(prev => 
      prev.includes(gradeItem) 
        ? prev.filter(g => g !== gradeItem) 
        : [...prev, gradeItem]
    );
  };

  // Quick select group
  const handleSelectGroup = (items) => {
    setSelectedGrades(prev => {
      const allSelected = items.every(i => prev.includes(i));
      if (allSelected) {
        return prev.filter(g => !items.includes(g));
      } else {
        return Array.from(new Set([...prev, ...items]));
      }
    });
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Nama kategori wajib diisi');
      return;
    }

    if (!isAllGrades && selectedGrades.length === 0) {
      setFormError('Silakan pilih minimal 1 jenjang kelas, atau pilih "Bisa dilihat di Semua Jenjang"');
      return;
    }

    setSubmitting(true);
    setFormError('');

    const targetGradesPayload = isAllGrades ? 'all' : selectedGrades;

    try {
      if (editingCategory) {
        await onUpdateCategory(editingCategory.id, {
          name: name.trim(),
          icon,
          color,
          description: description.trim(),
          target_grades: targetGradesPayload
        });
      } else {
        await onAddCategory({
          name: name.trim(),
          icon,
          color,
          description: description.trim(),
          target_grades: targetGradesPayload
        });
      }
      setShowModal(false);
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan kategori');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIconComponent = (iconName) => {
    const found = AVAILABLE_ICONS.find(i => i.name === iconName);
    const IconComp = found ? found.icon : BookOpen;
    return <IconComp className="w-5 h-5" />;
  };

  const getColorStyles = (colorId) => {
    return COLOR_PALETTES.find(c => c.id === colorId) || COLOR_PALETTES[0];
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-700/60 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold font-fun text-white">
              Manajemen Kategori & Pembatasan Jenjang Kelas
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
              {categories.length} Kategori
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Atur kategori materi pembelajaran. Anda dapat menambah kategori baru, mengedit, atau membatasi kategori agar hanya dapat dilihat oleh jenjang kelas tertentu (misal: hanya untuk TK, atau khusus SMP/SMA).
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all active:scale-95 font-fun shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kategori Baru</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => {
          const colorStyle = getColorStyles(cat.color);
          const isAll = cat.target_grades === 'all' || cat.target_grades_parsed === 'all';
          const gradesList = Array.isArray(cat.target_grades_parsed) ? cat.target_grades_parsed : [];

          return (
            <div
              key={cat.id}
              className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 shadow-xl flex flex-col justify-between transition-all group"
            >
              <div>
                {/* Header Icon + Name */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl ${colorStyle.bg} border ${colorStyle.border} ${colorStyle.text} flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform`}>
                      {getCategoryIconComponent(cat.icon)}
                    </div>
                    <div>
                      <h4 className="text-base font-bold font-fun text-white group-hover:text-indigo-300 transition-colors">
                        {cat.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {cat.module_count || 0} Modul Materi
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4 min-h-[32px]">
                  {cat.description || 'Tidak ada deskripsi kategori'}
                </p>

                {/* Target Grades Tag / Badges */}
                <div className="mb-4">
                  <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Dapat Dilihat Oleh:</span>
                  </div>

                  {isAll ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>Semua Jenjang Kelas (TK - SMA)</span>
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                      {gradesList.map((g) => (
                        <span
                          key={g}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-slate-500">
                  ID: #{cat.id}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors"
                    title="Edit Kategori & Pengaturan Kelas"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Hapus kategori "${cat.name}"? Kategori tidak dapat dihapus jika masih ada materi yang menggunakannya.`)) {
                        onDeleteCategory(cat.id);
                      }
                    }}
                    className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                    title="Hapus Kategori"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl p-6 sm:p-8 bg-slate-900 border border-slate-700 shadow-2xl relative my-8">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-fun text-white">
                  {editingCategory ? `Edit Kategori: ${editingCategory.name}` : 'Tambah Kategori Pembelajaran Baru'}
                </h3>
                <p className="text-xs text-slate-400">
                  Atur nama kategori, tema visual, serta batasan kelas yang diizinkan mengaksesnya
                </p>
              </div>
            </div>

            {formError && (
              <div className="p-3 my-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 text-xs pt-3">
              {/* Nama Kategori */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nama Kategori <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sains & Alam, Coding & Robotik, Seni Musik..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium outline-none focus:border-indigo-500"
                />
              </div>

              {/* Ikon Kategori & Warna Aksen */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ikon Picker */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Pilih Ikon</label>
                  <div className="grid grid-cols-5 gap-2 p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 max-h-36 overflow-y-auto">
                    {AVAILABLE_ICONS.map((item) => {
                      const IconItem = item.icon;
                      const isSelected = icon === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setIcon(item.name)}
                          className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-md scale-110'
                              : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white'
                          }`}
                          title={item.label}
                        >
                          <IconItem className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Warna Aksen */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">Pilihan Warna Aksen</label>
                  <div className="grid grid-cols-4 gap-2 p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                    {COLOR_PALETTES.map((col) => {
                      const isSelected = color === col.id;
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setColor(col.id)}
                          className={`p-2 rounded-xl flex items-center gap-1.5 text-[11px] font-semibold transition-all ${
                            isSelected
                              ? 'bg-slate-700 border-2 border-indigo-400 text-white'
                              : 'bg-slate-800/60 hover:bg-slate-700 text-slate-400'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full ${col.bg} border ${col.border}`} />
                          <span className="capitalize">{col.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Deskripsi Singkat */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows="2"
                  placeholder="Keterangan singkat mengenai cakupan materi di kategori ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Atur Jenjang Kelas yang Bisa Melihat Kategori Ini */}
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-white flex items-center gap-1.5 text-xs">
                    <GraduationCap className="w-4 h-4 text-amber-400" />
                    <span>Pengaturan Hak Akses Jenjang Kelas</span>
                  </label>
                </div>
                <p className="text-[11px] text-slate-400">
                  Tentukan apakah kategori ini dapat dilihat oleh semua anak atau dibatasi hanya untuk jenjang kelas tertentu.
                </p>

                {/* Option 1: Semua Jenjang vs Option 2: Jenjang Tertentu */}
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-200">
                    <input
                      type="radio"
                      name="grade_mode"
                      checked={isAllGrades}
                      onChange={() => setIsAllGrades(true)}
                      className="accent-indigo-500 w-4 h-4"
                    />
                    <span>🌟 Bisa dilihat di Semua Jenjang Kelas</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-200">
                    <input
                      type="radio"
                      name="grade_mode"
                      checked={!isAllGrades}
                      onChange={() => setIsAllGrades(false)}
                      className="accent-indigo-500 w-4 h-4"
                    />
                    <span>🎯 Batasi untuk Jenjang Tertentu</span>
                  </label>
                </div>

                {/* Specific Grade Selection Matrix */}
                {!isAllGrades && (
                  <div className="pt-3 border-t border-slate-700/60 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Centang kelas yang diizinkan melihat kategori ini:</span>
                      <div className="flex items-center gap-2 font-semibold">
                        <button
                          type="button"
                          onClick={() => setSelectedGrades(ALL_GRADE_OPTIONS.flatMap(g => g.items))}
                          className="text-indigo-400 hover:text-indigo-300"
                        >
                          Pilih Semua
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setSelectedGrades([])}
                          className="text-slate-400 hover:text-slate-300"
                        >
                          Kosongkan
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                      {ALL_GRADE_OPTIONS.map((group) => {
                        const allGroupSelected = group.items.every(i => selectedGrades.includes(i));

                        return (
                          <div key={group.group} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-slate-300 text-xs">
                                {group.group}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSelectGroup(group.items)}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold"
                              >
                                {allGroupSelected ? 'Batal Pilih Grup' : 'Pilih Grup Ini'}
                              </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {group.items.map((gradeItem) => {
                                const checked = selectedGrades.includes(gradeItem);
                                return (
                                  <label
                                    key={gradeItem}
                                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                      checked
                                        ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-200'
                                        : 'bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => handleToggleGrade(gradeItem)}
                                      className="accent-indigo-500 rounded"
                                    />
                                    <span className="text-[11px] font-medium">{gradeItem}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors font-fun text-xs"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold shadow-lg shadow-indigo-500/25 transition-all active:scale-95 font-fun text-xs"
                >
                  {submitting ? 'Menyimpan...' : (editingCategory ? 'Simpan Perubahan Kategori' : 'Buat Kategori Baru')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
