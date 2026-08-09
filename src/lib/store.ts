import { Employee, AttendanceRecord, AuditLog, SystemSettings, AttendanceStatus } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEYS = {
  EMPLOYEES: 'hosseiny_employees_v4',
  ATTENDANCE: 'hosseiny_attendance_v4',
  AUDIT_LOGS: 'hosseiny_audit_logs_v4',
  SETTINGS: 'hosseiny_settings_v4',
};

export const DEFAULT_SETTINGS: SystemSettings = {
  work_start_time: '09:00',
  late_start_time: '10:00',
  severe_late_time: '11:00',
};

const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'emp-1', name: 'احمد سريع', phone: '', job_title: 'فني تكييف', status: 'active' },
  { id: 'emp-2', name: 'محمد سمير', phone: '', job_title: 'فني تكييف', status: 'active' },
  { id: 'emp-3', name: 'عمر حسن', phone: '', job_title: 'فني صيانة', status: 'active' },
  { id: 'emp-4', name: 'شريف محمود', phone: '', job_title: 'فني تكييف', status: 'active' },
  { id: 'emp-5', name: 'مؤمن', phone: '', job_title: 'مساعد فني', status: 'active' },
  { id: 'emp-6', name: 'كريم عيد', phone: '', job_title: 'فني تركيبات', status: 'active' },
  { id: 'emp-7', name: 'عمرو خالد', phone: '', job_title: 'مهندس تبريد وتكييف', status: 'active' },
  { id: 'emp-8', name: 'سيد ربيع', phone: '', job_title: 'فني صيانة', status: 'active' },
  { id: 'emp-9', name: 'خالد سيد', phone: '', job_title: 'فني تكييف', status: 'active' },
  { id: 'emp-10', name: 'شريف احمد', phone: '', job_title: 'فني تركيبات', status: 'active' },
  { id: 'emp-11', name: 'عبد الله ممدوح', phone: '', job_title: 'فني تكييف', status: 'active' },
  { id: 'emp-12', name: 'احمد شعبان', phone: '', job_title: 'فني صيانة', status: 'active' },
  { id: 'emp-13', name: 'محمود احمد', phone: '', job_title: 'مشرف موقع', status: 'active' },
  { id: 'emp-14', name: 'احمد جلال', phone: '', job_title: 'فني تكييف', status: 'active' },
  { id: 'emp-15', name: 'علاء هشام', phone: '', job_title: 'مهندس تبريد', status: 'active' },
  { id: 'emp-16', name: 'عبد الرحمن حسن', phone: '', job_title: 'فني صيانة', status: 'active' },
  { id: 'emp-17', name: 'اشرف ابراهيم', phone: '', job_title: 'فني تكييف', status: 'active' },
  { id: 'emp-18', name: 'يوسف شعبان', phone: '', job_title: 'مساعد فني', status: 'active' },
  { id: 'emp-19', name: 'يوسف احمد', phone: '', job_title: 'فني تركيبات', status: 'active' },
  { id: 'emp-20', name: 'منار سيد', phone: '', job_title: 'إداري', status: 'active' },
  { id: 'emp-21', name: 'زينب علي', phone: '', job_title: 'إداري', status: 'active' },
  { id: 'emp-22', name: 'ملك ناصر', phone: '', job_title: 'إداري', status: 'active' },
  { id: 'emp-23', name: 'حنين خميس', phone: '', job_title: 'إداري', status: 'active' },
  { id: 'emp-24', name: 'لارا هيثم', phone: '', job_title: 'إداري', status: 'active' },
];

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

export function calculateAttendanceStatus(timeStr: string, settings: SystemSettings): AttendanceStatus {
  const checkInMin = timeToMinutes(timeStr);
  const lateMin = timeToMinutes(settings.late_start_time);
  const severeLateMin = timeToMinutes(settings.severe_late_time);

  if (checkInMin >= severeLateMin) {
    return 'severe_late';
  } else if (checkInMin >= lateMin) {
    return 'late';
  } else {
    return 'present';
  }
}

export function formatArabicTime(timeStr?: string): string {
  if (!timeStr) return '--:--';
  const parts = timeStr.split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  const ampm = h >= 12 ? 'م' : 'ص';
  h = h % 12;
  h = h ? h : 12;
  const formattedHour = String(h).padStart(2, '0');
  return `${formattedHour}:${m} ${ampm}`;
}

