import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  InteractionManager,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import mobileAds, {
  AdEventType,
  BannerAd,
  BannerAdSize,
  InterstitialAd,
} from 'react-native-google-mobile-ads';

// Constants & Data
import { THEMES, FONT_FAMILY, getEffectiveTheme } from './src/constants/themes';
import { TRANSLATIONS } from './src/constants/translations';
import { CONFIG, CUTE_STICKERS } from './src/constants/data';

// Cấu hình kiểu chữ Monospace (máy đánh chữ) cho TOÀN BỘ ứng dụng
// Dùng WeakMap cache để trả về cùng 1 tham chiếu đối tượng, triệt tiêu hoàn toàn việc cấp phát mảng mới trên mỗi frame gây giật màn hình
const MONO_STYLE = { fontFamily: FONT_FAMILY };
const styleCache = new WeakMap();
const monoReadySet = new WeakSet();

function getCachedMonoStyle(s) {
  if (!s) return MONO_STYLE;
  if (typeof s !== 'object') return s;
  if (monoReadySet.has(s) || s.fontFamily) return s;
  if (Array.isArray(s) && s.some((item) => item?.fontFamily)) {
    monoReadySet.add(s);
    return s;
  }
  let cached = styleCache.get(s);
  if (!cached) {
    cached = Array.isArray(s) ? [MONO_STYLE, ...s] : [MONO_STYLE, s];
    styleCache.set(s, cached);
    monoReadySet.add(cached);
  }
  return cached;
}

try {
  if (Text.defaultProps == null) Text.defaultProps = {};
  Text.defaultProps.style = MONO_STYLE;
} catch (e) {}

try {
  if (TextInput.defaultProps == null) TextInput.defaultProps = {};
  TextInput.defaultProps.style = MONO_STYLE;
} catch (e) {}

if (typeof Text?.render === 'function') {
  const originalTextRender = Text.render;
  Text.render = function (props, ref) {
    const s = props?.style;
    const style = getCachedMonoStyle(s);
    if (style === s) return originalTextRender.call(this, props, ref);
    return originalTextRender.call(this, { ...props, style }, ref);
  };
}

if (typeof TextInput?.render === 'function') {
  const originalTextInputRender = TextInput.render;
  TextInput.render = function (props, ref) {
    const s = props?.style;
    const style = getCachedMonoStyle(s);
    if (style === s) return originalTextInputRender.call(this, props, ref);
    return originalTextInputRender.call(this, { ...props, style }, ref);
  };
}

// Cấu hình AdMob Banner tĩnh để tránh re-render / reload liên tục gây giật lag
const AD_REQUEST_OPTIONS = { requestNonPersonalizedAdsOnly: true };

const MemoizedBannerAd = React.memo(function MemoizedBannerAd({ unitId }) {
  return (
    <BannerAd
      unitId={unitId}
      size={BannerAdSize.BANNER}
      requestOptions={AD_REQUEST_OPTIONS}
    />
  );
});


// Utils
import { dateKey, parseDateTime, timeString, getWeek, clampRemindMinutes } from './src/utils/dateUtils';
import { resolveItemCategory } from './src/utils/categoryUtils';

// Services
import { request, normalizeEvent, fetchStickersApi } from './src/services/api';
import { fetchRealWeather } from './src/services/weatherService';
import {
  syncUserToSqlServer,
  syncAllLocalUsersToSqlServer,
  fetchUserFromSqlServer,
  fetchAllUsersFromSqlServer,
} from './src/services/sqlUserService';
import {
  setupNotifications,
  getEventReminders,
  cancelReminders,
  scheduleEventReminders,
  syncUpcomingEventReminders,
  scheduleMorningGreeting,
  sendWelcomeAccountAlert,
} from './src/services/notificationService';
import { trackAnalyticsEvent, trackScreenView } from './src/services/analyticsService';
import {
  fetchDailyBriefing,
  fetchWeeklyInsights,
  getInstantDailyBriefing,
  getInstantWeeklyInsights,
  reportAiContent,
} from './src/services/aiService';

// Components
import TopBar from './src/components/TopBar';
import TabBar from './src/components/TabBar';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import HabitsScreen from './src/screens/HabitsScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Modals
import StickerModal from './src/modals/StickerModal';
import MoodModal from './src/modals/MoodModal';
import HabitModal from './src/modals/HabitModal';
import TodoModal from './src/modals/TodoModal';
import DDayModal from './src/modals/DDayModal';
import EventEditorModal from './src/modals/EventEditorModal';
import AuthModal from './src/modals/AuthModal';
import PyramidRewardModal from './src/modals/PyramidRewardModal';
import SepayPaymentModal from './src/modals/SepayPaymentModal';
import SettingsModal from './src/modals/SettingsModal';

// Setup push notification handler
setupNotifications();

// Giá trị mặc định ban đầu cho thói quen, việc cần làm và đếm ngược
const DEFAULT_HABITS = [
  { id: '1', title: 'Uống 2L nước', icon: '💧', color: '#4EA8DE', category: 'health', history: {} },
  { id: '2', title: 'Đọc sách 20 phút', icon: '📖', color: '#A290E8', category: 'study', history: {} },
  { id: '3', title: 'Đi dạo ngoài trời', icon: '🏃‍♀️', color: '#52B788', category: 'health', history: {} },
  { id: '4', title: 'Ngủ sớm trước 11h', icon: '🌙', color: '#FFB84C', category: 'health', history: {} },
];
const DEFAULT_TODOS = [
  { id: '1', title: 'Mua hoa cúc họa mi trang trí bàn 🌼', date: dateKey(new Date()), category: 'personal', completed: false, starred: true },
  { id: '2', title: 'Chuẩn bị tài liệu ôn tập 📚', date: dateKey(new Date()), category: 'study', completed: true, starred: false },
];
const DEFAULT_COUNTDOWNS = [
  { id: '1', title: 'Kỳ nghỉ hè & Du lịch 🏖️', targetDate: '2026-11-20', icon: '✈️', color: '#FF7E95' },
  { id: '2', title: 'Sinh nhật bạn thân 🎂', targetDate: '2026-11-05', icon: '🎁', color: '#A290E8' },
];

