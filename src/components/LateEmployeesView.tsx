'use client';

import React from 'react';
import { Employee, AttendanceRecord } from '@/types';
import { AlertTriangle, TrendingDown, Clock, Award } from 'lucide-react';
import { formatArabicTime, timeToMinutes } from '@/lib/store';

interface LateEmployeesViewProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
}

export const LateEmployeesView: React.FC<LateEmployeesViewProps> = ({
  employees,
  attendanceRecords,
}) => {
  const activeEmployees = employees.filter((e) => e.status === 'active');

  // Calculate late metrics per employee
  const lateRankings = activeEmployees.map((emp) => {
    const empRecs = attendanceRecords.filter((r) => r.employee_id === emp.id);

    let totalAttendanceDays = 0;
    let lateCount = 0;
    let severeLateCount = 0;
    let totalCheckInMinutes = 0;

    empRecs.forEach((r) => {
      if (['present', 'late', 'severe_late'].includes(r.status)) {
        totalAttendanceDays++;
        if (r.check_in_time) {
          totalCheckInMinutes += timeToMinutes(r.check_in_time);
        }
      }
      if (r.status === 'late') lateCount++;
      if (r.status === 'severe_late') severeLateCount++;
    });

    const totalTardinessScore = lateCount + severeLateCount * 2;

    let avgTime = '--:--';
    if (totalAttendanceDays > 0) {
      const avgMin = Math.round(totalCheckInMinutes / totalAttendanceDays);
      const h = Math.floor(avgMin / 60);
      const m = avgMin % 60;
      avgTime = formatArabicTime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }

    return {
      employee: emp,
      totalAttendanceDays,
      lateCount,
      severeLateCount,
      tardinessScore: totalTardinessScore,
      avgTime,
    };
  });

  // Sort by highest tardiness score descending
  lateRankings.sort((a, b) => b.tardinessScore - a.tardinessScore);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>⚠️ الموظفين الأكثر تأخيرًا (Late Employees Analytics)</span>
            </h2>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">
              تحليل شامل يظهر أكثر الموظفين الذين يعانون من مشاكل في الالتزام بمواعيد العمل لمعرفتهم في نهاية الشهر والتخاذ الإجراءات اللازمة.
            </p>
          </div>
        </div>
      </div>

      {/* Ranked Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {lateRankings.map((item, idx) => {
          const isTopLate = idx < 2 && item.tardinessScore > 0;
          return (
            <div
              key={item.employee.id}
              className={`rounded-2xl p-5 border shadow-xl transition-all relative overflow-hidden ${
                isTopLate
                  ? 'bg-slate-900 border-rose-500/50 shadow-rose-950/20'
                  : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              {/* Badge Rank */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                      idx === 0
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                        : idx === 1
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-base">{item.employee.name}</h3>
                    <p className="text-xs text-slate-400">{item.employee.job_title}</p>
                  </div>
                </div>

                {isTopLate && (
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold">
                    تأخير متكرر ⚠️
                  </span>
                )}
              </div>

              {/* Stats Grid */}
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-800/50 p-2.5 rounded-xl text-xs">
                  <span className="text-slate-400">إجمالي أيام الحضور:</span>
                  <span className="font-mono font-bold text-slate-200">{item.totalAttendanceDays} يوم</span>
                </div>

                <div className="flex justify-between items-center bg-amber-950/20 border border-amber-900/40 p-2.5 rounded-xl text-xs">
                  <span className="text-amber-300">مرات التأخير (10:00 - 10:59):</span>
                  <span className="font-mono font-bold text-amber-400">{item.lateCount} مرة</span>
                </div>

                <div className="flex justify-between items-center bg-rose-950/30 border border-rose-900/40 p-2.5 rounded-xl text-xs">
                  <span className="text-rose-300">بعد الساعة 11:00 (تأخير شديد):</span>
                  <span className="font-mono font-bold text-rose-400">{item.severeLateCount} مرة</span>
                </div>

                <div className="flex justify-between items-center bg-cyan-950/30 border border-cyan-900/40 p-2.5 rounded-xl text-xs">
                  <span className="text-cyan-300">متوسط وقت الحضور:</span>
                  <span className="font-mono font-bold text-cyan-300">{item.avgTime}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
