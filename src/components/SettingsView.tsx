'use client';

import React, { useState } from 'react';
import { SystemSettings } from '@/types';
import { Settings, Save, Clock, CloudCheck, Info } from 'lucide-react';
import { AttendanceStore } from '@/lib/store';

interface SettingsViewProps {
  settings: SystemSettings;
  onRefreshData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onRefreshData }) => {
  const [formData, setFormData] = useState<SystemSettings>({
    work_start_time: settings.work_start_time || '09:00',
    late_start_time: settings.late_start_time || '10:00',
    severe_late_time: settings.severe_late_time || '11:00',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [purging, setPurging] = useState(false);

  const lastPurgeTime = settings.last_purge_date ? new Date(settings.last_purge_date).getTime() : Date.now();
  const daysPassed = Math.floor((Date.now() - lastPurgeTime) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, 90 - daysPassed);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await AttendanceStore.saveSettings(formData);
    await onRefreshData();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handlePurgeThreeMonths = async () => {
    if (!window.confirm('⚠️ هل أنت تأكد من رغبتك في مسح بيانات الحضور والتأخيرات والسلف السابقة والبدء من جديد لدورة الـ 3 أشهر القادمة؟\nملاحظة: سيتم الحفاظ على بيانات وأسماء الموظفين أساسياً.')) {
      return;
    }
    setPurging(true);
    try {
      await AttendanceStore.purgeThreeMonthData();
      await onRefreshData();
      alert('✓ تم مسح وتصفية بيانات الـ 3 أشهر وبدء دورة جديدة بنجاح!');
    } catch (err) {
      console.error('Error purging data:', err);
      alert('حدث خطأ أثناء تصفية البيانات، يرجى المحاولة مرة أخرى');
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">إعدادات مواعيد العمل والتصنيف</h2>
            <p className="text-xs text-slate-400">ضبط ساعات الدوام والتصنيف التلقائي للتأخيرات لموظفي الحسيني للتكييف</p>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-2">
            ⏰ مواعيد العمل الرسمية والتأخير
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Work Start Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>بداية العمل الرسمي:</span>
              </label>
              <input
                type="time"
                required
                value={formData.work_start_time}
                onChange={(e) => setFormData({ ...formData, work_start_time: e.target.value })}
                className="w-full bg-slate-800 text-emerald-400 font-mono text-base font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">🟢 حساب الحضور في الموعد</span>
            </div>

            {/* Late Start Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>بداية التأخير:</span>
              </label>
              <input
                type="time"
                required
                value={formData.late_start_time}
                onChange={(e) => setFormData({ ...formData, late_start_time: e.target.value })}
                className="w-full bg-slate-800 text-amber-400 font-mono text-base font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">🟡 حساب تصنيف "متأخر"</span>
            </div>

            {/* Severe Late Start Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-rose-400" />
                <span>التأخير الشديد:</span>
              </label>
              <input
                type="time"
                required
                value={formData.severe_late_time}
                onChange={(e) => setFormData({ ...formData, severe_late_time: e.target.value })}
                className="w-full bg-slate-800 text-rose-400 font-mono text-base font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">🔴 حساب تصنيف "تأخير شديد"</span>
            </div>
          </div>
        </div>

        {/* Dynamic Classification Example Preview */}
        <div className="bg-slate-800/50 border border-slate-700/60 p-4 rounded-xl space-y-2 text-xs">
          <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>معاينة التصنيف التلقائي الحالي للمواعيد:</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-center">
            <div className="bg-emerald-950/30 border border-emerald-900/50 p-2 rounded-lg text-emerald-300">
              🟢 في الموعد: {formData.work_start_time} إلى {formData.late_start_time}
            </div>
            <div className="bg-amber-950/30 border border-amber-900/50 p-2 rounded-lg text-amber-300">
              🟡 متأخر: {formData.late_start_time} إلى {formData.severe_late_time}
            </div>
            <div className="bg-rose-950/30 border border-rose-900/50 p-2 rounded-lg text-rose-300">
              🔴 تأخير شديد: من {formData.severe_late_time} فما بعده
            </div>
          </div>
        </div>

        {/* 3-Month Automated & Manual Data Purge Section */}
        <div className="bg-amber-950/20 border border-amber-500/30 p-5 rounded-2xl space-y-3 text-xs">
          <div className="flex items-center justify-between gap-3">
            <h4 className="font-black text-amber-300 text-sm flex items-center gap-2">
              <span>🧹 إدارة دورة البيانات (تصفية كل 3 أشهر / 90 يوماً)</span>
            </h4>
            <span className="bg-amber-500/20 text-amber-300 font-mono font-bold px-3 py-1 rounded-full border border-amber-500/30">
              متبقي في الدورة: {daysRemaining} يوم
            </span>
          </div>

          <p className="text-slate-300 leading-relaxed">
            يقوم النظام تلقائياً وبشكل دوري بمسح وتصفية بيانات الحضور والتأخيرات والسلف القديمة التي تجاوزت 90 يوماً (3 أشهر) للحفاظ على السرعة والذاكرة، مع الاحتفاظ ببيانات وأسماء الموظفين الأساسية.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-amber-900/40">
            <span className="text-slate-400 font-mono">
              تاريخ آخر تصفية: {settings.last_purge_date ? new Date(settings.last_purge_date).toLocaleDateString('ar-EG') : 'الدورة الحالية جارية'}
            </span>

            <button
              type="button"
              onClick={handlePurgeThreeMonths}
              disabled={purging}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-lg shadow-red-950/40 transition flex items-center gap-2 border border-red-400/30 disabled:opacity-50"
            >
              {purging ? 'جاري المسح والتصفية...' : '🗑️ مسح وتصفية بيانات 3 الشهور الآن (بدء دورة جديدة)'}
            </button>
          </div>
        </div>

        {/* Server Connection Info */}
        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-2 text-xs">
          <h4 className="font-bold text-slate-200 flex items-center gap-2">
            <span className="text-emerald-400 flex items-center gap-1">
              <CloudCheck className="w-4 h-4" /> خادم DigitalOcean وتواصل Socket.io اللحظي مباشر 🟢
            </span>
          </h4>
          <p className="text-slate-400 leading-relaxed">
            يعمل هذا النظام مباشرة على خادم <code className="text-cyan-300 font-mono">DigitalOcean (161.35.12.161)</code> بنظام الـ WebSockets اللحظية دون الحاجة لأي خدمات سحابية خارجية.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-bold animate-fade-in">
              ✓ تم حفظ الإعدادات وتحديث المواعيد بنجاح!
            </span>
          )}
          <button
            type="submit"
            className="mr-auto flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>حفظ الإعدادات</span>
          </button>
        </div>
      </form>
    </div>
  );
};
