export function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateTime(dateValue, timeValue = '09:00') {
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);
  if (!dateParts) return new Date();
  const timeParts = /^(\d{2}):(\d{2})$/.exec(timeValue);
  const year = Number(dateParts[1]);
  const month = Number(dateParts[2]) - 1;
  const day = Number(dateParts[3]);
  const hour = timeParts ? Number(timeParts[1]) : 9;
  const minute = timeParts ? Number(timeParts[2]) : 0;
  const date = new Date(year, month, day, hour, minute);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day
    ? date
    : new Date();
}

export function timeString(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function dateLabel(dateValue, lang = 'vi') {
  const date = parseDateTime(dateValue);
  if (lang === 'en') {
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthsEn[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

export function isValidTime(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  return Boolean(match && Number(match[1]) < 24 && Number(match[2]) < 60);
}

export function daysRemaining(targetDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseDateTime(targetDateStr, '00:00');
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateDDay(targetDateStr) {
  const diffDays = daysRemaining(targetDateStr);
  if (diffDays === 0) return 'D-Day';
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${Math.abs(diffDays)}`;
}

export function getWeek(date) {
  const monday = new Date(date);
  const weekday = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - weekday);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return day;
  });
}

/**
 * Trả về chuỗi chỉ hiển thị 1 ngôn ngữ theo cấu hình (loại bỏ dạng song ngữ 'Tiếng Việt / English')
 */
export function localizeText(text, lang = 'vi') {
  if (!text || typeof text !== 'string') return '';
  if (text.includes(' / ')) {
    const parts = text.split(' / ');
    return (lang === 'en' ? (parts[1] || parts[0]) : parts[0]).trim();
  }
  return text;
}

/**
 * Giới hạn số phút nhắc trước hợp lệ trong khoảng 0..1440 (24 giờ)
 */
export function clampRemindMinutes(value) {
  const num = parseInt(value, 10);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.min(1440, num);
}

/**
 * Tính thời điểm Date sẽ phát thông báo nhắc trước dựa trên ngày, giờ bắt đầu và số phút báo trước
 */
export function getRemindBeforeDate(dateValue, timeValue, remindBeforeMinutes = 0) {
  const startDate = parseDateTime(dateValue, timeValue);
  const mins = clampRemindMinutes(remindBeforeMinutes);
  return new Date(startDate.getTime() - mins * 60 * 1000);
}

/**
 * Định dạng nhãn số phút báo trước lịch trình (ví dụ: "Đúng giờ (0 phút)", "Trước 10 phút", "Trước 1 giờ")
 */
export function formatRemindBeforeLabel(minutes, lang = 'vi') {
  const m = clampRemindMinutes(minutes);
  if (m === 0) return lang === 'en' ? 'On time' : 'Đúng giờ (0 phút)';
  if (m % 60 === 0) {
    const hrs = m / 60;
    return lang === 'en' ? `${hrs} hr before` : `Trước ${hrs} giờ`;
  }
  return lang === 'en' ? `${m} min before` : `Trước ${m} phút`;
}
