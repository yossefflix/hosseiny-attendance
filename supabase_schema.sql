-- =========================================================
-- نظام حضور الحسيني للتكييف - Supabase Database Schema
-- =========================================================

-- إعادة إنشاء الجداول بنص المعرف (id TEXT) لتوافق الاتصال التام
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- 1. جدول الموظفين (employees)
CREATE TABLE employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    job_title TEXT NOT NULL DEFAULT 'فني تكييف',
    status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'inactive'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول الحضور والغياب (attendance)
CREATE TABLE attendance (
    id TEXT PRIMARY KEY,
    employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIME NOT NULL,
    original_check_in_time TIME,
    status TEXT NOT NULL, -- 'present' | 'late' | 'severe_late' | 'absent' | 'leave' | 'mission' | 'off'
    edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- 3. جدول سجل التعديلات (audit_logs)
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    attendance_id TEXT REFERENCES attendance(id) ON DELETE CASCADE,
    employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
    old_time TIME,
    new_time TIME,
    old_status TEXT,
    new_status TEXT,
    changed_by TEXT DEFAULT 'الإدارة',
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول الإعدادات (settings)
CREATE TABLE settings 
    id INT PRIMARY KEY DEFAULT 1,
    work_start_time TIME NOT NULL DEFAULT '09:00:00',
    late_start_time TIME NOT NULL DEFAULT '10:00:00',
    severe_late_time TIME NOT NULL DEFAULT '11:00:00',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- تفعيل سياسات الوصول (Row Level Security - RLS) للسماح بالقراءة والكتابة من الفرونت إند
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public employees access" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public attendance access" ON attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public audit_logs access" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public settings access" ON settings FOR ALL USING (true) WITH CHECK (true);

-- بيانات أولية افتراضية لمواعيد الدوام
INSERT INTO settings (id, work_start_time, late_start_time, severe_late_time)
VALUES (1, '09:00:00', '10:00:00', '11:00:00')
ON CONFLICT (id) DO NOTHING;

-- إضافة قائمة الـ 24 موظف بشركة الحسيني للتكييف
INSERT INTO employees (id, name, phone, job_title, status) VALUES
('emp-1', 'احمد سريع', '', 'فني تكييف', 'active'),
('emp-2', 'محمد سمير', '', 'فني تكييف', 'active'),
('emp-3', 'عمر حسن', '', 'فني صيانة', 'active'),
('emp-4', 'شريف محمود', '', 'فني تكييف', 'active'),
('emp-5', 'مؤمن', '', 'مساعد فني', 'active'),
('emp-6', 'كريم عيد', '', 'فني تركيبات', 'active'),
('emp-7', 'عمرو خالد', '', 'مهندس تبريد وتكييف', 'active'),
('emp-8', 'سيد ربيع', '', 'فني صيانة', 'active'),
('emp-9', 'خالد سيد', '', 'فني تكييف', 'active'),
('emp-10', 'شريف احمد', '', 'فني تركيبات', 'active'),
('emp-11', 'عبد الله ممدوح', '', 'فني تكييف', 'active'),
('emp-12', 'احمد شعبان', '', 'فني صيانة', 'active'),
('emp-13', 'محمود احمد', '', 'مشرف موقع', 'active'),
('emp-14', 'احمد جلال', '', 'فني تكييف', 'active'),
('emp-15', 'علاء هشام', '', 'مهندس تبريد', 'active'),
('emp-16', 'عبد الرحمن حسن', '', 'فني صيانة', 'active'),
('emp-17', 'اشرف ابراهيم', '', 'فني تكييف', 'active'),
('emp-18', 'يوسف شعبان', '', 'مساعد فني', 'active'),
('emp-19', 'يوسف احمد', '', 'فني تركيبات', 'active'),
('emp-20', 'منار سيد', '', 'إداري', 'active'),
('emp-21', 'زينب علي', '', 'إداري', 'active'),
('emp-22', 'ملك ناصر', '', 'إداري', 'active'),
('emp-23', 'حنين خميس', '', 'إداري', 'active'),
('emp-24', 'لارا هيثم', '', 'إداري', 'active')
ON CONFLICT (id) DO NOTHING;
