'use client';

import React, { useState } from 'react';
import { Employee, AttendanceRecord, SystemSettings } from '@/types';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Edit3, 
  Check, 
  Flame,
  Search,
  UserCheck,
  AlertTriangle,
  UserX,
  Briefcase
} from 'lucide-react';
import { AttendanceStore, formatArabicTime, getTodayDateString, getCurrentTimeString } from '@/lib/store';

interface DashboardViewProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  settings: SystemSettings;
  onRefreshData: () => void;
  onOpenEditModal: (record: AttendanceRecord) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  employees,
  attendanceRecords,
  settings,
  onRefreshData,
  onOpenEditModal,
}) => {
  const todayStr = getTodayDateString();
  const activeEmployees = employees.filter((e) => e.status === 'active');

  const [searchQuery, setSearchQuery] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<{
    show: boolean;
    employeeName: string;
    existingTime: string;
    record?: AttendanceRecord;
  }>({ show: false, employeeName: '', existingTime: '' });

  // Map today's attendance by employee_id
  const todayRecordsMap = new Map<string, AttendanceRecord>();
  attendanceRecords.forEach((r) => {
    if (r.date === todayStr) {
      todayRecordsMap.set(r.employee_id, r);
    }
  });

  // Statistics counters
  let presentCount = 0;
  let lateCount = 0;
  let severeLateCount = 0;
  let absentCount = 0;

  activeEmployees.forEach((emp) => {
    const rec = todayRecordsMap.get(emp.id);
    if (!rec) {
      absentCount++;
    } else if (rec.status === 'present') {
      presentCount++;
    } else if (rec.status === 'late') {
      lateCount++;
    } else if (rec.status === 'severe_late') {
      severeLateCount++;
    }
  });

  // Severe late list & Late list today
  const severeLateListToday: { name: string; time: string; record: AttendanceRecord }[] = [];
  const lateListToday: { name: string; time: string; record: AttendanceRecord }[] = [];

  activeEmployees.forEach((emp) => {
    const rec = todayRecordsMap.get(emp.id);
    if (rec) {
      if (rec.status === 'severe_late') {
        severeLateListToday.push({ name: emp.name, time: formatArabicTime(rec.check_in_time), record: rec });
      } else if (rec.status === 'late') {
        lateListToday.push({ name: emp.name, time: formatArabicTime(rec.check_in_time), record: rec });
      }
    }
  });

  // Filter employees search
  const filteredEmployees = activeEmployees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.job_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Quick Check-in handler
  const handleQuickCheckIn = (emp: Employee) => {
    const result = AttendanceStore.recordCheckIn(emp.id, todayStr);

    if (result.isDuplicate && result.record) {
      setDuplicateWarning({
        show: true,
        employeeName: emp.name,
        existingTime: formatArabicTime(result.existingTime),
        record: result.record,
      });
    } else {
      onRefreshData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Active Employees */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">إجمالي الموظفين</p>
              <h3 className="text-2xl font-bold text-white mt-1">{activeEmployees.length}</h3>
              <p className="text-xs text-cyan-400 mt-1">فنيين وإداريين نشطين</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
        </div>

        {/* Present (On Time) */}
        <div className="bg-slate-800/80 border border-emerald-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">🟢 في الموعد</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{presentCount}</h3>
              <p className="text-xs text-emerald-500/80 mt-1">حضروا قبل {settings.late_start_time}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 right-0 left-0 h-1 bg-emerald-500"></div>
        </div>

        {/* Late */}
        <div className="bg-slate-800/80 border border-amber-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">🟡 متأخر</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">{lateCount}</h3>
              <p className="text-xs text-amber-500/80 mt-1">{settings.late_start_time} - {settings.severe_late_time}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 right-0 left-0 h-1 bg-amber-500"></div>
        </div>

        {/* Severe Late */}
        <div className="bg-slate-800/80 border border-rose-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">🔴 تأخير شديد</p>
              <h3 className="text-2xl font-bold text-rose-400 mt-1">{severeLateCount}</h3>
              <p className="text-xs text-rose-500/80 mt-1">بعد {settings.severe_late_time}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 right-0 left-0 h-1 bg-rose-500"></div>
        </div>
      </div>

      {/* Main Grid: Employee Attendance List & Alert Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Today's Employee Attendance List */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-cyan-400" />
                <span>قائمة تسجيل الحضور اليومي</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">اضغط على زر الحضور لتسجيل الوقت الحالي أوتوماتيكياً</p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث باسم الموظف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800 text-slate-200 text-sm placeholder:text-slate-500 pr-9 pl-4 py-2 rounded-xl border border-slate-700/70 focus:outline-none focus:border-cyan-500 transition-all w-full sm:w-60"
              />
            </div>
          </div>

          {/* Attendance Table / Cards */}
          <div className="divide-y divide-slate-800/80">
            {filteredEmployees.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <UserX className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-sm">لا يوجد موظفين مطابقين للبحث</p>
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const rec = todayRecordsMap.get(emp.id);
                const isRecorded = Boolean(rec);

                return (
                  <div
                    key={emp.id}
                    className="py-3.5 px-3 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Employee Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm shrink-0">
                        {emp.name.slice(0, 2)}
                      </div>
                      <div className="truncate">
                        <h4 className="font-semibold text-slate-100 text-sm truncate">{emp.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span className="truncate">{emp.job_title}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                          <span>{emp.phone || 'بدون هاتف'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Action */}
                    <div className="flex items-center gap-3 shrink-0">
                      {isRecorded && rec ? (
                        <>
                          {/* Time & Badge */}
                          <div className="text-left font-mono">
                            <span className="text-sm font-bold text-slate-200 block">
                              {formatArabicTime(rec.check_in_time)}
                            </span>
                            {rec.edited && (
                              <span className="text-[10px] text-amber-400 block font-sans">
                                ✏️ معدل (أصلي {formatArabicTime(rec.original_check_in_time)})
                              </span>
                            )}
                          </div>

                          {/* Badge indicator */}
                          {rec.status === 'present' && (
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-semibold">
                              🟢 حاضر
                            </span>
                          )}
                          {rec.status === 'late' && (
                            <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs px-2.5 py-1 rounded-full font-semibold">
                              🟡 متأخر
                            </span>
                          )}
                          {rec.status === 'severe_late' && (
                            <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs px-2.5 py-1 rounded-full font-semibold">
                              🔴 تأخير شديد
                            </span>
                          )}
                          {['absent', 'leave', 'mission', 'off'].includes(rec.status) && (
                            <span className="inline-flex items-center gap-1 bg-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-full font-semibold">
                              {rec.status === 'absent' && '🔴 غائب'}
                              {rec.status === 'leave' && '🔵 إجازة'}
                              {rec.status === 'mission' && '🟣 مأمورية'}
                              {rec.status === 'off' && '⚪ راحة'}
                            </span>
                          )}

                          {/* Edit button */}
                          <button
                            onClick={() => onOpenEditModal(rec)}
                            title="تعديل الوقت والحالة"
                            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 transition-all border border-slate-700"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        /* Quick Check-in Button */
                        <button
                          onClick={() => handleQuickCheckIn(emp)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                        >
                          <Check className="w-4 h-4" />
                          <span>تسجيل حضور</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Today's Delay Alert Widgets */}
        <div className="space-y-6">
          {/* Severe Late Widget 🔴 */}
          <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></div>
              <h3 className="text-base font-bold text-rose-400 flex items-center gap-2">
                <span>🔴 تأخير شديد اليوم</span>
                <span className="text-xs bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-mono">
                  {severeLateListToday.length}
                </span>
              </h3>
            </div>

            {severeLateListToday.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">لا يوجد حالات تأخير شديد حتى الآن 👍</p>
            ) : (
              <div className="space-y-2">
                {severeLateListToday.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => onOpenEditModal(item.record)}
                    className="flex items-center justify-between p-3 rounded-xl bg-rose-950/30 border border-rose-900/50 hover:bg-rose-950/50 cursor-pointer transition-colors"
                  >
                    <span className="text-sm font-semibold text-rose-100">{item.name}</span>
                    <span className="text-xs font-mono font-bold text-rose-300 bg-rose-900/40 px-2.5 py-1 rounded-lg">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Late Widget 🟡 */}
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <span>🟡 المتأخرون اليوم</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                  {lateListToday.length}
                </span>
              </h3>
            </div>

            {lateListToday.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">لا يوجد متأخرين اليوم 👍</p>
            ) : (
              <div className="space-y-2">
                {lateListToday.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => onOpenEditModal(item.record)}
                    className="flex items-center justify-between p-3 rounded-xl bg-amber-950/30 border border-amber-900/50 hover:bg-amber-950/50 cursor-pointer transition-colors"
                  >
                    <span className="text-sm font-semibold text-amber-100">{item.name}</span>
                    <span className="text-xs font-mono font-bold text-amber-300 bg-amber-900/40 px-2.5 py-1 rounded-lg">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Duplicate Warning Modal */}
      {duplicateWarning.show && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-white">تنبيه تسجيل مكرر!</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                ⚠️ <strong className="text-amber-400">{duplicateWarning.employeeName}</strong> تم تسجيل حضوره بالفعل اليوم الساعة{' '}
                <span className="font-mono font-bold text-cyan-300">{duplicateWarning.existingTime}</span>.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDuplicateWarning({ show: false, employeeName: '', existingTime: '' })}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-sm font-semibold transition-all"
              >
                إغلاق
              </button>
              {duplicateWarning.record && (
                <button
                  onClick={() => {
                    const rec = duplicateWarning.record;
                    setDuplicateWarning({ show: false, employeeName: '', existingTime: '' });
                    if (rec) onOpenEditModal(rec);
                  }}
                  className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-sm hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg"
                >
                  ✏️ تعديل الوقت
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
