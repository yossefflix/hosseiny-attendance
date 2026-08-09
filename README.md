# ❄️ نظام حضور الحسيني للتكييف (El-Hosseiny Air Conditioning Attendance System)

تطبيق ويب حديث وفاخر باللغة العربية لإدارة وتوثيق حضور وغياب موظفي وفنيي مركز **الحسيني للتكييف**، مع دعم البناء المباشر للرفع على **Vercel** والربط بسحابة **Supabase (PostgreSQL)**.

---

## 🌟 المميزات والخصائص

1. **لوحة التحكم وحضور اليوم**:
   - عرض التاريخ التلقائي بالعربي (مثل: `الأحد 9 أغسطس 2026`).
   - بطاقات الإحصائيات الفورية: (إجمالي الموظفين، في الموعد 🟢، متأخر 🟡، تأخير شديد 🔴).
   - تسجيل الحضور الفوري بزر واحد `[ 🟢 تسجيل حضور ]`.
   - صناديق التنبيهات المباشرة لـ `🔴 تأخير شديد اليوم` و `🟡 المتأخرون اليوم`.
   - حماية منع الحضور المزدوج وتنبيه المستخدم عند المحاولة المكررة.

2. **تعديل الوقت وسجل التعديلات (Audit Log)**:
   - زر `✏️ تعديل الوقت` للتصحيح اليدوي.
   - حفظ تلقائي للـ Audit Log يحتفظ بالسجل الأصلي، السجل المعدل، اسم المستخدم، وتاريخ ووقت التعديل.

3. **تصنيف التأخير والإعدادات الديناميكية**:
   - موعد بداية العمل الرسمي (افتراضي: `09:00 AM`).
   - بداية التأخير (افتراضي: `10:00 AM`).
   - بداية التأخير الشديد (افتراضي: `11:00 AM`).

4. **التقارير اليومية والشهرية وتصدير Excel**:
   - **التقرير اليومي**: استعراض الحضور لأي تاريخ وتصدير ملف `attendance_YYYY-MM-DD.xlsx`.
   - **التقرير الشهري**: تجميع أيام الحضور، الغياب، التأخير، التأخير الشديد، و**متوسط وقت الحضور** لكل موظف مع تصدير `monthly_attendance_YYYY-MM.xlsx`.

5. **صفحة تحليل الموظفين الأكثر تأخيراً (⚠️ Late Employees)**:
   - ترتيب الموظفين حسب أكثرهم تأخيراً في الدوام لمساعدة الإدارة في التقييم.

6. **إدارة الموظفين**:
   - إضافة/تعديل/تنشيط/إيقاف/حذف الموظفين، واستعراض سجل الحضور الكامل لكل موظف.

---

## 🛠️ التقنيات المستعملة (Tech Stack)

- **Next.js 14 (App Router)**
- **TypeScript**
- **Tailwind CSS** (تصميم عربي كامل RTL)
- **Lucide Icons**
- **XLSX** (لتوليد شيتات Excel)
- **Supabase (PostgreSQL)** + **LocalStorage Fallback**

---

## 🗄️ إعداد قاعدة البيانات في Supabase

انسخ محتوى الملف `supabase_schema.sql` وشغّله في الـ **SQL Editor** بداخل مشروعك على [Supabase](https://supabase.com):

```sql
-- 1. جدول الموظفين
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    job_title TEXT NOT NULL DEFAULT 'فني تكييف',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول الحضور
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIME NOT NULL,
    original_check_in_time TIME,
    status TEXT NOT NULL,
    edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- 3. جدول سجل التدقيق
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

-- 4. جدول الإعدادات
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY DEFAULT 1,
    work_start_time TIME NOT NULL DEFAULT '09:00:00',
    late_start_time TIME NOT NULL DEFAULT '10:00:00',
    severe_late_time TIME NOT NULL DEFAULT '11:00:00',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🚀 الرفع على Vercel

1. اذهب إلى [Vercel.com](https://vercel.com) واعمل `Import` للمستودع:
   `yossefflix/hosseiny-attendance`
2. أضف متغيرات البيئة التالية:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. اضغط `Deploy`!
