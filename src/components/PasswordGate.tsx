'use client';

import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, ArrowLeft, ShieldCheck, Flame } from 'lucide-react';

const AUTH_KEY = 'hosseiny_auth_session';
const SYSTEM_PASSWORD = 'QxK9#mPv$2nL@8wZ';

interface PasswordGateProps {
  children: React.ReactNode;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem(AUTH_KEY);
      if (session === 'true') {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === SYSTEM_PASSWORD) {
      localStorage.setItem(AUTH_KEY, 'true');
      setIsAuthenticated(true);
      setErrorMsg('');
    } else {
      setErrorMsg('❌ كلمة المرور غير صحيحة! يرجى التأكد وإعادة المحاولة.');
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400 font-sans" dir="rtl">
        <div className="animate-pulse flex items-center gap-2">
          <Lock className="w-5 h-5 text-cyan-400" />
          <span>جاري التحقق من أمان النظام...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 backdrop-blur-xl relative overflow-hidden">
          {/* Top Gradient Accent */}
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400"></div>

          {/* Logo & Brand Header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mx-auto shadow-xl shadow-cyan-500/20">
              <Flame className="w-9 h-9 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">نظام حضور الحسيني للتكييف</h1>
              <p className="text-xs text-slate-400 mt-1">تسجيل الدخول الآمن للوحة التحكم والتقارير</p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-cyan-400" />
                <span>كلمة المرور الخاصة بالنظام:</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="أدخل كلمة المرور..."
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-800/90 text-white font-mono text-base pr-10 pl-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-500 placeholder:font-sans placeholder:text-xs"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs font-semibold animate-fade-in text-center">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 text-white font-bold text-sm hover:from-blue-500 hover:to-teal-400 shadow-xl shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span>دخول النظام</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </form>

          {/* Footer note */}
          <div className="pt-2 border-t border-slate-800/80 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>نظام محمي بكلمة مرور مخصصة لإدارة مركز الحسيني للتكييف</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export function logoutSystem() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_KEY);
    window.location.reload();
  }
}
