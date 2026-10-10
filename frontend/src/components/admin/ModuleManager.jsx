import React, { useState, useRef } from 'react';
import { 
  Plus, Trash2, Power, Eye, BookOpen, Rocket, Calculator, Languages, 
  X, Check, ExternalLink, Upload, FileCode2, FileJson, Link as LinkIcon, 
  Download, HelpCircle, CheckCircle2, AlertCircle, Sparkles, FileText, Pencil
} from 'lucide-react';

export default function ModuleManager({ 
  modules, 
  categories = [], 
  onAddModule, 
  onUpdateModule, 
  onToggleActive, 
  onDeleteModule, 
  onSeedSampleModules 
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewModule, setPreviewModule] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [filterGrade, setFilterGrade] = useState('all');
  const [inputMode, setInputMode] = useState('html'); // 'html' | 'json' | 'manual'
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedContent, setUploadedContent] = useState('');
  const [jsonQuestionsCount, setJsonQuestionsCount] = useState(0);
  const [showJsonHelp, setShowJsonHelp] = useState(false);
  const fileInputRef = useRef(null);

  // Edit states
  const [editFormData, setEditFormData] = useState({
    title: '',
    category: '',
    target_grade: 'all',
    icon: 'Rocket',
    description: '',
    file_path: '',
    is_active: 1
  });
  const [editInputMode, setEditInputMode] = useState('keep'); // 'keep' | 'html' | 'json' | 'manual'
  const [editUploadedFile, setEditUploadedFile] = useState(null);
  const [editUploadedContent, setEditUploadedContent] = useState('');
  const [editJsonQuestionsCount, setEditJsonQuestionsCount] = useState(0);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');
  const editFileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    category: categories[0]?.name || 'Sains',
    target_grade: 'all',
    icon: 'Rocket',
    description: '',
    file_path: '/materi/contoh-sains.html'
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleOpenEdit = (mod) => {
    setEditingModule(mod);
    setEditFormData({
      title: mod.title || '',
      category: mod.category || (categories[0]?.name || 'Sains'),
      target_grade: mod.target_grade || 'all',
      icon: mod.icon || 'Rocket',
      description: mod.description || '',
      file_path: mod.file_path || '',
      is_active: mod.is_active ? 1 : 0
    });
    setEditInputMode('keep');
    setEditUploadedFile(null);
    setEditUploadedContent('');
    setEditJsonQuestionsCount(0);
    setEditError('');
  };

  const handleEditFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditError('');
    try {
      const text = await file.text();
      setEditUploadedFile(file);
      setEditUploadedContent(text);

      if (editInputMode === 'html') {
        const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1] && (!editFormData.title || editFormData.title === '')) {
          setEditFormData(prev => ({ ...prev, title: titleMatch[1].trim() }));
        }
      } else if (editInputMode === 'json') {
        try {
          const parsed = JSON.parse(text);
          const rawQ = parsed.questions || parsed.soal || parsed.quiz || (Array.isArray(parsed) ? parsed : []);
          setEditJsonQuestionsCount(rawQ.length);

          setEditFormData(prev => ({
            ...prev,
            title: parsed.title || parsed.judul || prev.title || file.name.replace(/\.json$/i, ''),
            category: parsed.category || parsed.kategori || prev.category,
            target_grade: parsed.target_grade || parsed.jenjang || prev.target_grade,
            description: parsed.description || parsed.deskripsi || prev.description
          }));
        } catch (jsonErr) {
          setEditError('File JSON tidak valid: ' + jsonErr.message);
          setEditUploadedFile(null);
          setEditUploadedContent('');
          setEditJsonQuestionsCount(0);
        }
      }
    } catch (err) {
      setEditError('Gagal membaca file: ' + err.message);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editFormData.title || !editFormData.category) {
      setEditError('Judul dan Kategori materi wajib diisi');
      return;
    }

    if (editInputMode === 'html') {
      if (!editUploadedFile || !editUploadedContent) {
        setEditError('Silakan pilih file HTML pengganti terlebih dahulu');
        return;
      }
    } else if (editInputMode === 'json') {
      if (!editUploadedFile || !editUploadedContent) {
        setEditError('Silakan pilih file JSON pengganti terlebih dahulu');
        return;
      }
      if (editJsonQuestionsCount === 0) {
        setEditError('File JSON harus memuat minimal 1 pertanyaan kuis');
        return;
      }
    } else if (editInputMode === 'manual') {
      if (!editFormData.file_path) {
        setEditError('File Path / URL materi wajib diisi');
        return;
      }
    }

    setEditSubmitting(true);
    try {
      const payload = {
        title: editFormData.title,
        category: editFormData.category,
        target_grade: editFormData.target_grade,
        icon: editFormData.icon,
        description: editFormData.description,
        file_path: editFormData.file_path,
        is_active: editFormData.is_active,
        uploadType: editInputMode !== 'keep' && editInputMode !== 'manual' ? editInputMode : undefined,
        fileName: editUploadedFile?.name,
        fileContent: editUploadedContent || undefined
      };

      if (onUpdateModule) {
        await onUpdateModule(editingModule.id, payload);
      }
      setEditingModule(null);
      setEditUploadedFile(null);
      setEditUploadedContent('');
    } catch (err) {
      setEditError(err.message || 'Gagal memperbarui materi');
    } finally {
      setEditSubmitting(false);
    }
  };

  const filteredModules = modules.filter(m => {
    if (filterGrade === 'all') return true;
    if (filterGrade === 'TK') return m.target_grade === 'TK';
    if (filterGrade === 'SD') return m.target_grade?.startsWith('SD');
    if (filterGrade === 'SMP') return m.target_grade?.startsWith('SMP');
    if (filterGrade === 'SMA') return m.target_grade?.startsWith('SMA');
    return m.target_grade?.toLowerCase() === filterGrade.toLowerCase();
  });

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormError('');
    try {
      const text = await file.text();
      setUploadedFile(file);
      setUploadedContent(text);

      if (inputMode === 'html') {
        // Try extracting <title> from HTML
        const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1] && (!formData.title || formData.title === '')) {
          setFormData(prev => ({ ...prev, title: titleMatch[1].trim() }));
        }
      } else if (inputMode === 'json') {
        try {
          const parsed = JSON.parse(text);
          const rawQ = parsed.questions || parsed.soal || parsed.quiz || (Array.isArray(parsed) ? parsed : []);
          setJsonQuestionsCount(rawQ.length);

          setFormData(prev => ({
            ...prev,
            title: parsed.title || parsed.judul || prev.title || file.name.replace(/\.json$/i, ''),
            category: parsed.category || parsed.kategori || prev.category,
            target_grade: parsed.target_grade || parsed.jenjang || prev.target_grade,
            description: parsed.description || parsed.deskripsi || prev.description
          }));
        } catch (jsonErr) {
          setFormError('File JSON tidak valid: ' + jsonErr.message);
          setUploadedFile(null);
          setUploadedContent('');
          setJsonQuestionsCount(0);
        }
      }
    } catch (err) {
      setFormError('Gagal membaca file: ' + err.message);
    }
  };

  const downloadSampleJson = () => {
    const sample = {
      title: "Petualangan Tata Surya & Bintang",
      category: "Sains",
      target_grade: "SD Kelas 3",
      description: "Kuis seru mengenal planet-planet di tata surya",
      questions: [
        {
          question: "Planet manakah yang paling dekat dengan Matahari?",
          options: ["Merkurius", "Venus", "Bumi", "Mars"],
          answer: 0,
          explanation: "Merkurius adalah planet yang paling dekat posisinya dengan matahari!"
        },
        {
          question: "Planet terbesar di tata surya kita adalah...",
          options: ["Saturnus", "Bumi", "Jupiter", "Neptunus"],
          answer: 2,
          explanation: "Jupiter adalah planet terbesar, sangat besar hingga dapat memuat 1.300 planet Bumi!"
        },
        {
          question: "Planet yang terkenal dengan cincin indahnya yang megah adalah...",
          options: ["Uranus", "Saturnus", "Venus", "Mars"],
          answer: 1,
          explanation: "Saturnus memiliki cincin es dan debu spektakuler yang mengelilinginya!"
        }
      ]
    };

    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contoh_kuis_materi.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (inputMode === 'html') {
      if (!uploadedFile || !uploadedContent) {
        setFormError('Silakan pilih file HTML materi terlebih dahulu');
        return;
      }
    } else if (inputMode === 'json') {
      if (!uploadedFile || !uploadedContent) {
        setFormError('Silakan pilih file JSON materi terlebih dahulu');
        return;
      }
      if (jsonQuestionsCount === 0) {
        setFormError('File JSON harus memuat minimal 1 pertanyaan kuis');
        return;
      }
    } else {
      if (!formData.file_path) {
        setFormError('File Path / URL materi wajib diisi');
        return;
      }
    }

    if (!formData.title || !formData.category) {
      setFormError('Judul dan Kategori materi wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        uploadType: inputMode !== 'manual' ? inputMode : undefined,
        fileName: uploadedFile?.name,
        fileContent: uploadedContent || undefined
      };

      await onAddModule(payload);
      setShowAddModal(false);
      setUploadedFile(null);
      setUploadedContent('');
      setJsonQuestionsCount(0);
      setFormData({
        title: '',
        category: categories[0]?.name || 'Sains',
        target_grade: 'all',
        icon: 'Rocket',
        description: '',
        file_path: '/materi/contoh-sains.html'
      });
    } catch (err) {
      setFormError(err.message || 'Gagal menambahkan materi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl glass-panel border border-slate-700/60 shadow-xl space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold font-fun text-white flex items-center gap-2">
            <span>Manajemen Modul Pembelajaran (Content CMS)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal font-sans">
              {modules.length} Materi
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Tambah materi interaktif baru, atur target pembelajaran anak, atau nonaktifkan materi lama
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all active:scale-95 font-fun"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Materi Baru</span>
        </button>
      </div>

      {/* Grade Filters for Parent CMS */}
      {modules.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: '🌟 Semua Jenjang' },
            { id: 'TK', label: '🧸 TK' },
            { id: 'SD', label: '🎒 SD (1-6)' },
            { id: 'SMP', label: '📘 SMP (1-3)' },
            { id: 'SMA', label: '🎓 SMA (1-3)' },
            { id: 'hebat', label: '🚀 Khusus Hebat' },
            { id: 'heven', label: '🦄 Khusus Heven' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterGrade(f.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                filterGrade === f.id
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Modules List Grid */}
      {modules.length === 0 ? (
        <div className="text-center py-16 px-6 rounded-3xl bg-slate-900/50 border border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-bold font-fun text-white mb-1">Belum Ada Materi Pembelajaran</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Seluruh materi demo telah dikosongkan. Anda dapat menambahkan modul buatan sendiri atau memuat materi contoh kapan saja.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all font-fun"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Materi Baru</span>
            </button>
            {onSeedSampleModules && (
              <button
                onClick={onSeedSampleModules}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-bold text-xs transition-all font-fun"
              >
                <span>📥 Muat 3 Materi Contoh</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((mod) => {
            const isActive = Boolean(mod.is_active);

            return (
              <div
                key={mod.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                  isActive
                    ? 'bg-slate-900/80 border-slate-700/70 hover:border-slate-600 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-60'
                }`}
              >
                <div>
                  {/* Header tags */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {mod.category}
                    </span>

                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      mod.target_grade === 'hebat' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' :
                      mod.target_grade === 'heven' ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' :
                      mod.target_grade === 'all' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {mod.target_grade === 'all' ? 'Semua Jenjang' : 
                       mod.target_grade === 'hebat' ? '🚀 Khusus Hebat' :
                       mod.target_grade === 'heven' ? '🦄 Khusus Heven' :
                       mod.target_grade}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-base font-bold font-fun text-white mb-1.5 line-clamp-1">
                    {mod.title}
                  </h4>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {mod.description || 'Tidak ada deskripsi'}
                  </p>

                  <div className="text-[11px] font-mono text-slate-500 truncate mb-4 bg-slate-950/60 px-2.5 py-1 rounded-xl border border-slate-800">
                    {mod.file_path}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Preview Button */}
                    <button
                      onClick={() => setPreviewModule(mod)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Pratinjau Materi"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEdit(mod)}
                      className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 transition-colors"
                      title="Edit Modul Materi"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Toggle Active Button */}
                    <button
                      onClick={() => onToggleActive(mod.id, !isActive)}
                      className={`p-2 rounded-xl border transition-colors ${
                        isActive
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                      title={isActive ? 'Nonaktifkan Materi' : 'Aktifkan Materi'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => {
                      if (window.confirm(`Apakah Anda yakin ingin menghapus materi "${mod.title}"?`)) {
                        onDeleteModule(mod.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                    title="Hapus Materi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New Module Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:p-8 bg-slate-900 border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => {
                setShowAddModal(false);
                setUploadedFile(null);
                setUploadedContent('');
                setJsonQuestionsCount(0);
                setFormError('');
              }}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-fun text-white">
                Tambah Materi Pembelajaran Baru
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Pilih salah satu metode: Upload file HTML interaktif, upload file kuis JSON otomatis, atau gunakan tautan manual.
            </p>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Selection Tabs: HTML Upload / JSON Upload / Manual Path */}
            <div className="flex p-1 rounded-2xl bg-slate-950/80 border border-slate-800 gap-1 mb-5">
              <button
                type="button"
                onClick={() => {
                  setInputMode('html');
                  setUploadedFile(null);
                  setUploadedContent('');
                  setFormError('');
                }}
                className={`flex-1 py-2 px-3 rounded-xl font-fun font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  inputMode === 'html'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <FileCode2 className="w-4 h-4" />
                <span>Upload HTML</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInputMode('json');
                  setUploadedFile(null);
                  setUploadedContent('');
                  setFormError('');
                }}
                className={`flex-1 py-2 px-3 rounded-xl font-fun font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  inputMode === 'json'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <FileJson className="w-4 h-4" />
                <span>Upload JSON</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setInputMode('manual');
                  setFormError('');
                }}
                className={`flex-1 py-2 px-3 rounded-xl font-fun font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  inputMode === 'manual'
                    ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <LinkIcon className="w-4 h-4" />
                <span>Path Manual</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* File Upload Zone: HTML */}
              {inputMode === 'html' && (
                <div className="space-y-2">
                  <label className="block font-semibold text-slate-300">File HTML Materi Interaktif</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".html,.htm"
                    onChange={handleFileChange}
                    className="hidden"
                    id="html-file-input"
                  />
                  {!uploadedFile ? (
                    <label
                      htmlFor="html-file-input"
                      className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-indigo-400/80 rounded-2xl cursor-pointer bg-slate-950/40 hover:bg-slate-800/40 transition-all text-center group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-200 font-fun">
                        Klik untuk Memilih File .html
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1">
                        Mendukung halaman materi web, kuis interaktif, atau cerita pembelajaran
                      </span>
                    </label>
                  ) : (
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="truncate text-left">
                          <div className="font-bold text-xs text-white truncate font-fun">{uploadedFile.name}</div>
                          <div className="text-[10px] text-emerald-400/80">
                            {(uploadedFile.size / 1024).toFixed(1)} KB • File HTML Siap Diunggah
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFile(null);
                          setUploadedContent('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 transition-colors shrink-0"
                      >
                        Ganti File
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* File Upload Zone: JSON */}
              {inputMode === 'json' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-slate-300">File JSON Kuis & Materi</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={downloadSampleJson}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 hover:underline font-fun"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh Contoh JSON</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowJsonHelp(!showJsonHelp)}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-fun"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Format Soal</span>
                      </button>
                    </div>
                  </div>

                  {showJsonHelp && (
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1.5 animate-fade-in font-mono">
                      <div className="text-amber-400 font-bold font-fun">Contoh Format JSON Kuis:</div>
                      <pre className="text-[10px] text-slate-400 overflow-x-auto p-2 bg-slate-900 rounded-lg">
{`{
  "title": "Kuis Mengenal Bintang & Planet",
  "category": "Sains",
  "target_grade": "SD Kelas 3",
  "description": "Kuis interaktif tata surya",
  "questions": [
    {
      "question": "Planet manakah yang dijuluki Planet Merah?",
      "options": ["Mars", "Venus", "Jupiter", "Bumi"],
      "answer": 0,
      "explanation": "Mars dijuluki planet merah karena kaya akan besi oksida!"
    }
  ]
}`}
                      </pre>
                      <p className="text-[10px] text-slate-400">
                        *Mendukung format bahasa Indonesia (<code>judul</code>, <code>kategori</code>, <code>soal</code>, <code>pilihan</code>, <code>jawaban</code>, <code>penjelasan</code>).
                      </p>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                    id="json-file-input"
                  />
                  {!uploadedFile ? (
                    <label
                      htmlFor="json-file-input"
                      className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-purple-400/80 rounded-2xl cursor-pointer bg-slate-950/40 hover:bg-slate-800/40 transition-all text-center group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-2 group-hover:scale-110 transition-transform">
                        <FileJson className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-200 font-fun">
                        Klik untuk Memilih File .json
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1">
                        Otomatis dikonversi menjadi kuis interaktif dengan audio, animasi, & bintang!
                      </span>
                    </label>
                  ) : (
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="truncate text-left">
                          <div className="font-bold text-xs text-white truncate font-fun">{uploadedFile.name}</div>
                          <div className="text-[10px] text-emerald-400/80 flex items-center gap-1.5">
                            <span>{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span className="font-bold text-emerald-300">✅ Terdeteksi {jsonQuestionsCount} Soal Siap Digenerate</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFile(null);
                          setUploadedContent('');
                          setJsonQuestionsCount(0);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 transition-colors shrink-0"
                      >
                        Ganti File
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Manual URL / Path Input */}
              {inputMode === 'manual' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">URL / File Path HTML</label>
                  <input
                    type="text"
                    required
                    placeholder="/materi/contoh-sains.html"
                    value={formData.file_path}
                    onChange={(e) => setFormData({ ...formData, file_path: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Judul Materi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Mengenal Dinosaurus & Fosil Purba"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500 cursor-pointer font-medium"
                  >
                    {categories.length > 0 ? (
                      categories.map((c) => (
                        <option key={c.id || c.name} value={c.name} className="bg-slate-900">
                          {c.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Sains">🔭 Sains</option>
                        <option value="Matematika">🔢 Matematika</option>
                        <option value="Bahasa">📚 Bahasa</option>
                        <option value="Seni & Kreativitas">🎨 Seni & Kreativitas</option>
                        <option value="Teknologi & Coding">💻 Teknologi & Coding</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Target Jenjang / Siswa</label>
                  <select
                    value={formData.target_grade}
                    onChange={(e) => setFormData({ ...formData, target_grade: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="all">🌟 Semua Jenjang & Anak</option>
                    <optgroup label="Khusus Personal" className="bg-slate-900 text-slate-400 font-bold">
                      <option value="hebat" className="text-white">🚀 Khusus Hebat</option>
                      <option value="heven" className="text-white">🦄 Khusus Heven</option>
                    </optgroup>
                    <optgroup label="Taman Kanak-Kanak / PAUD" className="bg-slate-900 text-slate-400 font-bold">
                      <option value="TK" className="text-white">🧸 TK (Taman Kanak-Kanak)</option>
                    </optgroup>
                    <optgroup label="Sekolah Dasar (SD)" className="bg-slate-900 text-slate-400 font-bold">
                      <option value="SD Kelas 1" className="text-white">🎒 SD Kelas 1</option>
                      <option value="SD Kelas 2" className="text-white">🎒 SD Kelas 2</option>
                      <option value="SD Kelas 3" className="text-white">🎒 SD Kelas 3</option>
                      <option value="SD Kelas 4" className="text-white">🎒 SD Kelas 4</option>
                      <option value="SD Kelas 5" className="text-white">🎒 SD Kelas 5</option>
                      <option value="SD Kelas 6" className="text-white">🎒 SD Kelas 6</option>
                    </optgroup>
                    <optgroup label="Sekolah Menengah Pertama (SMP)" className="bg-slate-900 text-slate-400 font-bold">
                      <option value="SMP Kelas 1" className="text-white">📘 SMP Kelas 1 (Kelas 7)</option>
                      <option value="SMP Kelas 2" className="text-white">📘 SMP Kelas 2 (Kelas 8)</option>
                      <option value="SMP Kelas 3" className="text-white">📘 SMP Kelas 3 (Kelas 9)</option>
                    </optgroup>
                    <optgroup label="Sekolah Menengah Atas (SMA)" className="bg-slate-900 text-slate-400 font-bold">
                      <option value="SMA Kelas 1" className="text-white">🎓 SMA Kelas 1 (Kelas 10)</option>
                      <option value="SMA Kelas 2" className="text-white">🎓 SMA Kelas 2 (Kelas 11)</option>
                      <option value="SMA Kelas 3" className="text-white">🎓 SMA Kelas 3 (Kelas 12)</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows="2"
                  placeholder="Ceritakan tentang apa yang akan dipelajari anak dalam materi ini..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setUploadedFile(null);
                    setUploadedContent('');
                    setJsonQuestionsCount(0);
                    setFormError('');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors font-fun"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold shadow-lg shadow-indigo-500/25 transition-all font-fun flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <span>Memproses & Menyimpan...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Simpan Materi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Module Modal */}
      {editingModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:p-8 bg-slate-900 border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => {
                setEditingModule(null);
                setEditUploadedFile(null);
                setEditUploadedContent('');
                setEditError('');
              }}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Pencil className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-fun text-white">
                  Edit Modul Pembelajaran
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  ID #{editingModule.id} • {editingModule.title}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Perbarui rincian materi, kategori, target jenjang anak, atau ganti file materi kuis jika diperlukan.
            </p>

            {editError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              {/* File Management Tabs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-300">File Materi / Kuis</label>
                  <span className="text-[10px] text-slate-400">Pilih opsi berkas materi</span>
                </div>

                <div className="flex p-1 rounded-2xl bg-slate-950/80 border border-slate-800 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditInputMode('keep');
                      setEditUploadedFile(null);
                      setEditUploadedContent('');
                      setEditError('');
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-xl font-fun font-bold text-[11px] flex items-center justify-center gap-1 transition-all ${
                      editInputMode === 'keep'
                        ? 'bg-slate-800 text-indigo-300 shadow border border-indigo-500/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Tetap Pakai File Lama</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditInputMode('html');
                      setEditUploadedFile(null);
                      setEditUploadedContent('');
                      setEditError('');
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-xl font-fun font-bold text-[11px] flex items-center justify-center gap-1 transition-all ${
                      editInputMode === 'html'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileCode2 className="w-3.5 h-3.5" />
                    <span>Ganti HTML</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditInputMode('json');
                      setEditUploadedFile(null);
                      setEditUploadedContent('');
                      setEditError('');
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-xl font-fun font-bold text-[11px] flex items-center justify-center gap-1 transition-all ${
                      editInputMode === 'json'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileJson className="w-3.5 h-3.5" />
                    <span>Ganti JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditInputMode('manual');
                      setEditError('');
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-xl font-fun font-bold text-[11px] flex items-center justify-center gap-1 transition-all ${
                      editInputMode === 'manual'
                        ? 'bg-slate-800 text-white shadow border border-slate-700'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Path URL</span>
                  </button>
                </div>

                {/* Current file display if 'keep' */}
                {editInputMode === 'keep' && (
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="truncate">
                      <span className="text-[10px] text-slate-500 block">File tersimpan saat ini:</span>
                      <span className="font-mono text-indigo-300 text-[11px] truncate block">{editFormData.file_path}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewModule({ ...editingModule, file_path: editFormData.file_path })}
                      className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-bold shrink-0 transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Cek File</span>
                    </button>
                  </div>
                )}

                {/* Replacement HTML upload */}
                {editInputMode === 'html' && (
                  <div>
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept=".html,.htm"
                      onChange={handleEditFileChange}
                      className="hidden"
                      id="edit-html-file-input"
                    />
                    {!editUploadedFile ? (
                      <label
                        htmlFor="edit-html-file-input"
                        className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-700 hover:border-indigo-400/80 rounded-2xl cursor-pointer bg-slate-950/40 hover:bg-slate-800/40 transition-all text-center group"
                      >
                        <Upload className="w-5 h-5 text-indigo-400 mb-1" />
                        <span className="text-xs font-bold text-slate-200 font-fun">
                          Pilih File HTML Baru Pengganti
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          File kuis lama akan digantikan oleh file HTML baru ini
                        </span>
                      </label>
                    ) : (
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div className="truncate">
                            <div className="font-bold text-xs text-white truncate font-fun">{editUploadedFile.name}</div>
                            <div className="text-[10px] text-emerald-400/80">{(editUploadedFile.size / 1024).toFixed(1)} KB • Siap menggantikan</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditUploadedFile(null);
                            setEditUploadedContent('');
                            if (editFileInputRef.current) editFileInputRef.current.value = '';
                          }}
                          className="text-[11px] px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 transition-colors shrink-0"
                        >
                          Batal Ganti
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Replacement JSON upload */}
                {editInputMode === 'json' && (
                  <div>
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleEditFileChange}
                      className="hidden"
                      id="edit-json-file-input"
                    />
                    {!editUploadedFile ? (
                      <label
                        htmlFor="edit-json-file-input"
                        className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-700 hover:border-purple-400/80 rounded-2xl cursor-pointer bg-slate-950/40 hover:bg-slate-800/40 transition-all text-center group"
                      >
                        <FileJson className="w-5 h-5 text-purple-400 mb-1" />
                        <span className="text-xs font-bold text-slate-200 font-fun">
                          Pilih File JSON Baru Pengganti
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          Otomatis dikonversi menjadi kuis baru dengan audio & animasi
                        </span>
                      </label>
                    ) : (
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div className="truncate">
                            <div className="font-bold text-xs text-white truncate font-fun">{editUploadedFile.name}</div>
                            <div className="text-[10px] text-emerald-300 font-bold">Terdeteksi {editJsonQuestionsCount} soal kuis</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditUploadedFile(null);
                            setEditUploadedContent('');
                            setEditJsonQuestionsCount(0);
                            if (editFileInputRef.current) editFileInputRef.current.value = '';
                          }}
                          className="text-[11px] px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 transition-colors shrink-0"
                        >
                          Batal Ganti
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual Path input */}
                {editInputMode === 'manual' && (
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="/api/uploads/nama-file.html"
                      value={editFormData.file_path}
                      onChange={(e) => setEditFormData({ ...editFormData, file_path: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Judul Materi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Latihan Soal Matematika"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Category & Grade */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Kategori</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500 cursor-pointer font-medium"
                  >
                    {categories.length > 0 ? (
                      categories.map((c) => (
                        <option key={c.id || c.name} value={c.name} className="bg-slate-900">
                          {c.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Sains">🔭 Sains</option>
                        <option value="Matematika">🔢 Matematika</option>
                        <option value="Bahasa">📚 Bahasa</option>
                        <option value="Seni & Kreativitas">🎨 Seni & Kreativitas</option>
                        <option value="Teknologi & Coding">💻 Teknologi & Coding</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Target Jenjang / Siswa</label>
                  <select
                    value={editFormData.target_grade}
                    onChange={(e) => setEditFormData({ ...editFormData, target_grade: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="all">🌟 Semua Jenjang & Anak</option>
                    <optgroup label="Khusus Personal" className="bg-slate-900 text-slate-400 font-bold">
                      <option value="hebat" className="text-white">🚀 Khusus Hebat</option>
                      <option value="heven" className="text-white">🦄 Khusus Heven</option>
                    </optgroup>
                    <optgroup label="Taman Kanak-Kanak / PAUD" className="bg-slate-900 text-slate-400 font-bold">
                      <option value="TK" className="text-white">🧸 TK (Taman Kanak-Kanak)</option>
                    </optgroup>
                    <optgroup label="Sekolah Dasar (SD)" className="bg-slate-900 text-slate-400 font-bold">
                      <option value="SD Kelas 1" className="text-white">🎒 SD Kelas 1</option>
                      <option value="SD Kelas 2" className="text-white">🎒 SD Kelas 2</option>
                      <option value="SD Kelas 3" className="text-white">🎒 SD Kelas 3</option>
                      <option value="SD Kelas 4" className="text-white">🎒 SD Kelas 4</option>
                      <option value="SD Kelas 5" className="text-white">🎒 SD Kelas 5</option>
                      <option value="SD Kelas 6" className="text-white">🎒 SD Kelas 6</option>
                    </optgroup>
                    <optgroup label="Sekolah Menengah Pertama (SMP)" className="bg-slate-900 text-slate-400 font-bold">
                      <option value="SMP Kelas 1" className="text-white">📘 SMP Kelas 1 (Kelas 7)</option>
                      <option value="SMP Kelas 2" className="text-white">📘 SMP Kelas 2 (Kelas 8)</option>
                      <option value="SMP Kelas 3" className="text-white">📘 SMP Kelas 3 (Kelas 9)</option>
                    </optgroup>
                    <optgroup label="Sekolah Menengah Atas (SMA)" className="bg-slate-900 text-slate-400 font-bold">
                      <option value="SMA Kelas 1" className="text-white">🎓 SMA Kelas 1 (Kelas 10)</option>
                      <option value="SMA Kelas 2" className="text-white">🎓 SMA Kelas 2 (Kelas 11)</option>
                      <option value="SMA Kelas 3" className="text-white">🎓 SMA Kelas 3 (Kelas 12)</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Icon Choice */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Ikon Tampilan</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: 'Rocket', label: 'Roket', icon: Rocket },
                    { id: 'BookOpen', label: 'Buku', icon: BookOpen },
                    { id: 'Calculator', label: 'Hitung', icon: Calculator },
                    { id: 'Languages', label: 'Bahasa', icon: Languages },
                    { id: 'Sparkles', label: 'Ajaib', icon: Sparkles },
                  ].map(item => {
                    const IconComp = item.icon;
                    const isSelected = editFormData.icon === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, icon: item.id })}
                        className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all ${
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 shadow'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-[10px] font-semibold">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows="2"
                  placeholder="Ceritakan tentang apa yang akan dipelajari anak dalam materi ini..."
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Status Switch */}
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Status Publikasi Materi</div>
                  <div className="text-[11px] text-slate-400">
                    {editFormData.is_active ? 'Materi aktif dan dapat dipelajari anak' : 'Materi disembunyikan/dinonaktifkan sementara'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditFormData({ ...editFormData, is_active: editFormData.is_active ? 0 : 1 })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    editFormData.is_active
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {editFormData.is_active ? '✅ Aktif' : '⏸️ Nonaktif'}
                </button>
              </div>

              {/* Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingModule(null);
                    setEditUploadedFile(null);
                    setEditUploadedContent('');
                    setEditError('');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors font-fun"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-amber-500/25 transition-all font-fun flex items-center justify-center gap-2"
                >
                  {editSubmitting ? (
                    <span>Menyimpan Perubahan...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewModule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-4xl h-[85vh] rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-fun text-white">
                  Pratinjau Modul: {previewModule.title}
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                  {previewModule.category}
                </span>
              </div>
              <button
                onClick={() => setPreviewModule(null)}
                className="p-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Iframe Preview */}
            <div className="flex-1 bg-slate-950">
              <iframe
                src={previewModule.file_path}
                title="Preview"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
