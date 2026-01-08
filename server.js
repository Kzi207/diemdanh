const http = require('http');
const fs = require('fs');
const path = require('path');

// ===== CONFIG =====
const PORT = 4000;
const DATA_DIR = path.join(__dirname, "data");
const LEGACY_DB_PATH = path.join(__dirname, "db.json");

// Danh sách các bảng dữ liệu
const COLLECTIONS = ['users', 'classes', 'students', 'subjects', 'activities', 'attendance'];

// Định nghĩa Schema để nén dữ liệu (Object -> Array)
// Giúp giảm dung lượng file khoảng 50-60% cho các bảng nhiều dữ liệu
const COMPRESSION_SCHEMAS = {
    students: ['id', 'lastName', 'firstName', 'dob', 'classId'],
    attendance: ['id', 'activityId', 'studentId', 'timestamp']
};

// ===== DATA COMPRESSION HELPERS =====

// Chuyển đổi Object -> Array để lưu file
function pack(name, data) {
    const keys = COMPRESSION_SCHEMAS[name];
    // Chỉ nén nếu có schema và dữ liệu chưa bị nén (check phần tử đầu tiên)
    if (!keys || !data.length || Array.isArray(data[0])) return data;
    
    return data.map(item => keys.map(k => item[k]));
}

// Chuyển đổi Array -> Object để App sử dụng
function unpack(name, data) {
    const keys = COMPRESSION_SCHEMAS[name];
    // Chỉ giải nén nếu có schema và dữ liệu đang ở dạng nén (Array)
    if (!keys || !data.length || !Array.isArray(data[0])) return data;

    return data.map(row => {
        const obj = {};
        keys.forEach((k, i) => obj[k] = row[i]);
        return obj;
    });
}

// ===== INIT & MIGRATION =====
function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
    console.log("Created 'data' directory.");
  }

  // Migration: Tách db.json cũ nếu có
  if (fs.existsSync(LEGACY_DB_PATH)) {
    console.log("Migrating legacy db.json...");
    try {
      const oldData = JSON.parse(fs.readFileSync(LEGACY_DB_PATH, 'utf8'));
      COLLECTIONS.forEach(col => {
        const filePath = path.join(DATA_DIR, `${col}.json`);
        if (!fs.existsSync(filePath)) {
          const data = oldData[col] || [];
          // Lưu dạng nén ngay lập tức
          fs.writeFileSync(filePath, JSON.stringify(pack(col, data))); 
        }
      });
      fs.renameSync(LEGACY_DB_PATH, LEGACY_DB_PATH + '.bak');
    } catch (e) {
      console.error("Migration failed:", e);
    }
  }

  // Init file rỗng
  COLLECTIONS.forEach(col => {
    const filePath = path.join(DATA_DIR, `${col}.json`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]));
    }
  });
}

// ===== FILE HELPERS =====

function readCollection(name) {
  try {
    const filePath = path.join(DATA_DIR, `${name}.json`);
    if (!fs.existsSync(filePath)) return [];
    
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    
    // Tự động giải nén (Array -> Object) khi đọc
    return unpack(name, data);
  } catch (e) {
    console.error(`Error reading ${name}:`, e);
    return [];
  }
}

function writeCollection(name, data) {
  try {
    const filePath = path.join(DATA_DIR, `${name}.json`);
    // Tự động nén (Object -> Array) trước khi ghi
    const packedData = pack(name, data);
    fs.writeFileSync(filePath, JSON.stringify(packedData));
  } catch(e) {
    console.error(`Error writing ${name}:`, e);
  }
}

