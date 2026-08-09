'use client';

import React from 'react';
import { Employee, AttendanceRecord } from '@/types';
import { X, Calendar, Edit3, UserCheck, Phone, Briefcase } from 'lucide-react';
import { formatArabicTime } from '@/lib/store';

interface EmployeeProfileModalProps {
  employee: Employee;
  attendanceRecords: AttendanceRecord[];
  onClose: () => void;
  onOpenEditModal: (record: AttendanceRecord) => void;
}

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  employee,
  attendanceRecords,
  onClose,
  onOpenEditModal,
}) => {
  const empRecords = attendanceRecords
    .filter((r) => r.employee_id === employee.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold text-lg flex items-center justify-center">
              {employee.name.slice(0, 2)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{employee.name}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{employee.job_title}</span>
                <span>•</span>
                <span className="font-mono">{employee.phone || 'بدون هاتف'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <div className="flex items-center justify-between shrink-0">
          <h4 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>Attendance History (سجل الحضور الكامل)</span>
          </h4>
          <span className="text-xs font-mono text-slate-400">إجمالي الأيام: {empRecords.length}</span>
        </div>

        {/* Table Container */}
        <div className="overflow-y-auto overflow-x-auto flex-1 rounded-xl border border-slate-800">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-800/90 text-slate-300 text-xs uppercase border-b border-slate-700 sticky top-0">
              <tr>
                <th className="px-4 py-3 font-bold">التاريخ</th>
                <th className="px-4 py-3 font-bold">وقت الحضور</th>
                <th className="px-4 py-3 font-bold">الحالة</th>
                <th className="px-4 py-3 font-bold">تعديل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {empRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">
                    لا يوجد سجلات حضور مسجلة لهذا الموظف
                  </td>
                </tr>
              ) : (
                empRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-cyan-300 text-xs">{rec.date}</td>
                    <td className="px-4 py-3 font-mono font-bold text-white">
                      {formatArabicTime(rec.check_in_time)}
                      {rec.edited && (
                        <span className="text-[10px] text-amber-400 block font-sans">
                          ✏️ (الأصلي: {formatArabicTime(rec.original_check_in_time)})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {rec.status === 'present' && (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          حاضر
                        </span>
                      )}
                      {rec.status === 'late' && (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          متأخر
                        </span>
                      )}
                      {rec.status === 'severe_late' && (
                        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          تأخير شديد
                        </span>
                      )}
                      {rec.status === 'absent' && (
                        <span className="bg-slate-800 text-slate-400 border border-slate-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          غائب
                        </span>
                      )}
                      {rec.status === 'mission' && (
                        <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          مأمورية
                        </span>
                      )}
                      {rec.status === 'leave' && (
                        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          إجازة
                        </span>
                      )}
                      {rec.status === 'off' && (
                        <span className="bg-slate-700 text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                          راحة
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onOpenEditModal(rec)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-400 transition-colors"
                        title="تعديل وقت الحضور"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
