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
