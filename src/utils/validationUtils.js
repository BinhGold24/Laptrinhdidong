// Bộ công cụ kiểm tra & xác thực Số điện thoại Việt Nam và Email/Gmail tồn tại thực tế

const VN_CARRIER_PREFIXES = {
  // Viettel
  '032': 'Viettel',
  '033': 'Viettel',
  '034': 'Viettel',
  '035': 'Viettel',
  '036': 'Viettel',
  '037': 'Viettel',
  '038': 'Viettel',
  '039': 'Viettel',
  '086': 'Viettel',
  '096': 'Viettel',
  '097': 'Viettel',
  '098': 'Viettel',
  // Vinaphone
  '081': 'Vinaphone',
  '082': 'Vinaphone',
  '083': 'Vinaphone',
  '084': 'Vinaphone',
  '085': 'Vinaphone',
  '088': 'Vinaphone',
  '091': 'Vinaphone',
  '094': 'Vinaphone',
  // MobiFone
  '070': 'MobiFone',
  '076': 'MobiFone',
  '077': 'MobiFone',
  '078': 'MobiFone',
  '079': 'MobiFone',
  '089': 'MobiFone',
  '090': 'MobiFone',
  '093': 'MobiFone',
  // Vietnamobile
  '052': 'Vietnamobile',
  '056': 'Vietnamobile',
  '058': 'Vietnamobile',
  '092': 'Vietnamobile',
  // Wintel / Gmobile / Itelecom
  '055': 'Wintel',
  '059': 'Gmobile',
  '087': 'Itelecom',
  '099': 'Gmobile',
};

const EMAIL_DOMAIN_TYPOS = {
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.vn': 'gmail.com',
  'gmail.com.vn': 'gmail.com',
  'gnail.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'hotmai.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'iclod.com': 'icloud.com',
};

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'yopmail.com',
  'guerrillamail.com',
  'mailinator.com',
  'trashmail.com',
  'sharklasers.com',
  'getnada.com',
  'fakeinbox.com',
  'throwawaymail.com',
  'mohmal.com',
  'dispostable.com',
  'maildrop.cc',
  'mailnesia.com',
]);

/**
 * Chuẩn hóa số điện thoại (ví dụ +84912345678 -> 0912345678)
 */
export function normalizeVietnamPhone(rawPhone = '') {
  let cleaned = String(rawPhone || '').trim().replace(/[\s.\-()]/g, '');
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('84') && cleaned.length === 11) {
    cleaned = '0' + cleaned.slice(2);
  }
  return cleaned;
}

/**
 * Kiểm tra số điện thoại di động Việt Nam hợp lệ và thuộc nhà mạng thật
 */
export function validateVietnamPhone(rawPhone = '') {
  const phone = normalizeVietnamPhone(rawPhone);

  if (!phone) {
    return {
      valid: false,
      normalizedPhone: '',
      carrier: null,
      message: 'Vui lòng nhập số điện thoại của bạn!',
    };
  }

  if (!/^\d+$/.test(phone)) {
    return {
      valid: false,
      normalizedPhone: phone,
      carrier: null,
      message: 'Số điện thoại chỉ được chứa chữ số (0-9)!',
    };
  }

  if (!phone.startsWith('0')) {
    return {
      valid: false,
      normalizedPhone: phone,
      carrier: null,
      message: 'Số điện thoại Việt Nam phải bắt đầu bằng số 0 (hoặc +84)!',
    };
  }

  if (phone.length !== 10) {
    return {
      valid: false,
      normalizedPhone: phone,
      carrier: null,
      message: `Số điện thoại Việt Nam phải có đúng 10 chữ số (hiện tại: ${phone.length} số)!`,
    };
  }

  const prefix = phone.slice(0, 3);
  const carrier = VN_CARRIER_PREFIXES[prefix];
  if (!carrier) {
    return {
      valid: false,
      normalizedPhone: phone,
      carrier: null,
      message: `Đầu số "${prefix}" không thuộc bất kỳ nhà mạng di động nào tại Việt Nam!`,
    };
  }

  // Chặn số ảo lặp toàn bộ 7 số cuối (ví dụ: 0988888888, 0900000000) hoặc số tiến/lùi giả (0912345678, 0987654321)
  const subscriber = phone.slice(3);
  if (/^(\d)\1{6}$/.test(subscriber)) {
    return {
      valid: false,
      normalizedPhone: phone,
      carrier: null,
      message: 'Số điện thoại có dấu hiệu là số ảo (lặp toàn bộ số cuối). Vui lòng nhập SĐT thật của bạn!',
    };
  }

  if (subscriber === '1234567' || subscriber === '2345678' || subscriber === '3456789' || subscriber === '7654321' || subscriber === '8765432') {
    return {
      valid: false,
      normalizedPhone: phone,
      carrier: null,
      message: 'Số điện thoại là chuỗi số đếm thử nghiệm (1234567...). Vui lòng nhập SĐT thực tế của bạn!',
    };
  }

  return {
    valid: true,
    normalizedPhone: phone,
    carrier,
    message: `Số ${carrier} hợp lệ`,
  };
}

/**
 * Kiểm tra cấu trúc, quy tắc Gmail và lỗi chính tả tên miền Email
 */
