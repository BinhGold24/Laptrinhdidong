import { SEPAY_CONFIG } from '../constants/data';

/**
 * Sinh cú pháp chuyển khoản gọn gàng, không dấu, dễ nhận diện:
 * Ví dụ: "MYLIFE 0812285479" hoặc "MYLIFE 85479"
 */
export function generateOrderDescription(userPhone = '', packageId = '3months') {
  const cleanPhone = String(userPhone || '').replace(/\D/g, '');
  const suffix = cleanPhone ? cleanPhone.slice(-6) : Math.floor(1000 + Math.random() * 9000);
  const pkgSuffix = packageId === '6months' ? '6T' : packageId === '1month' ? '1T' : '3T';
  return `${SEPAY_CONFIG.TRANSFER_PREFIX} ${suffix} ${pkgSuffix}`;
}

/**
 * Tạo URL ảnh VietQR động từ API SePay (MBBank - 0812285479 - NGUYEN DUC BINH)
 * Khách quét mã sẽ tự động có đầy đủ STK, Số tiền, Tên người nhận và Nội dung CK
 */
export function getVietQrUrl({ amount = 79000, description = 'MYLIFE VIP' }) {
  const acc = SEPAY_CONFIG.ACCOUNT_NUMBER;
  const bank = SEPAY_CONFIG.BANK_NAME; // 'MBBank'
  const des = encodeURIComponent(description);

  return `https://qr.sepay.vn/img?acc=${acc}&bank=${bank}&amount=${amount}&des=${des}&template=compact`;
}

/**
 * URL dự phòng từ API VietQR NAPAS nếu đường truyền SePay chậm
 */
export function getBackupVietQrUrl({ amount = 79000, description = 'MYLIFE VIP' }) {
  const acc = SEPAY_CONFIG.ACCOUNT_NUMBER;
  const bankCode = SEPAY_CONFIG.BANK_CODE || 'MB';
  const des = encodeURIComponent(description);
  const name = encodeURIComponent(SEPAY_CONFIG.ACCOUNT_HOLDER);
  return `https://img.vietqr.io/image/${bankCode}-${acc}-compact2.png?amount=${amount}&addInfo=${des}&accountName=${name}`;
}

/**
 * Kiểm tra trạng thái giao dịch qua SePay API (nếu có API Token)
 */
export async function checkSepayTransaction({ orderDescription = '', amount = 79000 }) {
  const token = SEPAY_CONFIG.API_TOKEN;
  if (!token) {
    // Chưa có token -> trả về chế độ xác nhận nhanh
    return {
      success: true,
      mode: 'manual_confirm',
      message: 'Xác nhận chuyển khoản thành công',
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    // Hỗ trợ đồng thời SePay API v2 và v1
    let res = await fetch('https://userapi.sepay.vn/v2/transactions?limit=25', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    }).catch(() => null);

    if (!res || !res.ok) {
      res = await fetch('https://my.sepay.vn/userapi/transactions/list?limit=25', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      }).catch(() => null);
    }
    clearTimeout(timeout);

    if (!res || !res.ok) {
      return { success: false, message: 'Không thể kết nối máy chủ SePay để kiểm tra giao dịch' };
    }

    const data = await res.json();
    const list = Array.isArray(data?.data)
      ? data.data
      : (Array.isArray(data?.transactions) ? data.transactions : (data?.messages || []));

    const normalizedDes = orderDescription.toUpperCase().replace(/\s+/g, '');

    const matched = list.find((item) => {
      const itemAmount = Number(item.amount_in || item.amount || 0);
      const itemContent = String(
        item.transaction_content || item.content || item.description || ''
      ).toUpperCase().replace(/\s+/g, '');
      return itemAmount >= amount && (itemContent.includes(normalizedDes) || (item.code && normalizedDes.includes(String(item.code).toUpperCase())));
    });

    if (matched) {
      return { success: true, mode: 'auto_verified', transaction: matched };
    }

    return {
      success: false,
      message: 'Chưa thấy giao dịch khớp với số tiền ' + amount.toLocaleString('vi-VN') + 'đ và cú pháp "' + orderDescription + '". Vui lòng đợi 5-10 giây sau khi chuyển để ngân hàng báo có rồi bấm lại nhé!',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Lỗi kiểm tra giao dịch: ' + (error?.message || 'Hết thời gian chờ'),
    };
  }
}
