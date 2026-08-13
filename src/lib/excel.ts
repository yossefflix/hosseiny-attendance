import * as XLSX from 'xlsx';
import { AttendanceRecord, Employee, SystemSettings, AttendanceStatus } from '@/types';
import { formatArabicTime, timeToMinutes } from './store';

const STATUS_ARABIC_MAP: Record<AttendanceStatus, string> = {
  present: '🟢 حاضر (في الموعد)',
  late: '🟡 متأخر',
  severe_late: '🔴 تأخير شديد',
  absent: '🔴 غائب',
  leave: '🔵 إجازة',
  mission: '🟣 مأمورية',
  off: '⚪ راحة',
};

// Generate Daily Attendance Excel
export function exportDailyAttendanceExcel(
  dateStr: string,
  employees: Employee[],
  attendanceRecords: AttendanceRecord[]
) {
  const activeEmployees = employees.filter((e) => e.status === 'active');
  const recordsMap = new Map<string, AttendanceRecord>();
  attendanceRecords.forEach((r) => {
    if (r.date === dateStr) {
      recordsMap.set(r.employee_id, r);
    }
  });

  let presentCount = 0;
  let lateCount = 0;
  let severeLateCount = 0;
  let absentCount = 0;
  let missionCount = 0;
  let leaveCount = 0;

  const rows = activeEmployees.map((emp, index) => {
    const rec = recordsMap.get(emp.id);
    const status = rec ? rec.status : 'absent';
    const checkInTime = rec ? formatArabicTime(rec.check_in_time) : 'لم يسجل';
    const statusText = STATUS_ARABIC_MAP[status];
    const editedText = rec?.edited ? `نعم (الأصلي: ${formatArabicTime(rec.original_check_in_time)})` : 'لا';

    if (status === 'present') presentCount++;
    else if (status === 'late') lateCount++;
    else if (status === 'severe_late') severeLateCount++;
    else if (status === 'absent') absentCount++;
    else if (status === 'mission') missionCount++;
    else if (status === 'leave') leaveCount++;

    return {
      '#': index + 1,
      'اسم الموظف': emp.name,
      'الوظيفة': emp.job_title,
      'رقم الهاتف': emp.phone || '-',
      'وقت الحضور': checkInTime,
      'حالة الحضور': statusText,
      'ملاحظات / التعديل': editedText,
    };
  });

  // Summary Rows
  const summaryData = [
    { 'التقرير': 'نظام حضور الحسيني للتكييف - التقرير اليومي', 'القيمة': dateStr },
    { 'التقرير': 'إجمالي الموظفين النشطين', 'القيمة': activeEmployees.length },
    { 'التقرير': 'حاضر (في الموعد)', 'القيمة': presentCount },
    { 'التقرير': 'متأخر', 'القيمة': lateCount },
    { 'التقرير': 'تأخير شديد (بعد 11:00)', 'القيمة': severeLateCount },
    { 'التقرير': 'غائب', 'القيمة': absentCount },
    { 'التقرير': 'مأمورية خارجية', 'القيمة': missionCount },
    { 'التقرير': 'إجازة', 'القيمة': leaveCount },
  ];

  const workbook = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'ملخص اليوم');

  const mainSheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, mainSheet, 'سجل الحضور اليومي');

  XLSX.writeFile(workbook, `attendance_${dateStr}.xlsx`);
}