// ===== SERVER =====
const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const host = req.headers.host || 'localhost';
  const baseURL =  `http://${host}/`;
  const parsedUrl = new URL(req.url, baseURL);
  const endpoint = parsedUrl.pathname.split('/')[1];

  const jsonResponse = (data, code = 200) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  const readBody = () => new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } 
      catch (e) { resolve({}); }
    });
  });

  // --- API ---

  if (req.method === 'GET' && endpoint === 'status') {
    return jsonResponse({ status: 'ok', mode: 'NodeJS Optimized (Packed DB)' });
  }

  // CRUD Chung
  if (['classes', 'subjects', 'activities', 'users'].includes(endpoint)) {
    if (req.method === 'GET') return jsonResponse(readCollection(endpoint));
    
    if (req.method === 'POST') {
      readBody().then(item => {
        const list = readCollection(endpoint);
        list.push(item);
        writeCollection(endpoint, list);
        jsonResponse({ success: true });
      });
      return;
    }
    
    if (req.method === 'PUT') {
        readBody().then(item => {
          const list = readCollection(endpoint);
          const idx = list.findIndex(i => String(i.id || i.username) === String(item.id || item.username));
          if (idx !== -1) {
              list[idx] = { ...list[idx], ...item };
              writeCollection(endpoint, list);
          }
          jsonResponse({ success: true });
        });
        return;
    }

    if (req.method === 'DELETE') {
        readBody().then(payload => {
            let list = readCollection(endpoint);
            const newList = list.filter(i => String(i.id || i.username) !== String(payload.id || payload.username));
            if (list.length !== newList.length) writeCollection(endpoint, newList);
            jsonResponse({ success: true });
        });
        return;
    }
  }

  // Students (Có lọc theo lớp)
  if (endpoint === 'students') {
    if (req.method === 'GET') {
        const classId = parsedUrl.searchParams.get('classId');
        let list = readCollection('students');
        if (classId) list = list.filter(s => String(s.classId) === String(classId));
        return jsonResponse(list);
    }
    if (req.method === 'POST') {
        readBody().then(payload => {
            const list = readCollection('students');
            const items = Array.isArray(payload) ? payload : [payload];
            const existingIds = new Set(list.map(s => String(s.id)));
            let changed = false;
            
            items.forEach(s => {
                if (!existingIds.has(String(s.id))) {
                    list.push(s);
                    existingIds.add(String(s.id));
                    changed = true;
                }
            });
            if (changed) writeCollection('students', list);
            jsonResponse({ success: true });
        });
        return;
    }
  }

  // Attendance (Có lọc theo hoạt động)
  if (endpoint === 'attendance') {
    if (req.method === 'GET') {
        const activityId = parsedUrl.searchParams.get('activityId');
        let list = readCollection('attendance');
        if (activityId) list = list.filter(a => String(a.activityId) === String(activityId));
        return jsonResponse(list);
    }
    if (req.method === 'POST') {
        readBody().then(record => {
            const list = readCollection('attendance');
            const exists = list.some(a => 
                String(a.activityId) === String(record.activityId) && 
                String(a.studentId) === String(record.studentId)
            );
            if (!exists) {
                list.push(record);
                writeCollection('attendance', list);
            }
            jsonResponse({ success: true });
        });
        return;
    }
  }

  if (!res.writableEnded) jsonResponse({ error: 'Endpoint not found' }, 404);
});

// ===== ERROR HANDLING & STARTUP =====

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error('\n\x1b[31m%s\x1b[0m', '⚠️  LỖI: Cổng 4000 đang bận (EADDRINUSE)!');
    console.error('\x1b[33m%s\x1b[0m', '=> Nguyên nhân: Có thể một cửa sổ terminal khác đang chạy server.');
    console.error('\x1b[33m%s\x1b[0m', '=> Giải pháp: Hãy tắt các terminal khác hoặc chạy lệnh sau để đóng server cũ:');
    console.error('   npx kill-port 4000\n');
  } else {
    console.error('Server error:', e);
  }
});

initDB();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`📦 Data Directory: ${DATA_DIR}`);
  console.log(`🚀 Chế độ: Compressed JSON (Nén dữ liệu)\n`);
});