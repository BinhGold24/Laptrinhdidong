import { Platform } from 'react-native';
import { getAnalytics, logEvent, logScreenView } from '@react-native-firebase/analytics';

export async function trackAnalyticsEvent(name, parameters = {}) {
  if (Platform.OS !== 'android') return;
  try {
    await logEvent(getAnalytics(), name, parameters);
  } catch (analyticsError) {
    console.warn(`Analytics error "${name}":`, analyticsError);
  }
}

export async function trackScreenView(screenName) {
  if (Platform.OS !== 'android') return;
  try {
    await logScreenView(getAnalytics(), {
      screen_name: screenName,
      screen_class: screenName,
    });
  } catch (analyticsError) {
    console.warn(`Screen view error "${screenName}":`, analyticsError);
  }
}
