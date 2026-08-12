'use client';

import React, { useState } from 'react';
import { Employee } from '@/types';
import { AttendanceStore, getTodayDateString, getCurrentTimeString, formatArabicTime } from '@/lib/store';

interface AddAdvanceModalProps {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddAdvanceModal({ employee, isOpen, onClose, onSuccess }: AddAdvanceModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const todayDate = getTodayDateString();
  const currentTime = getCurrentTimeString();
  const formattedTime = formatArabicTime(currentTime);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('يرجى إدخال مبلغ سلفة صحيح أكبر من الصفر');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await AttendanceStore.addAdvance(employee.id, numAmount, notes);
      setAmount('');
      setNotes('');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding advance:', err);
      setError('حدث خطأ أثناء حفظ السلفة، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-slate-900 border-b border-amber-500/20 p-6 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">💵</span> إضافة سلفة مالية
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              للموظف: <span className="text-amber-400 font-bold">{employee.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Auto Date & Time Notice */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-xs text-slate-300 flex items-center justify-between">
            <span className="text-slate-400">📅 تاريخ ووقت التسجيل التلقائي:</span>
            <span className="font-mono text-amber-300 bg-amber-950/40 px-2 py-1 rounded border border-amber-800/40">
              {todayDate} | {formattedTime}
            </span>
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              مبلغ السلفة (بالجنيه المصري) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="1"
                placeholder="أدخل المبلغ، مثال: 1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl py-3 pr-4 pl-12 text-white font-bold text-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                ج.م
              </span>
            </div>
          </div>

          {/* Notes Field */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              ملاحظات أو سبب السلفة (اختياري)
            </label>
            <textarea
              rows={2}
              placeholder="مثال: سلفة طارئة لشراء مستلزمات..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-900/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <span>💾</span> تأكيد وإضافة السلفة
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 rounded-xl transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
