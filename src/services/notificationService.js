import { Platform, Linking, Alert } from 'react-native';
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
 * CẤU HÌNH CỔNG GỬI SMS & EMAIL THỰC TẾ
 * Khi bạn có tài khoản nhà cung cấp SMS (eSMS.vn, SpeedSMS.vn, Twilio):
 * Bạn chỉ cần cung cấp API Key / Secret để điền vào đây.
 */
export const SMS_GATEWAY_CONFIG = {
  provider: 'esms', // 'speedsms' | 'esms' | 'twilio' | 'none'
  apiKey: '48B4F00221174DD213DFBB337D4553',
  secretKey: '38B9C6AE445BBD459C6C162E69890A',
  // Brandname test do eSMS cấp sẵn cho tài khoản. Khi có Brandname riêng "MyLife" đã được duyệt, đổi tại đây.
  brandName: 'Baotrixemay',
  // Tin Brandname CSKH (SmsType 2) BẮT BUỘC khớp 100% một mẫu (template) đã duyệt, nếu không eSMS báo
  // "Sai template Brandname CSKH" và tin bị tính là thất bại. Đây là mẫu đã duyệt của Brandname test.
  templateMessage: 'Cam on quy khach da su dung dich vu cua chung toi. Chuc quy khach mot ngay tot lanh!',
};

/**
 * Chuẩn hóa số điện thoại Việt Nam về dạng 0xxxxxxxxx (chấp nhận +84..., 84..., 0..., hoặc 9 số không có số 0)
 */
export function normalizeVnPhone(phone) {
  let digits = String(phone || '').replace(/[^0-9]/g, '');
  if (digits.startsWith('84') && digits.length >= 11) digits = '0' + digits.slice(2);
  else if (!digits.startsWith('0') && digits.length === 9) digits = '0' + digits;
  return digits;
}

/**
 * Gửi SMS thực tế qua cổng API (SpeedSMS, eSMS, Twilio)
 */
export async function sendActualSms({ phone, message }) {
  if (!phone) return { success: false, reason: 'Chưa có số điện thoại' };

  const cleanPhone = normalizeVnPhone(phone);

  try {
    // 1. Cổng SpeedSMS (Việt Nam)
    if (SMS_GATEWAY_CONFIG.provider === 'speedsms' && SMS_GATEWAY_CONFIG.apiKey) {
      const authHeader = 'Basic ' + (typeof btoa !== 'undefined' ? btoa(SMS_GATEWAY_CONFIG.apiKey + ':x') : '');
      const response = await fetch('https://api.speedsms.vn/index.php/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          to: [cleanPhone],
          content: message,
          sms_type: 2, // 2: tin nhắn CSKH hoặc tin nhắn đầu số cố định
          sender: SMS_GATEWAY_CONFIG.brandName || '',
        }),
      });
      const data = await response.json();
      console.log('[SpeedSMS Response]:', data);
      return data;
    }

    // 2. Cổng eSMS.vn (Việt Nam)
    if (SMS_GATEWAY_CONFIG.provider === 'esms' && SMS_GATEWAY_CONFIG.apiKey) {
      const useBrand = !!SMS_GATEWAY_CONFIG.brandName;
      console.log(`[eSMS] 🚀 Đang gửi SMS đến ${cleanPhone}...`);
      const response = await fetch('https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ApiKey: SMS_GATEWAY_CONFIG.apiKey,
          SecretKey: SMS_GATEWAY_CONFIG.secretKey,
          // Brandname CSKH chỉ chấp nhận nội dung đúng mẫu đã duyệt
          Content: useBrand ? SMS_GATEWAY_CONFIG.templateMessage : message,
          Phone: cleanPhone,
          SmsType: useBrand ? '2' : '1', // 2: Brandname CSKH, 1: quảng cáo không Brandname
          Brandname: SMS_GATEWAY_CONFIG.brandName || '',
          IsUnicode: '0',
        }),
      });
      const data = await response.json();
      console.log('[eSMS Response]:', data);

      const isSuccess = String(data?.CodeResult || data?.CodeResponse) === '100';
      return {
        success: isSuccess,
        code: data?.CodeResult || data?.CodeResponse,
        message: data?.ErrorMessage || (isSuccess ? 'Gửi SMS thành công' : 'Lỗi gửi SMS'),
        raw: data,
      };
    }

    // 3. Cổng Twilio (Quốc tế)
    if (SMS_GATEWAY_CONFIG.provider === 'twilio' && SMS_GATEWAY_CONFIG.apiKey) {
      const accountSid = SMS_GATEWAY_CONFIG.apiKey;
      const authToken = SMS_GATEWAY_CONFIG.secretKey;
      const fromNumber = SMS_GATEWAY_CONFIG.brandName;
      const authHeader = 'Basic ' + (typeof btoa !== 'undefined' ? btoa(`${accountSid}:${authToken}`) : '');

      let formattedPhone = cleanPhone;
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+84' + formattedPhone.slice(1);
      }

      const bodyData = `To=${encodeURIComponent(formattedPhone)}&From=${encodeURIComponent(fromNumber)}&Body=${encodeURIComponent(message)}`;
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyData,
      });
      return await response.json();
    }
  } catch (err) {
    console.log('[SMS Gateway Error]:', err.message);
    return { success: false, error: err.message };
  }

  return { success: false, reason: 'Chưa cấu hình API Key cổng SMS Gateway' };
}

