import { Employee, AttendanceRecord, AuditLog, SystemSettings, AttendanceStatus } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';

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

// Memory Cache during active session (NO LocalStorage Caching to prevent stale data)
let inMemoryEmployees: Employee[] = INITIAL_EMPLOYEES;
let inMemoryAttendance: AttendanceRecord[] = [];
let inMemoryAuditLogs: AuditLog[] = [];
let inMemorySettings: SystemSettings = DEFAULT_SETTINGS;

export class AttendanceStore {
  // --- DIRECT LIVE SUPABASE FETCHES (NO BROWSER CACHE) ---
  static async fetchEmployeesAsync(): Promise<Employee[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: true });
      if (!error && data) {
        inMemoryEmployees = data as Employee[];
        return inMemoryEmployees;
      }
    }
    return inMemoryEmployees;
  }

  static async fetchAttendanceAsync(): Promise<AttendanceRecord[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('attendance').select('*').order('created_at', { ascending: true });
      if (!error && data) {
        // Strip seconds if present in check_in_time
        inMemoryAttendance = data.map((item: any) => ({
          ...item,
          check_in_time: item.check_in_time ? item.check_in_time.slice(0, 5) : '09:00',
          original_check_in_time: item.original_check_in_time ? item.original_check_in_time.slice(0, 5) : item.check_in_time?.slice(0, 5),
        })) as AttendanceRecord[];
        return inMemoryAttendance;
      }
    }
    return inMemoryAttendance;
  }

  static async fetchAuditLogsAsync(): Promise<AuditLog[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('audit_logs').select('*').order('changed_at', { ascending: false });
      if (!error && data) {
        inMemoryAuditLogs = data as AuditLog[];
        return inMemoryAuditLogs;
      }
    }
    return inMemoryAuditLogs;
  }

  static async fetchSettingsAsync(): Promise<SystemSettings> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
      if (!error && data) {
        inMemorySettings = {
          work_start_time: data.work_start_time ? data.work_start_time.slice(0, 5) : '09:00',
          late_start_time: data.late_start_time ? data.late_start_time.slice(0, 5) : '10:00',
          severe_late_time: data.severe_late_time ? data.severe_late_time.slice(0, 5) : '11:00',
        };
        return inMemorySettings;
      }
    }
    return inMemorySettings;
  }

  // Synchronous getters (read from in-memory session)
  static getEmployees(): Employee[] {
    return inMemoryEmployees;
  }

  static getAttendance(): AttendanceRecord[] {
    return inMemoryAttendance;
  }

  static getAuditLogs(): AuditLog[] {
    return inMemoryAuditLogs;
  }

  static getSettings(): SystemSettings {
    return inMemorySettings;
  }

  // --- LIVE SUPABASE MUTATIONS ---
  static async saveSettings(newSettings: SystemSettings): Promise<void> {
    inMemorySettings = newSettings;
    if (isSupabaseConfigured && supabase) {
      await supabase.from('settings').upsert({
        id: 1,
        work_start_time: `${newSettings.work_start_time}:00`,
        late_start_time: `${newSettings.late_start_time}:00`,
        severe_late_time: `${newSettings.severe_late_time}:00`,
        updated_at: new Date().toISOString(),
      });
    }
  }

  static async saveEmployee(employee: Omit<Employee, 'id'> & { id?: string }): Promise<Employee> {
    let savedEmployee: Employee;

    if (employee.id) {
      const index = inMemoryEmployees.findIndex((e) => e.id === employee.id);
      if (index !== -1) {
        inMemoryEmployees[index] = { ...inMemoryEmployees[index], ...employee } as Employee;
        savedEmployee = inMemoryEmployees[index];
      } else {
        savedEmployee = { ...employee, id: `emp-${Date.now()}` } as Employee;
        inMemoryEmployees.push(savedEmployee);
      }
    } else {
      savedEmployee = {
        ...employee,
        id: `emp-${Date.now()}`,
        created_at: new Date().toISOString(),
      } as Employee;
      inMemoryEmployees.push(savedEmployee);
    }

    if (isSupabaseConfigured && supabase) {
      await supabase.from('employees').upsert({
        id: savedEmployee.id,
        name: savedEmployee.name,
        phone: savedEmployee.phone || '',
        job_title: savedEmployee.job_title,
        status: savedEmployee.status,
      });
    }

    return savedEmployee;
  }

  static async toggleEmployeeStatus(id: string): Promise<void> {
    const employee = inMemoryEmployees.find((e) => e.id === id);
    if (employee) {
      employee.status = employee.status === 'active' ? 'inactive' : 'active';
      if (isSupabaseConfigured && supabase) {
        await supabase.from('employees').update({ status: employee.status }).eq('id', id);
      }
    }
  }

  static async deleteEmployee(id: string): Promise<void> {
    inMemoryEmployees = inMemoryEmployees.filter((e) => e.id !== id);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('employees').delete().eq('id', id);
    }
  }

  static async recordCheckIn(employeeId: string, date: string, customTime?: string): Promise<{ success: boolean; record?: AttendanceRecord; isDuplicate?: boolean; existingTime?: string }> {
    const existing = inMemoryAttendance.find((r) => r.employee_id === employeeId && r.date === date);

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

    inMemoryAttendance.push(newRecord);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('attendance').insert({
        id: newRecord.id,
        employee_id: employeeId,
        date,
        check_in_time: `${checkInTime}:00`,
        original_check_in_time: `${checkInTime}:00`,
        status,
        edited: false,
      });
    }

    return { success: true, record: newRecord };
  }

  static async editAttendanceRecord(
    recordId: string,
    newTime: string,
    newStatus: AttendanceStatus,
    notes?: string,
    changedBy: string = 'الإدارة'
  ): Promise<AttendanceRecord | null> {
    const record = inMemoryAttendance.find((r) => r.id === recordId);
    if (!record) return null;

    const oldTime = record.check_in_time;
    const oldStatus = record.status;

    record.original_check_in_time = record.original_check_in_time || oldTime;
    record.check_in_time = newTime;
    record.status = newStatus;
    record.edited = true;
    record.edited_at = new Date().toISOString();
    if (notes) record.notes = notes;

    const emp = inMemoryEmployees.find((e) => e.id === record.employee_id);

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

    await this.addAuditLog(auditLogRecord);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('attendance').update({
        check_in_time: `${newTime}:00`,
        status: newStatus,
        edited: true,
        edited_at: record.edited_at,
        notes: notes,
      }).eq('id', recordId);
    }

    return record;
  }

  static async upsertAttendance(
    employeeId: string,
    date: string,
    status: AttendanceStatus,
    checkInTime: string = '09:00',
    notes?: string
  ): Promise<AttendanceRecord> {
    let record = inMemoryAttendance.find((r) => r.employee_id === employeeId && r.date === date);

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
      inMemoryAttendance.push(record);
    }

    if (isSupabaseConfigured && supabase) {
      await supabase.from('attendance').upsert({
        id: record.id,
        employee_id: employeeId,
        date,
        check_in_time: `${checkInTime}:00`,
        original_check_in_time: `${checkInTime}:00`,
        status,
        edited: true,
        notes: notes,
      });
    }

    return record;
  }

  static async addAuditLog(log: AuditLog): Promise<void> {
    inMemoryAuditLogs.unshift(log);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('audit_logs').insert({
        id: log.id,
        attendance_id: log.attendance_id,
        employee_id: log.employee_id,
        old_time: log.old_time ? `${log.old_time}:00` : null,
        new_time: log.new_time ? `${log.new_time}:00` : null,
        old_status: log.old_status,
        new_status: log.new_status,
        changed_by: log.changed_by,
      });
    }
  }
}
