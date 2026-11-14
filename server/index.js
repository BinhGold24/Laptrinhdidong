const http = require('http');
const { spawn } = require('child_process');
const os = require('os');

const PORT = process.env.PORT || 3001;
const SQL_SERVER = process.env.SQL_SERVER || '(local)';
const SQL_DB = process.env.SQL_DB || 'MyLifeDB';

function escapeSqlString(val) {
  if (val === null || val === undefined) return '';
  return String(val).replace(/'/g, "''");
}

/**
 * Thực thi câu lệnh SQL trực tiếp vào SQL Server qua stdin của sqlcmd (Windows Authentication -E, UTF-8 -f 65001)
 * Truyền qua stdin giúp bảo toàn tuyệt đối dấu ngoặc kép JSON (") và emoji Unicode.
 */
function runSqlQuery(sqlText) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'sqlcmd',
      ['-S', SQL_SERVER, '-d', SQL_DB, '-E', '-f', '65001', '-W', '-h', '-1'],
      { windowsHide: true }
    );

    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (err) => {
      reject(err);
    });
    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(stderr || stdout || `sqlcmd exited with code ${code}`));
      }
      resolve(stdout.trim());
    });

    child.stdin.write(`SET NOCOUNT ON;\n${sqlText}\nGO\nEXIT\n`, 'utf8');
    child.stdin.end();
  });
}

/**
 * Lấy danh sách tất cả Users dưới dạng mảng JSON từ SQL Server
 */
async function fetchAllUsersFromSql() {
  const query = `
    SELECT
      Id,
      Phone,
      ISNULL(Email, '') AS Email,
      Password,
      ISNULL(OwnedStickers, '["🌸","🍓","🐱"]') AS OwnedStickers,
      ISNULL(RegisteredAt, 0) AS RegisteredAt,
      ISNULL(ProExpiresAt, 0) AS ProExpiresAt,
      ISNULL(ProTrialUsed, 0) AS ProTrialUsed,
      CONVERT(VARCHAR(30), CreatedAt, 126) AS CreatedAt
    FROM dbo.Users
    ORDER BY Id DESC
    FOR JSON PATH;
  `;
  const raw = await runSqlQuery(query);
  if (!raw) return [];
  const cleaned = raw.replace(/\r?\n/g, '').trim();
  if (!cleaned.startsWith('[')) return [];
  const rows = JSON.parse(cleaned);
  return rows.map((r) => {
    let stickers = ['🌸', '🍓', '🐱'];
    try {
      stickers = typeof r.OwnedStickers === 'string' ? JSON.parse(r.OwnedStickers) : r.OwnedStickers;
    } catch (e) {}
    return {
      id: r.Id,
      phone: String(r.Phone || '').trim(),
      email: String(r.Email || '').trim(),
      password: String(r.Password || ''),
      ownedStickers: Array.isArray(stickers) ? stickers : ['🌸', '🍓', '🐱'],
      registeredAt: Number(r.RegisteredAt) || Date.now(),
      proExpiresAt: Number(r.ProExpiresAt) || 0,
      proTrialUsed: Boolean(r.ProTrialUsed),
      createdAt: r.CreatedAt,
    };
  });
}

/**
 * Thêm mới hoặc cập nhật (Upsert) 1 tài khoản người dùng vào bảng dbo.Users
 */
