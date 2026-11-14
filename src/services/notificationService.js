import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { CONFIG } from '../constants/data';
import {
  dateKey,
  parseDateTime,
  isValidTime,
  clampRemindMinutes,
  getRemindBeforeDate,
} from '../utils/dateUtils';

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
      name: 'Nhắc lịch trình',
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

function buildReminderCandidates(event, lang = 'vi') {
  const isEn = lang === 'en';
  const startDate = parseDateTime(event.date, event.time);
  const remindBeforeMinutes = clampRemindMinutes(event.remindBeforeMinutes ?? event.remindBefore ?? 0);
  const candidates = [];

  if (remindBeforeMinutes > 0) {
    candidates.push({
      type: 'before',
      date: getRemindBeforeDate(event.date, event.time, remindBeforeMinutes),
      title: isEn
        ? `⏰ Upcoming in ${remindBeforeMinutes} min: ${event.title}`
        : `⏰ Sắp tới lịch (còn ${remindBeforeMinutes} phút): ${event.title}`,
      body: isEn
        ? `"${event.title}" starts at ${event.time}. Get ready! 🌸`
        : `Còn ${remindBeforeMinutes} phút nữa đến giờ "${event.title}" (lúc ${event.time}). Chuẩn bị ngay nhé! 🌸`,
    });
  }

  candidates.push({
    type: 'start',
    date: startDate,
    title: `🌸 ${event.title}`,
    body: isEn
      ? `It is time to start your schedule (${event.time}).`
      : `Đã đến giờ bắt đầu lịch trình (${event.time}).`,
  });

  if (event.endTime) {
    candidates.push({
      type: 'end',
      date: parseDateTime(event.date, event.endTime),
      title: `🌸 ${event.title}`,
      body: isEn
        ? `Your scheduled event has ended (${event.endTime}).`
        : `Đã đến giờ kết thúc lịch trình (${event.endTime}).`,
    });
  }

  return { candidates, remindBeforeMinutes };
}

export async function scheduleEventReminders(event, lang = 'vi') {
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

  if (event.completed) {
    await cancelReminders(previousReminders);
    return 0;
  }

  const now = new Date();
  const { candidates: allCandidates, remindBeforeMinutes } = buildReminderCandidates(event, lang);
  const candidates = allCandidates.filter((reminder) => reminder.date > now);

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
          title: reminder.title,
          body: reminder.body,
          sound: 'default',
          data: { eventId, reminderType: reminder.type, remindBeforeMinutes },
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
    return 0;
  }

  try {
    await cancelReminders(previousReminders);
  } catch (cancelError) {}

  return candidates.length;
}

/**
 * Đồng bộ lại thông báo cho các lịch trình sắp tới (chỉ chạy âm thầm nếu quyền thông báo đã được cấp)
 */
export async function syncUpcomingEventReminders(events = [], lang = 'vi') {
  if (!Array.isArray(events) || events.length === 0) return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const scheduledKeys = new Set(
      scheduled.map((n) => {
        const d = n.content?.data || {};
        return `${String(d.eventId)}_${d.reminderType}_${d.remindBeforeMinutes ?? ''}`;
      }),
    );

    const now = new Date();
    for (const ev of events) {
      if (!ev || ev.id == null || ev.completed) continue;
      if (
        dateKey(parseDateTime(ev.date)) !== ev.date ||
        !isValidTime(ev.time) ||
        (ev.endTime && !isValidTime(ev.endTime))
      ) {
        continue;
      }

      const { candidates, remindBeforeMinutes } = buildReminderCandidates(ev, lang);
      const upcoming = candidates.filter((c) => c.date > now);
      if (!upcoming.length) continue;

      const missingAny = upcoming.some(
        (c) => !scheduledKeys.has(`${String(ev.id)}_${c.type}_${remindBeforeMinutes}`),
      );
      if (missingAny) {
        await scheduleEventReminders(ev, lang);
      }
    }
  } catch (e) {}
}

let lastMorningGreetingKey = '';

/**
 * Lên lịch thông báo Chào buổi sáng nếu người dùng có lịch trình từ 06:00 đến 09:00
 */
export async function scheduleMorningGreeting(events = []) {
  if (!Array.isArray(events) || events.length === 0) return;
  const now = new Date();
  const todayStr = dateKey(now);

  // Tìm lịch trình diễn ra hôm nay trong khung giờ 06:00 - 09:00
  const morningEvents = events.filter((e) => {
    if (e.date !== todayStr) return false;
    const time = e.time || '00:00';
    return time >= '06:00' && time <= '09:00';
  });

  if (morningEvents.length === 0) return;

  const firstEvent = morningEvents[0];
  const greetingKey = `${todayStr}_${firstEvent.id}`;
  if (lastMorningGreetingKey === greetingKey) return;
  lastMorningGreetingKey = greetingKey;
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  // Lên lịch vào 06:00 sáng hoặc gửi ngay nếu đang trong khung giờ sáng
  const currentHour = now.getHours();
  const isMorningNow = currentHour >= 6 && currentHour <= 9;

  try {
    if (isMorningNow) {
      // Thông báo chào buổi sáng ngay lập tức nếu đang trong sáng
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '☀️ Chào buổi sáng yêu đời! 🌸',
          body: `Hôm nay bạn có lịch "${firstEvent.title}" lúc ${firstEvent.time}. Chúc bạn ngày mới ngọt ngào và hiệu quả! ✨`,
          sound: 'default',
          data: { type: 'morning_greeting', eventId: firstEvent.id },
        },
        trigger: null, // Gửi ngay
      });
    } else if (currentHour < 6) {
      // Đặt lịch vào 06:00 sáng hôm nay
      const triggerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '☀️ Chào buổi sáng yêu đời! 🌸',
          body: `Hôm nay bạn có lịch "${firstEvent.title}" lúc ${firstEvent.time}. Chúc bạn ngày mới ngọt ngào và hiệu quả! ✨`,
          sound: 'default',
          data: { type: 'morning_greeting', eventId: firstEvent.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
          ...(Platform.OS === 'android' ? { channelId: CONFIG.REMINDER_CHANNEL_ID } : {}),
        },
      });
    }
  } catch (e) {
    console.log('Lỗi lên lịch chào buổi sáng:', e);
  }
}

/**
 * Gửi thông báo chào mừng trên thiết bị khi đăng ký tài khoản mới thành công
 */
export async function sendWelcomeAccountAlert({ stickers = [] }) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Đăng ký thành công - Quà tặng cho bạn!',
        body: `Chào mừng bạn gia nhập MyLife! Bạn nhận được 3 sticker xinh xắn: ${stickers.join(' ')}.`,
        sound: 'default',
      },
      trigger: null,
    });
  } catch (e) {}
}

