'use client';

import React, { useState } from 'react';
import { Employee, AttendanceRecord } from '@/types';
import { FileSpreadsheet, Download, RefreshCw, BarChart2 } from 'lucide-react';
import { exportMonthlyAttendanceExcel } from '@/lib/excel';
import { formatArabicTime, timeToMinutes } from '@/lib/store';

interface MonthlyReportViewProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  employees,
  attendanceRecords,
}) => {
  // Default to August 2026 or current month
  const [selectedMonth, setSelectedMonth] = useState('2026-08');

  const activeEmployees = employees.filter((e) => e.status === 'active');
  const monthRecords = attendanceRecords.filter((r) => r.date.startsWith(selectedMonth));

  // Compute metrics for each active employee
  const monthlyMetrics = activeEmployees.map((emp) => {
    const empRecs = monthRecords.filter((r) => r.employee_id === emp.id);

    let presentDays = 0;
    let lateDays = 0;
    let severeLateDays = 0;
    let absentDays = 0;
    let leaveDays = 0;
    let missionDays = 0;
    let totalMinutes = 0;
    let validCheckIns = 0;

    empRecs.forEach((r) => {
      if (r.status === 'present') presentDays++;
      else if (r.status === 'late') lateDays++;
      else if (r.status === 'severe_late') severeLateDays++;
      else if (r.status === 'absent') absentDays++;
      else if (r.status === 'leave') leaveDays++;
      else if (r.status === 'mission') missionDays++;

      if (['present', 'late', 'severe_late'].includes(r.status) && r.check_in_time) {
        totalMinutes += timeToMinutes(r.check_in_time);
        validCheckIns++;
      }
    });

    let avgTime = '--:--';
    if (validCheckIns > 0) {
      const avgMin = Math.round(totalMinutes / validCheckIns);
      const h = Math.floor(avgMin / 60);
      const m = avgMin % 60;
      avgTime = formatArabicTime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }

    return {
      employee: emp,
      presentDays,
      lateDays,
      severeLateDays,
      absentDays,
      leaveDays,
      missionDays,
      avgTime,
    };
  });

  const handleDownloadExcel = () => {
    exportMonthlyAttendanceExcel(selectedMonth, employees, attendanceRecords);
  };

  return (
    <div className="space-y-6">
      {/* Selector Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">التقرير الشهري الشامل (Monthly Report)</h2>
            <p className="text-xs text-slate-400">استخراج إحصائيات الحضور والغياب ومتوسط أوقات الحضور لكل موظف</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Month Input */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-300 font-semibold">الشهر:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-800 text-slate-200 text-sm border border-slate-700 px-3.5 py-2 rounded-xl focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>⬇️ Download Excel</span>
          </button>
        </div>
      </div>

      {/* Metrics Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-cyan-400" />
            <span>كشف حساب الحضور المالي والشهري لشهر: <span className="font-mono text-cyan-300">{selectedMonth}</span></span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">إجمالي الموظفين: {activeEmployees.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-800/90 text-slate-300 text-xs uppercase border-b border-slate-700">
              <tr>
                <th className="px-5 py-3.5 font-bold">الموظف</th>
                <th className="px-5 py-3.5 font-bold text-center">أيام الحضور</th>
                <th className="px-5 py-3.5 font-bold text-center">الغياب</th>
                <th className="px-5 py-3.5 font-bold text-center">التأخير (10-11)</th>
                <th className="px-5 py-3.5 font-bold text-center">بعد 11:00</th>
                <th className="px-5 py-3.5 font-bold text-center">مأموريات وإجازات</th>
                <th className="px-5 py-3.5 font-bold text-center">متوسط وقت الحضور</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {monthlyMetrics.map((item) => (
                <tr key={item.employee.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-white">{item.employee.name}</div>
                    <div className="text-xs text-slate-400">{item.employee.job_title}</div>
                  </td>
                  <td className="px-5 py-3.5 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20">
                    {item.presentDays}
                  </td>
                  <td className="px-5 py-3.5 text-center font-mono font-bold text-rose-400 bg-rose-950/20">
                    {item.absentDays}
                  </td>
                  <td className="px-5 py-3.5 text-center font-mono font-bold text-amber-400 bg-amber-950/20">
                    {item.lateDays}
                  </td>
                  <td className="px-5 py-3.5 text-center font-mono font-bold text-rose-500 bg-rose-950/40">
                    {item.severeLateDays}
                  </td>
                  <td className="px-5 py-3.5 text-center text-xs text-slate-400">
                    {item.missionDays > 0 && <span className="text-purple-400 font-bold ml-2">🟣 {item.missionDays} مأمورية</span>}
                    {item.leaveDays > 0 && <span className="text-blue-400 font-bold">🔵 {item.leaveDays} إجازة</span>}
                    {item.missionDays === 0 && item.leaveDays === 0 && '-'}
                  </td>
                  <td className="px-5 py-3.5 text-center font-mono font-bold text-cyan-300">
                    {item.avgTime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
