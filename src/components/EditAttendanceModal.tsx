'use client';

import React, { useState } from 'react';
import { AttendanceRecord, Employee, AttendanceStatus } from '@/types';
import { X, Clock, Edit3, Save, ShieldAlert } from 'lucide-react';
import { AttendanceStore, formatArabicTime } from '@/lib/store';

interface EditAttendanceModalProps {
  record: AttendanceRecord;
  employees: Employee[];
  onClose: () => void;
  onRefreshData: () => void;
}

export const EditAttendanceModal: React.FC<EditAttendanceModalProps> = ({
  record,
  employees,
  onClose,
  onRefreshData,
}) => {
  const employee = employees.find((e) => e.id === record.employee_id);

  const [newTime, setNewTime] = useState(record.check_in_time || '09:00');
  const [newStatus, setNewStatus] = useState<AttendanceStatus>(record.status || 'present');
  const [notes, setNotes] = useState(record.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    AttendanceStore.editAttendanceRecord(
      record.id,
      newTime,
      newStatus,
      notes,
      'الإدارة'
    );
    onRefreshData();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-amber-400">
            <Edit3 className="w-5 h-5" />
            <h3 className="text-lg font-bold text-white">✏️ تعديل وقت الحضور</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Employee details & Current state */}
        <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/50 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">الموظف:</span>
            <span className="font-bold text-white text-sm">{employee?.name || 'موظف'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">التاريخ:</span>
            <span className="font-mono text-cyan-300 font-bold">{record.date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">الوقت المسجل حالياً:</span>
            <span className="font-mono text-amber-400 font-bold">{formatArabicTime(record.check_in_time)}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* New Time Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>تعديل وقت الحضور إلى:</span>
            </label>
            <input
              type="time"
              required
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full bg-slate-800 text-cyan-300 font-mono text-lg font-bold px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* New Status Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">حالة الحضور:</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as AttendanceStatus)}
              className="w-full bg-slate-800 text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500 font-semibold"
            >
              <option value="present">🟢 في الموعد (حاضر)</option>
              <option value="late">🟡 متأخر</option>
              <option value="severe_late">🔴 تأخير شديد</option>
              <option value="absent">🔴 غائب</option>
              <option value="mission">🟣 مأمورية رسمية</option>
              <option value="leave">🔵 إجازة</option>
              <option value="off">⚪ راحة</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">سبب التعديل / ملاحظات:</label>
            <textarea
              rows={2}
              placeholder="مثال: تم تسجيل الوقت بالخطأ 9:20 والحضور الفعلي 9:05"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 text-slate-200 text-xs px-3.5 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Notice about audit log */}
          <div className="bg-amber-950/30 border border-amber-900/40 p-3 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-200/90">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>سيتم الاحتفاظ بالسجل الأصلي والسجل المعدل أوتوماتيكياً في سجل التعديلات (Audit Log) لمنع التغيير غير الموثق.</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold hover:from-amber-400 hover:to-orange-400 shadow-lg flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>[ حفظ التعديل ]</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
