import React, { useState } from 'react';
import { Search, Filter, Calendar, Clock, CheckCircle, AlertTriangle, BookOpen, User, RefreshCw } from 'lucide-react';

export default function ActivityTable({ activities, onFilterChange, loading, onRefresh }) {
  const [childFilter, setChildFilter] = useState('all');
  const [daysFilter, setDaysFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleChildChange = (e) => {
    const val = e.target.value;
    setChildFilter(val);
    onFilterChange({ child: val, days: daysFilter, search: searchQuery });
  };

  const handleDaysChange = (e) => {
    const val = e.target.value;
    setDaysFilter(val);
    onFilterChange({ child: childFilter, days: val, search: searchQuery });
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    onFilterChange({ child: childFilter, days: daysFilter, search: val });
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}d`;
    return `${mins}m ${secs}d`;
  };

  return (
    <div className="p-6 rounded-3xl glass-panel border border-slate-700/60 shadow-xl space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold font-fun text-white flex items-center gap-2">
            <span>Log Aktivitas Belajar Real-Time</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal font-sans">
              Audit Trail ({activities.length})
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Riwayat pengerjaan modul, skor evaluasi, durasi, dan status kelulusan anak
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Child Filter */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-800/90 border border-slate-700/70 text-xs text-slate-300">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={childFilter}
              onChange={handleChildChange}
              className="bg-transparent text-white outline-none cursor-pointer font-medium"
            >
              <option value="all" className="bg-slate-900">Semua Anak</option>
              <option value="hebat" className="bg-slate-900">Hebat 🚀</option>
              <option value="heven" className="bg-slate-900">Heven 🦄</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-800/90 border border-slate-700/70 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={daysFilter}
              onChange={handleDaysChange}
              className="bg-transparent text-white outline-none cursor-pointer font-medium"
            >
              <option value="all" className="bg-slate-900">Semua Tanggal</option>
              <option value="7" className="bg-slate-900">7 Hari Terakhir</option>
              <option value="30" className="bg-slate-900">30 Hari Terakhir</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-800/90 border border-slate-700/70 text-xs text-slate-300 w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari materi..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="bg-transparent text-white placeholder-slate-500 outline-none w-full"
            />
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
              title="Perbarui Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Nama Anak</th>
              <th className="py-3.5 px-4">Judul Materi & Kategori</th>
              <th className="py-3.5 px-4">Waktu Pengerjaan</th>
              <th className="py-3.5 px-4">Durasi</th>
              <th className="py-3.5 px-4">Skor Akhir</th>
              <th className="py-3.5 px-4">Status Kelulusan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {activities.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-500">
                  Tidak ada data aktivitas yang sesuai dengan filter.
                </td>
              </tr>
            ) : (
              activities.map((act) => {
                const isHebat = act.user_name === 'Hebat';
                const isPassed = act.status === 'Lulus';

                return (
                  <tr key={act.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Nama Anak */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{act.user_avatar || (isHebat ? '🚀' : '🦄')}</span>
                        <span className={`font-bold font-fun ${isHebat ? 'text-indigo-300' : 'text-pink-300'}`}>
                          {act.user_name}
                        </span>
                      </div>
                    </td>

                    {/* Judul Materi & Kategori */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white line-clamp-1">{act.module_title}</div>
                      <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium mt-0.5">
                        {act.module_category}
                      </span>
                    </td>

                    {/* Tanggal & Jam */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                      {formatDate(act.completed_at)}
                    </td>

                    {/* Durasi */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 font-mono">
                      {formatDuration(act.duration_seconds)}
                    </td>

                    {/* Skor Akhir */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-white text-sm font-mono">{act.percentage}%</span>
                      <span className="text-slate-500 text-[11px] ml-1">({act.score}/{act.total_questions})</span>
                    </td>

                    {/* Status Kelulusan */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isPassed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Lulus</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Perlu Ulang</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
