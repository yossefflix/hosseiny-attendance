'use client';

import React, { useState } from 'react';
import { Employee, AttendanceRecord, AdvanceRecord, DeductionRecord } from '@/types';
import { UserPlus, Search, Edit, Trash2, Power, History, Phone, Briefcase, DollarSign } from 'lucide-react';
import { AttendanceStore } from '@/lib/store';

interface EmployeesViewProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  advances?: AdvanceRecord[];
  deductions?: DeductionRecord[];
  onRefreshData: () => void;
  onSelectEmployeeProfile: (employee: Employee) => void;
  onOpenAddAdvanceModal?: (employee: Employee) => void;
  onOpenAddDeductionModal?: (employee: Employee) => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  employees,
  attendanceRecords,
  advances = [],
  deductions = [],
  onRefreshData,
  onSelectEmployeeProfile,
  onOpenAddAdvanceModal,
  onOpenAddDeductionModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    job_title: 'فني تكييف',
    status: 'active' as 'active' | 'inactive',
  });

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.phone.includes(searchQuery)
  );

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setFormData({ name: '', phone: '', job_title: 'فني تكييف', status: 'active' });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({ name: emp.name, phone: emp.phone, job_title: emp.job_title, status: emp.status });
    setIsAddModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    await AttendanceStore.saveEmployee({
      ...(editingEmployee ? { id: editingEmployee.id } : {}),
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      job_title: formData.job_title.trim(),
      status: formData.status,
    });

    setIsAddModalOpen(false);
    await onRefreshData();
  };

  const handleToggleStatus = async (emp: Employee) => {
    await AttendanceStore.toggleEmployeeStatus(emp.id);
    await onRefreshData();
  };

  const handleDeleteEmployee = async (emp: Employee) => {
    if (confirm(`هل أنت تأكد من حذف الموظف "${emp.name}"؟`)) {
      await AttendanceStore.deleteEmployee(emp.id);
      await onRefreshData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">إدارة الموظفين (Employees)</h2>
          <p className="text-xs text-slate-400">إضافة وتعديل بيانات موظفي وفنيي شركة الحسيني للتكييف</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث باسم الموظف أو الوظيفة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 text-slate-200 text-sm placeholder:text-slate-500 pr-9 pl-4 py-2.5 rounded-xl border border-slate-700 w-full focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Add Employee Button */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ إضافة موظف</span>
          </button>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((emp) => {
          const empRecords = attendanceRecords.filter((r) => r.employee_id === emp.id);
          return (
            <div
              key={emp.id}
              className={`rounded-2xl p-5 border shadow-xl transition-all relative overflow-hidden bg-slate-900/90 ${
                emp.status === 'active' ? 'border-slate-800' : 'border-rose-900/30 opacity-75'
              }`}
            >
              {/* Top Row */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-lg">
                    {emp.name.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-base">{emp.name}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{emp.job_title}</span>
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    emp.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {emp.status === 'active' ? 'نشط' : 'متوقف'}
                </span>
              </div>

              {/* Body */}
              {(() => {
                const empAdvances = advances.filter((a) => a.employee_id === emp.id);
                const totalAdvAmount = empAdvances.reduce((sum, a) => sum + (a.amount || 0), 0);

                const empDeductions = deductions.filter((d) => d.employee_id === emp.id);
                const totalDedAmount = empDeductions.reduce((sum, d) => sum + (d.amount || 0), 0);
                const totalDedDays = empDeductions.reduce((sum, d) => sum + (d.days || 0), 0);

                return (
                  <>
                    <div className="py-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-500" /> رقم الهاتف:
                        </span>
                        <span className="font-mono font-semibold">{emp.phone || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">سجلات الحضور المسجلة:</span>
                        <span className="font-mono font-semibold text-cyan-300">{empRecords.length} سجل</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800/60">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-amber-400" /> إجمالي السلف المالية:
                        </span>
                        <span className="font-mono font-bold text-amber-400 text-sm">
                          {totalAdvAmount.toLocaleString('ar-EG')} ج.م
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800/60">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <span>🔻</span> إجمالي الخصومات:
                        </span>
                        <span className="font-mono font-bold text-rose-400 text-sm">
                          {totalDedAmount > 0 ? `${totalDedAmount.toLocaleString('ar-EG')} ج.م ` : ''}
                          {totalDedDays > 0 ? `(${totalDedDays.toLocaleString('ar-EG')} يوم)` : ''}
                          {totalDedAmount === 0 && totalDedDays === 0 ? '0 ج.م' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => onSelectEmployeeProfile(emp)}
                          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 text-cyan-300 hover:bg-slate-700 transition-colors"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>السجل</span>
                        </button>
                        {onOpenAddAdvanceModal && (
                          <button
                            onClick={() => onOpenAddAdvanceModal(emp)}
                            className="flex items-center gap-1 text-xs font-bold px-2 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
                          >
                            <span>💵</span>
                            <span>+ سلفة</span>
                          </button>
                        )}
                        {onOpenAddDeductionModal && (
                          <button
                            onClick={() => onOpenAddDeductionModal(emp)}
                            className="flex items-center gap-1 text-xs font-bold px-2 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-all"
                          >
                            <span>🔻</span>
                            <span>+ خصم</span>
                          </button>
                        )}
                      </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditModal(emp)}
                    title="تعديل الموظف"
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(emp)}
                    title={emp.status === 'active' ? 'إيقاف الموظف' : 'تنشيط الموظف'}
                    className={`p-1.5 rounded-lg bg-slate-800 transition-colors ${
                      emp.status === 'active' ? 'text-slate-400 hover:text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEmployee(emp)}
                    title="حذف الموظف"
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          );
        })()}
      </div>
    );
  })}
      </div>

      {/* Add / Edit Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
              {editingEmployee ? '✏️ تعديل بيانات الموظف' : '+ إضافة موظف جديد'}
            </h3>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">الاسم الكامل:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محمد أحمد"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-800 text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">رقم الهاتف:</label>
                <input
                  type="text"
                  placeholder="01xxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-800 text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">الوظيفة:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فني تكييف / مهندس"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  className="w-full bg-slate-800 text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">حالة الموظف:</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full bg-slate-800 text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
                >
                  <option value="active">نشط</option>
                  <option value="inactive">متوقف / غير نشط</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold hover:from-blue-500 hover:to-cyan-500 shadow-lg"
                >
                  {editingEmployee ? 'حفظ التعديلات' : 'إضافة الموظف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