// Generate Monthly Report Excel
export function exportMonthlyAttendanceExcel(
  yearMonth: string, // YYYY-MM
  employees: Employee[],
  attendanceRecords: AttendanceRecord[]
) {
  const activeEmployees = employees.filter((e) => e.status === 'active');
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  // Filter records for that month
  const monthRecords = attendanceRecords.filter((r) => r.date.startsWith(yearMonth));

  // Compute metrics per employee
  const summaryRows = activeEmployees.map((emp, idx) => {
    const empRecords = monthRecords.filter((r) => r.employee_id === emp.id);

    let presentDays = 0;
    let lateDays = 0;
    let severeLateDays = 0;
    let absentDays = 0;
    let leaveDays = 0;
    let missionDays = 0;
    let totalCheckInMinutes = 0;
    let checkInCount = 0;

    empRecords.forEach((r) => {
      if (r.status === 'present') presentDays++;
      else if (r.status === 'late') lateDays++;
      else if (r.status === 'severe_late') severeLateDays++;
      else if (r.status === 'absent') absentDays++;
      else if (r.status === 'leave') leaveDays++;
      else if (r.status === 'mission') missionDays++;

      if (['present', 'late', 'severe_late'].includes(r.status) && r.check_in_time) {
        totalCheckInMinutes += timeToMinutes(r.check_in_time);
        checkInCount++;
      }
    });

    let avgTimeStr = '--:--';
    if (checkInCount > 0) {
      const avgMinutes = Math.round(totalCheckInMinutes / checkInCount);
      const avgH = Math.floor(avgMinutes / 60);
      const avgM = avgMinutes % 60;
      avgTimeStr = formatArabicTime(`${String(avgH).padStart(2, '0')}:${String(avgM).padStart(2, '0')}`);
    }

    return {
      '#': idx + 1,
      'اسم الموظف': emp.name,
      'الوظيفة': emp.job_title,
      'أيام الحضور (في الموعد)': presentDays,
      'مرات التأخير (10-11)': lateDays,
      'تأخير شديد (بعد 11)': severeLateDays,
      'أيام الغياب': absentDays,
      'مأموريات': missionDays,
      'إجازات': leaveDays,
      'متوسط وقت الحضور': avgTimeStr,
    };
  });

  const workbook = XLSX.utils.book_new();
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(workbook, summarySheet, `ملخص شهر ${month}-${year}`);

  XLSX.writeFile(workbook, `monthly_attendance_${yearMonth}.xlsx`);
}

// Generate Advances Excel Report
export function exportAdvancesToExcel(advances: any[], employees: Employee[]) {
  const empMap = new Map<string, Employee>();
  employees.forEach((e) => empMap.set(e.id, e));

  const rows = advances.map((adv, idx) => {
    const emp = empMap.get(adv.employee_id);
    return {
      '#': idx + 1,
      'اسم الموظف': adv.employee_name || emp?.name || 'موظف',
      'الوظيفة': emp?.job_title || '-',
      'مبلغ السلفة (ج.م)': adv.amount || 0,
      'تاريخ السلفة': adv.date || '-',
      'وقت التسجيل': adv.time ? formatArabicTime(adv.time) : '-',
      'الملاحظات': adv.notes || '-',
    };
  });

  const totalAmount = advances.reduce((sum, a) => sum + (a.amount || 0), 0);

  const summaryRows = [
    { 'البيان': 'إجمالي عدد السلف المسجلة', 'القيمة': advances.length },
    { 'البيان': 'إجمالي مبالغ السلف (ج.م)', 'القيمة': totalAmount },
    { 'البيان': 'تاريخ استخراج التقرير', 'القيمة': new Date().toLocaleDateString('ar-EG') },
  ];

  const workbook = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'ملخص السلف');

  const mainSheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, mainSheet, 'سجل السلف التفصيلي');

  XLSX.writeFile(workbook, `advances_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// Generate Deductions Excel Report
export function exportDeductionsToExcel(deductions: any[], employees: Employee[]) {
  const empMap = new Map<string, Employee>();
  employees.forEach((e) => empMap.set(e.id, e));

  const rows = deductions.map((ded, idx) => {
    const emp = empMap.get(ded.employee_id);
    return {
      '#': idx + 1,
      'اسم الموظف': ded.employee_name || emp?.name || 'موظف',
      'الوظيفة': emp?.job_title || '-',
      'مبلغ الخصم (ج.م)': ded.amount || 0,
      'عدد أيام الخصم': ded.days || 0,
      'سبب الخصم': ded.reason || '-',
      'تاريخ الخصم': ded.date || '-',
      'وقت التسجيل': ded.time ? formatArabicTime(ded.time) : '-',
    };
  });

  const totalAmount = deductions.reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalDays = deductions.reduce((sum, d) => sum + (d.days || 0), 0);

  const summaryRows = [
    { 'البيان': 'إجمالي عدد الخصومات المسجلة', 'القيمة': deductions.length },
    { 'البيان': 'إجمالي مبالغ الخصومات (ج.م)', 'القيمة': totalAmount },
    { 'البيان': 'إجمالي الأيام المخصومة', 'القيمة': totalDays },
    { 'البيان': 'تاريخ استخراج التقرير', 'القيمة': new Date().toLocaleDateString('ar-EG') },
  ];

  const workbook = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'ملخص الخصومات');

  const mainSheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, mainSheet, 'سجل الخصومات التفصيلي');

  XLSX.writeFile(workbook, `deductions_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

