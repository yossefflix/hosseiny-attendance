'use client';

import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from '@/components/Navbar';
import { DashboardView } from '@/components/DashboardView';
import { DailyReportView } from '@/components/DailyReportView';
import { MonthlyReportView } from '@/components/MonthlyReportView';
import { LateEmployeesView } from '@/components/LateEmployeesView';
import { EmployeesView } from '@/components/EmployeesView';
import { EmployeeProfileModal } from '@/components/EmployeeProfileModal';
import { EditAttendanceModal } from '@/components/EditAttendanceModal';
import { AuditLogView } from '@/components/AuditLogView';
import { SettingsView } from '@/components/SettingsView';
import { Employee, AttendanceRecord, AuditLog, SystemSettings } from '@/types';
import { AttendanceStore, getTodayDateString } from '@/lib/store';
import { PasswordGate } from '@/components/PasswordGate';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  
  // App State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(AttendanceStore.getSettings());

  // Modal States
  const [selectedProfileEmployee, setSelectedProfileEmployee] = useState<Employee | null>(null);
  const [editingAttendanceRecord, setEditingAttendanceRecord] = useState<AttendanceRecord | null>(null);

  // Today Date formatted in Arabic (e.g. الأحد 9 أغسطس 2026)
  const [todayArabicDateStr, setTodayArabicDateStr] = useState('');

  const loadData = async () => {
    // Immediate fallback display
    setEmployees(AttendanceStore.getEmployees());
    setAttendanceRecords(AttendanceStore.getAttendance());
    setAuditLogs(AttendanceStore.getAuditLogs());
    setSettings(AttendanceStore.getSettings());

    // Fetch latest live data from Supabase if configured
    const [fetchedEmps, fetchedAtt, fetchedLogs, fetchedSet] = await Promise.all([
      AttendanceStore.fetchEmployeesAsync(),
      AttendanceStore.fetchAttendanceAsync(),
      AttendanceStore.fetchAuditLogsAsync(),
      AttendanceStore.fetchSettingsAsync(),
    ]);

    setEmployees(fetchedEmps);
    setAttendanceRecords(fetchedAtt);
    setAuditLogs(fetchedLogs);
    setSettings(fetchedSet);
  };

  useEffect(() => {
    loadData();

    // Format Arabic Date
    const now = new Date();
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const dayName = days[now.getDay()];
    const dayNum = now.getDate();
    const monthName = months[now.getMonth()];
    const yearNum = now.getFullYear();

    setTodayArabicDateStr(`${dayName} ${dayNum} ${monthName} ${yearNum}`);

    // Live Realtime Subscriptions & Broadcast across all connected devices
    if (isSupabaseConfigured && supabase) {
      const client = supabase;

      const dbChannel = client
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          loadData();
        })
        .subscribe();

      const broadcastChannel = client
        .channel('hosseiny-live-broadcast')
        .on('broadcast', { event: 'data_changed' }, () => {
          loadData();
        })
        .subscribe();

      return () => {
        client.removeChannel(dbChannel);
        client.removeChannel(broadcastChannel);
      };
    }
  }, []);

  const handleOpenEditModal = (record: AttendanceRecord) => {
    setEditingAttendanceRecord(record);
  };

  const handleUpsertRecord = (empId: string, date: string, status: any) => {
    const rec = AttendanceStore.upsertAttendance(empId, date, status);
    loadData();
    return rec;
  };

  return (
    <PasswordGate>
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans" dir="rtl">
        {/* Navbar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          todayDateStr={todayArabicDateStr || 'الأحد 9 أغسطس 2026'}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              employees={employees}
              attendanceRecords={attendanceRecords}
              settings={settings}
              onRefreshData={loadData}
              onOpenEditModal={handleOpenEditModal}
            />
          )}

          {activeTab === 'daily_report' && (
            <DailyReportView
              employees={employees}
              attendanceRecords={attendanceRecords}
              onOpenEditModal={handleOpenEditModal}
              onUpsertRecord={handleUpsertRecord}
            />
          )}

          {activeTab === 'monthly_report' && (
            <MonthlyReportView
              employees={employees}
              attendanceRecords={attendanceRecords}
            />
          )}

          {activeTab === 'late_employees' && (
            <LateEmployeesView
              employees={employees}
              attendanceRecords={attendanceRecords}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeesView
              employees={employees}
              attendanceRecords={attendanceRecords}
              onRefreshData={loadData}
              onSelectEmployeeProfile={(emp) => setSelectedProfileEmployee(emp)}
            />
          )}

          {activeTab === 'audit_log' && (
            <AuditLogView auditLogs={auditLogs} />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onRefreshData={loadData}
            />
          )}
        </main>

        {/* Modals */}
        {selectedProfileEmployee && (
          <EmployeeProfileModal
            employee={selectedProfileEmployee}
            attendanceRecords={attendanceRecords}
            onClose={() => setSelectedProfileEmployee(null)}
            onOpenEditModal={(rec) => {
              setSelectedProfileEmployee(null);
              handleOpenEditModal(rec);
            }}
          />
        )}

        {editingAttendanceRecord && (
          <EditAttendanceModal
            record={editingAttendanceRecord}
            employees={employees}
            onClose={() => setEditingAttendanceRecord(null)}
            onRefreshData={loadData}
          />
        )}

        {/* Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
          <p>نظام حضور الحسيني للتكييف © 2026 - جاهز للنشر السحابي على Vercel و Supabase</p>
        </footer>
      </div>
    </PasswordGate>
  );
}
