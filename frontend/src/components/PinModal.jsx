import React, { useState, useEffect } from 'react';
import { Lock, X, Delete, ArrowRight, ShieldCheck } from 'lucide-react';

export default function PinModal({ user, isOpen, onClose, onSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
    }
  }, [isOpen, user]);

  // Support keyboard digits
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 4) {
          handleDigit(e.key);
        }
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        if (pin.length === 4) {
          handleSubmit();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin]);

  if (!isOpen || !user) return null;

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const verifyPin = async (fullPin) => {
    setLoading(true);
    setError('');
    try {
      await onSuccess(user.id, fullPin);
    } catch (err) {
      setError(err.message || 'PIN tidak sesuai');
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setPin('');
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (pin.length === 4) {
      verifyPin(pin);
    }
  };

  // Default PIN hint
  const getDefaultHint = () => {
    if (user.name === 'Hebat') return '1111';
    if (user.name === 'Heven') return '2222';
    if (user.role === 'parent' || user.name.includes('Orang Tua')) return '9999';
    return '1111';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className={`relative w-full max-w-sm rounded-3xl p-6 sm:p-8 bg-slate-900/90 border border-slate-700/60 shadow-2xl transition-all duration-300 ${shake ? 'animate-wiggle border-red-500/80' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pin-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-700/60 transition-colors"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* User Avatar & Name */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/30 border border-indigo-500/30 flex items-center justify-center text-4xl shadow-inner mb-3">
            {user.avatar || '👤'}
          </div>
          <h2 id="pin-modal-title" className="text-2xl font-bold font-fun text-white">
            {user.name}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {user.role === 'parent' ? 'Akses Khusus Orang Tua / Wali' : 'Masukkan PIN Belajarmu'}
          </p>

          {/* Hint badge */}
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Default PIN: <strong className="text-indigo-200">{getDefaultHint()}</strong></span>
          </div>
        </div>

        {/* PIN Indicators */}
        <div className="my-6 flex justify-center items-center gap-3">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-indigo-400 scale-125 shadow-lg shadow-indigo-500/50'
                    : 'bg-slate-700 border border-slate-600'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-center text-rose-400 text-sm font-medium mb-3 animate-pulse">
            {error}
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num.toString())}
              disabled={loading}
              className="h-14 rounded-2xl bg-slate-800/80 hover:bg-indigo-600/30 active:scale-95 text-xl font-bold text-white border border-slate-700/60 shadow hover:border-indigo-400/50 transition-all font-fun"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-700/60 active:scale-95 text-xs font-bold text-slate-400 hover:text-white border border-slate-700/40 transition-all"
          >
            HAPUS
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            disabled={loading}
            className="h-14 rounded-2xl bg-slate-800/80 hover:bg-indigo-600/30 active:scale-95 text-xl font-bold text-white border border-slate-700/60 shadow hover:border-indigo-400/50 transition-all font-fun"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            disabled={loading}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-700/60 active:scale-95 flex items-center justify-center text-slate-400 hover:text-white border border-slate-700/40 transition-all"
            aria-label="Hapus satu angka"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Submit button when 4 digits */}
        {pin.length === 4 && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700 transition-all active:scale-95 font-fun"
          >
            {loading ? 'Memeriksa...' : 'Masuk Sekarang'}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
