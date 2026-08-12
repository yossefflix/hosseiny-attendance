export type EmployeeStatus = 'active' | 'inactive';

export type AttendanceStatus =
  | 'present'     // 🟢 في الموعد (حاضر)
  | 'late'        // 🟡 متأخر
  | 'severe_late' // 🔴 تأخير شديد
  | 'absent'      // 🔴 غائب
  | 'leave'       // 🔵 إجازة
  | 'mission'     // 🟣 مأمورية
  | 'off';        // ⚪ راحة

export interface Employee {
  id: string;
  name: string;
  phone: string;
  job_title: string;
  status: EmployeeStatus;
  created_at?: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string; // YYYY-MM-DD
  check_in_time: string; // HH:mm
  original_check_in_time?: string; // HH:mm
  status: AttendanceStatus;
  edited?: boolean;
  edited_at?: string;
  notes?: string;
  created_at?: string;
}

export interface AuditLog {
  id: string;
  attendance_id: string;
  employee_id: string;
  employee_name?: string;
  old_time?: string;
  new_time?: string;
  old_status?: string;
  new_status?: string;
  changed_by: string;
  changed_at: string;
}

export interface AdvanceRecord {
  id: string;
  employee_id: string;
  employee_name?: string;
  amount: number; // المبلغ المستلف
  date: string;   // تاريخ السلفة (YYYY-MM-DD)
  time?: string;   // وقت السلفة (HH:mm)
  notes?: string;  // ملاحظات
  created_at?: string;
}

export interface SystemSettings {
  work_start_time: string; // e.g. "09:00"
  late_start_time: string; // e.g. "10:00"
  severe_late_time: string; // e.g. "11:00"
  last_purge_date?: string; // تاريخ آخر تصفية للبيانات
}

