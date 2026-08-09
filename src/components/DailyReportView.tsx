'use client';

import React, { useState } from 'react';
import { Employee, AttendanceRecord } from '@/types';
import { Download, Calendar, Edit3, UserCheck } from 'lucide-react';
import { exportDailyAttendanceExcel } from '@/lib/excel';
import { formatArabicTime, getTodayDateString } from '@/lib/store';

interface DailyReportViewProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  onOpenEditModal: (record: AttendanceRecord) => void;
  onUpsertRecord: (empId: string, date: string, status: any) => AttendanceRecord | undefined;
}

export const DailyReportView: React.FC<DailyReportViewProps> = ({
  employees,
  attendanceRecords,
  onOpenEditModal,
  onUpsertRecord,
}) => {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());

  const activeEmployees = employees.filter((e) => e.status === 'active');
  const recordsMap = new Map<string, AttendanceRecord>();
  attendanceRecords.forEach((r) => {
    if (r.date === selectedDate) {
      recordsMap.set(r.employee_id, r);
    }
  });

  let presentCount = 0;
  let lateCount = 0;
  let severeLateCount = 0;
  let absentCount = 0;
  let missionCount = 0;

  activeEmployees.forEach((emp) => {
    const rec = recordsMap.get(emp.id);
    const status = rec ? rec.status : 'absent';
    if (status === 'present') presentCount++;
    else if (status === 'late') lateCount++;
    else if (status === 'severe_late') severeLateCount++;
    else if (status === 'absent') absentCount++;
    else if (status === 'mission') missionCount++;
  });

  const handleDownloadExcel = () => {
    exportDailyAttendanceExcel(selectedDate, employees, attendanceRecords);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar & Date Selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">تقرير حضور اليوم المحدد</h2>
            <p className="text-xs text-slate-400">اختر أي تاريخ لعرض سجلات الحضور وتصديرها</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Date Selector */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-800 text-slate-200 text-sm border border-slate-700 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500 font-mono"
          />

          {/* Download Excel Button */}
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>⬇️ تحميل التقرير Excel</span>
          </button>
        </div>
      </div>

      {/* Summary Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-2">
          تقرير حضور — <span className="font-mono text-cyan-400">{selectedDate}</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <span className="text-xs text-slate-400 block">إجمالي الموظفين</span>
            <span className="text-lg font-bold text-white">{activeEmployees.length}</span>
          </div>
          <div className="bg-emerald-950/30 p-3 rounded-xl border border-emerald-900/50">
            <span className="text-xs text-emerald-400 block">🟢 حاضر</span>
            <span className="text-lg font-bold text-emerald-300">{presentCount}</span>
          </div>
          <div className="bg-amber-950/30 p-3 rounded-xl border border-amber-900/50">
            <span className="text-xs text-amber-400 block">🟡 متأخر</span>
            <span className="text-lg font-bold text-amber-300">{lateCount}</span>
          </div>
          <div className="bg-rose-950/30 p-3 rounded-xl border border-rose-900/50">
            <span className="text-xs text-rose-400 block">🔴 تأخير شديد</span>
            <span className="text-lg font-bold text-rose-300">{severeLateCount}</span>
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <span className="text-xs text-slate-400 block">🔴 غائب / لم يسجل</span>
            <span className="text-lg font-bold text-slate-300">{absentCount}</span>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-800/90 text-slate-300 text-xs uppercase border-b border-slate-700">
              <tr>
                <th className="px-5 py-3.5 font-bold">#</th>
                <th className="px-5 py-3.5 font-bold">اسم الموظف</th>
                <th className="px-5 py-3.5 font-bold">الوظيفة</th>
                <th className="px-5 py-3.5 font-bold">وقت الحضور</th>
                <th className="px-5 py-3.5 font-bold">الحالة</th>
                <th className="px-5 py-3.5 font-bold">تعديل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {activeEmployees.map((emp, index) => {
                const rec = recordsMap.get(emp.id);
                const status = rec ? rec.status : 'absent';
                const checkInTime = rec ? formatArabicTime(rec.check_in_time) : 'لم يسجل';

                return (
                  <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-slate-500">{index + 1}</td>
                    <td className="px-5 py-3.5 font-semibold text-white">{emp.name}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{emp.job_title}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-cyan-300">{checkInTime}</td>
                    <td className="px-5 py-3.5">
                      {status === 'present' && (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-semibold">
                          🟢 في الموعد (حاضر)
                        </span>
                      )}
                      {status === 'late' && (
                        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs px-3 py-1 rounded-full font-semibold">
                          🟡 متأخر
                        </span>
                      )}
                      {status === 'severe_late' && (
                        <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs px-3 py-1 rounded-full font-semibold">
                          🔴 تأخير شديد
                        </span>
                      )}
                      {status === 'absent' && (
                        <span className="bg-slate-800 text-slate-400 border border-slate-700 text-xs px-3 py-1 rounded-full font-semibold">
                          🔴 غائب
                        </span>
                      )}
                      {status === 'mission' && (
                        <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs px-3 py-1 rounded-full font-semibold">
                          🟣 مأمورية
                        </span>
                      )}
                      {status === 'leave' && (
                        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs px-3 py-1 rounded-full font-semibold">
                          🔵 إجازة
                        </span>
                      )}
                      {status === 'off' && (
                        <span className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded-full font-semibold">
                          ⚪ راحة
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => {
                          if (rec) {
                            onOpenEditModal(rec);
                          } else {
                            // Create record for absent employee to edit
                            const newRec = onUpsertRecord(emp.id, selectedDate, 'present');
                            if (newRec) onOpenEditModal(newRec as any);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 transition-all border border-slate-700"
                        title="تعديل الحضور"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
