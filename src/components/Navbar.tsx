'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  FileSpreadsheet, 
  AlertTriangle, 
  Users, 
  History, 
  Settings,
  Flame,
  CloudCheck,
  CloudOff,
  LogOut
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { logoutSystem } from './PasswordGate';

export type ActiveTab = 
  | 'dashboard'
  | 'daily_report'
  | 'monthly_report'
  | 'late_employees'
  | 'employees'
  | 'audit_log'
  | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  todayDateStr: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, todayDateStr }) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'daily_report', label: 'التقرير اليومي', icon: <CalendarDays className="w-5 h-5" /> },
    { id: 'monthly_report', label: 'التقرير الشهري', icon: <FileSpreadsheet className="w-5 h-5" /> },
    { id: 'late_employees', label: 'المتأخرين ⚠️', icon: <AlertTriangle className="w-5 h-5 text-amber-400" /> },
    { id: 'employees', label: 'الموظفين', icon: <Users className="w-5 h-5" /> },
    { id: 'audit_log', label: 'سجل التعديلات', icon: <History className="w-5 h-5" /> },
    { id: 'settings', label: 'الإعدادات', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Flame className="w-7 h-7 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
              نظام حضور الحسيني للتكييف
            </h1>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
              <span>مركز الصيانة المعتمد والخدمات الفنية</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block"></span>
              {isSupabaseConfigured ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CloudCheck className="w-3.5 h-3.5" /> مصل بسحابة Supabase
                </span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1">
                  <CloudOff className="w-3.5 h-3.5" /> تخزين محلي (Offline Ready)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Current Date Badge & Logout */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 border border-slate-700/60 px-4 py-2 rounded-xl flex items-center gap-2 shadow-inner">
            <CalendarDays className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-slate-200">{todayDateStr}</span>
          </div>

          <button
            onClick={logoutSystem}
            title="قفل النظام / خروج"
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-slate-950/60 border-t border-slate-800/60 overflow-x-auto no-scrollbar">
        <nav className="flex space-x-1 space-x-reverse min-w-max py-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
