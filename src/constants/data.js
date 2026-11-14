import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

export const CONFIG = {
  API_URL: 'https://6ae09edfbe3bc8fead979650.mockapi.io/api/v1/events',
  // Khóa API Gemini được nạp tự động từ file .env (EXPO_PUBLIC_GEMINI_API_KEY), không lưu cứng vào Git:
  GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
  AI_PROXY_URL: '',
  AI_CLIENT_KEY: 'Binh241006',
  REMINDER_CHANNEL_ID: 'event-reminders',
  DEFAULT_REMIND_MINUTES_KEY: 'cutecalendar_default_remind_minutes',
  LAST_INTERSTITIAL_SHOWN_KEY: 'ads.lastInterstitialShownAt',
  INTERSTITIAL_COOLDOWN_MS: 3 * 60 * 1000,
  BANNER_AD_UNIT_ID: !__DEV__ && Platform.OS === 'android'
    ? 'ca-app-pub-7366543760319067/2702305987'
    : TestIds.BANNER,
  INTERSTITIAL_AD_UNIT_ID: !__DEV__ && Platform.OS === 'android'
    ? 'ca-app-pub-7366543760319067/9678989909'
    : TestIds.INTERSTITIAL,
};

export const SEPAY_CONFIG = {
  BANK_NAME: 'MBBank',
  BANK_CODE: 'MB',
  ACCOUNT_NUMBER: '0812285479',
  ACCOUNT_HOLDER: 'NGUYEN DUC BINH',
  TRANSFER_PREFIX: 'MYLIFE',
  API_TOKEN: process.env.EXPO_PUBLIC_SEPAY_API_TOKEN || '', // SePay API Token tự động nạp từ .env (EXPO_PUBLIC_SEPAY_API_TOKEN)
  PACKAGES: {
    '1month': {
      id: '1month',
      name: 'Gói PRO 1 Tháng',
      price: 30000,
      days: 30,
      label: '30.000đ',
      tag: null,
    },
    '3months': {
      id: '3months',
      name: 'Gói PRO 3 Tháng',
      price: 79000,
      days: 90,
      label: '79.000đ',
      tag: 'Ưu đãi',
    },
    '6months': {
      id: '6months',
      name: 'Gói PRO 6 Tháng',
      price: 150000,
      days: 180,
      label: '150.000đ',
      tag: 'HOT Nhất',
    },
  },
};

export const REMIND_PRESET_MINUTES = [0, 5, 10, 15, 30, 60];

export const CUTE_STICKERS = [
  '🌸', '🍓', '🐱', '☕', '🎂', '🧸', '🥑', '🎀',
  '✈️', '💖', '⭐️', '☀️', '🌧', '🎵', '📚', '🍕',
  '🍦', '🎨', '🌿', '🍿', '🐶', '🐰', '🐼', '🌻',
  '🌙', '🫧', '🧋', '💌', '🥞', '🍩', '🎯', '💫'
];

export const MOOD_KEYS = [
  { key: 'ecstatic', emoji: '🥰', color: '#FF7E95' },
  { key: 'happy', emoji: '🌸', color: '#FFB84C' },
  { key: 'peaceful', emoji: '☕', color: '#79B99C' },
  { key: 'tired', emoji: '😴', color: '#9995A3' },
  { key: 'sad', emoji: '🌧', color: '#68BBE3' },
  { key: 'motivated', emoji: '💪', color: '#A084E8' },
];

export const CATEGORY_KEYS = [
  { key: 'work', icon: 'briefcase-outline', color: '#5E81AC', emoji: '💼' },
  { key: 'study', icon: 'book-outline', color: '#A084E8', emoji: '📚' },
  { key: 'personal', icon: 'heart-outline', color: '#FF7E95', emoji: '🌸' },
  { key: 'health', icon: 'fitness-outline', color: '#52B788', emoji: '🌿' },
  { key: 'other', icon: 'sparkles-outline', color: '#FFB84C', emoji: '✨' },
];
