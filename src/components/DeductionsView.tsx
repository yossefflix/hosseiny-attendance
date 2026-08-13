'use client';

import React, { useState } from 'react';
import { Employee, DeductionRecord } from '@/types';
import { AttendanceStore, formatArabicTime } from '@/lib/store';
import { exportDeductionsToExcel } from '@/lib/excel';

interface DeductionsViewProps {
  employees: Employee[];
  deductions: DeductionRecord[];
  onRefresh: () => void;
  onOpenAddModal: (employee: Employee) => void;
}

export default function DeductionsView({ employees, deductions, onRefresh, onOpenAddModal }: DeductionsViewProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Calculate totals
  const totalAmount = deductions.reduce((sum, d) => sum + (d.amount || 0), 0);
  const uniqueDeductedCount = new Set(deductions.map((d) => d.employee_id)).size;

  // Filter deductions
  const filteredDeductions = deductions.filter((ded) => {
    const empName = ded.employee_name || employees.find((e) => e.id === ded.employee_id)?.name || '';
    const matchesSearch = empName.toLowerCase().includes(searchTerm.toLowerCase()) || (ded.reason || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmployee = selectedEmployeeId === 'all' || ded.employee_id === selectedEmployeeId;
    return matchesSearch && matchesEmployee;
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت تأكد من رغبتك في حذف هذا الخصم المالي؟')) return;
    setDeletingId(id);
    try {
      await AttendanceStore.deleteDeduction(id);
      onRefresh();
    } catch (err) {
      console.error('Error deleting deduction:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = () => {
    exportDeductionsToExcel(filteredDeductions, employees);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <span className="text-3xl">🔻</span> قسم الخصومات المالية للموظفين
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              إدارة وتسجيل وتتبع الخصومات الجزائية وتكلفة التلفيات لموظفي الشركة
            </p>
          </div>
          <button
            onClick={handleExport}
            className="self-start md:self-auto bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-rose-950/30 transition flex items-center gap-2"
          >
            <span>📊</span> تصدير تقرير الخصومات إلى Excel
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-950/60 border border-rose-500/20 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-2xl">
              🔻
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">إجمالي الخصومات المالية</p>
              <p className="text-2xl font-black text-rose-400 font-mono mt-0.5">
                {totalAmount.toLocaleString('ar-EG')} <span className="text-sm font-sans text-rose-300">ج.م</span>
              </p>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-amber-500/20 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl">
              📋
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">عدد الخصومات المسجلة</p>
              <p className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                {deductions.length} <span className="text-sm font-sans text-amber-300">خصم</span>
              </p>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-purple-500/20 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-2xl">
              👥
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">عدد الموظفين المخصوم لهم</p>
              <p className="text-2xl font-black text-purple-400 font-mono mt-0.5">
                {uniqueDeductedCount} <span className="text-sm font-sans text-purple-300">موظف</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="بحث باسم الموظف أو سبب الخصم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
          />
        </div>

        <div className="w-full md:w-64 flex items-center gap-2">
          <label className="text-xs text-slate-400 whitespace-nowrap font-medium">تصفية حسب الموظف:</label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-rose-500 transition"
          >
            <option value="all">جميع الموظفين ({employees.length})</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Deductions Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                <th className="p-4 text-center w-16">#</th>
                <th className="p-4">اسم الموظف</th>
                <th className="p-4">تاريخ الخصم (تلقائي)</th>
                <th className="p-4">وقت التسجيل</th>
                <th className="p-4">مبلغ الخصم</th>
                <th className="p-4">سبب الخصم / ملاحظات</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm text-slate-200">
              {filteredDeductions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <div className="text-4xl mb-2">🛡️</div>
                    <p className="font-medium text-base text-slate-400">لا توجد خصومات مالية مسجلة حالياً</p>
                    <p className="text-xs text-slate-500 mt-1">يمكنك إضافة خصم مالي من لوحة الموظفين أو الحضور اليومي</p>
                  </td>
                </tr>
              ) : (
                filteredDeductions.map((ded, index) => {
                  const emp = employees.find((e) => e.id === ded.employee_id);
                  const empName = ded.employee_name || emp?.name || 'موظف';

                  return (
                    <tr key={ded.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 text-center font-mono text-xs text-slate-500">{index + 1}</td>
                      <td className="p-4 font-bold text-white flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-center font-black">
                          {empName.charAt(0)}
                        </span>
                        {empName}
                      </td>
                      <td className="p-4 font-mono text-slate-300">{ded.date || '--'}</td>
                      <td className="p-4 font-mono text-rose-300/90 text-xs">
                        {formatArabicTime(ded.time)}
                      </td>
                      <td className="p-4 font-bold text-rose-400 font-mono text-base">
                        {(ded.amount || 0).toLocaleString('ar-EG')} <span className="text-xs font-sans text-rose-300">ج.م</span>
                      </td>
                      <td className="p-4 text-slate-400 text-xs max-w-xs truncate">
                        {ded.reason || <span className="text-slate-600">-- بدون سبب مدون --</span>}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDelete(ded.id)}
                          disabled={deletingId === ded.id}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold transition border border-red-500/20"
                        >
                          {deletingId === ded.id ? 'جاري الحذف...' : '🗑️ حذف'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredDeductions.length > 0 && (
              <tfoot>
                <tr className="bg-rose-950/30 border-t-2 border-rose-500/30 font-bold text-white">
                  <td colSpan={4} className="p-4 text-left">
                    المجموع الكلي للخصومات المفلترة:
                  </td>
                  <td className="p-4 font-mono text-rose-400 text-lg">
                    {filteredDeductions.reduce((sum, d) => sum + (d.amount || 0), 0).toLocaleString('ar-EG')}{' '}
                    <span className="text-xs font-sans text-rose-300">ج.م</span>
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
