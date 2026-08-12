const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const next = require('next');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev });
const handle = app.getRequestHandler();

// Atomic File-Based Database Setup
const dbFilePath = path.join(__dirname, 'database.json');

const INITIAL_EMPLOYEES = [
  { id: 'emp-1', name: 'احمد سريع', phone: '', job_title: 'فني تكييف', status: 'active', created_at: new Date().toISOString() },
  { id: 'emp-2', name: 'محمد سمير', phone: '', job_title: 'فني تكييف', status: 'active', created_at: new Date().toISOString() },
  { id: 'emp-3', name: 'عمر حسن', phone: '', job_title: 'فني صيانة', status: 'active', created_at: new Date().toISOString() },
  { id: 'emp-4', name: 'شريف محمود', phone: '', job_title: 'فني تكييف', status: 'active', created_at: new Date().toISOString() },
  { id: 'emp-5', name: 'مؤمن', phone: '', job_title: 'مساعد فني', status: 'active', created_at: new Date().toISOString() },
  { id: 'emp-6', name: 'كريم عيد', phone: '', job_title: 'فني تركيبات', status: 'active', created_at: new Date().toISOString() },
  { id: 'emp-7', name: 'عمرو خالد', phone: '', job_title: 'مهندس تبريد وتكييف', status: 'active', created_at: new Date().toISOString() },
  { id: 'emp-8', name: 'سيد ربيع', phone: '', job_title: 'فني صيانة', status: 'active', created_at: new Date().toISOString() },
  { id: 'emp-9', name: 'خالد سيد', phone: '', job_title: 'فني تكييف', status: 'active', created_at: new Date().toISOString() },
  { id: 'emp-10', name: 'شريف احمد', phone: '', job_title: 'فني تركيبات', status: 'active', created_at: new Date().toISOString() },
  { id: 'emp-11', name: 'عبد الله ممدوح', phone: '', job_title: 'فني تكييف', status: 'active', created_at: new Date().toISOString() },
  { id: 'emp-12', name: 'احمد شعبان', phone: '', job_title: 'فني صيانة', status: 'active', created_at: new Date().toISOString() },
  { id: 'emp-13', name: 'محمود احمد', phone: '', job_title: 'مشرف موقع', status: 'active', created_at: new Date().toISOString() },
  { id: 'emp-14', name: 'احمد جلال', phone: '', job_title: 'فني تكييف', status: 'active', created_at: new Date().toISOString() },
  { id: 'emp-15', name: 'علاء هشام', phone: '', job_title: 'مهندس تبريد', status: 'active', created_at: new Date().toISOString() },
  { id: 'emp-16', name: 'عبد الرحمن حسن', phone: '', job_title: 'فني صيانة', status: 'active', created_at: new Date().toISOString() },
  { id: 'emp-17', name: 'اشرف ابراهيم', phone: '', job_title: 'فني تكييف', status: 'active', created_at: new Date().toISOString() },
  { id: 'emp-18', name: 'يوسف شعبان', phone: '', job_title: 'مساعد فني', status: 'active', created_at: new Date().toISOString() },
  { id: 'emp-19', name: 'يوسف احمد', phone: '', job_title: 'فني تركيبات', status: 'active', created_at: new Date().toISOString() },
  { id: 'emp-20', name: 'منار سيد', phone: '', job_title: 'إداري', status: 'active', created_at: new Date().toISOString() },
  { id: 'emp-21', name: 'زينب علي', phone: '', job_title: 'إداري', status: 'active', created_at: new Date().toISOString() },
  { id: 'emp-22', name: 'ملك ناصر', phone: '', job_title: 'إداري', status: 'active', created_at: new Date().toISOString() },
  { id: 'emp-23', name: 'حنين خميس', phone: '', job_title: 'إداري', status: 'active', created_at: new Date().toISOString() },
  { id: 'emp-24', name: 'لارا هيثم', phone: '', job_title: 'إداري', status: 'active', created_at: new Date().toISOString() },
];

function autoPurgeOldData(data) {
  if (!data.advances) data.advances = [];
  if (!data.attendance) data.attendance = [];
  if (!data.audit_logs) data.audit_logs = [];

  const NinetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(Date.now() - NinetyDaysMs);

  const initialAttCount = data.attendance.length;
  const initialAdvCount = data.advances.length;

  data.attendance = data.attendance.filter((rec) => {
    if (!rec.date) return true;
    const recDate = new Date(rec.date);
    return recDate >= cutoffDate;
  });

  data.advances = data.advances.filter((rec) => {
    if (!rec.date) return true;
    const recDate = new Date(rec.date);
    return recDate >= cutoffDate;
  });

  data.audit_logs = data.audit_logs.filter((log) => {
    if (!log.changed_at) return true;
    const logDate = new Date(log.changed_at);
    return logDate >= cutoffDate;
  });

  if (initialAttCount !== data.attendance.length || initialAdvCount !== data.advances.length) {
    if (!data.settings) data.settings = {};
    data.settings.last_purge_date = new Date().toISOString();
    console.log('🧹 Purged attendance and advances records older than 90 days (3 months).');
  }

  return data;
}