async function upsertUserToSql(user) {
  const phone = escapeSqlString(String(user.phone || '').trim());
  if (!phone) throw new Error('Thiếu số điện thoại (Phone)');

  const email = escapeSqlString(String(user.email || '').trim().toLowerCase());
  const password = escapeSqlString(String(user.password || ''));
  const stickersJson = escapeSqlString(
    JSON.stringify(Array.isArray(user.ownedStickers) ? user.ownedStickers : ['🌸', '🍓', '🐱'])
  );
  const registeredAt = Number(user.registeredAt) || Date.now();
  const proExpiresAt = Number(user.proExpiresAt) || 0;
  const proTrialUsed = user.proTrialUsed ? 1 : 0;

  const sql = `
    IF EXISTS (SELECT 1 FROM dbo.Users WHERE Phone = N'${phone}')
    BEGIN
      UPDATE dbo.Users
      SET
        Email = CASE WHEN N'${email}' <> N'' THEN N'${email}' ELSE Email END,
        Password = CASE WHEN N'${password}' <> N'' THEN N'${password}' ELSE Password END,
        OwnedStickers = N'${stickersJson}',
        ProExpiresAt = ${proExpiresAt},
        ProTrialUsed = ${proTrialUsed}
      WHERE Phone = N'${phone}';
    END
    ELSE
    BEGIN
      INSERT INTO dbo.Users (Phone, Email, Password, OwnedStickers, RegisteredAt, ProExpiresAt, ProTrialUsed, CreatedAt)
      VALUES (N'${phone}', N'${email}', N'${password}', N'${stickersJson}', ${registeredAt}, ${proExpiresAt}, ${proTrialUsed}, GETDATE());
    END
    SELECT 'OK' AS Status;
  `;

  await runSqlQuery(sql);
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString('utf8');
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;

  try {
    // 1. Health check & danh sách người dùng
    if (req.method === 'GET' && (pathname === '/' || pathname === '/health')) {
      const users = await fetchAllUsersFromSql();
      return sendJson(res, 200, {
        success: true,
        database: SQL_DB,
        table: 'dbo.Users',
        totalUsers: users.length,
        users,
      });
    }

    // 2. Lấy toàn bộ danh sách Users
    if (req.method === 'GET' && pathname === '/users') {
      const users = await fetchAllUsersFromSql();
      return sendJson(res, 200, { success: true, users });
    }

    // 3. Lấy 1 User theo số điện thoại
    if (req.method === 'GET' && pathname.startsWith('/users/')) {
      const targetPhone = decodeURIComponent(pathname.replace('/users/', '')).trim();
      const users = await fetchAllUsersFromSql();
      const found = users.find((u) => u.phone === targetPhone) || null;
      return sendJson(res, 200, { success: !!found, user: found });
    }

    // 4. Đồng bộ / Đăng ký / Cập nhật 1 hoặc nhiều User từ App vào SQL Server
    if (req.method === 'POST' && (pathname === '/users/sync' || pathname === '/register')) {
      const body = await parseBody(req);
      if (Array.isArray(body.users)) {
        for (const u of body.users) {
          if (u && u.phone) await upsertUserToSql(u);
        }
        console.log(`✅ [SQL Server] Đã đồng bộ ${body.users.length} tài khoản vào [MyLifeDB].[dbo].[Users]`);
        return sendJson(res, 200, { success: true, syncedCount: body.users.length });
      }

      const userObj = body.user || body;
      if (!userObj || !userObj.phone) {
        return sendJson(res, 400, { success: false, message: 'Thiếu số điện thoại (phone)' });
      }
      await upsertUserToSql(userObj);
      console.log(`✅ [SQL Server] Đã lưu tài khoản SĐT ${userObj.phone} (${userObj.email || ''}) vào [MyLifeDB].[dbo].[Users]`);
      return sendJson(res, 200, { success: true, user: userObj });
    }

    // 5. Đăng nhập kiểm tra trực tiếp từ SQL Server
    if (req.method === 'POST' && pathname === '/login') {
      const { phone, password } = await parseBody(req);
      const users = await fetchAllUsersFromSql();
      const found = users.find((u) => u.phone === String(phone || '').trim());
      if (!found) {
        return sendJson(res, 404, { success: false, message: 'Số điện thoại chưa được đăng ký trong SQL Server!' });
      }
      if (found.password && found.password !== String(password || '')) {
        return sendJson(res, 401, { success: false, message: 'Mật khẩu không chính xác!' });
      }
      console.log(`🔑 [SQL Server] Đăng nhập thành công: ${found.phone}`);
      return sendJson(res, 200, { success: true, user: found });
    }

    return sendJson(res, 404, { success: false, message: 'Endpoint not found' });
  } catch (err) {
    console.error('❌ [SQL Server Error]:', err.message);
    return sendJson(res, 500, { success: false, error: err.message });
  }
});

function getLocalLanIps() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips;
}

server.listen(PORT, '0.0.0.0', async () => {
  const ips = getLocalLanIps();
  console.log('====================================================');
  console.log(`🚀 MyLife SQL Server Bridge đang chạy tại cổng ${PORT}`);
  console.log(`📌 Kết nối tới: ${SQL_SERVER} -> Database: [${SQL_DB}].[dbo].[Users]`);
  ips.forEach((ip) => console.log(`🌐 Địa chỉ mạng LAN cho điện thoại: http://${ip}:${PORT}`));
  console.log('====================================================');
  try {
    const users = await fetchAllUsersFromSql();
    console.log(`✅ Kết nối SQL Server thành công! Hiện có ${users.length} tài khoản trong bảng dbo.Users.`);
  } catch (e) {
    console.error('⚠️ Chưa kết nối được SQL Server:', e.message);
  }
});
