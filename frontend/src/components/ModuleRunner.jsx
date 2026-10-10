import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, Clock, RotateCcw, Award, Star, CheckCircle2, AlertCircle, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { api } from '../api';

export default function ModuleRunner({ user, module, onBack, onQuizFinished }) {
  const [startTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [quizResult, setQuizResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const iframeRef = useRef(null);

  // Timer counter
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Synthesize sound effects using Web Audio API (zero external assets needed)
  const playSound = (type) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'celebration') {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const noteOsc = audioCtx.createOscillator();
          const noteGain = audioCtx.createGain();
          noteOsc.connect(noteGain);
          noteGain.connect(audioCtx.destination);
          noteOsc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.12);
          noteGain.gain.setValueAtTime(0.3, audioCtx.currentTime + idx * 0.12);
          noteGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.12 + 0.35);
          noteOsc.start(audioCtx.currentTime + idx * 0.12);
          noteOsc.stop(audioCtx.currentTime + idx * 0.12 + 0.4);
        });
      }
    } catch (e) {
      console.warn('Audio playback not supported or user gesture needed:', e);
    }
  };

  // Confetti celebration trigger
  const fireCelebration = () => {
    // Fireworks confetti effect
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fire(0.2, {
      spread: 60,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });

    playSound('celebration');
  };

  // PostMessage listener
  useEffect(() => {
    const handleMessage = async (event) => {
      // Validate message structure
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'QUIZ_COMPLETED') {
        const { score, total } = event.data;
        console.log('Received QUIZ_COMPLETED event:', { score, total });

        const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
        setSubmitting(true);

        try {
          // Trigger confetti burst immediately
          fireCelebration();

          // Submit to backend API
          const response = await api.submitQuiz({
            userId: user.id,
            moduleId: module.id,
            score: Number(score),
            totalQuestions: Number(total),
            durationSeconds: duration
          });

          setQuizResult(response);
          setShowResultModal(true);

          if (onQuizFinished) {
            onQuizFinished(response);
          }
        } catch (err) {
          console.error('Failed to submit quiz result:', err);
          // Fallback visual feedback even if network offline
          const totalQ = Number(total) || 100;
          const scoreNum = Number(score) || 0;
          const percentage = Math.round((scoreNum / totalQ) * 100);
          setQuizResult({
            score: scoreNum,
            totalQuestions: totalQ,
            percentage,
            starsEarned: percentage >= 90 ? 3 : percentage >= 70 ? 2 : 1,
            passed: percentage >= 70,
            message: 'Tantangan Selesai!'
          });
          setShowResultModal(true);
        } finally {
          setSubmitting(false);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user, module, startTime]);

  const handleManualComplete = async () => {
    const duration = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
    setSubmitting(true);
    try {
      fireCelebration();
      const response = await api.submitQuiz({
        userId: user.id,
        moduleId: module.id,
        score: 100,
        totalQuestions: 100,
        durationSeconds: duration
      });
      setQuizResult(response);
      setShowResultModal(true);
      if (onQuizFinished) {
        onQuizFinished(response);
      }
    } catch (err) {
      console.error('Failed manual submit quiz:', err);
      setQuizResult({
        score: 100,
        totalQuestions: 100,
        percentage: 100,
        starsEarned: 5,
        passed: true,
        message: 'Materi Berhasil Diselesaikan!'
      });
      setShowResultModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestartModule = () => {
    setShowResultModal(false);
    setQuizResult(null);
    if (iframeRef.current) {
      const glue = module.file_path.includes('?') ? '&' : '?';
      iframeRef.current.src = `${module.file_path}${glue}student=${encodeURIComponent(user.name || 'Hebat')}&r=${Date.now()}`;
    }
  };

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 flex flex-col">
      {/* Top Runner Navigation Bar */}
      <header className="h-16 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors font-fun text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
          <div className="h-5 w-px bg-slate-700 hidden sm:block" />
          <h2 className="text-sm sm:text-base font-bold font-fun text-white line-clamp-1">
            {module.title}
          </h2>
          <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {module.category}
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Complete Module Button */}
          <button
            onClick={handleManualComplete}
            disabled={submitting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold font-fun transition-all active:scale-95 shadow-sm"
            title="Tandai selesai belajar dan raih bintang"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Selesai Belajar</span>
            <span className="sm:hidden">Selesai</span>
          </button>

          {/* Duration Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs font-mono font-medium">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Reload Module */}
          <button
            onClick={handleRestartModule}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Muat Ulang Materi"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Iframe Window */}
      <div className="flex-1 w-full h-full relative bg-slate-900">
        <iframe
          ref={iframeRef}
          src={`${module.file_path}${module.file_path.includes('?') ? '&' : '?'}student=${encodeURIComponent(user.name || 'Hebat')}`}
          title={module.title}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>

      {/* Completion Celebration Modal */}
      {showResultModal && quizResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-slate-900 to-indigo-950 border border-indigo-500/40 shadow-2xl text-center relative overflow-hidden animate-scale-up">
            {/* Top decorative glow */}
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />

            {/* Big Award Trophy */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-xl mb-4">
              <Award className="w-12 h-12 animate-bounce-subtle" />
            </div>

            <h3 className="text-2xl sm:text-3xl font-black font-fun text-white mb-1">
              {quizResult.passed ? 'Luar Biasa, Kamu Juara! 🎉' : 'Bagus Sekali Usahamu! 💪'}
            </h3>
            <p className="text-xs text-slate-300 mb-6">
              {quizResult.message || 'Kamu telah menyelesaikan modul materi ini dengan sangat baik!'}
            </p>

            {/* Stars Earned (1 to 5 Stars Scale) */}
            <div className="flex justify-center items-center gap-2 sm:gap-3 my-4">
              {[1, 2, 3, 4, 5].map((starIndex) => {
                const isEarned = starIndex <= (quizResult.starsEarned || 1);
                return (
                  <div
                    key={starIndex}
                    className={`transition-all duration-500 transform ${
                      isEarned
                        ? 'scale-110 sm:scale-125 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                        : 'scale-90 text-slate-700'
                    }`}
                  >
                    <Star className="w-8 h-8 sm:w-9 sm:h-9 fill-current" />
                  </div>
                );
              })}
            </div>

            {/* Score & Duration Box */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 my-6">
              <div>
                <div className="text-[11px] text-slate-400">Skor Akhir</div>
                <div className="text-2xl font-black font-fun text-emerald-400">
                  {quizResult.percentage}%
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Waktu Pengerjaan</div>
                <div className="text-2xl font-black font-fun text-indigo-300">
                  {formatTimer(elapsedSeconds)}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRestartModule}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-colors font-fun flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ulangi Modul</span>
              </button>
              <button
                onClick={onBack}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all font-fun flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Kembali ke Beranda</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
