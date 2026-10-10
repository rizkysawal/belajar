import React from 'react';
import { Star, ShieldCheck, Sparkles, Award, Compass, HeartHandshake, GraduationCap } from 'lucide-react';

export default function ProfileSelect({ users, onSelectUser, loading }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-950 via-indigo-950/60 to-slate-950 relative overflow-hidden">
      {/* Decorative Glow Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-1/3 w-60 h-60 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-4xl z-10 text-center">
        {/* Title Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs sm:text-sm font-medium mb-4 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Selamat Datang di Portal Belajar Interaktif</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-fun mb-3">
          Siapa yang Ingin Belajar Hari Ini?
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto mb-10">
          Pilih profilmu untuk memulai petualangan seru mengumpulkan bintang dan mengasah kemampuan!
        </p>

        {/* Profile Cards Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {users.map((user) => {
              const isParent = user.role === 'parent';
              const isHebat = user.name === 'Hebat';
              const isHeven = user.name === 'Heven';

              let cardBg = 'from-indigo-600/20 to-purple-600/20 border-indigo-500/30 hover:border-indigo-400';
              let badgeColor = 'bg-indigo-500/20 text-indigo-300';
              let roleSubtitle = 'Pahlawan Sains & Penjelajah';
              let roleIcon = <Compass className="w-4 h-4 text-indigo-400" />;

              if (isHeven) {
                cardBg = 'from-pink-600/20 to-purple-600/20 border-pink-500/30 hover:border-pink-400';
                badgeColor = 'bg-pink-500/20 text-pink-300';
                roleSubtitle = 'Kreatif, Ceria & Berprestasi';
                roleIcon = <Award className="w-4 h-4 text-pink-400" />;
              } else if (isParent) {
                cardBg = 'from-amber-600/20 to-indigo-900/30 border-amber-500/30 hover:border-amber-400';
                badgeColor = 'bg-amber-500/20 text-amber-300';
                roleSubtitle = 'Monitoring & Pengaturan';
                roleIcon = <ShieldCheck className="w-4 h-4 text-amber-400" />;
              }

              return (
                <button
                  key={user.id}
                  onClick={() => onSelectUser(user)}
                  className={`group relative flex flex-col items-center p-6 sm:p-8 rounded-3xl bg-gradient-to-b ${cardBg} border backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl text-center active:scale-95`}
                >
                  {/* Avatar Circle */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-900/60 border border-white/10 flex items-center justify-center text-5xl sm:text-6xl mb-4 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    {user.avatar || '👤'}

                    {/* Star badge on avatar for students */}
                    {!isParent && (
                      <div className="absolute -bottom-2 -right-2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-bold text-xs shadow-md">
                        <Star className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                        <span>{user.totalStars || 0}</span>
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <h2 className="text-2xl font-bold font-fun text-white mb-1 group-hover:text-indigo-300 transition-colors">
                    {user.name}
                  </h2>

                  {/* Subtitle */}
                  <p className="text-xs text-slate-400 mb-2 flex items-center justify-center gap-1">
                    {roleIcon}
                    <span>{roleSubtitle}</span>
                  </p>

                  {/* Grade Badge for Students */}
                  {!isParent && user.grade && (
                    <div className="mb-4 px-3 py-1 rounded-full bg-slate-900/60 border border-white/10 text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm text-indigo-300 group-hover:text-amber-300 group-hover:border-amber-400/30 transition-all">
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-400 group-hover:text-amber-400" />
                      <span>{user.grade}</span>
                    </div>
                  )}

                  {/* Action pill */}
                  <div className={`mt-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isParent 
                      ? 'bg-amber-500 text-slate-950 group-hover:bg-amber-400' 
                      : 'bg-indigo-500 text-white group-hover:bg-indigo-400'
                  }`}>
                    <span>Masuk Profil</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-14 text-xs text-slate-500 flex items-center justify-center gap-2">
          <HeartHandshake className="w-4 h-4 text-rose-400" />
          <span>Dibuat dengan cinta untuk pembelajaran aktif Hebat & Heven</span>
        </div>
      </div>
    </div>
  );
}
