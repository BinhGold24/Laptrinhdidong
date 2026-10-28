import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

export const CONFIG = {
  API_URL: 'https://6ae09edfbe3bc8fead979650.mockapi.io/api/v1/events',
  REMINDER_CHANNEL_ID: 'event-reminders',
  LAST_INTERSTITIAL_SHOWN_KEY: 'ads.lastInterstitialShownAt',
  INTERSTITIAL_COOLDOWN_MS: 3 * 60 * 1000,
  BANNER_AD_UNIT_ID: !__DEV__ && Platform.OS === 'android'
    ? 'ca-app-pub-7366543760319067/2702305987'
    : TestIds.BANNER,
  INTERSTITIAL_AD_UNIT_ID: !__DEV__ && Platform.OS === 'android'
    ? 'ca-app-pub-7366543760319067/9678989909'
    : TestIds.INTERSTITIAL,
};

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
  { key: 'work', icon: 'briefcase-outline' },
  { key: 'study', icon: 'book-outline' },
  { key: 'personal', icon: 'heart-outline' },
  { key: 'health', icon: 'fitness-outline' },
  { key: 'other', icon: 'sparkles-outline' },
];