/**
 * Gửi thông báo lịch trình đến SMS và Gmail
 */
export async function sendScheduleAlert({ event, phone, email, triggerType = 'reminder', openNativeSms = true }) {
  // Chuyển tiêu đề sang không dấu để SMS gửi nhanh, tiết kiệm ký tự và không bị lỗi font trên mọi dòng máy
  const cleanTitle = (event.title || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  const timeDesc = `${event.time || ''} ngày ${event.date || ''}`;
  const message = `[MyLife] Nhac lich: "${cleanTitle}" luc ${event.time || ''} ngay ${event.date || ''}.`;

  console.log(`[SMS & Gmail Service] 📲 Đang gửi SMS đến: ${phone || 'Chưa cung cấp SĐT'}`);
  console.log(`[SMS & Gmail Service] ✉️ Đang gửi Gmail đến: ${email || 'Chưa cung cấp Email'}`);
  console.log(`[SMS & Gmail Service] 📋 Nội dung: ${message}`);

  // Brandname CSKH chỉ cho gửi đúng mẫu cố định nên không thể mang nội dung lịch trình.
  // Chỉ gửi qua cổng khi gateway cho phép nội dung tùy ý (không dùng Brandname mẫu).
  const gatewayAllowsCustomContent = !!SMS_GATEWAY_CONFIG.apiKey && !SMS_GATEWAY_CONFIG.brandName;
  let smsResult = null;
  if (gatewayAllowsCustomContent) {
    smsResult = await sendActualSms({ phone, message });
    console.log('[SMS Gateway Response]:', smsResult);
  }
  const gatewayDelivered = !!smsResult?.success;

  // Thông báo đẩy xác nhận đến thiết bị
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: gatewayDelivered ? '📲✉️ Đã gửi thông báo SMS & Gmail!' : '🔔 Đã lưu lịch trình',
        body: gatewayDelivered
          ? `Lịch trình "${event.title}" (${timeDesc}) đã được gửi tới ${phone || 'SĐT'} và ${email || 'Gmail'}.`
          : `Lịch trình "${event.title}" (${timeDesc}) đã được lưu. Bạn sẽ nhận nhắc lịch trên thiết bị này.`,
        sound: 'default',
      },
      trigger: null,
    });
  } catch (e) {}

  // Nếu cổng SMS không gửi được nội dung lịch trình, đề xuất mở ứng dụng Tin nhắn của máy để gửi SMS thật qua SIM
  if (!gatewayDelivered && phone && openNativeSms) {
    Alert.alert(
      '📲 Gửi tin nhắn SMS thật',
      `Bạn có muốn mở ứng dụng Tin nhắn điện thoại để gửi SMS nhắc lịch "${event.title}" đến số ${phone} không?`,
      [
        { text: 'Để sau', style: 'cancel' },
        {
          text: 'Mở Tin Nhắn 📲',
          onPress: () => {
            const separator = Platform.OS === 'ios' ? '&' : '?';
            const url = `sms:${normalizeVnPhone(phone)}${separator}body=${encodeURIComponent(message)}`;
            Linking.openURL(url).catch((err) => {
              console.log('Không mở được SMS app:', err);
            });
          },
        },
      ]
    );
  }

  return { success: gatewayDelivered, timestamp: Date.now(), smsResult };
}

/**
 * Gửi thông báo SMS & Gmail chào mừng khi đăng ký tài khoản mới thành công
 */
export async function sendWelcomeAccountAlert({ phone, email, stickers = [] }) {
  console.log(`[Auth Alert] 🚀 Bắt đầu gửi SMS chào mừng đến SĐT: ${phone}`);
  console.log(`[Auth Alert] Gửi Gmail chào mừng đến: ${email}`);

  let smsResult = null;
  if (phone) {
    const welcomeMessage = '[MyLife] Chuc mung ban da dang ky tai khoan MyLife thanh cong! Chuc ban mot ngay moi tran day niem vui!';
    smsResult = await sendActualSms({ phone, message: welcomeMessage });
    console.log('[Auth Alert SMS Result]:', smsResult);

    if (smsResult && smsResult.success) {
      Alert.alert(
        '📲 Đã gửi tin nhắn SMS!',
        `Hệ thống eSMS đã gửi tin nhắn chào mừng tới số ${normalizeVnPhone(phone)}. Bạn kiểm tra hộp thư tin nhắn điện thoại nhé!`
      );
    } else {
      // Hiện rõ lý do thất bại (mã lỗi eSMS) để biết chính xác vì sao số này chưa nhận được SMS
      const reason = smsResult?.message || smsResult?.error || smsResult?.reason || 'Không rõ nguyên nhân';
      Alert.alert(
        '⚠️ Chưa gửi được SMS',
        `Không gửi được SMS tới số ${normalizeVnPhone(phone)}.\nLý do: ${reason}${smsResult?.code ? ` (mã ${smsResult.code})` : ''}`
      );
    }
  }

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

  return smsResult;
}