function loadDb() {
  if (!fs.existsSync(dbFilePath)) {
    const initialDb = {
      employees: INITIAL_EMPLOYEES,
      attendance: [],
      audit_logs: [],
      advances: [],
      settings: {
        work_start_time: '09:00',
        late_start_time: '10:00',
        severe_late_time: '11:00',
        last_purge_date: new Date().toISOString(),
      },
    };
    fs.writeFileSync(dbFilePath, JSON.stringify(initialDb, null, 2), 'utf8');
    return initialDb;
  }
  try {
    const content = fs.readFileSync(dbFilePath, 'utf8');
    let data = JSON.parse(content);
    if (!data.employees || data.employees.length === 0) {
      data.employees = INITIAL_EMPLOYEES;
    }
    if (!data.advances) {
      data.advances = [];
    }
    if (!data.settings) {
      data.settings = {
        work_start_time: '09:00',
        late_start_time: '10:00',
        severe_late_time: '11:00',
        last_purge_date: new Date().toISOString(),
      };
    }
    data = autoPurgeOldData(data);
    return data;
  } catch (err) {
    console.error('Error reading database file, resetting:', err);
    const initialDb = {
      employees: INITIAL_EMPLOYEES,
      attendance: [],
      audit_logs: [],
      advances: [],
      settings: {
        work_start_time: '09:00',
        late_start_time: '10:00',
        severe_late_time: '11:00',
        last_purge_date: new Date().toISOString(),
      },
    };
    fs.writeFileSync(dbFilePath, JSON.stringify(initialDb, null, 2), 'utf8');
    return initialDb;
  }
}

function saveDb(data) {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving database file:', err);
  }
}

