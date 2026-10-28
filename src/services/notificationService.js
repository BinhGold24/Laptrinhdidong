import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { CONFIG } from '../constants/data';
import { dateKey, parseDateTime, isValidTime } from '../utils/dateUtils';

export function setupNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CONFIG.REMINDER_CHANNEL_ID, {
      name: 'Nhắc lịch trình / Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF7E95',
      sound: 'default',
    });
  }
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const permission = await Notifications.requestPermissionsAsync();
  return permission.status === 'granted';
}

export async function getEventReminders(eventId) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.filter(
    (notification) => String(notification.content.data?.eventId) === String(eventId),
  );
}

export async function cancelReminders(reminders) {
  await Promise.all(
    reminders.map(({ identifier }) => Notifications.cancelScheduledNotificationAsync(identifier)),
  );
}

export async function scheduleEventReminders(event) {
  if (event.id == null) return 0;
  if (
    dateKey(parseDateTime(event.date)) !== event.date ||
    !isValidTime(event.time) ||
    (event.endTime && !isValidTime(event.endTime))
  ) {
    return 0;
  }

  const eventId = String(event.id);
  const previousReminders = await getEventReminders(eventId);
  const now = new Date();
  const candidates = [
    { type: 'start', time: event.time, body: 'Đã đến giờ bắt đầu lịch trình / It is time to start.' },
    ...(event.endTime
      ? [{ type: 'end', time: event.endTime, body: 'Đã đến giờ kết thúc lịch trình / Event has ended.' }]
      : []),
  ].map((reminder) => ({
    ...reminder,
    date: parseDateTime(event.date, reminder.time),
  })).filter((reminder) => reminder.date > now);

  if (!candidates.length) {
    await cancelReminders(previousReminders);
    return 0;
  }
  if (!(await requestNotificationPermission())) {
    await cancelReminders(previousReminders);
    return 0;
  }

  const scheduledIds = [];
  try {
    for (const reminder of candidates) {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🌸 ${event.title}`,
          body: reminder.body,
          sound: 'default',
          data: { eventId, reminderType: reminder.type },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminder.date,
          ...(Platform.OS === 'android' ? { channelId: CONFIG.REMINDER_CHANNEL_ID } : {}),
        },
      });
      scheduledIds.push(identifier);
    }
  } catch (err) {
    await Promise.all(
      scheduledIds.map((identifier) => Notifications.cancelScheduledNotificationAsync(identifier)),
    );
  }

  try {
    await cancelReminders(previousReminders);
  } catch (cancelError) {}

  return candidates.length;
}
