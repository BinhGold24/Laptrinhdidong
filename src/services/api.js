import { CONFIG, CATEGORY_KEYS } from '../constants/data';
import { dateKey } from '../utils/dateUtils';

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
  };
}

export async function request(path = '', options = {}) {
  const response = await fetch(`${CONFIG.API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`MockAPI error ${response.status}${detail ? `: ${detail}` : ''}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

/**
 * Gọi API lấy danh sách stickers (với cache offline và fallback)
 */
export async function fetchStickersApi() {
  try {
    // Thử gọi endpoint stickers từ MockAPI (nếu có endpoint /stickers)
    const response = await fetch('https://6ae09edfbe3bc8fead979650.mockapi.io/api/v1/stickers', {
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const stickers = data.map((item) => (typeof item === 'string' ? item : item.emoji || item.sticker || '🌸'));
        return stickers;
      }
    }
  } catch (err) {
    console.log('API stickers error, using fallback/cached stickers:', err.message);
  }

  // Fallback danh sách sticker kawaii phong phú
  const defaultStickers = [
    '🌸', '🍓', '🐱', '☕', '🎂', '🧸', '🥑', '🎀',
    '✈️', '💖', '⭐️', '☀️', '🌧', '🎵', '📚', '🍕',
    '🍦', '🎨', '🌿', '🍿', '🐶', '🐰', '🐼', '🌻',
    '🌙', '🫧', '🧋', '💌', '🥞', '🍩', '🎯', '💫',
    '🍒', '🍉', '🐣', '🦄', '🧁', '🌷', '🍬', '🍡'
  ];
  return defaultStickers;
}

