const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const next = require('next');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev });
const handle = app.getRequestHandler();

// SQLite Database Setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening SQLite database:', err);
  } else {
    console.log('🟢 Connected to local SQLite database:', dbPath);
  }
});

// Helper for Promisified SQLite Database Queries
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Initialize Tables & Seed 24 Employees
async function initDatabase() {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      job_title TEXT NOT NULL DEFAULT 'فني تكييف',
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      date TEXT NOT NULL,
      check_in_time TEXT NOT NULL,
      original_check_in_time TEXT,
      status TEXT NOT NULL,
      edited INTEGER DEFAULT 0,
      edited_at TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, date)
    );
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      attendance_id TEXT,
      employee_id TEXT,
      employee_name TEXT,
      old_time TEXT,
      new_time TEXT,
      old_status TEXT,
      new_status TEXT,
      changed_by TEXT DEFAULT 'الإدارة',
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      work_start_time TEXT NOT NULL DEFAULT '09:00',
      late_start_time TEXT NOT NULL DEFAULT '10:00',
      severe_late_time TEXT NOT NULL DEFAULT '11:00',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default settings if empty
  const settingsCount = await dbGet('SELECT COUNT(*) as count FROM settings');
  if (settingsCount.count === 0) {
    await dbRun(
      'INSERT INTO settings (id, work_start_time, late_start_time, severe_late_time) VALUES (1, "09:00", "10:00", "11:00")'
    );
  }

  // Seed 24 El-Hosseiny Air Conditioning Employees if empty
  const empCount = await dbGet('SELECT COUNT(*) as count FROM employees');
  if (empCount.count === 0) {
    const initialEmps = [
      ['emp-1', 'احمد سريع', '', 'فني تكييف', 'active'],
      ['emp-2', 'محمد سمير', '', 'فني تكييف', 'active'],
      ['emp-3', 'عمر حسن', '', 'فني صيانة', 'active'],
      ['emp-4', 'شريف محمود', '', 'فني تكييف', 'active'],
      ['emp-5', 'مؤمن', '', 'مساعد فني', 'active'],
      ['emp-6', 'كريم عيد', '', 'فني تركيبات', 'active'],
      ['emp-7', 'عمرو خالد', '', 'مهندس تبريد وتكييف', 'active'],
      ['emp-8', 'سيد ربيع', '', 'فني صيانة', 'active'],
      ['emp-9', 'خالد سيد', '', 'فني تكييف', 'active'],
      ['emp-10', 'شريف احمد', '', 'فني تركيبات', 'active'],
      ['emp-11', 'عبد الله ممدوح', '', 'فني تكييف', 'active'],
      ['emp-12', 'احمد شعبان', '', 'فني صيانة', 'active'],
      ['emp-13', 'محمود احمد', '', 'مشرف موقع', 'active'],
      ['emp-14', 'احمد جلال', '', 'فني تكييف', 'active'],
      ['emp-15', 'علاء هشام', '', 'مهندس تبريد', 'active'],
      ['emp-16', 'عبد الرحمن حسن', '', 'فني صيانة', 'active'],
      ['emp-17', 'اشرف ابراهيم', '', 'فني تكييف', 'active'],
      ['emp-18', 'يوسف شعبان', '', 'مساعد فني', 'active'],
      ['emp-19', 'يوسف احمد', '', 'فني تركيبات', 'active'],
      ['emp-20', 'منار سيد', '', 'إداري', 'active'],
      ['emp-21', 'زينب علي', '', 'إداري', 'active'],
      ['emp-22', 'ملك ناصر', '', 'إداري', 'active'],
      ['emp-23', 'حنين خميس', '', 'إداري', 'active'],
      ['emp-24', 'لارا هيثم', '', 'إداري', 'active'],
    ];

    for (const emp of initialEmps) {
      await dbRun(
        'INSERT OR IGNORE INTO employees (id, name, phone, job_title, status) VALUES (?, ?, ?, ?, ?)',
        emp
      );
    }
  }

  console.log('🟢 Database initialized with 24 El-Hosseiny Air Conditioning employees!');
}