export class AttendanceStore {
  // --- ASYNC DATA FETCHING FROM SUPABASE ---
  static async fetchEmployeesAsync(): Promise<Employee[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('employees').select('*');
      if (!error && data && data.length > 0) {
        localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(data));
        return data as Employee[];
      }
    }
    return this.getEmployees();
  }

  static async fetchAttendanceAsync(): Promise<AttendanceRecord[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('attendance').select('*');
      if (!error && data) {
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(data));
        return data as AttendanceRecord[];
      }
    }
    return this.getAttendance();
  }

  static async fetchAuditLogsAsync(): Promise<AuditLog[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('audit_logs').select('*');
      if (!error && data) {
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(data));
        return data as AuditLog[];
      }
    }
    return this.getAuditLogs();
  }

  static async fetchSettingsAsync(): Promise<SystemSettings> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
      if (!error && data) {
        const fetched: SystemSettings = {
          work_start_time: data.work_start_time ? data.work_start_time.slice(0, 5) : '09:00',
          late_start_time: data.late_start_time ? data.late_start_time.slice(0, 5) : '10:00',
          severe_late_time: data.severe_late_time ? data.severe_late_time.slice(0, 5) : '11:00',
        };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(fetched));
        return fetched;
      }
    }
    return this.getSettings();
  }

  // --- SETTINGS ---
  static getSettings(): SystemSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) return DEFAULT_SETTINGS;
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(newSettings: SystemSettings): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    if (isSupabaseConfigured && supabase) {
      supabase.from('settings').upsert({
        id: 1,
        work_start_time: `${newSettings.work_start_time}:00`,
        late_start_time: `${newSettings.late_start_time}:00`,
        severe_late_time: `${newSettings.severe_late_time}:00`,
        updated_at: new Date().toISOString(),
      }).then();
    }
  }

  // --- EMPLOYEES ---
  static getEmployees(): Employee[] {
    if (typeof window === 'undefined') return INITIAL_EMPLOYEES;
    const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
      return INITIAL_EMPLOYEES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_EMPLOYEES;
    }
  }

  static saveEmployee(employee: Omit<Employee, 'id'> & { id?: string }): Employee {
    const employees = this.getEmployees();
    let savedEmployee: Employee;

    if (employee.id) {
      const index = employees.findIndex((e) => e.id === employee.id);
      if (index !== -1) {
        employees[index] = { ...employees[index], ...employee } as Employee;
        savedEmployee = employees[index];
      } else {
        savedEmployee = { ...employee, id: `emp-${Date.now()}` } as Employee;
        employees.push(savedEmployee);
      }
    } else {
      savedEmployee = {
        ...employee,
        id: `emp-${Date.now()}`,
        created_at: new Date().toISOString(),
      } as Employee;
      employees.push(savedEmployee);
    }

    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));

    if (isSupabaseConfigured && supabase) {
      supabase.from('employees').upsert({
        id: savedEmployee.id,
        name: savedEmployee.name,
        phone: savedEmployee.phone || '',
        job_title: savedEmployee.job_title,
        status: savedEmployee.status,
      }).then();
    }

    return savedEmployee;
  }

  static toggleEmployeeStatus(id: string): void {
    const employees = this.getEmployees();
    const employee = employees.find((e) => e.id === id);
    if (employee) {
      employee.status = employee.status === 'active' ? 'inactive' : 'active';
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
      if (isSupabaseConfigured && supabase) {
        supabase.from('employees').update({ status: employee.status }).eq('id', id).then();
      }
    }
  }

  static deleteEmployee(id: string): void {
    let employees = this.getEmployees();
    employees = employees.filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    if (isSupabaseConfigured && supabase) {
      supabase.from('employees').delete().eq('id', id).then();
    }
  }

  // --- ATTENDANCE ---
  static getAttendance(): AttendanceRecord[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static recordCheckIn(employeeId: string, date: string, customTime?: string): { success: boolean; record?: AttendanceRecord; isDuplicate?: boolean; existingTime?: string } {
    const allRecords = this.getAttendance();
    const existing = allRecords.find((r) => r.employee_id === employeeId && r.date === date);

    if (existing) {
      return {
        success: false,
        isDuplicate: true,
        record: existing,
        existingTime: existing.check_in_time,
      };
    }

    const checkInTime = customTime || getCurrentTimeString();
    const settings = this.getSettings();
    const status = calculateAttendanceStatus(checkInTime, settings);

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employee_id: employeeId,
      date,
      check_in_time: checkInTime,
      original_check_in_time: checkInTime,
      status,
      edited: false,
      created_at: new Date().toISOString(),
    };

    allRecords.push(newRecord);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(allRecords));

    if (isSupabaseConfigured && supabase) {
      supabase.from('attendance').insert({
        id: newRecord.id,
        employee_id: employeeId,
        date,
        check_in_time: `${checkInTime}:00`,
        original_check_in_time: `${checkInTime}:00`,
        status,
        edited: false,
      }).then();
    }

    return { success: true, record: newRecord };
  }

  static editAttendanceRecord(
    recordId: string,
    newTime: string,
    newStatus: AttendanceStatus,
    notes?: string,
    changedBy: string = 'الإدارة'
  ): AttendanceRecord | null {
    const allRecords = this.getAttendance();
    const record = allRecords.find((r) => r.id === recordId);
    if (!record) return null;

    const oldTime = record.check_in_time;
    const oldStatus = record.status;

    record.original_check_in_time = record.original_check_in_time || oldTime;
    record.check_in_time = newTime;
    record.status = newStatus;
    record.edited = true;
    record.edited_at = new Date().toISOString();
    if (notes) record.notes = notes;

    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(allRecords));

    const employees = this.getEmployees();
    const emp = employees.find((e) => e.id === record.employee_id);

    const auditLogRecord: AuditLog = {
      id: `log-${Date.now()}`,
      attendance_id: recordId,
      employee_id: record.employee_id,
      employee_name: emp ? emp.name : 'موظف',
      old_time: oldTime,
      new_time: newTime,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: changedBy,
      changed_at: new Date().toISOString(),
    };

    this.addAuditLog(auditLogRecord);

    if (isSupabaseConfigured && supabase) {
      supabase.from('attendance').update({
        check_in_time: `${newTime}:00`,
        status: newStatus,
        edited: true,
        edited_at: record.edited_at,
        notes: notes,
      }).eq('id', recordId).then();
    }

    return record;
  }

  static upsertAttendance(
    employeeId: string,
    date: string,
    status: AttendanceStatus,
    checkInTime: string = '09:00',
    notes?: string
  ): AttendanceRecord {
    const allRecords = this.getAttendance();
    let record = allRecords.find((r) => r.employee_id === employeeId && r.date === date);

    if (record) {
      record.status = status;
      record.check_in_time = checkInTime;
      record.notes = notes;
      record.edited = true;
      record.edited_at = new Date().toISOString();
    } else {
      record = {
        id: `att-${Date.now()}`,
        employee_id: employeeId,
        date,
        check_in_time: checkInTime,
        original_check_in_time: checkInTime,
        status,
        notes,
        created_at: new Date().toISOString(),
      };
      allRecords.push(record);
    }

    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(allRecords));

    if (isSupabaseConfigured && supabase) {
      supabase.from('attendance').upsert({
        id: record.id,
        employee_id: employeeId,
        date,
        check_in_time: `${checkInTime}:00`,
        original_check_in_time: `${checkInTime}:00`,
        status,
        edited: true,
        notes: notes,
      }).then();
    }

    return record;
  }

  // --- AUDIT LOGS ---
  static getAuditLogs(): AuditLog[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static addAuditLog(log: AuditLog): void {
    const logs = this.getAuditLogs();
    logs.unshift(log);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));

    if (isSupabaseConfigured && supabase) {
      supabase.from('audit_logs').insert({
        id: log.id,
        attendance_id: log.attendance_id,
        employee_id: log.employee_id,
        old_time: log.old_time ? `${log.old_time}:00` : null,
        new_time: log.new_time ? `${log.new_time}:00` : null,
        old_status: log.old_status,
        new_status: log.new_status,
        changed_by: log.changed_by,
      }).then();
    }
  }
}