export function validateEmailSync(rawEmail = '') {
  const email = String(rawEmail || '').trim().toLowerCase();

  if (!email) {
    return {
      valid: false,
      normalizedEmail: '',
      message: 'Vui lòng nhập địa chỉ Email / Gmail của bạn!',
    };
  }

  if (email.includes(' ')) {
    return {
      valid: false,
      normalizedEmail: email,
      message: 'Địa chỉ Email không được chứa khoảng trắng!',
    };
  }

  const parts = email.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return {
      valid: false,
      normalizedEmail: email,
      message: 'Email không đúng định dạng (ví dụ hợp lệ: tenban@gmail.com)!',
    };
  }

  const [localPart, domain] = parts;

  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return {
      valid: false,
      normalizedEmail: email,
      message: 'Phần tên Email trước dấu @ không hợp lệ (dấu chấm đặt sai vị trí)!',
    };
  }

  if (!/^[a-z0-9._+-]+$/.test(localPart)) {
    return {
      valid: false,
      normalizedEmail: email,
      message: 'Tên Email chỉ được chứa chữ cái không dấu (a-z), chữ số (0-9) và dấu chấm (.)!',
    };
  }

  // Phát hiện lỗi gõ sai tên miền phổ biến (ví dụ @gmai.com, @gmial.com)
  if (EMAIL_DOMAIN_TYPOS[domain]) {
    const fixedDomain = EMAIL_DOMAIN_TYPOS[domain];
    return {
      valid: false,
      normalizedEmail: email,
      suggestion: `${localPart}@${fixedDomain}`,
      message: `Tên miền "@${domain}" không tồn tại! Có phải ý bạn là "${localPart}@${fixedDomain}"?`,
    };
  }

  // Chặn email rác / email 10 phút
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return {
      valid: false,
      normalizedEmail: email,
      message: `Hệ thống không chấp nhận email ảo tạm thời (@${domain}). Vui lòng dùng Gmail hoặc email thật!`,
    };
  }

  // Kiểm tra cấu trúc tên miền chuẩn
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(domain)) {
    return {
      valid: false,
      normalizedEmail: email,
      message: `Tên miền email "@${domain}" không hợp lệ!`,
    };
  }

  // Quy tắc riêng của Google đối với @gmail.com: độ dài username từ 6 đến 30 ký tự (bỏ qua dấu chấm)
  if (domain === 'gmail.com') {
    const cleanGmailUser = localPart.replace(/\./g, '');
    if (cleanGmailUser.length < 6) {
      return {
        valid: false,
        normalizedEmail: email,
        message: 'Theo quy định của Google, tài khoản @gmail.com phải có ít nhất 6 ký tự trước dấu @!',
      };
    }
    if (/^(\w)\1{5,}$/.test(cleanGmailUser) || cleanGmailUser === '123456' || cleanGmailUser === '12345678' || cleanGmailUser === 'abcdef') {
      return {
        valid: false,
        normalizedEmail: email,
        message: 'Địa chỉ Gmail có dấu hiệu là email nhập thử nghiệm. Vui lòng nhập Gmail thật của bạn!',
      };
    }
  } else if (localPart.length < 3) {
    return {
      valid: false,
      normalizedEmail: email,
      message: 'Tên tài khoản Email quá ngắn (tối thiểu 3 ký tự trước dấu @)!',
    };
  }

  return {
    valid: true,
    normalizedEmail: email,
    domain,
    message: 'Định dạng Email hợp lệ',
  };
}

/**
 * Kiểm tra tên miền Email có tồn tại máy chủ nhận thư (MX Record) trên Internet qua Google Public DNS API
 */
export async function verifyEmailDomainOnline(rawEmail = '') {
  const syncCheck = validateEmailSync(rawEmail);
  if (!syncCheck.valid) {
    return syncCheck;
  }

  const domain = syncCheck.domain;

  // Các tên miền lớn đã xác thực sẵn máy chủ MX toàn cầu
  const trustedMajorDomains = new Set([
    'gmail.com',
    'yahoo.com',
    'yahoo.com.vn',
    'outlook.com',
    'hotmail.com',
    'icloud.com',
    'live.com',
    'msn.com',
  ]);

  if (trustedMajorDomains.has(domain)) {
    return {
      valid: true,
      normalizedEmail: syncCheck.normalizedEmail,
      domain,
      message: `Máy chủ @${domain} hợp lệ`,
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (!res.ok) {
      return syncCheck;
    }

    const data = await res.json();
    // Status === 3 là NXDOMAIN (Tên miền hoàn toàn không tồn tại trên Internet)
    if (data?.Status === 3) {
      return {
        valid: false,
        normalizedEmail: syncCheck.normalizedEmail,
        message: `Tên miền "@${domain}" không tồn tại trên Internet! Vui lòng kiểm tra lại địa chỉ Email.`,
      };
    }

    const hasMxRecord = Array.isArray(data?.Answer) && data.Answer.some((ans) => ans.type === 15 && ans.data);
    if (!hasMxRecord) {
      return {
        valid: false,
        normalizedEmail: syncCheck.normalizedEmail,
        message: `Tên miền "@${domain}" không có máy chủ nhận thư (MX). Vui lòng dùng Gmail hoặc Email đang hoạt động!`,
      };
    }

    return {
      valid: true,
      normalizedEmail: syncCheck.normalizedEmail,
      domain,
      message: `Đã xác thực máy chủ @${domain}`,
    };
  } catch (e) {
    // Nếu mạng chập chờn vẫn giữ kết quả kiểm tra nghiêm ngặt cục bộ
    return syncCheck;
  }
}
