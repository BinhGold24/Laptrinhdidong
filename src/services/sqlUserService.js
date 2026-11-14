// Dịch vụ đồng bộ dữ liệu người dùng hai chiều giữa Điện thoại và Microsoft SQL Server ([MyLifeDB].[dbo].[Users])

const SQL_BRIDGE_CANDIDATES = [
  'http://192.168.1.4:3001',   // Địa chỉ IP mạng Wi-Fi LAN của máy tính chạy SQL Server
  'http://10.0.2.2:3001',      // Địa chỉ máy chủ khi chạy trên máy ảo Android Emulator
  'http://localhost:3001',     // Địa chỉ cục bộ
];

let workingBridgeUrl = null;

async function fetchBridge(path, options = {}, timeoutMs = 2800) {
  const urlsToTry = workingBridgeUrl
    ? [workingBridgeUrl, ...SQL_BRIDGE_CANDIDATES.filter((u) => u !== workingBridgeUrl)]
    : SQL_BRIDGE_CANDIDATES;

  for (const baseUrl of urlsToTry) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        workingBridgeUrl = baseUrl;
        return await res.json();
      }
    } catch (e) {
      // Thử tiếp candidate tiếp theo nếu IP hiện tại không phản hồi
    }
  }
  return null;
}

/**
 * Lưu hoặc cập nhật 1 tài khoản người dùng lên SQL Server ([MyLifeDB].[dbo].[Users])
 */
export async function syncUserToSqlServer(user) {
  if (!user || !user.phone) return false;
  try {
    const data = await fetchBridge('/users/sync', {
      method: 'POST',
      body: JSON.stringify({ user }),
    });
    if (data && data.success) {
      console.log(`[SQL Server] ✅ Đã lưu tài khoản ${user.phone} vào [MyLifeDB].[dbo].[Users]`);
      return true;
    }
  } catch (e) {}
  return false;
}

/**
 * Đồng bộ toàn bộ danh sách tài khoản đang có trên điện thoại lên SQL Server ([MyLifeDB].[dbo].[Users])
 */
export async function syncAllLocalUsersToSqlServer(usersList = []) {
  const validUsers = Array.isArray(usersList) ? usersList.filter((u) => u && u.phone) : [];
  if (validUsers.length === 0) return false;
  try {
    const data = await fetchBridge('/users/sync', {
      method: 'POST',
      body: JSON.stringify({ users: validUsers }),
    });
    if (data && data.success) {
      console.log(`[SQL Server] ✅ Đã đồng bộ ${validUsers.length} tài khoản lên [MyLifeDB].[dbo].[Users]`);
      return true;
    }
  } catch (e) {}
  return false;
}

/**
 * Tìm tài khoản người dùng từ SQL Server theo Số điện thoại
 */
export async function fetchUserFromSqlServer(phone) {
  const cleanPhone = String(phone || '').trim();
  if (!cleanPhone) return null;
  try {
    const data = await fetchBridge(`/users/${encodeURIComponent(cleanPhone)}`);
    if (data && data.success && data.user) {
      return data.user;
    }
  } catch (e) {}
  return null;
}

/**
 * Lấy toàn bộ danh sách tài khoản từ SQL Server ([MyLifeDB].[dbo].[Users])
 */
export async function fetchAllUsersFromSqlServer() {
  try {
    const data = await fetchBridge('/users');
    if (data && data.success && Array.isArray(data.users)) {
      return data.users;
    }
  } catch (e) {}
  return null;
}
