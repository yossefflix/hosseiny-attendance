'use client';

import React, { useState } from 'react';
import { Employee, AdvanceRecord } from '@/types';
import { AttendanceStore, formatArabicTime } from '@/lib/store';
import { exportAdvancesToExcel } from '@/lib/excel';

interface AdvancesViewProps {
  employees: Employee[];
  advances: AdvanceRecord[];
  onRefresh: () => void;
  onOpenAddModal: (employee: Employee) => void;
}

export default function AdvancesView({ employees, advances, onRefresh, onOpenAddModal }: AdvancesViewProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Calculate totals
  const totalAmount = advances.reduce((sum, a) => sum + (a.amount || 0), 0);
  const uniqueBorrowersCount = new Set(advances.map((a) => a.employee_id)).size;

  // Filter advances
  const filteredAdvances = advances.filter((adv) => {
    const empName = adv.employee_name || employees.find((e) => e.id === adv.employee_id)?.name || '';
    const matchesSearch = empName.toLowerCase().includes(searchTerm.toLowerCase()) || (adv.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmployee = selectedEmployeeId === 'all' || adv.employee_id === selectedEmployeeId;
    return matchesSearch && matchesEmployee;
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت تأكد من رغبتك في حذف هذه السلفة؟')) return;
    setDeletingId(id);
    try {
      await AttendanceStore.deleteAdvance(id);
      onRefresh();
    } catch (err) {
      console.error('Error deleting advance:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = () => {
    exportAdvancesToExcel(filteredAdvances, employees);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <span className="text-3xl">💰</span> قسم السلف المالية للموظفين
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              إدارة وتسجيل وتتبع سلف الموظفين ومجموع المبالغ المستلفة
            </p>
          </div>
          <button
            onClick={handleExport}
            className="self-start md:self-auto bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-950/30 transition flex items-center gap-2"
          >
            <span>📊</span> تصدير تقرير السلف إلى Excel
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-950/60 border border-amber-500/20 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl">
              💵
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">إجمالي مبالغ السلف</p>
              <p className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                {totalAmount.toLocaleString('ar-EG')} <span className="text-sm font-sans text-amber-300">ج.م</span>
              </p>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-blue-500/20 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-2xl">
              📝
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">عدد السلف المسجلة</p>
              <p className="text-2xl font-black text-blue-400 font-mono mt-0.5">
                {advances.length} <span className="text-sm font-sans text-blue-300">سلفة</span>
              </p>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-purple-500/20 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-2xl">
              👥
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">عدد الموظفين المستلفين</p>
              <p className="text-2xl font-black text-purple-400 font-mono mt-0.5">
                {uniqueBorrowersCount} <span className="text-sm font-sans text-purple-300">موظف</span>
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
            placeholder="بحث باسم الموظف أو الملاحظات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        <div className="w-full md:w-64 flex items-center gap-2">
          <label className="text-xs text-slate-400 whitespace-nowrap font-medium">تصفية حسب الموظف:</label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 transition"
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

      {/* Main Advances Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                <th className="p-4 text-center w-16">#</th>
                <th className="p-4">اسم الموظف</th>
                <th className="p-4">تاريخ السلفة (تلقائي)</th>
                <th className="p-4">وقت التسجيل</th>
                <th className="p-4">المبلغ المستلف</th>
                <th className="p-4">ملاحظات</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm text-slate-200">
              {filteredAdvances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <div className="text-4xl mb-2">💸</div>
                    <p className="font-medium text-base text-slate-400">لا توجد سلف مالية مسجلة حالياً</p>
                    <p className="text-xs text-slate-500 mt-1">يمكنك إضافة سلفة من لوحة الموظفين أو الحضور اليومي</p>
                  </td>
                </tr>
              ) : (
                filteredAdvances.map((adv, index) => {
                  const emp = employees.find((e) => e.id === adv.employee_id);
                  const empName = adv.employee_name || emp?.name || 'موظف';

                  return (
                    <tr key={adv.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 text-center font-mono text-xs text-slate-500">{index + 1}</td>
                      <td className="p-4 font-bold text-white flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center justify-center font-black">
                          {empName.charAt(0)}
                        </span>
                        {empName}
                      </td>
                      <td className="p-4 font-mono text-slate-300">{adv.date || '--'}</td>
                      <td className="p-4 font-mono text-amber-300/90 text-xs">
                        {formatArabicTime(adv.time)}
                      </td>
                      <td className="p-4 font-bold text-amber-400 font-mono text-base">
                        {(adv.amount || 0).toLocaleString('ar-EG')} <span className="text-xs font-sans text-amber-300">ج.م</span>
                      </td>
                      <td className="p-4 text-slate-400 text-xs max-w-xs truncate">
                        {adv.notes || <span className="text-slate-600">-- لا توجد ملاحظات --</span>}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDelete(adv.id)}
                          disabled={deletingId === adv.id}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold transition border border-red-500/20"
                        >
                          {deletingId === adv.id ? 'جاري الحذف...' : '🗑️ حذف'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredAdvances.length > 0 && (
              <tfoot>
                <tr className="bg-amber-950/30 border-t-2 border-amber-500/30 font-bold text-white">
                  <td colSpan={4} className="p-4 text-left">
                    المجموع الكلي للسلف المفلترة:
                  </td>
                  <td className="p-4 font-mono text-amber-400 text-lg">
                    {filteredAdvances.reduce((sum, a) => sum + (a.amount || 0), 0).toLocaleString('ar-EG')}{' '}
                    <span className="text-xs font-sans text-amber-300">ج.م</span>
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
