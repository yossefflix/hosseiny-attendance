-- =========================================================
-- نظام حضور الحسيني للتكييف - Supabase Database Schema
-- =========================================================

-- 1. جدول الموظفين (employees)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    job_title TEXT NOT NULL DEFAULT 'فني تكييف',
    status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'inactive'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول الحضور والغياب (attendance)
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID REFERENCES attendance(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    old_time TIME,
    new_time TIME,
    old_status TEXT,
    new_status TEXT,
    changed_by TEXT DEFAULT 'الإدارة',
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول الإعدادات (settings)
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY DEFAULT 1,
    work_start_time TIME NOT NULL DEFAULT '09:00:00',
    late_start_time TIME NOT NULL DEFAULT '10:00:00',
    severe_late_time TIME NOT NULL DEFAULT '11:00:00',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- بيانات أولية افتراضية للمشروع (Default Seed Data)
INSERT INTO settings (id, work_start_time, late_start_time, severe_late_time)
VALUES (1, '09:00:00', '10:00:00', '11:00:00')
ON CONFLICT (id) DO NOTHING;

-- إضافة الـ 24 موظف بشركة الحسيني للتكييف
INSERT INTO employees (name, phone, job_title, status) VALUES
('احمد سريع', '', 'فني تكييف', 'active'),
('محمد سمير', '', 'فني تكييف', 'active'),
('عمر حسن', '', 'فني صيانة', 'active'),
('شريف محمود', '', 'فني تكييف', 'active'),
('مؤمن', '', 'مساعد فني', 'active'),
('كريم عيد', '', 'فني تركيبات', 'active'),
('عمرو خالد', '', 'مهندس تبريد وتكييف', 'active'),
('سيد ربيع', '', 'فني صيانة', 'active'),
('خالد سيد', '', 'فني تكييف', 'active'),
('شريف احمد', '', 'فني تركيبات', 'active'),
('عبد الله ممدوح', '', 'فني تكييف', 'active'),
('احمد شعبان', '', 'فني صيانة', 'active'),
('محمود احمد', '', 'مشرف موقع', 'active'),
('احمد جلال', '', 'فني تكييف', 'active'),
('علاء هشام', '', 'مهندس تبريد', 'active'),
('عبد الرحمن حسن', '', 'فني صيانة', 'active'),
('اشرف ابراهيم', '', 'فني تكييف', 'active'),
('يوسف شعبان', '', 'مساعد فني', 'active'),
('يوسف احمد', '', 'فني تركيبات', 'active'),
('منار سيد', '', 'إداري', 'active'),
('زينب علي', '', 'إداري', 'active'),
('ملك ناصر', '', 'إداري', 'active'),
('حنين خميس', '', 'إداري', 'active'),
('لارا هيثم', '', 'إداري', 'active')
ON CONFLICT DO NOTHING;
