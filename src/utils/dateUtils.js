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

export function calculateDDay(targetDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseDateTime(targetDateStr, '00:00');
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
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