export default function App() {
  // Language & Theme State
  const [lang, setLang] = useState('vi');
  const langRef = useRef('vi');
  langRef.current = lang;
  const [defaultRemindMinutes, setDefaultRemindMinutes] = useState(0);
  const t = useMemo(() => TRANSLATIONS[lang] || TRANSLATIONS.vi, [lang]);

  const [currentThemeKey, setCurrentThemeKey] = useState('strawberry');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const theme = useMemo(
    () => getEffectiveTheme(currentThemeKey, isDarkMode),
    [currentThemeKey, isDarkMode]
  );

  // Navigation & Date State
  const [activeTab, setActiveTab] = useState('home');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMode, setCalendarMode] = useState('month');

  // Events & Data States
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // MyLife Local Storage States (Khởi tạo theo template mặc định)
  const [stickersMap, setStickersMap] = useState({});
  const [moodsMap, setMoodsMap] = useState({});
  const [habits, setHabits] = useState(DEFAULT_HABITS);
  const [todos, setTodos] = useState(DEFAULT_TODOS);
  const [countdowns, setCountdowns] = useState(DEFAULT_COUNTDOWNS);

  // Real-time Weather
  const [weather, setWeather] = useState({
    temp: 28,
    icon: '🌤️',
    city: 'Hà Nội',
    descVi: 'Nắng nhẹ',
    descEn: 'Partly sunny',
    loading: false,
  });

  // Modal Visibility States
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pickerMode, setPickerMode] = useState(null);
  const [pickerDraftDate, setPickerDraftDate] = useState(new Date());

  const [stickerPickerVisible, setStickerPickerVisible] = useState(false);
  const [moodModalVisible, setMoodModalVisible] = useState(false);
  const [moodDraftNote, setMoodDraftNote] = useState('');
  const [selectedMoodKey, setSelectedMoodKey] = useState('happy');

  const [addHabitModalVisible, setAddHabitModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('✨');
  const [newHabitCategory, setNewHabitCategory] = useState('health');

  const [addTodoModalVisible, setAddTodoModalVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoCategory, setNewTodoCategory] = useState('work');

  const [addDDayModalVisible, setAddDDayModalVisible] = useState(false);
  const [newDDayTitle, setNewDDayTitle] = useState('');
  const [newDDayDate, setNewDDayDate] = useState(dateKey(new Date()));
  const [newDDayIcon, setNewDDayIcon] = useState('🎉');
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  // User Account & Stickers State
  const [userAccount, setUserAccount] = useState(null); // { phone, email, password, registeredAt }
  const [ownedStickers, setOwnedStickers] = useState([]); // Sticker nhận được khi đăng ký
  const [apiStickers, setApiStickers] = useState(CUTE_STICKERS);

  // Định danh tài khoản cá nhân hiện tại ('guest' hoặc SĐT của tài khoản)
  const currentAccountKey = useMemo(() => {
    return userAccount?.phone ? String(userAccount.phone).trim() : 'guest';
  }, [userAccount]);
  const currentAccountKeyRef = useRef('guest');
  useEffect(() => {
    currentAccountKeyRef.current = currentAccountKey;
  }, [currentAccountKey]);

  // Pro Membership & Pyramid Rewards
  const [proExpiresAt, setProExpiresAt] = useState(0);
  const [proTrialUsed, setProTrialUsed] = useState(false);
  // Chỉ tài khoản ĐÃ ĐĂNG NHẬP và CÒN HẠN MỚI LÀ PRO VIP
  const isProUser = useMemo(() => {
    return !!userAccount && Number(proExpiresAt) > Date.now();
  }, [userAccount, proExpiresAt]);
  const proDaysLeft = useMemo(
    () => Math.max(0, Math.ceil((proExpiresAt - Date.now()) / (24 * 60 * 60 * 1000))),
    [proExpiresAt]
  );

  // Phân quyền tài khoản:
  // - 'guest': Tài khoản thường (chưa đăng ký) -> 1 sticker cơ bản 🌸, có quảng cáo
  // - 'member': Tài khoản thành viên (đã đăng ký) -> 3 sticker, đồng bộ tài khoản, có quảng cáo
  // - 'pro': Tài khoản PRO VIP -> Không quảng cáo, full sticker, lặp lịch tự động
  const accountRole = useMemo(() => {
    if (!userAccount) return 'guest';
    if (isProUser) return 'pro';
    return 'member';
  }, [userAccount, isProUser]);

  // Bộ sticker khả dụng theo cấp độ phân quyền
  const effectiveOwnedStickers = useMemo(() => {
    if (accountRole === 'pro') return apiStickers;
    if (accountRole === 'member') return ownedStickers.length > 0 ? ownedStickers : ['🌸', '🍓', '🐱'];
    return ['🌸']; // Tài khoản thường (chưa đăng ký) chỉ có 1 sticker mặc định
  }, [accountRole, apiStickers, ownedStickers]);

  // Additional Modals Visibility
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [pyramidRewardModalVisible, setPyramidRewardModalVisible] = useState(false);
  const [sepayModalVisible, setSepayModalVisible] = useState(false);
  const [selectedSepayPackage, setSelectedSepayPackage] = useState('3months');

  // AI Assistant States (#2 Daily Briefing & #3 Weekly Insights)
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiBriefing, setAiBriefing] = useState(() => getInstantDailyBriefing({ lang: 'vi' }));
  const [aiBriefingLoading, setAiBriefingLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState(() => getInstantWeeklyInsights({ lang: 'vi' }));
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);

  // Hàm tải sự kiện riêng biệt cho từng tài khoản cá nhân
  const loadEventsForUser = useCallback(async (accountKey, showSpinner = true) => {
    const activeKey = accountKey || currentAccountKeyRef.current || 'guest';
    if (showSpinner) setLoading(true);
    setError('');

    // Đọc ngay bản lưu cục bộ của tài khoản này nếu có để hiển thị tức thì không bị trống lịch
    try {
      const cached = await AsyncStorage.getItem(`cutecalendar_${activeKey}_events`);
      if (cached) {
        const parsedCached = JSON.parse(cached);
        if (currentAccountKeyRef.current === activeKey) {
          setEvents(parsedCached);
        }
      }
    } catch (e) {}

    try {
      const data = await request();
      if (!Array.isArray(data)) throw new Error('Invalid MockAPI format');
      const allNormalized = data.map(normalizeEvent);

      // Phân tách lịch trình độc lập tuyệt đối cho từng tài khoản:
      // - Tài khoản khách ('guest'): chỉ thấy lịch của guest hoặc lịch cũ không gắn userId
      // - Tài khoản đã đăng nhập (SĐT): CHỈ THẤY LỊCH CỦA CHÍNH TÀI KHOẢN ĐÓ
      const userEvents = allNormalized.filter((item) => {
        const itemUser = String(item.userId || '').trim();
        if (activeKey === 'guest') {
          return !itemUser || itemUser === 'guest';
        }
        return itemUser === activeKey;
      });

      // Lưu trữ an toàn vào local storage của tài khoản này
      await AsyncStorage.setItem(`cutecalendar_${activeKey}_events`, JSON.stringify(userEvents));

      if (currentAccountKeyRef.current === activeKey) {
        setEvents(userEvents);
        scheduleMorningGreeting(userEvents);
        syncUpcomingEventReminders(userEvents, langRef.current);
      }
    } catch (loadError) {
      console.warn(`Lỗi tải MockAPI cho tài khoản ${activeKey}:`, loadError);
      setError(loadError.message || 'Cannot load events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadEvents = useCallback(
    (showSpinner = true) => loadEventsForUser(currentAccountKeyRef.current, showSpinner),
    [loadEventsForUser]
  );

  // Chuyển đổi toàn bộ dữ liệu (lịch trình, thói quen, to-do, sticker, mood) theo từng tài khoản bằng multiGet
  const switchAccountData = useCallback(async (targetAccount) => {
    const targetKey = targetAccount?.phone ? String(targetAccount.phone).trim() : 'guest';
    currentAccountKeyRef.current = targetKey;

    setLoading(true);
    try {
      const keys = [
        `cutecalendar_${targetKey}_stickers`,
        `cutecalendar_${targetKey}_moods`,
        `cutecalendar_${targetKey}_habits`,
        `cutecalendar_${targetKey}_todos`,
        `cutecalendar_${targetKey}_countdowns`,
        `cutecalendar_${targetKey}_events`,
      ];
      const pairs = await AsyncStorage.multiGet(keys);
      const map = Object.fromEntries(pairs);

      setStickersMap(map[keys[0]] ? JSON.parse(map[keys[0]]) : {});
      setMoodsMap(map[keys[1]] ? JSON.parse(map[keys[1]]) : {});

      if (map[keys[2]]) {
        setHabits(JSON.parse(map[keys[2]]));
      } else {
        setHabits(DEFAULT_HABITS);
        AsyncStorage.setItem(keys[2], JSON.stringify(DEFAULT_HABITS)).catch(() => {});
      }

      if (map[keys[3]]) {
        setTodos(JSON.parse(map[keys[3]]));
      } else {
        setTodos(DEFAULT_TODOS);
        AsyncStorage.setItem(keys[3], JSON.stringify(DEFAULT_TODOS)).catch(() => {});
      }

      if (map[keys[4]]) {
        setCountdowns(JSON.parse(map[keys[4]]));
      } else {
        setCountdowns(DEFAULT_COUNTDOWNS);
        AsyncStorage.setItem(keys[4], JSON.stringify(DEFAULT_COUNTDOWNS)).catch(() => {});
      }

      if (map[keys[5]]) {
        try {
          setEvents(JSON.parse(map[keys[5]]));
        } catch (e) {
          setEvents([]);
        }
      } else {
        setEvents([]);
      }

      // Đồng bộ danh sách sự kiện từ đám mây MockAPI
      await loadEventsForUser(targetKey, false);
    } catch (e) {
      console.warn('Lỗi switchAccountData:', e);
    } finally {
      setLoading(false);
    }
  }, [loadEventsForUser]);

  // AdMob States
  const [adsInitialized, setAdsInitialized] = useState(false);
  const [navigationPending, setNavigationPending] = useState(false);
  const [bottomBannerVisible, setBottomBannerVisible] = useState(true);
  const interstitial = useMemo(
    () => InterstitialAd.createForAdRequest(CONFIG.INTERSTITIAL_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    }),
    [],
  );
  const pendingTabRef = useRef(null);
  const lastInterstitialShownRef = useRef(0);
  const interstitialLoadedRef = useRef(false);
  const adsInitializedRef = useRef(false);
  const retryInterstitialRef = useRef(null);

  // Daily Quote
  const dailyQuote = useMemo(() => {
    const day = selectedDate.getDate();
    return t.quotes[day % t.quotes.length];
  }, [selectedDate, t.quotes]);

  // Load Real Weather
  const refreshWeather = useCallback(async () => {
    const data = await fetchRealWeather();
    if (data) {
      setWeather(data);
      AsyncStorage.setItem('cutecalendar_weather', JSON.stringify(data)).catch(() => {});
    }
  }, []);

  // Load AsyncStorage Data (gộp multiGet 2 lần để khởi động cực nhanh)
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const globalKeys = [
          'cutecalendar_language',
          'cutecalendar_theme',
          'cutecalendar_darkmode',
          'cutecalendar_ai_enabled',
          'cutecalendar_weather',
          'cutecalendar_user_account',
          CONFIG.DEFAULT_REMIND_MINUTES_KEY,
        ];
        const globalPairs = await AsyncStorage.multiGet(globalKeys);
        const gMap = Object.fromEntries(globalPairs);

        const storedLang = gMap.cutecalendar_language;
        if (storedLang === 'vi' || storedLang === 'en') setLang(storedLang);

        const storedDefaultRemind = gMap[CONFIG.DEFAULT_REMIND_MINUTES_KEY];
        if (storedDefaultRemind !== null && storedDefaultRemind !== undefined) {
          setDefaultRemindMinutes(clampRemindMinutes(storedDefaultRemind));
        }

        const storedTheme = gMap.cutecalendar_theme;
        if (storedTheme && THEMES[storedTheme]) setCurrentThemeKey(storedTheme);

        const storedDark = gMap.cutecalendar_darkmode;
        if (storedDark !== null && storedDark !== undefined) {
          setIsDarkMode(storedDark === 'true');
        } else if (storedTheme && (storedTheme === 'midnight' || storedTheme === 'darkRose')) {
          setIsDarkMode(true);
        }

        const storedAiEnabled = gMap.cutecalendar_ai_enabled;
        if (storedAiEnabled !== null && storedAiEnabled !== undefined) {
          setAiEnabled(storedAiEnabled !== 'false');
        }

        if (gMap.cutecalendar_weather) {
          try { setWeather(JSON.parse(gMap.cutecalendar_weather)); } catch (e) {}
        }
        refreshWeather();

        // 1. Tải thông tin tài khoản đăng nhập hiện tại
        let activeKey = 'guest';
        const storedUserStr = gMap.cutecalendar_user_account;
        if (storedUserStr) {
          const userObj = JSON.parse(storedUserStr);
          setUserAccount(userObj);
          activeKey = userObj.phone ? String(userObj.phone).trim() : 'guest';
          currentAccountKeyRef.current = activeKey;
          if (userObj.ownedStickers) setOwnedStickers(userObj.ownedStickers);
          setProExpiresAt(Number(userObj.proExpiresAt) || 0);
          setProTrialUsed(userObj.proTrialUsed === true);
        } else {
          setUserAccount(null);
          currentAccountKeyRef.current = 'guest';
          setOwnedStickers([]);
          setProExpiresAt(0);
          setProTrialUsed(false);
        }

        // 2. Nạp toàn bộ dữ liệu cá nhân trong 1 lần gọi multiGet
        const accountKeys = [
          `cutecalendar_${activeKey}_stickers`,
          `cutecalendar_${activeKey}_moods`,
          `cutecalendar_${activeKey}_habits`,
          `cutecalendar_${activeKey}_todos`,
          `cutecalendar_${activeKey}_countdowns`,
        ];
        if (activeKey === 'guest') {
          accountKeys.push(
            'cutecalendar_stickers',
            'cutecalendar_moods',
            'cutecalendar_habits',
            'cutecalendar_todos',
            'cutecalendar_countdowns'
          );
        }
        const accPairs = await AsyncStorage.multiGet(accountKeys);
        const aMap = Object.fromEntries(accPairs);

        const storedStickers = aMap[`cutecalendar_${activeKey}_stickers`] || (activeKey === 'guest' ? aMap.cutecalendar_stickers : null);
        if (storedStickers) setStickersMap(JSON.parse(storedStickers));

        const storedMoods = aMap[`cutecalendar_${activeKey}_moods`] || (activeKey === 'guest' ? aMap.cutecalendar_moods : null);
        if (storedMoods) setMoodsMap(JSON.parse(storedMoods));

        const storedHabits = aMap[`cutecalendar_${activeKey}_habits`] || (activeKey === 'guest' ? aMap.cutecalendar_habits : null);
        if (storedHabits) setHabits(JSON.parse(storedHabits));

        const storedTodos = aMap[`cutecalendar_${activeKey}_todos`] || (activeKey === 'guest' ? aMap.cutecalendar_todos : null);
        if (storedTodos) setTodos(JSON.parse(storedTodos));

        const storedCountdowns = aMap[`cutecalendar_${activeKey}_countdowns`] || (activeKey === 'guest' ? aMap.cutecalendar_countdowns : null);
        if (storedCountdowns) setCountdowns(JSON.parse(storedCountdowns));

        // 3. Tải lịch trình riêng biệt cho tài khoản activeKey
        loadEventsForUser(activeKey, false);

        // Dọn dẹp ngầm không chặn luồng khởi động
        AsyncStorage.multiRemove(['cutecalendar_pro_expires', 'cutecalendar_pro_trial_used']).catch(() => {});

        // Gọi API lấy Stickers
        fetchStickersApi().then((stks) => {
          if (Array.isArray(stks) && stks.length > 0) setApiStickers(stks);
        });

        // 4. Tự động đồng bộ seluruh tài khoản trên máy lên SQL Server ([MyLifeDB].[dbo].[Users])
        AsyncStorage.getItem('cutecalendar_users_db')
          .then((dbStr) => {
            const dbMap = dbStr ? JSON.parse(dbStr) : {};
            if (storedUserStr) {
              try {
                const curU = JSON.parse(storedUserStr);
                if (curU && curU.phone) dbMap[curU.phone] = curU;
              } catch (e) {}
            }
            const allLocalUsers = Object.values(dbMap);
            if (allLocalUsers.length > 0) {
              syncAllLocalUsersToSqlServer(allLocalUsers);
            }
          })
          .catch(() => {});
      } catch (e) {
        console.warn('Lỗi đọc AsyncStorage:', e);
      }
    };
    loadStoredData();
  }, [refreshWeather, loadEventsForUser]);


  // Quản lý cơ sở dữ liệu tài khoản (Đồng bộ song song AsyncStorage + Microsoft SQL Server [MyLifeDB].[dbo].[Users])
  const saveUserToDb = async (user) => {
    try {
      const dbStr = await AsyncStorage.getItem('cutecalendar_users_db');
      const db = dbStr ? JSON.parse(dbStr) : {};
      db[user.phone] = user;
      await AsyncStorage.setItem('cutecalendar_users_db', JSON.stringify(db));
    } catch (e) {}
    // Gửi trực tiếp lên bảng [MyLifeDB].[dbo].[Users] trên SQL Server
    syncUserToSqlServer(user).catch(() => {});
  };

  const getUserFromDb = async (phone) => {
    // 1. Ưu tiên kiểm tra trên SQL Server ([MyLifeDB].[dbo].[Users]) trước
    const sqlUser = await fetchUserFromSqlServer(phone);
    if (sqlUser && sqlUser.phone) {
      try {
        const dbStr = await AsyncStorage.getItem('cutecalendar_users_db');
        const db = dbStr ? JSON.parse(dbStr) : {};
        db[sqlUser.phone] = sqlUser;
        await AsyncStorage.setItem('cutecalendar_users_db', JSON.stringify(db));
      } catch (e) {}
      return sqlUser;
    }

    // 2. Dự phòng đọc từ bộ nhớ cục bộ nếu máy tính SQL Server chưa bật
    try {
      const dbStr = await AsyncStorage.getItem('cutecalendar_users_db');
      if (!dbStr) return null;
      const db = JSON.parse(dbStr);
      const localUser = db[phone] || null;
      if (localUser) {
        syncUserToSqlServer(localUser).catch(() => {});
      }
      return localUser;
    } catch (e) {
      return null;
    }
  };

  const getUserByEmailFromDb = async (email) => {
    const targetEmail = String(email || '').trim().toLowerCase();
    if (!targetEmail) return null;

    // 1. Kiểm tra trên SQL Server ([MyLifeDB].[dbo].[Users])
    const sqlUsers = await fetchAllUsersFromSqlServer();
    if (Array.isArray(sqlUsers)) {
      const foundSql = sqlUsers.find((u) => String(u?.email || '').trim().toLowerCase() === targetEmail);
      if (foundSql) return foundSql;
    }

    // 2. Dự phòng kiểm tra trong bộ nhớ cục bộ
    try {
      const dbStr = await AsyncStorage.getItem('cutecalendar_users_db');
      if (!dbStr) return null;
      const db = JSON.parse(dbStr);
      return Object.values(db).find((u) => String(u?.email || '').trim().toLowerCase() === targetEmail) || null;
    } catch (e) {
      return null;
    }
  };

  // Save Settings
  const toggleLanguage = async (newLang) => {
    setLang(newLang);
    try {
      await AsyncStorage.setItem('cutecalendar_language', newLang);
    } catch (e) {}
  };

  const saveDefaultRemindMinutes = async (minutes) => {
    const clamped = clampRemindMinutes(minutes);
    setDefaultRemindMinutes(clamped);
    try {
      await AsyncStorage.setItem(CONFIG.DEFAULT_REMIND_MINUTES_KEY, String(clamped));
    } catch (e) {}
  };

  const saveTheme = async (themeKey) => {
    setCurrentThemeKey(themeKey);
    const targetTheme = THEMES[themeKey];
    const shouldBeDark = !!(targetTheme?.isDark || themeKey === 'midnight' || themeKey === 'darkRose');
    setIsDarkMode(shouldBeDark);
    try {
      await AsyncStorage.setItem('cutecalendar_theme', themeKey);
      await AsyncStorage.setItem('cutecalendar_darkmode', String(shouldBeDark));
    } catch (e) {}
  };

  const toggleDarkMode = async (enableDark) => {
    const nextDark = typeof enableDark === 'boolean' ? enableDark : !isDarkMode;
    setIsDarkMode(nextDark);
    if (!nextDark) {
      // Khi chọn Chế độ Sáng, nếu theme hiện tại là theme tối (Bóng Đêm hoặc Hoa Hồng Đêm), tự chuyển sang theme sáng (Dâu Sữa)
      if (currentThemeKey === 'midnight' || currentThemeKey === 'darkRose' || THEMES[currentThemeKey]?.isDark) {
        setCurrentThemeKey('strawberry');
        AsyncStorage.setItem('cutecalendar_theme', 'strawberry').catch(() => {});
      }
    } else {
      // Khi chọn Chế độ Tối, nếu theme hiện tại là theme sáng, tự chuyển sang theme tối (Bóng Đêm)
      if (!THEMES[currentThemeKey]?.isDark) {
        setCurrentThemeKey('midnight');
        AsyncStorage.setItem('cutecalendar_theme', 'midnight').catch(() => {});
      }
    }
    try {
      await AsyncStorage.setItem('cutecalendar_darkmode', String(nextDark));
    } catch (e) {}
  };

  // Auth Handlers (Đăng ký SĐT + Gmail, Đăng nhập, Đăng xuất)
  const handleRegisterSuccess = async (newUser) => {
    const existing = await getUserFromDb(newUser.phone);
    if (existing) {
      Alert.alert(
        'Số điện thoại đã tồn tại',
        `Số điện thoại ${newUser.phone} đã được đăng ký trên hệ thống. Vui lòng chuyển sang tab Đăng Nhập để vào tài khoản!`,
      );
      return false;
    }

    const existingEmailUser = await getUserByEmailFromDb(newUser.email);
    if (existingEmailUser) {
      Alert.alert(
        'Gmail đã được sử dụng',
        `Địa chỉ ${newUser.email} đã được liên kết với một số điện thoại khác (${existingEmailUser.phone}). Vui lòng dùng Gmail khác hoặc đăng nhập!`,
      );
      return false;
    }

    // Tài khoản mới đăng ký bắt đầu ở cấp THÀNH VIÊN THƯỜNG (chưa kích hoạt PRO)
    const freshUser = {
      ...newUser,
      proExpiresAt: 0,
      proTrialUsed: false,
    };
    setUserAccount(freshUser);
    setOwnedStickers(freshUser.ownedStickers || ['🌸', '🍓', '🐱']);
    setProExpiresAt(0);
    setProTrialUsed(false);
    try {
      await AsyncStorage.setItem('cutecalendar_user_account', JSON.stringify(freshUser));
      await AsyncStorage.setItem('cutecalendar_owned_stickers', JSON.stringify(freshUser.ownedStickers));
      await AsyncStorage.removeItem('cutecalendar_pro_expires');
      await AsyncStorage.removeItem('cutecalendar_pro_trial_used');
      await saveUserToDb(freshUser);
      sendWelcomeAccountAlert({ stickers: freshUser.ownedStickers });
    } catch (e) {}

    // Chuyển sang lịch cá nhân độc lập của tài khoản mới tạo
    await switchAccountData(freshUser);
    return true;
  };

  const handleLoginSuccess = async ({ phone, password }) => {
    const existing = await getUserFromDb(phone);
    if (!existing) {
      Alert.alert(
        'Tài khoản chưa tồn tại',
        `Số điện thoại ${phone} chưa được đăng ký trong hệ thống. Vui lòng chuyển sang tab "Đăng Ký Mới" để tạo tài khoản trước!`,
      );
      return false;
    }

    if (existing.password && existing.password !== password) {
      Alert.alert('Đăng nhập thất bại', 'Mật khẩu không chính xác. Vui lòng kiểm tra lại!');
      return false;
    }

    const account = existing;
    setUserAccount(account);
    setOwnedStickers(account.ownedStickers || ['🌸', '🍓', '🐱']);
    setProExpiresAt(Number(account.proExpiresAt) || 0);
    setProTrialUsed(account.proTrialUsed === true);
    try {
      await AsyncStorage.setItem('cutecalendar_user_account', JSON.stringify(account));
      await AsyncStorage.setItem('cutecalendar_owned_stickers', JSON.stringify(account.ownedStickers || []));
      await saveUserToDb(account);
    } catch (e) {}

    // Chuyển sang lịch cá nhân của tài khoản vừa đăng nhập (giữ nguyên vẹn lịch trình của tài khoản đó)
    await switchAccountData(account);
    Alert.alert('Đăng nhập thành công', `Chào mừng ${phone} đã quay trở lại! 🌸`);
    return true;
  };

  const handleResetPassword = async ({ phone, email, newPassword }) => {
    const existing = await getUserFromDb(phone);
    if (!existing) {
      Alert.alert(
        'Không tìm thấy tài khoản',
        `Số điện thoại ${phone} chưa từng được đăng ký trong ứng dụng!`
      );
      return false;
    }

    const userEmail = (existing.email || '').trim().toLowerCase();
    const inputEmail = (email || '').trim().toLowerCase();
    if (userEmail && userEmail !== inputEmail) {
      Alert.alert(
        'Xác thực không khớp',
        'Địa chỉ Gmail bạn vừa nhập không khớp với Gmail đã liên kết với số điện thoại này!'
      );
      return false;
    }

    const updatedUser = {
      ...existing,
      password: newPassword,
    };
    await saveUserToDb(updatedUser);

    if (userAccount && userAccount.phone === phone) {
      setUserAccount(updatedUser);
      await AsyncStorage.setItem('cutecalendar_user_account', JSON.stringify(updatedUser));
    }

    Alert.alert(
      'Đặt lại mật khẩu thành công 🎉',
      'Mật khẩu của bạn đã được cập nhật. Bạn có thể sử dụng mật khẩu mới để đăng nhập ngay!'
    );
    return true;
  };

  const handleLogout = async () => {
    setUserAccount(null);
    setOwnedStickers([]);
    setProExpiresAt(0);
    setProTrialUsed(false);
    try {
      await AsyncStorage.removeItem('cutecalendar_user_account');
      await AsyncStorage.removeItem('cutecalendar_owned_stickers');
      await AsyncStorage.removeItem('cutecalendar_pro_expires');
      await AsyncStorage.removeItem('cutecalendar_pro_trial_used');
    } catch (e) {}

    // Chuyển về dữ liệu lịch cá nhân của tài khoản thường (chưa đăng ký)
    await switchAccountData(null);
    Alert.alert('Đã đăng xuất', 'Bạn đang dùng tài khoản thường (chưa đăng ký).');
  };

  // Pyramid & Pro Membership Handlers
  const handleClaimTrial = async () => {
    const expires = Date.now() + 3 * 24 * 60 * 60 * 1000; // 3 ngày dùng thử
    setProExpiresAt(expires);
    setProTrialUsed(true);
    setPyramidRewardModalVisible(false);

    if (userAccount) {
      const updatedUser = {
        ...userAccount,
        proExpiresAt: expires,
        proTrialUsed: true,
      };
      setUserAccount(updatedUser);
      try {
        await AsyncStorage.setItem('cutecalendar_user_account', JSON.stringify(updatedUser));
        await saveUserToDb(updatedUser);
      } catch (e) {}
    }

    Alert.alert(
      '👑 Kích hoạt Quà Tặng thành công!',
      'Chúc mừng bạn nhận 3 ngày dùng thử Gói Thành viên PRO miễn phí! Đã tắt toàn bộ quảng cáo, mở full sticker và lặp lịch tự động.',
    );
  };

  // Mở Modal thanh toán SePay VietQR
  const handleOpenSepayPayment = (packageType = '3months') => {
    setSelectedSepayPackage(packageType);
    setPyramidRewardModalVisible(false);
    setSepayModalVisible(true);
  };

  // Kích hoạt VIP sau khi thanh toán thành công
  const handleSepaySuccess = async (packageType) => {
    const days = packageType === '6months' ? 180 : packageType === '1month' ? 30 : 90;
    const expires = Date.now() + days * 24 * 60 * 60 * 1000;
    setProExpiresAt(expires);

    if (userAccount) {
      const updatedUser = {
        ...userAccount,
        proExpiresAt: expires,
      };
      setUserAccount(updatedUser);
      try {
        await AsyncStorage.setItem('cutecalendar_user_account', JSON.stringify(updatedUser));
        await saveUserToDb(updatedUser);
      } catch (e) {}
    }
  };

  const handleUpgradeProPackage = async (packageType) => {
    handleOpenSepayPayment(packageType);
  };


  // Hủy gói PRO: đưa tài khoản về cấp Thành viên thường (giữ nguyên cờ đã dùng thử để không nhận lại quà)
  const handleCancelPro = () => {
    Alert.alert(
      'Hủy gói PRO?',
      'Bạn sẽ mất đặc quyền PRO (quảng cáo sẽ hiện lại, chỉ còn sticker đã sở hữu). Thời gian PRO còn lại sẽ không được hoàn lại.',
      [
        { text: 'Giữ gói PRO', style: 'cancel' },
        {
          text: 'Hủy gói PRO',
          style: 'destructive',
          onPress: async () => {
            setProExpiresAt(0);
            if (userAccount) {
              const updatedUser = { ...userAccount, proExpiresAt: 0 };
              setUserAccount(updatedUser);
              try {
                await AsyncStorage.setItem('cutecalendar_user_account', JSON.stringify(updatedUser));
                await saveUserToDb(updatedUser);
              } catch (e) {}
            }
            Alert.alert('Đã hủy gói PRO', 'Tài khoản của bạn đã trở về cấp Thành viên.');
          },
        },
      ],
    );
  };

  // Sticker Handlers
  const handleSelectSticker = async (sticker) => {
    const activeKey = currentAccountKeyRef.current || 'guest';
    const dateK = dateKey(selectedDate);
    const updated = { ...stickersMap, [dateK]: sticker };
    setStickersMap(updated);
    setStickerPickerVisible(false);
    try {
      await AsyncStorage.setItem(`cutecalendar_${activeKey}_stickers`, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleRemoveSticker = async () => {
    const activeKey = currentAccountKeyRef.current || 'guest';
    const dateK = dateKey(selectedDate);
    const updated = { ...stickersMap };
    delete updated[dateK];
    setStickersMap(updated);
    setStickerPickerVisible(false);
    try {
      await AsyncStorage.setItem(`cutecalendar_${activeKey}_stickers`, JSON.stringify(updated));
    } catch (e) {}
  };

  // Mood Handlers
  const handleSaveMood = async () => {
    const activeKey = currentAccountKeyRef.current || 'guest';
    const dateK = dateKey(selectedDate);
    const updated = {
      ...moodsMap,
      [dateK]: { key: selectedMoodKey, note: moodDraftNote.trim() },
    };
    setMoodsMap(updated);
    setMoodModalVisible(false);
    try {
      await AsyncStorage.setItem(`cutecalendar_${activeKey}_moods`, JSON.stringify(updated));
    } catch (e) {}
  };

  // Habit CRUD Handlers
  const openNewHabit = () => {
    setEditingHabit(null);
    setNewHabitTitle('');
    setNewHabitIcon('✨');
    setNewHabitCategory('health');
    setAddHabitModalVisible(true);
  };

  const openEditHabit = (habit) => {
    setEditingHabit(habit);
    setNewHabitTitle(habit.title);
    setNewHabitIcon(habit.icon || '✨');
    setNewHabitCategory(resolveItemCategory(habit));
    setAddHabitModalVisible(true);
  };

  const toggleHabit = async (habitId) => {
    const activeKey = currentAccountKeyRef.current || 'guest';
    const dateK = dateKey(selectedDate);
    const updated = habits.map((h) => {
      if (h.id === habitId) {
        const history = { ...(h.history || {}) };
        if (history[dateK]) {
          delete history[dateK];
        } else {
          history[dateK] = true;
        }
        return { ...h, history };
      }
      return h;
    });
    setHabits(updated);
    try {
      await AsyncStorage.setItem(`cutecalendar_${activeKey}_habits`, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleSaveHabit = async () => {
    if (!newHabitTitle.trim()) return;
    const activeKey = currentAccountKeyRef.current || 'guest';
    let updated;
    if (editingHabit) {
      updated = habits.map((h) =>
        h.id === editingHabit.id
          ? { ...h, title: newHabitTitle.trim(), icon: newHabitIcon || '✨', category: newHabitCategory || 'health' }
          : h
      );
    } else {
      const newH = {
        id: Date.now().toString(),
        title: newHabitTitle.trim(),
        icon: newHabitIcon || '✨',
        color: theme.primary,
        category: newHabitCategory || 'health',
        history: {},
      };
      updated = [...habits, newH];
    }
    setHabits(updated);
    setNewHabitTitle('');
    setEditingHabit(null);
    setAddHabitModalVisible(false);
    try {
      await AsyncStorage.setItem(`cutecalendar_${activeKey}_habits`, JSON.stringify(updated));
    } catch (e) {}
  };

  const deleteHabit = (habitId) => {
    Alert.alert(t.deleteHabitTitle, t.deleteHabitMsg, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          const activeKey = currentAccountKeyRef.current || 'guest';
          const updated = habits.filter((h) => h.id !== habitId);
          setHabits(updated);
          await AsyncStorage.setItem(`cutecalendar_${activeKey}_habits`, JSON.stringify(updated));
        },
      },
    ]);
  };

  // To-Do CRUD Handlers
  const openNewTodo = () => {
    setEditingTodo(null);
    setNewTodoTitle('');
    setNewTodoCategory('work');
    setAddTodoModalVisible(true);
  };

  const openEditTodo = (todo) => {
    setEditingTodo(todo);
    setNewTodoTitle(todo.title);
    setNewTodoCategory(resolveItemCategory(todo));
    setAddTodoModalVisible(true);
  };

  const toggleTodo = async (todoId) => {
    const activeKey = currentAccountKeyRef.current || 'guest';
    const updated = todos.map((tItem) => (tItem.id === todoId ? { ...tItem, completed: !tItem.completed } : tItem));
    setTodos(updated);
    try {
      await AsyncStorage.setItem(`cutecalendar_${activeKey}_todos`, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleSaveTodo = async () => {
    if (!newTodoTitle.trim()) return;
    const activeKey = currentAccountKeyRef.current || 'guest';
    let updated;
    if (editingTodo) {
      updated = todos.map((tItem) =>
        tItem.id === editingTodo.id
          ? { ...tItem, title: newTodoTitle.trim(), category: newTodoCategory || 'other' }
          : tItem
      );
    } else {
      const newT = {
        id: Date.now().toString(),
        title: newTodoTitle.trim(),
        date: dateKey(selectedDate),
        category: newTodoCategory || 'other',
        completed: false,
        starred: false,
      };
      updated = [newT, ...todos];
    }
    setTodos(updated);
    setNewTodoTitle('');
    setEditingTodo(null);
    setAddTodoModalVisible(false);
    try {
      await AsyncStorage.setItem(`cutecalendar_${activeKey}_todos`, JSON.stringify(updated));
    } catch (e) {}
  };

  const deleteTodo = (todoId) => {
    Alert.alert(
      lang === 'vi' ? 'Xóa việc cần làm?' : 'Delete Task?',
      lang === 'vi' ? 'Bạn có chắc muốn xóa việc này?' : 'Are you sure you want to delete this task?',
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            const activeKey = currentAccountKeyRef.current || 'guest';
            const updated = todos.filter((item) => item.id !== todoId);
            setTodos(updated);
            await AsyncStorage.setItem(`cutecalendar_${activeKey}_todos`, JSON.stringify(updated));
          },
        },
      ]
    );
  };

  // D-Day Handlers
  const handleCreateDDay = async () => {
    if (!newDDayTitle.trim()) return;
    const activeKey = currentAccountKeyRef.current || 'guest';
    const item = {
      id: Date.now().toString(),
      title: newDDayTitle.trim(),
      targetDate: newDDayDate,
      icon: newDDayIcon || '🎉',
      color: theme.primary,
    };
    const updated = [...countdowns, item];
    setCountdowns(updated);
    setNewDDayTitle('');
    setAddDDayModalVisible(false);
    try {
      await AsyncStorage.setItem(`cutecalendar_${activeKey}_countdowns`, JSON.stringify(updated));
    } catch (e) {}
  };

  const deleteDDay = (id) => {
    Alert.alert(t.deleteDDayTitle, t.deleteDDayMsg, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          const activeKey = currentAccountKeyRef.current || 'guest';
          const updated = countdowns.filter((c) => c.id !== id);
          setCountdowns(updated);
          await AsyncStorage.setItem(`cutecalendar_${activeKey}_countdowns`, JSON.stringify(updated));
        },
      },
    ]);
  };

  // Ads Logic
  const finishPendingNavigation = useCallback(() => {
    const pendingTab = pendingTabRef.current;
    if (pendingTab === null) return;
    pendingTabRef.current = null;
    setNavigationPending(false);
    setActiveTab(pendingTab);
  }, []);

  const navigateToTab = useCallback((tab) => {
    if (tab === activeTab || pendingTabRef.current !== null) return;
    const cooldownFinished = Date.now() - lastInterstitialShownRef.current >= CONFIG.INTERSTITIAL_COOLDOWN_MS;
    // BẢN THÀNH VIÊN PRO: HOÀN TOÀN KHÔNG HIỂN THỊ QUẢNG CÁO
    if (isProUser || !adsInitializedRef.current || !interstitialLoadedRef.current || !cooldownFinished) {
      setActiveTab(tab);
      return;
    }
    pendingTabRef.current = tab;
    setNavigationPending(true);
    interstitial.show().catch((adError) => {
      console.warn('Lỗi hiển thị quảng cáo:', adError);
      finishPendingNavigation();
    });
  }, [activeTab, finishPendingNavigation, interstitial, isProUser]);


  useEffect(() => {
    let active = true;
    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      interstitialLoadedRef.current = true;
      if (retryInterstitialRef.current) {
        clearTimeout(retryInterstitialRef.current);
        retryInterstitialRef.current = null;
      }
    });
    const unsubscribeOpened = interstitial.addAdEventListener(AdEventType.OPENED, () => {
      const shownAt = Date.now();
      lastInterstitialShownRef.current = shownAt;
      AsyncStorage.setItem(CONFIG.LAST_INTERSTITIAL_SHOWN_KEY, String(shownAt)).catch(() => {});
    });
    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialLoadedRef.current = false;
      finishPendingNavigation();
      interstitial.load();
    });
    const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (adError) => {
      console.warn('Lỗi load Interstitial:', adError);
      interstitialLoadedRef.current = false;
      finishPendingNavigation();
      if (active && !retryInterstitialRef.current) {
        retryInterstitialRef.current = setTimeout(() => {
          retryInterstitialRef.current = null;
          interstitial.load();
        }, 30_000);
      }
    });

    mobileAds().initialize().then(async () => {
      if (!active) return;
      try {
        const savedTimestamp = Number(await AsyncStorage.getItem(CONFIG.LAST_INTERSTITIAL_SHOWN_KEY));
        if (Number.isFinite(savedTimestamp) && savedTimestamp > 0) {
          lastInterstitialShownRef.current = savedTimestamp;
        }
      } catch (e) {}
      if (!active) return;
      adsInitializedRef.current = true;
      setAdsInitialized(true);
      interstitial.load();
    }).catch(() => {});

    return () => {
      active = false;
      unsubscribeLoaded();
      unsubscribeOpened();
      unsubscribeClosed();
      unsubscribeError();
      if (retryInterstitialRef.current) clearTimeout(retryInterstitialRef.current);
    };
  }, [finishPendingNavigation, interstitial]);

  // Event Form State
  const [form, setForm] = useState({
    title: '',
    date: dateKey(new Date()),
    time: '09:00',
    endTime: '10:00',
    category: 'work',
    description: '',
    sticker: '🌸',
    remindBeforeMinutes: 0,
  });

  useEffect(() => {
    trackScreenView(activeTab);
  }, [activeTab]);

  const selectedDateStr = useMemo(() => dateKey(selectedDate), [selectedDate]);
  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth();

  const week = useMemo(() => getWeek(selectedDate), [selectedDate]);
  const dayEvents = useMemo(
    () => events
      .filter((event) => event.date === selectedDateStr)
      .sort((a, b) => a.time.localeCompare(b.time)),
    [events, selectedDateStr],
  );
  const dayTodos = useMemo(
    () => todos.filter((todo) => todo.date === selectedDateStr),
    [todos, selectedDateStr],
  );
  const completedEventsCount = useMemo(
    () => events.reduce((count, event) => (event.completed ? count + 1 : count), 0),
    [events]
  );

  const monthDays = useMemo(() => {
    const first = new Date(selectedYear, selectedMonth, 1);
    const offset = (first.getDay() + 6) % 7;
    const count = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  }, [selectedYear, selectedMonth]);

  const changeDate = (offset, unit = 'day') => {
    const next = new Date(selectedDate);
    if (unit === 'month') {
      const day = next.getDate();
      next.setDate(1);
      next.setMonth(next.getMonth() + offset);
      next.setDate(Math.min(day, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
    } else {
      next.setDate(next.getDate() + (unit === 'week' ? offset * 7 : offset));
    }
    setSelectedDate(next);
  };

  const openNewEvent = () => {
    setPickerMode(null);
    setEditingEvent(null);
    setForm({
      title: '',
      date: dateKey(selectedDate),
      time: '09:00',
      endTime: '10:00',
      category: 'work',
      description: '',
      sticker: '🌸',
      repeat: 'none',
      remindBeforeMinutes: defaultRemindMinutes,
    });
    setEditorVisible(true);
  };

  const openEditEvent = (event) => {
    setPickerMode(null);
    setEditingEvent(event);
    setForm({
      title: event.title,
      date: event.date,
      time: event.time,
      endTime: event.endTime,
      category: event.category,
      description: event.description,
      sticker: event.sticker || '🌸',
      repeat: event.repeat || 'none',
      remindBeforeMinutes: clampRemindMinutes(event.remindBeforeMinutes ?? 0),
    });
    setEditorVisible(true);
  };

  const openPicker = (mode) => {
    const timeValue = mode === 'endTime' ? (form.endTime || form.time) : form.time;
    setPickerDraftDate(parseDateTime(form.date, timeValue));
    setPickerMode(mode);
  };

  const updateFormFromPicker = (mode, date) => {
    setForm((current) => {
      if (mode === 'date') return { ...current, date: dateKey(date) };
      if (mode === 'time') return { ...current, time: timeString(date) };
      return { ...current, endTime: timeString(date) };
    });
  };

  const handlePickerChange = (event, date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && date && pickerMode) updateFormFromPicker(pickerMode, date);
      setPickerMode(null);
      return;
    }
    if (date) setPickerDraftDate(date);
  };

  const saveEvent = async () => {
    if (!form.title.trim()) {
      Alert.alert(t.missingTitleAlert, t.missingTitleMsg);
      return;
    }
    setSaving(true);
    setError('');

    const activeKey = currentAccountKeyRef.current || 'guest';
    const payload = {
      title: form.title.trim(),
      date: form.date,
      time: form.time,
      endTime: form.endTime,
      category: form.category,
      note: form.description.trim(),
      completed: editingEvent ? editingEvent.completed : false,
      sticker: form.sticker,
      repeat: form.repeat || 'none',
      remindBeforeMinutes: clampRemindMinutes(form.remindBeforeMinutes),
      userId: editingEvent?.userId || activeKey, // GẮN CHẶT VỚI TÀI KHOẢN CÁ NHÂN
    };

    try {
      let normalized;
      try {
        const saved = await request(editingEvent ? `/${editingEvent.id}` : '', {
          method: editingEvent ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        });
        normalized = normalizeEvent(saved);
      } catch (apiErr) {
        console.warn('MockAPI request failed, saving locally:', apiErr);
        // Lưu trữ offline dự phòng nếu không kết nối được MockAPI
        normalized = normalizeEvent({
          id: editingEvent ? editingEvent.id : `local_${Date.now()}`,
          ...payload,
        });
      }

      const nextEvents = editingEvent
        ? events.map((item) => String(item.id) === String(normalized.id) ? normalized : item)
        : [...events, normalized];

      setEvents(nextEvents);

      // Lưu trữ ngay lập tức vào bộ nhớ cục bộ của tài khoản này
      await AsyncStorage.setItem(`cutecalendar_${activeKey}_events`, JSON.stringify(nextEvents));

      trackAnalyticsEvent(editingEvent ? 'event_updated' : 'event_created', {
        category: normalized.category,
      });
      setSelectedDate(new Date(`${payload.date}T12:00:00`));
      setEditorVisible(false);
      scheduleEventReminders(normalized, lang);
    } catch (saveError) {
      setError(saveError.message || 'Error saving');
      Alert.alert('Error', saveError.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleEvent = async (event) => {
    const activeKey = currentAccountKeyRef.current || 'guest';
    const updated = { ...event, completed: !event.completed };
    const nextEvents = events.map((item) => String(item.id) === String(event.id) ? updated : item);
    setEvents(nextEvents);

    // Lưu lại trạng thái vào bộ nhớ cục bộ của tài khoản này
    await AsyncStorage.setItem(`cutecalendar_${activeKey}_events`, JSON.stringify(nextEvents));
    scheduleEventReminders(updated, lang);

    try {
      if (!String(event.id).startsWith('local_')) {
        await request(`/${event.id}`, {
          method: 'PUT',
          body: JSON.stringify(updated),
        });
      }
    } catch (toggleError) {
      console.warn('Lỗi đồng bộ toggle MockAPI:', toggleError);
    }

    // Kiểm tra mốc 20 tầng Kim Tự Tháp
    const completedTotal = nextEvents.filter((item) => item.completed).length;
    if (completedTotal >= 20 && !proTrialUsed) {
      setPyramidRewardModalVisible(true);
    }
  };


  const deleteEvent = (event) => {
    Alert.alert(t.deleteEventTitle, t.deleteEventMsg(event.title), [
      { text: t.keep, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          const activeKey = currentAccountKeyRef.current || 'guest';
          const nextEvents = events.filter((item) => String(item.id) !== String(event.id));
          setEvents(nextEvents);

          // Cập nhật bộ nhớ cục bộ của tài khoản
          await AsyncStorage.setItem(`cutecalendar_${activeKey}_events`, JSON.stringify(nextEvents));

          try {
            cancelReminders(await getEventReminders(event.id));
            if (!String(event.id).startsWith('local_')) {
              await request(`/${event.id}`, { method: 'DELETE' });
            }
          } catch (e) {
            console.warn('Lỗi xóa MockAPI:', e);
          }
        },
      },
    ]);
  };

  const selectedDateMood = moodsMap[selectedDateStr];
  const selectedDateSticker = stickersMap[selectedDateStr];

  // AI Assistant Handlers (#2, #3, #4 + CH Play Compliance)
  const toggleAiEnabled = useCallback(async (enable) => {
    const next = typeof enable === 'boolean' ? enable : !aiEnabled;
    setAiEnabled(next);
    try {
      await AsyncStorage.setItem('cutecalendar_ai_enabled', String(next));
    } catch (e) {}
  }, [aiEnabled]);

  const aiStateRef = useRef({});
  aiStateRef.current = {
    aiEnabled,
    events,
    todos,
    currentAccountKey,
    isProUser,
    lang,
    weather,
    countdowns,
    habits,
    moodsMap,
    aiBriefing,
    aiInsights,
  };
  const briefingInFlightRef = useRef(false);
  const insightsInFlightRef = useRef(false);
  const loadedBriefingKeyRef = useRef('');
  const loadedInsightsKeyRef = useRef('');

  const loadAiBriefing = useCallback(async (forceRefresh = false) => {
    const s = aiStateRef.current;
    if (!s.aiEnabled || briefingInFlightRef.current) return;
    briefingInFlightRef.current = true;

    const todayKey = dateKey(new Date());
    const todayEvs = (s.events || []).filter((e) => e.date === todayKey);
    const todayTodos = (s.todos || []).filter((td) => td.date === todayKey);

    try {
      if (!s.aiBriefing) {
        setAiBriefing(
          getInstantDailyBriefing({
            weather: s.weather,
            dayEvents: todayEvs,
            dayTodos: todayTodos,
            countdowns: s.countdowns,
            habits: s.habits,
            dateStr: todayKey,
            lang: s.lang,
          })
        );
      }

      if (forceRefresh) {
        setAiBriefingLoading(true);
      }

      const res = await fetchDailyBriefing({
        accountKey: s.currentAccountKey,
        isProUser: s.isProUser,
        lang: s.lang,
        weather: s.weather,
        dayEvents: todayEvs,
        dayTodos: todayTodos,
        countdowns: s.countdowns,
        habits: s.habits,
        selectedDateMood: s.moodsMap?.[todayKey] || null,
        dateStr: todayKey,
        forceRefresh,
      });
      if (res) setAiBriefing(res);
    } catch (e) {
    } finally {
      briefingInFlightRef.current = false;
      setAiBriefingLoading(false);
    }
  }, []);

  const loadAiInsights = useCallback(async (forceRefresh = false) => {
    const s = aiStateRef.current;
    if (!s.aiEnabled || insightsInFlightRef.current) return;
    insightsInFlightRef.current = true;

    try {
      if (!s.aiInsights) {
        setAiInsights(
          getInstantWeeklyInsights({
            events: s.events,
            todos: s.todos,
            moodsMap: s.moodsMap,
            habits: s.habits,
            lang: s.lang,
          })
        );
      }

      if (forceRefresh) {
        setAiInsightsLoading(true);
      }

      const res = await fetchWeeklyInsights({
        accountKey: s.currentAccountKey,
        isProUser: s.isProUser,
        lang: s.lang,
        events: s.events,
        todos: s.todos,
        moodsMap: s.moodsMap,
        habits: s.habits,
        forceRefresh,
      });
      if (res) setAiInsights(res);
    } catch (e) {
    } finally {
      insightsInFlightRef.current = false;
      setAiInsightsLoading(false);
    }
  }, []);

  const insightsDataSignature = useMemo(() => {
    const evDone = events.filter((e) => e.completed).length;
    const tdDone = todos.filter((td) => td.completed).length;
    const habitCheckins = habits.reduce(
      (sum, h) => sum + Object.values(h.history || {}).filter(Boolean).length,
      0
    );
    return `${events.length}_${evDone}_${todos.length}_${tdDone}_${habitCheckins}_${Object.keys(moodsMap).length}`;
  }, [events, todos, habits, moodsMap]);

  useEffect(() => {
    if (!aiEnabled) return;
    const contextKey = `${currentAccountKey}_${lang}_${dateKey(new Date())}`;
    let taskHandle = null;
    if (activeTab === 'home' && loadedBriefingKeyRef.current !== contextKey) {
      loadedBriefingKeyRef.current = contextKey;
      taskHandle = InteractionManager.runAfterInteractions(() => loadAiBriefing(false));
    }
    const insightsContextKey = `${contextKey}_${insightsDataSignature}`;
    if (activeTab === 'insights' && loadedInsightsKeyRef.current !== insightsContextKey) {
      loadedInsightsKeyRef.current = insightsContextKey;
      taskHandle = InteractionManager.runAfterInteractions(() => loadAiInsights(false));
    }
    return () => {
      if (taskHandle && typeof taskHandle.cancel === 'function') {
        taskHandle.cancel();
      }
    };
  }, [aiEnabled, activeTab, currentAccountKey, lang, insightsDataSignature, loadAiBriefing, loadAiInsights]);

  const handleRefreshAiBriefing = useCallback(() => loadAiBriefing(true), [loadAiBriefing]);
  const handleRefreshAiInsights = useCallback(() => loadAiInsights(true), [loadAiInsights]);
  const handleOpenAddDDay = useCallback(() => setAddDDayModalVisible(true), []);
  const handleOpenProModal = useCallback(() => setPyramidRewardModalVisible(true), []);
  const handleOpenStickerPicker = useCallback(() => setStickerPickerVisible(true), []);
  const handleToggleCalendarMode = useCallback(
    () => setCalendarMode((prev) => (prev === 'month' ? 'week' : 'month')),
    []
  );
  const handleSelectToday = useCallback(() => setSelectedDate(new Date()), []);
  const handleOpenMoodModal = useCallback(() => {
    const mood = moodsMap[selectedDateStr];
    setSelectedMoodKey(mood?.key || 'happy');
    setMoodDraftNote(mood?.note || '');
    setMoodModalVisible(true);
  }, [moodsMap, selectedDateStr]);

  const handleQuickAddAiEvent = useCallback(async (action) => {
    if (!action?.title) return;
    const activeKey = currentAccountKeyRef.current || 'guest';
    const todayK = dateKey(new Date());
    const now = new Date();
    const nextHour = Math.min(22, now.getHours() + 1);
    const startStr = `${String(nextHour).padStart(2, '0')}:00`;
    const endHour = Math.min(23, nextHour);
    const endStr = `${String(endHour).padStart(2, '0')}:30`;

    const payload = {
      title: action.title,
      date: todayK,
      time: startStr,
      endTime: endStr,
      category: action.category || 'health',
      note: lang === 'en' ? 'Suggested by MyLife AI' : 'Gợi ý thư giãn từ MyLife AI',
      completed: false,
      sticker: action.sticker || '🌿',
      repeat: 'none',
      remindBeforeMinutes: defaultRemindMinutes,
      userId: activeKey,
    };

    let normalized;
    try {
      const saved = await request('', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      normalized = normalizeEvent(saved);
    } catch (err) {
      normalized = normalizeEvent({ id: `local_${Date.now()}`, ...payload });
    }

    const nextEvents = [...events, normalized];
    setEvents(nextEvents);
    scheduleEventReminders(normalized, lang);
    try {
      await AsyncStorage.setItem(`cutecalendar_${activeKey}_events`, JSON.stringify(nextEvents));
    } catch (e) {}
  }, [events, lang, defaultRemindMinutes]);

  const handleReportAi = useCallback((task, content) => {
    Alert.alert(
      lang === 'en' ? 'Report AI Suggestion' : 'Báo cáo nội dung AI',
      lang === 'en'
        ? 'Would you like to report this AI suggestion as unhelpful or inappropriate?'
        : 'Bạn muốn báo cáo gợi ý AI này chưa phù hợp và ẩn khỏi màn hình?',
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: lang === 'en' ? 'Report & Hide' : 'Báo cáo & Ẩn',
          style: 'destructive',
          onPress: async () => {
            await reportAiContent({ task, content });
            if (task === 'daily_briefing') setAiBriefing({ hidden: true });
            if (task === 'weekly_insights') setAiInsights({ hidden: true });
            Alert.alert(
              lang === 'en' ? 'Thank you' : 'Đã ghi nhận',
              lang === 'en'
                ? 'Thanks for your feedback! We will improve AI responses.'
                : 'Cảm ơn phản hồi của bạn! Chúng tôi sẽ cải thiện chất lượng AI tốt hơn.'
            );
          },
        },
      ]
    );
  }, [lang, t.cancel]);
  const isAnyModalOpen =
    editorVisible ||
    stickerPickerVisible ||
    moodModalVisible ||
    addHabitModalVisible ||
    addTodoModalVisible ||
    addDDayModalVisible ||
    authModalVisible ||
    pyramidRewardModalVisible ||
    sepayModalVisible ||
    settingsModalVisible;
  const isBannerActive = !isProUser && adsInitialized && bottomBannerVisible;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
      <View style={[styles.app, { backgroundColor: theme.background }]}>

        {/* --- CUTE TOP BAR --- */}
        <TopBar
          theme={theme}
          lang={lang}
          t={t}
          selectedDateSticker={selectedDateSticker}
          selectedDateMood={selectedDateMood}
          onPressSticker={() => setStickerPickerVisible(true)}
          onPressProfile={() => navigateToTab('profile')}
          isProUser={isProUser}
          accountRole={accountRole}
          userAccount={userAccount}
          onPressAuth={() => setAuthModalVisible(true)}
          onPressPro={() => setPyramidRewardModalVisible(true)}
          onOpenSettings={() => setSettingsModalVisible(true)}
        />


        {/* --- BODY SCROLLVIEW --- */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadEvents(false); }}
              tintColor={theme.primary}
            />
          }
        >
          {activeTab === 'home' && (
            <HomeScreen
              theme={theme}
              lang={lang}
              t={t}
              weather={weather}
              dailyQuote={dailyQuote}
              selectedDate={selectedDate}
              selectedDateStr={selectedDateStr}
              selectedDateMood={selectedDateMood}
              countdowns={countdowns}
              habits={habits}
              dayTodos={dayTodos}
              dayEvents={dayEvents}
              loading={loading}
              completedEventsCount={completedEventsCount}
              onPressWeather={refreshWeather}
              onPressMood={handleOpenMoodModal}
              onOpenAddDDay={handleOpenAddDDay}
              onDeleteDDay={deleteDDay}
              onOpenAddHabit={openNewHabit}
              onToggleHabit={toggleHabit}
              onEditHabit={openEditHabit}
              onDeleteHabit={deleteHabit}
              onOpenAddTodo={openNewTodo}
              onToggleTodo={toggleTodo}
              onEditTodo={openEditTodo}
              onDeleteTodo={deleteTodo}
              onToggleEvent={toggleEvent}
              onEditEvent={openEditEvent}
              onDeleteEvent={deleteEvent}
              onOpenNewEvent={openNewEvent}
              aiEnabled={aiEnabled}
              aiBriefing={aiBriefing}
              aiBriefingLoading={aiBriefingLoading}
              onRefreshAiBriefing={handleRefreshAiBriefing}
              onReportAi={handleReportAi}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarScreen
              theme={theme}
              lang={lang}
              t={t}
              selectedDate={selectedDate}
              selectedDateStr={selectedDateStr}
              calendarMode={calendarMode}
              week={week}
              monthDays={monthDays}
              events={events}
              stickersMap={stickersMap}
              moodsMap={moodsMap}
              selectedDateSticker={selectedDateSticker}
              dayEvents={dayEvents}
              onToggleMode={handleToggleCalendarMode}
              onChangeDate={changeDate}
              onSelectDate={setSelectedDate}
              onSelectToday={handleSelectToday}
              onOpenStickerPicker={handleOpenStickerPicker}
              onToggleEvent={toggleEvent}
              onEditEvent={openEditEvent}
              onDeleteEvent={deleteEvent}
              onOpenNewEvent={openNewEvent}
              aiEnabled={aiEnabled}
              aiBriefing={aiBriefing}
              aiBriefingLoading={aiBriefingLoading}
              onRefreshAiBriefing={handleRefreshAiBriefing}
              onReportAi={handleReportAi}
            />
          )}

          {activeTab === 'habits' && (
            <HabitsScreen
              theme={theme}
              lang={lang}
              t={t}
              selectedDateStr={selectedDateStr}
              countdowns={countdowns}
              habits={habits}
              onOpenAddDDay={handleOpenAddDDay}
              onDeleteDDay={deleteDDay}
              onOpenAddHabit={openNewHabit}
              onToggleHabit={toggleHabit}
              onEditHabit={openEditHabit}
              onDeleteHabit={deleteHabit}
            />
          )}

          {activeTab === 'insights' && (
            <InsightsScreen
              theme={theme}
              lang={lang}
              t={t}
              events={events}
              todos={todos}
              habits={habits}
              moodsMap={moodsMap}
              completedEventsCount={completedEventsCount}
              onPressGift={handleOpenProModal}
              isProUser={isProUser}
              proDaysLeft={proDaysLeft}
              aiEnabled={aiEnabled}
              aiInsights={aiInsights}
              aiInsightsLoading={aiInsightsLoading}
              onRefreshAiInsights={handleRefreshAiInsights}
              onQuickAddEvent={handleQuickAddAiEvent}
              onReportAi={handleReportAi}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileScreen
              theme={theme}
              lang={lang}
              t={t}
              currentThemeKey={currentThemeKey}
              onToggleLang={toggleLanguage}
              onSaveTheme={saveTheme}
              onRefreshData={() => loadEvents()}
              userAccount={userAccount}
              isProUser={isProUser}
              accountRole={accountRole}
              proDaysLeft={proDaysLeft}
              ownedStickers={effectiveOwnedStickers}
              onOpenAuthModal={() => setAuthModalVisible(true)}
              onOpenProModal={() => setPyramidRewardModalVisible(true)}
              onCancelPro={handleCancelPro}
              onLogout={handleLogout}
              bottomBannerVisible={bottomBannerVisible}
              onShowBanner={() => setBottomBannerVisible(true)}
              onOpenSettings={() => setSettingsModalVisible(true)}
            />
          )}

          <View style={{ height: isBannerActive ? 160 : 90 }} />
        </ScrollView>

        {/* --- FLOATING ACTION BUTTON (FAB) --- */}
        {activeTab !== 'profile' && activeTab !== 'insights' ? (
          <Pressable
            accessibilityLabel={t.fabAddText}
            style={[
              styles.fab,
              {
                backgroundColor: theme.primary,
                shadowColor: theme.primary,
                bottom: isBannerActive ? 152 : 82,
              },
            ]}
            onPress={openNewEvent}
          >
            <Ionicons name="add" size={26} color="#fff" />
            <Text style={styles.fabText}>{t.fabAddText}</Text>
          </Pressable>
        ) : null}

        {/* --- BOTTOM TAB BAR --- */}
        <TabBar
          theme={theme}
          t={t}
          activeTab={activeTab}
          onNavigateTab={navigateToTab}
          disabled={navigationPending}
        />

        {/* --- GOOGLE AD BANNER (ĐẶT Ở DƯỚI CÙNG THEO CHÍNH SÁCH GOOGLE ADMOB) --- */}
        {isBannerActive ? (
          <View
            style={[
              styles.bottomBannerContainer,
              {
                backgroundColor: theme.surface,
                borderTopColor: theme.line,
                ...(isAnyModalOpen ? { height: 0, maxHeight: 0, borderTopWidth: 0, overflow: 'hidden' } : {}),
              },
            ]}
          >
            {!isAnyModalOpen ? (
              <>
                <View style={styles.bannerHeader}>
                  <View style={styles.bannerBadge}>
                    <Ionicons name="megaphone-outline" size={11} color={theme.muted} />
                    <Text style={[styles.bannerBadgeText, { color: theme.muted }]}>
                      {lang === 'vi' ? 'Quảng cáo' : 'Ad'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setBottomBannerVisible(false)}
                    style={({ pressed }) => [
                      styles.bannerCloseBtn,
                      { backgroundColor: theme.line },
                      pressed && { opacity: 0.6 },
                    ]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={lang === 'vi' ? 'Tắt quảng cáo' : 'Close ad'}
                  >
                    <Ionicons name="close" size={13} color={theme.ink} />
                    <Text style={[styles.bannerCloseText, { color: theme.ink }]}>
                      {lang === 'vi' ? 'Tắt' : 'Close'}
                    </Text>
                  </Pressable>
                </View>
                <MemoizedBannerAd unitId={CONFIG.BANNER_AD_UNIT_ID} />
              </>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* --- ALL MODALS --- */}
      <StickerModal
        visible={stickerPickerVisible}
        theme={theme}
        lang={lang}
        t={t}
        selectedDateStr={selectedDateStr}
        selectedDateSticker={selectedDateSticker}
        stickers={apiStickers}
        isProUser={isProUser}
        accountRole={accountRole}
        ownedStickers={effectiveOwnedStickers}
        onClose={() => setStickerPickerVisible(false)}
        onSelectSticker={handleSelectSticker}
        onRemoveSticker={handleRemoveSticker}
        onOpenProModal={() => setPyramidRewardModalVisible(true)}
        onOpenAuthModal={() => setAuthModalVisible(true)}
      />

      <MoodModal
        visible={moodModalVisible}
        theme={theme}
        lang={lang}
        t={t}
        selectedMoodKey={selectedMoodKey}
        setSelectedMoodKey={setSelectedMoodKey}
        moodDraftNote={moodDraftNote}
        setMoodDraftNote={setMoodDraftNote}
        onClose={() => setMoodModalVisible(false)}
        onSaveMood={handleSaveMood}
        aiEnabled={aiEnabled}
        accountKey={currentAccountKey}
        isProUser={isProUser}
        onQuickAddEvent={handleQuickAddAiEvent}
        onReportAi={handleReportAi}
      />

      <HabitModal
        visible={addHabitModalVisible}
        theme={theme}
        lang={lang}
        t={t}
        editingHabit={editingHabit}
        newHabitTitle={newHabitTitle}
        setNewHabitTitle={setNewHabitTitle}
        newHabitIcon={newHabitIcon}
        setNewHabitIcon={setNewHabitIcon}
        newHabitCategory={newHabitCategory}
        setNewHabitCategory={setNewHabitCategory}
        onClose={() => setAddHabitModalVisible(false)}
        onSaveHabit={handleSaveHabit}
      />

      <TodoModal
        visible={addTodoModalVisible}
        theme={theme}
        lang={lang}
        t={t}
        editingTodo={editingTodo}
        newTodoTitle={newTodoTitle}
        setNewTodoTitle={setNewTodoTitle}
        newTodoCategory={newTodoCategory}
        setNewTodoCategory={setNewTodoCategory}
        onClose={() => setAddTodoModalVisible(false)}
        onSaveTodo={handleSaveTodo}
      />

      <DDayModal
        visible={addDDayModalVisible}
        theme={theme}
        t={t}
        newDDayTitle={newDDayTitle}
        setNewDDayTitle={setNewDDayTitle}
        newDDayDate={newDDayDate}
        setNewDDayDate={setNewDDayDate}
        newDDayIcon={newDDayIcon}
        setNewDDayIcon={setNewDDayIcon}
        onClose={() => setAddDDayModalVisible(false)}
        onCreateDDay={handleCreateDDay}
      />

      <EventEditorModal
        visible={editorVisible}
        theme={theme}
        lang={lang}
        t={t}
        editingEvent={editingEvent}
        form={form}
        setForm={setForm}
        saving={saving}
        pickerMode={pickerMode}
        setPickerMode={setPickerMode}
        pickerDraftDate={pickerDraftDate}
        openPicker={openPicker}
        handlePickerChange={handlePickerChange}
        updateFormFromPicker={updateFormFromPicker}
        onClose={() => setEditorVisible(false)}
        onSaveEvent={saveEvent}
        isProUser={isProUser}
        accountRole={accountRole}
        ownedStickers={effectiveOwnedStickers}
        allStickers={apiStickers}
        onOpenProModal={() => setPyramidRewardModalVisible(true)}
        onOpenAuthModal={() => setAuthModalVisible(true)}
      />

      {/* --- AUTH MODAL (Đăng ký SĐT + Gmail, Đăng nhập, Quên mật khẩu) --- */}
      <AuthModal
        visible={authModalVisible}
        theme={theme}
        t={t}
        allStickers={apiStickers}
        isLoggedIn={!!userAccount}
        onRegisterSuccess={handleRegisterSuccess}
        onLoginSuccess={handleLoginSuccess}
        onResetPassword={handleResetPassword}
        onClose={() => setAuthModalVisible(false)}
      />

      {/* --- PYRAMID REWARD & PRO PACKAGES MODAL --- */}
      <PyramidRewardModal
        visible={pyramidRewardModalVisible}
        theme={theme}
        t={t}
        completedCount={completedEventsCount}
        isProUser={isProUser}
        accountRole={accountRole}
        proTrialUsed={proTrialUsed}
        onClaimTrial={handleClaimTrial}
        onUpgradeProPackage={handleUpgradeProPackage}
        onOpenAuthModal={() => setAuthModalVisible(true)}
        onClose={() => setPyramidRewardModalVisible(false)}
      />

      {/* --- SEPAY VIETQR PAYMENT MODAL (MBBank 0812285479) --- */}
      <SepayPaymentModal
        visible={sepayModalVisible}
        theme={theme}
        t={t}
        initialPackage={selectedSepayPackage}
        userPhone={userAccount?.phone || ''}
        onPaymentSuccess={handleSepaySuccess}
        onClose={() => setSepayModalVisible(false)}
      />

      {/* --- SETTINGS MODAL (Ngôn ngữ, Dark Mode, Màu nền, Sticker, AI, Đồng bộ) --- */}
      <SettingsModal
        visible={settingsModalVisible}
        theme={theme}
        lang={lang}
        t={t}
        currentThemeKey={currentThemeKey}
        isDarkMode={isDarkMode}
        aiEnabled={aiEnabled}
        defaultRemindMinutes={defaultRemindMinutes}
        onChangeDefaultRemindMinutes={saveDefaultRemindMinutes}
        onToggleAi={toggleAiEnabled}
        onToggleLang={toggleLanguage}
        onSaveTheme={saveTheme}
        onToggleDarkMode={toggleDarkMode}
        selectedDateSticker={selectedDateSticker}
        onOpenStickerPicker={() => setStickerPickerVisible(true)}
        onRefreshData={() => loadEvents()}
        onClose={() => setSettingsModalVisible(false)}
      />


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0,
  },
  app: { flex: 1 },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 24 },
  bottomBannerContainer: {
    height: 78,
    maxHeight: 78,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    paddingTop: 4,
    paddingBottom: 4,
  },
  bannerHeader: {
    width: '100%',
    maxWidth: 320,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bannerBadgeText: {
    fontFamily: FONT_FAMILY,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  bannerCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 10,
  },
  bannerCloseText: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: '600',
  },

  fab: {
    position: 'absolute',
    bottom: 85,
    right: 20,
    borderRadius: 20,
    height: 48,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { fontFamily: FONT_FAMILY, color: '#fff', fontSize: 13, fontWeight: '700' },
});
