'use client';

import React from 'react';
import { AuditLog } from '@/types';
import { History, ShieldCheck, Clock, User } from 'lucide-react';
import { formatArabicTime } from '@/lib/store';

interface AuditLogViewProps {
  auditLogs: AuditLog[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ auditLogs }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">سجل تدقيق التعديلات (Audit Log Trail)</h2>
            <p className="text-xs text-slate-400">توثيق كامل لكافة عمليات تعديل أوقات وحالات الحضور لضمان الشفافية وموثوقية البيانات</p>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-mono text-cyan-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>إجمالي التعديلات: {auditLogs.length}</span>
        </div>
      </div>

      {/* Log List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-800/90 text-slate-300 text-xs uppercase border-b border-slate-700">
              <tr>
                <th className="px-5 py-3.5 font-bold">الموظف</th>
                <th className="px-5 py-3.5 font-bold">الوقت الأصلي</th>
                <th className="px-5 py-3.5 font-bold">الوقت المعدل</th>
                <th className="px-5 py-3.5 font-bold">الحالة المعدلة</th>
                <th className="px-5 py-3.5 font-bold">المعدِل</th>
                <th className="px-5 py-3.5 font-bold">تاريخ ووقت التعديل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500 text-xs">
                    لم يتم إجراء أي تعديلات على أوقات الحضور حتى الآن
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-white">
                      {log.employee_name || 'موظف'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-rose-400 line-through text-xs">
                      {formatArabicTime(log.old_time)}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-emerald-400">
                      {formatArabicTime(log.new_time)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                        {log.new_status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{log.changed_by}</span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-400">
                      {new Date(log.changed_at).toLocaleString('ar-EG')}
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