app.prepare().then(() => {
  const expressApp = express();
  const server = http.createServer(expressApp);

  // Setup Socket.io Realtime Engine
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  expressApp.use(cors());
  expressApp.use(express.json());

  // Broadcast function to notify all connected clients instantly
  function broadcastUpdate(event = 'data_changed') {
    io.emit(event, { timestamp: Date.now() });
  }

  io.on('connection', (socket) => {
    console.log('⚡ Client connected to Socket.io WebSockets:', socket.id);
    socket.on('disconnect', () => {
      console.log('⚡ Client disconnected:', socket.id);
    });
  });

  // --- REST API ENDPOINTS ---

  // 1. EMPLOYEES
  expressApp.get('/api/employees', (req, res) => {
    const db = loadDb();
    res.json(db.employees);
  });

  expressApp.post('/api/employees', (req, res) => {
    const db = loadDb();
    const { id, name, phone, job_title, status } = req.body;
    const empId = id || `emp-${Date.now()}`;

    const existingIdx = db.employees.findIndex((e) => e.id === empId);
    const updatedEmp = {
      id: empId,
      name: name ? name.trim() : 'موظف',
      phone: phone ? phone.trim() : '',
      job_title: job_title ? job_title.trim() : 'فني تكييف',
      status: status || 'active',
      created_at: existingIdx !== -1 ? db.employees[existingIdx].created_at : new Date().toISOString(),
    };

    if (existingIdx !== -1) {
      db.employees[existingIdx] = updatedEmp;
    } else {
      db.employees.push(updatedEmp);
    }

    saveDb(db);
    broadcastUpdate();
    res.json(updatedEmp);
  });

  expressApp.put('/api/employees/:id/toggle', (req, res) => {
    const db = loadDb();
    const { id } = req.params;
    const emp = db.employees.find((e) => e.id === id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });

    emp.status = emp.status === 'active' ? 'inactive' : 'active';
    saveDb(db);
    broadcastUpdate();
    res.json({ success: true, status: emp.status });
  });

  expressApp.delete('/api/employees/:id', (req, res) => {
    const db = loadDb();
    const { id } = req.params;
    db.employees = db.employees.filter((e) => e.id !== id);
    saveDb(db);
    broadcastUpdate();
    res.json({ success: true });
  });

  // 2. ATTENDANCE
  expressApp.get('/api/attendance', (req, res) => {
    const db = loadDb();
    res.json(db.attendance);
  });

  expressApp.post('/api/attendance/checkin', (req, res) => {
    const db = loadDb();
    const { id, employee_id, date, check_in_time, original_check_in_time, status } = req.body;

    const existing = db.attendance.find((r) => r.employee_id === employee_id && r.date === date);
    if (existing) {
      return res.json({ success: false, isDuplicate: true, record: existing, existingTime: existing.check_in_time });
    }

    const recId = id || `att-${Date.now()}`;
    const newRecord = {
      id: recId,
      employee_id,
      date,
      check_in_time,
      original_check_in_time: original_check_in_time || check_in_time,
      status,
      edited: false,
      created_at: new Date().toISOString(),
    };

    db.attendance.push(newRecord);
    saveDb(db);
    broadcastUpdate();
    res.json({ success: true, record: newRecord });
  });

  expressApp.put('/api/attendance/edit', (req, res) => {
    const db = loadDb();
    const { recordId, newTime, newStatus, notes, changedBy } = req.body;
    const record = db.attendance.find((r) => r.id === recordId);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    const oldTime = record.check_in_time;
    const oldStatus = record.status;
    const editedAt = new Date().toISOString();

    record.original_check_in_time = record.original_check_in_time || oldTime;
    record.check_in_time = newTime;
    record.status = newStatus;
    record.edited = true;
    record.edited_at = editedAt;
    if (notes) record.notes = notes;

    const emp = db.employees.find((e) => e.id === record.employee_id);
    const auditLogRecord = {
      id: `log-${Date.now()}`,
      attendance_id: recordId,
      employee_id: record.employee_id,
      employee_name: emp ? emp.name : 'موظف',
      old_time: oldTime,
      new_time: newTime,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: changedBy || 'الإدارة',
      changed_at: editedAt,
    };

    db.audit_logs.unshift(auditLogRecord);
    saveDb(db);
    broadcastUpdate();
    res.json(record);
  });

  expressApp.post('/api/attendance/upsert', (req, res) => {
    const db = loadDb();
    const { id, employee_id, date, check_in_time, status, notes } = req.body;
    let record = db.attendance.find((r) => r.employee_id === employee_id && r.date === date);

    if (record) {
      record.status = status;
      record.check_in_time = check_in_time || '09:00';
      if (notes) record.notes = notes;
      record.edited = true;
      record.edited_at = new Date().toISOString();
    } else {
      record = {
        id: id || `att-${Date.now()}`,
        employee_id,
        date,
        check_in_time: check_in_time || '09:00',
        original_check_in_time: check_in_time || '09:00',
        status,
        notes,
        edited: true,
        created_at: new Date().toISOString(),
      };
      db.attendance.push(record);
    }

    saveDb(db);
    broadcastUpdate();
    res.json(record);
  });

  // 3. AUDIT LOGS
  expressApp.get('/api/audit-logs', (req, res) => {
    const db = loadDb();
    res.json(db.audit_logs);
  });

  // 4. SETTINGS
  expressApp.get('/api/settings', (req, res) => {
    const db = loadDb();
    res.json(db.settings);
  });

  expressApp.post('/api/settings', (req, res) => {
    const db = loadDb();
    const { work_start_time, late_start_time, severe_late_time } = req.body;
    db.settings = {
      ...db.settings,
      work_start_time: work_start_time || '09:00',
      late_start_time: late_start_time || '10:00',
      severe_late_time: severe_late_time || '11:00',
      updated_at: new Date().toISOString(),
    };
    saveDb(db);
    broadcastUpdate();
    res.json({ success: true });
  });

  // 5. ADVANCES (السلف المالية)
  expressApp.get('/api/advances', (req, res) => {
    const db = loadDb();
    res.json(db.advances || []);
  });

  expressApp.post('/api/advances', (req, res) => {
    const db = loadDb();
    const { employee_id, amount, date, time, notes } = req.body;

    const emp = db.employees.find((e) => e.id === employee_id);
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newAdvance = {
      id: `adv-${Date.now()}`,
      employee_id,
      employee_name: emp ? emp.name : 'موظف',
      amount: parseFloat(amount) || 0,
      date: date || todayStr,
      time: time || timeStr,
      notes: notes || '',
      created_at: now.toISOString(),
    };

    if (!db.advances) db.advances = [];
    db.advances.push(newAdvance);

    saveDb(db);
    broadcastUpdate();
    res.json(newAdvance);
  });

  expressApp.delete('/api/advances/:id', (req, res) => {
    const db = loadDb();
    const { id } = req.params;
    if (db.advances) {
      db.advances = db.advances.filter((a) => a.id !== id);
    }
    saveDb(db);
    broadcastUpdate();
    res.json({ success: true });
  });

  // 6. THREE MONTH DATA PURGE (تنظيف بيانات 3 شهور)
  expressApp.post('/api/purge-3months', (req, res) => {
    const db = loadDb();
    db.attendance = [];
    db.advances = [];
    db.audit_logs = [];
    if (!db.settings) db.settings = {};
    db.settings.last_purge_date = new Date().toISOString();

    saveDb(db);
    broadcastUpdate();
    res.json({ success: true, message: 'تم تصفية وبدء دورة 3 شهور جديدة بنجاح' });
  });

  // Next.js Handler for Frontend Pages (Express 5 compatible)
  expressApp.use((req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 El-Hosseiny Attendance Server running on http://localhost:${port}`);
  });
});
