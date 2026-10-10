import React from 'react';
import { Clock, CheckCircle2, Star, TrendingUp, Trophy, Award, BookOpen, Compass, BarChart3 } from 'lucide-react';

export default function AnalyticsCard({ analytics }) {
  if (!analytics) return null;

  const {
    weeklySessions = 0,
    weeklyMinutes = 0,
    weeklyHours = '0.0',
    totalQuizzes = 0,
    passRate = 100,
    userStars = [],
    subjectPerformance = []
  } = analytics;

  const hebatUser = userStars.find(u => u.name === 'Hebat') || { total_stars: 0, total_quizzes: 0, avg_score: 0 };
  const hevenUser = userStars.find(u => u.name === 'Heven') || { total_stars: 0, total_quizzes: 0, avg_score: 0 };

  return (
    <div className="space-y-6">
      {/* 4 Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Waktu Belajar Minggu Ini */}
        <div className="p-5 rounded-3xl glass-panel border border-slate-700/60 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-slate-400">Waktu Belajar (7 Hari)</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-fun">{weeklyHours}</span>
            <span className="text-xs font-semibold text-slate-400">Jam ({weeklyMinutes} Menit)</span>
          </div>
          <div className="mt-2 text-xs text-indigo-300 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{weeklySessions} sesi terselesaikan minggu ini</span>
          </div>
        </div>

        {/* Card 2: Total Kuis Tuntas */}
        <div className="p-5 rounded-3xl glass-panel border border-slate-700/60 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-slate-400">Kuis Diselesaikan</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-fun">{totalQuizzes}</span>
            <span className="text-xs font-semibold text-slate-400">Kuis tuntas</span>
          </div>
          <div className="mt-2 text-xs text-emerald-400 font-medium">
            Tingkat Kelulusan: <strong className="text-emerald-300">{passRate}%</strong>
          </div>
        </div>

        {/* Card 3: Bintang Hebat vs Heven */}
        <div className="p-5 rounded-3xl glass-panel border border-slate-700/60 shadow-xl relative overflow-hidden sm:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-slate-400">Perolehan Bintang: Hebat vs Heven</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Hebat Stars */}
            <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🚀</span>
                <div>
                  <div className="text-xs font-bold text-white font-fun">Hebat</div>
                  <div className="text-[10px] text-indigo-300 font-semibold">{hebatUser.grade || 'SD Kelas 3'} • {hebatUser.total_quizzes} kuis</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-amber-300 font-black font-fun text-xl">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{hebatUser.total_stars}</span>
              </div>
            </div>

            {/* Heven Stars */}
            <div className="p-3 rounded-2xl bg-pink-950/40 border border-pink-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🦄</span>
                <div>
                  <div className="text-xs font-bold text-white font-fun">Heven</div>
                  <div className="text-[10px] text-pink-300 font-semibold">{hevenUser.grade || 'TK'} • {hevenUser.total_quizzes} kuis</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-amber-300 font-black font-fun text-xl">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{hevenUser.total_stars}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Performance Visual Comparison Bar */}
      <div className="p-6 rounded-3xl glass-panel border border-slate-700/60 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-lg font-bold font-fun text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <span>Perbandingan Performa Per Mata Pelajaran</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Rata-rata skor evaluasi kuis Hebat (🚀) dan Heven (🦄)
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-indigo-300">
              <span className="w-3 h-3 rounded-full bg-indigo-500" />
              <span>Hebat (🚀)</span>
            </span>
            <span className="flex items-center gap-1.5 text-pink-300">
              <span className="w-3 h-3 rounded-full bg-pink-500" />
              <span>Heven (🦄)</span>
            </span>
          </div>
        </div>

        {/* Comparison Bars */}
        <div className="space-y-6">
          {subjectPerformance.map((item) => (
            <div key={item.subject} className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-200 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span>{item.subject}</span>
                </span>
                <div className="flex items-center gap-4 text-[11px] font-mono">
                  <span className="text-indigo-400">Hebat: {item.hebatAvg}% ({item.hebatCount}x)</span>
                  <span className="text-pink-400">Heven: {item.hevenAvg}% ({item.hevenCount}x)</span>
                </div>
              </div>

              {/* Dual Bar Progress */}
              <div className="space-y-1.5">
                {/* Hebat Bar */}
                <div className="h-3 w-full bg-slate-800/80 rounded-full overflow-hidden flex items-center p-0.5 border border-slate-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(item.hebatAvg, 4)}%` }}
                  />
                </div>
                {/* Heven Bar */}
                <div className="h-3 w-full bg-slate-800/80 rounded-full overflow-hidden flex items-center p-0.5 border border-slate-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(item.hevenAvg, 4)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
