import React, { useState, useEffect } from 'react';
import { KeyRound, RotateCcw, AlertTriangle, CheckCircle, ShieldCheck, User, GraduationCap, Sparkles } from 'lucide-react';
import { api } from '../../api';

export default function SettingsPanel({ users = [], onProgressReset }) {
  const studentUsers = users.filter(u => u.role === 'student');

  // Grade management state
  const [selectedUserForGrade, setSelectedUserForGrade] = useState(studentUsers[0]?.id || 1);
  const [selectedGrade, setSelectedGrade] = useState(studentUsers[0]?.grade || 'SD Kelas 3');
  const [gradeLoading, setGradeLoading] = useState(false);
  const [gradeSuccess, setGradeSuccess] = useState('');
  const [gradeError, setGradeError] = useState('');

  // Sync selectedGrade when selectedUserForGrade changes or users prop updates
  useEffect(() => {
    const student = studentUsers.find(u => u.id === Number(selectedUserForGrade));
    if (student) {
      setSelectedGrade(student.grade || 'SD Kelas 1');
    }
  }, [selectedUserForGrade, users]);

  // PIN change state
  const [selectedUserForPin, setSelectedUserForPin] = useState(users[0]?.id || 1);
  const [newPin, setNewPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinSuccess, setPinSuccess] = useState('');
  const [pinError, setPinError] = useState('');

  // Reset progress state
  const [selectedUserForReset, setSelectedUserForReset] = useState('all');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetError, setResetError] = useState('');

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGrade) {
      setGradeError('Pilih jenjang kelas terlebih dahulu');
      return;
    }

    setGradeLoading(true);
    setGradeSuccess('');
    setGradeError('');
    try {
      const res = await api.changeGrade(selectedUserForGrade, selectedGrade);
      setGradeSuccess(res.message || 'Jenjang kelas berhasil diperbarui!');
      if (onProgressReset) onProgressReset();
    } catch (err) {
      setGradeError(err.message || 'Gagal mengubah jenjang kelas');
    } finally {
      setGradeLoading(false);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (!newPin || newPin.length < 4) {
      setPinError('PIN harus berupa minimal 4 digit angka');
      return;
    }

    setPinLoading(true);
    setPinSuccess('');
    setPinError('');
    try {
      const res = await api.changePin(selectedUserForPin, newPin);
      setPinSuccess(res.message || 'PIN berhasil diubah!');
      setNewPin('');
    } catch (err) {
      setPinError(err.message || 'Gagal mengubah PIN');
    } finally {
      setPinLoading(false);
    }
  };

  const handleResetSubmit = async () => {
    const targetName = selectedUserForReset === 'all' 
      ? 'SEMUA ANAK (Hebat & Heven)' 
      : users.find(u => u.id === Number(selectedUserForReset))?.name || 'Anak Terpilih';

    const confirmed = window.confirm(
      `PERINGATAN: Apakah Anda yakin ingin mereset seluruh nilai, riwayat kuis, dan perolehan bintang untuk ${targetName}? Tindakan ini tidak dapat dibatalkan!`
    );

    if (!confirmed) return;

    setResetLoading(true);
    setResetSuccess('');
    setResetError('');
    try {
      const res = await api.resetProgress(selectedUserForReset);
      setResetSuccess(res.message || 'Progres berhasil di-reset!');
      if (onProgressReset) onProgressReset();
    } catch (err) {
      setResetError(err.message || 'Gagal mereset progres');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Pengaturan Jenjang Kelas Anak */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-700/60 shadow-xl space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-fun text-white">Jenjang Kelas Anak</h3>
              <p className="text-xs text-slate-400">Atur tingkat kelas belajar Hebat & Heven</p>
            </div>
          </div>

          {gradeSuccess && (
            <div className="mt-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{gradeSuccess}</span>
            </div>
          )}

          {gradeError && (
            <div className="mt-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{gradeError}</span>
            </div>
          )}

          <form onSubmit={handleGradeSubmit} className="space-y-4 text-xs pt-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Pilih Anak</label>
              <select
                value={selectedUserForGrade}
                onChange={(e) => setSelectedUserForGrade(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none cursor-pointer"
              >
                {studentUsers.map((u) => (
                  <option key={u.id} value={u.id} className="bg-slate-900">
                    {u.avatar} {u.name} (Saat ini: {u.grade || 'Belum diatur'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Tingkat / Jenjang Kelas</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none cursor-pointer font-medium"
              >
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

            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <span>
                Materi di dashboard anak akan otomatis memprioritaskan kurikulum tingkat kelas yang dipilih.
              </span>
            </div>

            <button
              type="submit"
              disabled={gradeLoading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold transition-all active:scale-95 font-fun shadow-lg shadow-indigo-500/20"
            >
              {gradeLoading ? 'Menyimpan...' : 'Simpan Jenjang Kelas'}
            </button>
          </form>
        </div>
      </div>

      {/* 2. Pengaturan PIN Akun */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-700/60 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-fun text-white">Ubah PIN Pengguna</h3>
            <p className="text-xs text-slate-400">Atur ulang PIN keamanan profil Hebat, Heven, atau Admin</p>
          </div>
        </div>

        {pinSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{pinSuccess}</span>
          </div>
        )}

        {pinError && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{pinError}</span>
          </div>
        )}

        <form onSubmit={handlePinSubmit} className="space-y-4 text-xs pt-2">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Pilih Akun</label>
            <select
              value={selectedUserForPin}
              onChange={(e) => setSelectedUserForPin(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none cursor-pointer"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id} className="bg-slate-900">
                  {u.name} {u.role === 'parent' ? '(Admin/Orang Tua) 👑' : `(${u.avatar})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">PIN Baru (4 Digit)</label>
            <input
              type="password"
              maxLength={6}
              placeholder="Contoh: 1234"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white tracking-widest text-center font-mono text-base outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={pinLoading || newPin.length < 4}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold transition-all active:scale-95 font-fun shadow-lg shadow-indigo-500/20"
          >
            {pinLoading ? 'Menyimpan...' : 'Simpan PIN Baru'}
          </button>
        </form>
      </div>

      {/* 2. Reset Progres Belajar */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-700/60 shadow-xl space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-fun text-white">Reset Progres Belajar</h3>
              <p className="text-xs text-slate-400">Mulai tantangan bintang dari nol untuk anak</p>
            </div>
          </div>

          {resetSuccess && (
            <div className="p-3 mb-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{resetSuccess}</span>
            </div>
          )}

          {resetError && (
            <div className="p-3 mb-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{resetError}</span>
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Target Reset</label>
              <select
                value={selectedUserForReset}
                onChange={(e) => setSelectedUserForReset(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">🌟 Seluruh Anak (Hebat & Heven)</option>
                {users.filter(u => u.role === 'student').map((u) => (
                  <option key={u.id} value={u.id.toString()} className="bg-slate-900">
                    {u.avatar} Hanya {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Perhatian Penting</span>
              </div>
              Tindakan ini akan menghapus riwayat pengerjaan kuis dan mengembalikan jumlah bintang menjadi 0 agar anak dapat mengulang seluruh modul dari awal.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetSubmit}
          disabled={resetLoading}
          className="w-full py-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold transition-all active:scale-95 font-fun text-xs"
        >
          {resetLoading ? 'Mereset...' : 'Reset Progres Sekarang'}
        </button>
      </div>
    </div>
  );
}