app.prepare().then(async () => {
  await initDatabase();

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
  expressApp.get('/api/employees', async (req, res) => {
    try {
      const employees = await dbAll('SELECT * FROM employees ORDER BY rowid ASC');
      res.json(employees);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  expressApp.post('/api/employees', async (req, res) => {
    try {
      const { id, name, phone, job_title, status } = req.body;
      const empId = id || `emp-${Date.now()}`;
      await dbRun(
        `INSERT INTO employees (id, name, phone, job_title, status) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name=excluded.name, phone=excluded.phone, job_title=excluded.job_title, status=excluded.status`,
        [empId, name, phone || '', job_title || 'فني تكييف', status || 'active']
      );
      broadcastUpdate();
      const saved = await dbGet('SELECT * FROM employees WHERE id = ?', [empId]);
      res.json(saved);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  expressApp.put('/api/employees/:id/toggle', async (req, res) => {
    try {
      const { id } = req.params;
      const emp = await dbGet('SELECT * FROM employees WHERE id = ?', [id]);
      if (!emp) return res.status(404).json({ error: 'Employee not found' });

      const newStatus = emp.status === 'active' ? 'inactive' : 'active';
      await dbRun('UPDATE employees SET status = ? WHERE id = ?', [newStatus, id]);
      broadcastUpdate();
      res.json({ success: true, status: newStatus });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  expressApp.delete('/api/employees/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await dbRun('DELETE FROM employees WHERE id = ?', [id]);
      broadcastUpdate();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. ATTENDANCE
  expressApp.get('/api/attendance', async (req, res) => {
    try {
      const records = await dbAll('SELECT * FROM attendance ORDER BY date DESC, check_in_time ASC');
      // Normalize boolean edited
      const formatted = records.map((r) => ({
        ...r,
        edited: Boolean(r.edited),
      }));
      res.json(formatted);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  expressApp.post('/api/attendance/checkin', async (req, res) => {
    try {
      const { id, employee_id, date, check_in_time, original_check_in_time, status } = req.body;
      const existing = await dbGet('SELECT * FROM attendance WHERE employee_id = ? AND date = ?', [
        employee_id,
        date,
      ]);

      if (existing) {
        return res.json({ success: false, isDuplicate: true, record: existing, existingTime: existing.check_in_time });
      }

      const recId = id || `att-${Date.now()}`;
      await dbRun(
        `INSERT INTO attendance (id, employee_id, date, check_in_time, original_check_in_time, status, edited)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [recId, employee_id, date, check_in_time, original_check_in_time || check_in_time, status]
      );
      broadcastUpdate();
      const created = await dbGet('SELECT * FROM attendance WHERE id = ?', [recId]);
      res.json({ success: true, record: created });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  expressApp.put('/api/attendance/edit', async (req, res) => {
    try {
      const { recordId, newTime, newStatus, notes, changedBy } = req.body;
      const record = await dbGet('SELECT * FROM attendance WHERE id = ?', [recordId]);
      if (!record) return res.status(404).json({ error: 'Record not found' });

      const oldTime = record.check_in_time;
      const oldStatus = record.status;
      const origTime = record.original_check_in_time || oldTime;
      const editedAt = new Date().toISOString();

      await dbRun(
        `UPDATE attendance SET check_in_time = ?, original_check_in_time = ?, status = ?, edited = 1, edited_at = ?, notes = ? WHERE id = ?`,
        [newTime, origTime, newStatus, editedAt, notes || '', recordId]
      );

      // Audit Log
      const emp = await dbGet('SELECT name FROM employees WHERE id = ?', [record.employee_id]);
      const logId = `log-${Date.now()}`;
      await dbRun(
        `INSERT INTO audit_logs (id, attendance_id, employee_id, employee_name, old_time, new_time, old_status, new_status, changed_by, changed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          logId,
          recordId,
          record.employee_id,
          emp ? emp.name : 'موظف',
          oldTime,
          newTime,
          oldStatus,
          newStatus,
          changedBy || 'الإدارة',
          editedAt,
        ]
      );

      broadcastUpdate();
      const updated = await dbGet('SELECT * FROM attendance WHERE id = ?', [recordId]);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  expressApp.post('/api/attendance/upsert', async (req, res) => {
    try {
      const { id, employee_id, date, check_in_time, status, notes } = req.body;
      const recId = id || `att-${Date.now()}`;
      await dbRun(
        `INSERT INTO attendance (id, employee_id, date, check_in_time, original_check_in_time, status, edited, notes)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?)
         ON CONFLICT(employee_id, date) DO UPDATE SET
           status = excluded.status,
           check_in_time = excluded.check_in_time,
           notes = excluded.notes,
           edited = 1,
           edited_at = CURRENT_TIMESTAMP`,
        [recId, employee_id, date, check_in_time || '09:00', check_in_time || '09:00', status, notes || '']
      );
      broadcastUpdate();
      const result = await dbGet('SELECT * FROM attendance WHERE employee_id = ? AND date = ?', [employee_id, date]);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. AUDIT LOGS
  expressApp.get('/api/audit-logs', async (req, res) => {
    try {
      const logs = await dbAll('SELECT * FROM audit_logs ORDER BY changed_at DESC');
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. SETTINGS
  expressApp.get('/api/settings', async (req, res) => {
    try {
      const settings = await dbGet('SELECT * FROM settings WHERE id = 1');
      res.json(
        settings || {
          work_start_time: '09:00',
          late_start_time: '10:00',
          severe_late_time: '11:00',
        }
      );
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  expressApp.post('/api/settings', async (req, res) => {
    try {
      const { work_start_time, late_start_time, severe_late_time } = req.body;
      await dbRun(
        `INSERT INTO settings (id, work_start_time, late_start_time, severe_late_time, updated_at)
         VALUES (1, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET
           work_start_time = excluded.work_start_time,
           late_start_time = excluded.late_start_time,
           severe_late_time = excluded.severe_late_time,
           updated_at = CURRENT_TIMESTAMP`,
        [work_start_time, late_start_time, severe_late_time]
      );
      broadcastUpdate();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Next.js Handler for Frontend Pages
  expressApp.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`🚀 El-Hosseiny Attendance Server running on http://localhost:${port}`);
  });
});
