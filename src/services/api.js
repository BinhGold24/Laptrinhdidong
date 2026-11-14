import { CONFIG, CATEGORY_KEYS } from '../constants/data';
import { dateKey, clampRemindMinutes } from '../utils/dateUtils';
import { fetchWithTimeout } from '../utils/fetchUtils';

let cachedStickersResult = null;

export function normalizeEvent(event) {
  return {
    ...event,
    title: String(event.title || event.name || 'Activity'),
    date: String(event.date || dateKey(new Date())),
    time: String(event.time || '09:00'),
    endTime: String(event.endTime || ''),
    category: CATEGORY_KEYS.some((item) => item.key === event.category) ? event.category : 'other',
    description: String(event.description || event.note || ''),
    completed: event.completed === true || event.completed === 'true',
    sticker: event.sticker || '',
    userId: String(event.userId || event.userPhone || ''),
    repeat: event.repeat || 'none',
    remindBeforeMinutes: clampRemindMinutes(event.remindBeforeMinutes ?? event.remindBefore ?? 0),
  };
}

export async function request(path = '', options = {}) {
  const response = await fetchWithTimeout(`${CONFIG.API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  }, 6000);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`MockAPI error ${response.status}${detail ? `: ${detail}` : ''}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

/**
 * Gọi API lấy danh sách stickers (với cache trong RAM & timeout nhanh)
 */
export async function fetchStickersApi() {
  if (cachedStickersResult) return cachedStickersResult;
  try {
    // Thử gọi endpoint stickers từ MockAPI (nếu có endpoint /stickers)
    const response = await fetchWithTimeout('https://6ae09edfbe3bc8fead979650.mockapi.io/api/v1/stickers', {
      headers: { 'Content-Type': 'application/json' },
    }, 3500);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        cachedStickersResult = data.map((item) => (typeof item === 'string' ? item : item.emoji || item.sticker || '🌸'));
        return cachedStickersResult;
      }
    }
  } catch (err) {
    console.log('API stickers error, using fallback/cached stickers:', err.message);
  }

  // Fallback danh sách sticker kawaii phong phú
  cachedStickersResult = [
    '🌸', '🍓', '🐱', '☕', '🎂', '🧸', '🥑', '🎀',
    '✈️', '💖', '⭐️', '☀️', '🌧', '🎵', '📚', '🍕',
    '🍦', '🎨', '🌿', '🍿', '🐶', '🐰', '🐼', '🌻',
    '🌙', '🫧', '🧋', '💌', '🥞', '🍩', '🎯', '💫',
    '🍒', '🍉', '🐣', '🦄', '🧁', '🌷', '🍬', '🍡'
  ];
  return cachedStickersResult;
}

