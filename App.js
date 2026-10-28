import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
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
import { THEMES } from './src/constants/themes';
import { TRANSLATIONS } from './src/constants/translations';
import { CONFIG } from './src/constants/data';

// Utils
import { dateKey, parseDateTime, timeString, getWeek } from './src/utils/dateUtils';

// Services
import { request, normalizeEvent } from './src/services/api';
import { fetchRealWeather } from './src/services/weatherService';
import {
  setupNotifications,
  getEventReminders,
  cancelReminders,
  scheduleEventReminders,
} from './src/services/notificationService';
import { trackAnalyticsEvent, trackScreenView } from './src/services/analyticsService';

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

// Setup push notification handler
setupNotifications();

export default function App() {
  // Language & Theme State
  const [lang, setLang] = useState('vi');
  const t = useMemo(() => TRANSLATIONS[lang] || TRANSLATIONS.vi, [lang]);

  const [currentThemeKey, setCurrentThemeKey] = useState('strawberry');
  const theme = useMemo(() => THEMES[currentThemeKey] || THEMES.strawberry, [currentThemeKey]);

  // Navigation & Date State
  const [activeTab, setActiveTab] = useState('home');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMode, setCalendarMode] = useState('month');

  // Events & Data States
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // CalendarCute Local Storage States
  const [stickersMap, setStickersMap] = useState({});
  const [moodsMap, setMoodsMap] = useState({});
  const [habits, setHabits] = useState([
    { id: '1', title: 'Uống 2L nước / Drink 2L water', icon: '💧', color: '#4EA8DE', history: {} },
    { id: '2', title: 'Đọc sách 20 phút / Read 20m', icon: '📖', color: '#A290E8', history: {} },
    { id: '3', title: 'Đi dạo / Walk outside', icon: '🏃‍♀️', color: '#52B788', history: {} },
    { id: '4', title: 'Ngủ sớm / Sleep before 11PM', icon: '🌙', color: '#FFB84C', history: {} },
  ]);
  const [todos, setTodos] = useState([
    { id: '1', title: 'Mua hoa cúc họa mi trang trí bàn 🌼', date: dateKey(new Date()), completed: false, starred: true },
    { id: '2', title: 'Chuẩn bị tài liệu ôn tập 📚', date: dateKey(new Date()), completed: true, starred: false },
  ]);
  const [countdowns, setCountdowns] = useState([
    { id: '1', title: 'Kỳ nghỉ hè & Du lịch 🏖️', targetDate: '2026-11-20', icon: '✈️', color: '#FF7E95' },
    { id: '2', title: 'Sinh nhật bạn thân 🎂', targetDate: '2026-11-05', icon: '🎁', color: '#A290E8' },
  ]);

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

  const [addTodoModalVisible, setAddTodoModalVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [newTodoTitle, setNewTodoTitle] = useState('');

  const [addDDayModalVisible, setAddDDayModalVisible] = useState(false);
  const [newDDayTitle, setNewDDayTitle] = useState('');
  const [newDDayDate, setNewDDayDate] = useState(dateKey(new Date()));
  const [newDDayIcon, setNewDDayIcon] = useState('🎉');

  // AdMob States
  const [adsInitialized, setAdsInitialized] = useState(false);
  const [navigationPending, setNavigationPending] = useState(false);
  const [topBannerVisible, setTopBannerVisible] = useState(true);
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

  // Load AsyncStorage Data
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedLang = await AsyncStorage.getItem('cutecalendar_language');
        if (storedLang && (storedLang === 'vi' || storedLang === 'en')) setLang(storedLang);

        const storedTheme = await AsyncStorage.getItem('cutecalendar_theme');
        if (storedTheme && THEMES[storedTheme]) setCurrentThemeKey(storedTheme);

        const storedStickers = await AsyncStorage.getItem('cutecalendar_stickers');
        if (storedStickers) setStickersMap(JSON.parse(storedStickers));

        const storedMoods = await AsyncStorage.getItem('cutecalendar_moods');
        if (storedMoods) setMoodsMap(JSON.parse(storedMoods));

        const storedHabits = await AsyncStorage.getItem('cutecalendar_habits');
        if (storedHabits) setHabits(JSON.parse(storedHabits));

        const storedTodos = await AsyncStorage.getItem('cutecalendar_todos');
        if (storedTodos) setTodos(JSON.parse(storedTodos));

        const storedCountdowns = await AsyncStorage.getItem('cutecalendar_countdowns');
        if (storedCountdowns) setCountdowns(JSON.parse(storedCountdowns));

        const storedWeather = await AsyncStorage.getItem('cutecalendar_weather');
        if (storedWeather) setWeather(JSON.parse(storedWeather));
        refreshWeather();
      } catch (e) {
        console.warn('Lỗi đọc AsyncStorage:', e);
      }
    };
    loadStoredData();
  }, [refreshWeather]);

  // Save Settings
  const toggleLanguage = async (newLang) => {
    setLang(newLang);
    try {
      await AsyncStorage.setItem('cutecalendar_language', newLang);
    } catch (e) {}
  };

  const saveTheme = async (themeKey) => {
    setCurrentThemeKey(themeKey);
    try {
      await AsyncStorage.setItem('cutecalendar_theme', themeKey);
    } catch (e) {}
  };

  // Sticker Handlers
  const handleSelectSticker = async (sticker) => {
    const dateK = dateKey(selectedDate);
    const updated = { ...stickersMap, [dateK]: sticker };
    setStickersMap(updated);
    setStickerPickerVisible(false);
    try {
      await AsyncStorage.setItem('cutecalendar_stickers', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleRemoveSticker = async () => {
    const dateK = dateKey(selectedDate);
    const updated = { ...stickersMap };
    delete updated[dateK];
    setStickersMap(updated);
    setStickerPickerVisible(false);
    try {
      await AsyncStorage.setItem('cutecalendar_stickers', JSON.stringify(updated));
    } catch (e) {}
  };

  // Mood Handlers
  const handleSaveMood = async () => {
    const dateK = dateKey(selectedDate);
    const updated = {
      ...moodsMap,
      [dateK]: { key: selectedMoodKey, note: moodDraftNote.trim() },
    };
    setMoodsMap(updated);
    setMoodModalVisible(false);
    try {
      await AsyncStorage.setItem('cutecalendar_moods', JSON.stringify(updated));
    } catch (e) {}
  };

  // Habit CRUD Handlers
  const openNewHabit = () => {
    setEditingHabit(null);
    setNewHabitTitle('');
    setNewHabitIcon('✨');
    setAddHabitModalVisible(true);
  };

  const openEditHabit = (habit) => {
    setEditingHabit(habit);
    setNewHabitTitle(habit.title);
    setNewHabitIcon(habit.icon || '✨');
    setAddHabitModalVisible(true);
  };

  const toggleHabit = async (habitId) => {
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
      await AsyncStorage.setItem('cutecalendar_habits', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleSaveHabit = async () => {
    if (!newHabitTitle.trim()) return;
    let updated;
    if (editingHabit) {
      updated = habits.map((h) =>
        h.id === editingHabit.id
          ? { ...h, title: newHabitTitle.trim(), icon: newHabitIcon || '✨' }
          : h
      );
    } else {
      const newH = {
        id: Date.now().toString(),
        title: newHabitTitle.trim(),
        icon: newHabitIcon || '✨',
        color: theme.primary,
        history: {},
      };
      updated = [...habits, newH];
    }
    setHabits(updated);
    setNewHabitTitle('');
    setEditingHabit(null);
    setAddHabitModalVisible(false);
    try {
      await AsyncStorage.setItem('cutecalendar_habits', JSON.stringify(updated));
    } catch (e) {}
  };

  const deleteHabit = (habitId) => {
    Alert.alert(t.deleteHabitTitle, t.deleteHabitMsg, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          const updated = habits.filter((h) => h.id !== habitId);
          setHabits(updated);
          await AsyncStorage.setItem('cutecalendar_habits', JSON.stringify(updated));
        },
      },
    ]);
  };

  // To-Do CRUD Handlers
  const openNewTodo = () => {
    setEditingTodo(null);
    setNewTodoTitle('');
    setAddTodoModalVisible(true);
  };

  const openEditTodo = (todo) => {
    setEditingTodo(todo);
    setNewTodoTitle(todo.title);
    setAddTodoModalVisible(true);
  };

  const toggleTodo = async (todoId) => {
    const updated = todos.map((tItem) => (tItem.id === todoId ? { ...tItem, completed: !tItem.completed } : tItem));
    setTodos(updated);
    try {
      await AsyncStorage.setItem('cutecalendar_todos', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleSaveTodo = async () => {
    if (!newTodoTitle.trim()) return;
    let updated;
    if (editingTodo) {
      updated = todos.map((tItem) =>
        tItem.id === editingTodo.id
          ? { ...tItem, title: newTodoTitle.trim() }
          : tItem
      );
    } else {
      const newT = {
        id: Date.now().toString(),
        title: newTodoTitle.trim(),
        date: dateKey(selectedDate),
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
      await AsyncStorage.setItem('cutecalendar_todos', JSON.stringify(updated));
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
            const updated = todos.filter((item) => item.id !== todoId);
            setTodos(updated);
            await AsyncStorage.setItem('cutecalendar_todos', JSON.stringify(updated));
          },
        },
      ]
    );
  };

  // D-Day Handlers
  const handleCreateDDay = async () => {
    if (!newDDayTitle.trim()) return;
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
      await AsyncStorage.setItem('cutecalendar_countdowns', JSON.stringify(updated));
    } catch (e) {}
  };

  const deleteDDay = (id) => {
    Alert.alert(t.deleteDDayTitle, t.deleteDDayMsg, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          const updated = countdowns.filter((c) => c.id !== id);
          setCountdowns(updated);
          await AsyncStorage.setItem('cutecalendar_countdowns', JSON.stringify(updated));
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
    if (!adsInitializedRef.current || !interstitialLoadedRef.current || !cooldownFinished) {
      setActiveTab(tab);
      return;
    }
    pendingTabRef.current = tab;
    setNavigationPending(true);
    interstitial.show().catch((adError) => {
      console.warn('Lỗi hiển thị quảng cáo:', adError);
      finishPendingNavigation();
    });
  }, [activeTab, finishPendingNavigation, interstitial]);

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
  });

  const loadEvents = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError('');
    try {
      const data = await request();
      if (!Array.isArray(data)) throw new Error('Invalid MockAPI format');
      setEvents(data.map(normalizeEvent));
    } catch (loadError) {
      setError(loadError.message || 'Cannot load events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    trackScreenView(activeTab);
  }, [activeTab]);

  const week = useMemo(() => getWeek(selectedDate), [selectedDate]);
  const dayEvents = useMemo(
    () => events
      .filter((event) => event.date === dateKey(selectedDate))
      .sort((a, b) => a.time.localeCompare(b.time)),
    [events, selectedDate],
  );
  const dayTodos = useMemo(
    () => todos.filter((todo) => todo.date === dateKey(selectedDate)),
    [todos, selectedDate],
  );
  const completedEventsCount = dayEvents.filter((event) => event.completed).length;

  const monthDays = useMemo(() => {
    const first = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const count = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  }, [selectedDate]);

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
    const payload = {
      title: form.title.trim(),
      date: form.date,
      time: form.time,
      endTime: form.endTime,
      category: form.category,
      note: form.description.trim(),
      completed: editingEvent ? editingEvent.completed : false,
      sticker: form.sticker,
    };
    try {
      const saved = await request(editingEvent ? `/${editingEvent.id}` : '', {
        method: editingEvent ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      const normalized = normalizeEvent(saved);
      setEvents((current) => editingEvent
        ? current.map((item) => String(item.id) === String(normalized.id) ? normalized : item)
        : [...current, normalized]);
      trackAnalyticsEvent(editingEvent ? 'event_updated' : 'event_created', {
        category: normalized.category,
      });
      setSelectedDate(new Date(`${payload.date}T12:00:00`));
      setEditorVisible(false);
      scheduleEventReminders(normalized);
    } catch (saveError) {
      setError(saveError.message || 'Error saving');
      Alert.alert('Error', saveError.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleEvent = async (event) => {
    const updated = { ...event, completed: !event.completed };
    try {
      const saved = await request(`/${event.id}`, {
        method: 'PUT',
        body: JSON.stringify(updated),
      });
      setEvents((current) => current.map((item) => String(item.id) === String(event.id) ? normalizeEvent(saved) : item));
    } catch (toggleError) {
      Alert.alert('Error', 'Cannot update event');
    }
  };

  const deleteEvent = (event) => {
    Alert.alert(t.deleteEventTitle, t.deleteEventMsg(event.title), [
      { text: t.keep, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await request(`/${event.id}`, { method: 'DELETE' });
            setEvents((current) => current.filter((item) => String(item.id) !== String(event.id)));
            cancelReminders(await getEventReminders(event.id));
          } catch (e) {
            Alert.alert('Error', 'Cannot delete event');
          }
        },
      },
    ]);
  };

  const selectedDateStr = dateKey(selectedDate);
  const selectedDateMood = moodsMap[selectedDateStr];
  const selectedDateSticker = stickersMap[selectedDateStr];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
      <View style={[styles.app, { backgroundColor: theme.background }]}>

        {/* --- CUTE TOP BAR --- */}
        <TopBar
          theme={theme}
          lang={lang}
          t={t}
          onToggleLang={toggleLanguage}
          selectedDateSticker={selectedDateSticker}
          selectedDateMood={selectedDateMood}
          onPressSticker={() => setStickerPickerVisible(true)}
          onPressProfile={() => navigateToTab('profile')}
        />

        {/* --- GOOGLE AD BANNER --- */}
        {adsInitialized && topBannerVisible ? (
          <View style={[styles.topBannerContainer, { backgroundColor: theme.surface, borderBottomColor: theme.line }]}>
            <BannerAd
              unitId={CONFIG.BANNER_AD_UNIT_ID}
              size={BannerAdSize.BANNER}
              requestOptions={{ requestNonPersonalizedAdsOnly: true }}
            />
            <Pressable
              style={styles.topBannerCloseButton}
              onPress={() => setTopBannerVisible(false)}
            >
              <Ionicons name="close-circle" size={19} color={theme.muted} />
            </Pressable>
          </View>
        ) : null}

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
              onPressMood={() => {
                setSelectedMoodKey(selectedDateMood?.key || 'happy');
                setMoodDraftNote(selectedDateMood?.note || '');
                setMoodModalVisible(true);
              }}
              onOpenAddDDay={() => setAddDDayModalVisible(true)}
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
              onToggleMode={() => setCalendarMode(calendarMode === 'month' ? 'week' : 'month')}
              onChangeDate={changeDate}
              onSelectDate={(day) => {
                setSelectedDate(day);
              }}
              onSelectToday={() => setSelectedDate(new Date())}
              onOpenStickerPicker={() => setStickerPickerVisible(true)}
              onToggleEvent={toggleEvent}
              onEditEvent={openEditEvent}
              onDeleteEvent={deleteEvent}
              onOpenNewEvent={openNewEvent}
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
              onOpenAddDDay={() => setAddDDayModalVisible(true)}
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
              t={t}
              events={events}
              moodsMap={moodsMap}
              completedEventsCount={completedEventsCount}
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
            />
          )}

          <View style={{ height: 90 }} />
        </ScrollView>

        {/* --- FLOATING ACTION BUTTON (FAB) --- */}
        {activeTab !== 'profile' && activeTab !== 'insights' ? (
          <Pressable
            accessibilityLabel={t.fabAddText}
            style={[styles.fab, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
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
      </View>

      {/* --- ALL MODALS --- */}
      <StickerModal
        visible={stickerPickerVisible}
        theme={theme}
        lang={lang}
        t={t}
        selectedDateStr={selectedDateStr}
        selectedDateSticker={selectedDateSticker}
        onClose={() => setStickerPickerVisible(false)}
        onSelectSticker={handleSelectSticker}
        onRemoveSticker={handleRemoveSticker}
      />

      <MoodModal
        visible={moodModalVisible}
        theme={theme}
        t={t}
        selectedMoodKey={selectedMoodKey}
        setSelectedMoodKey={setSelectedMoodKey}
        moodDraftNote={moodDraftNote}
        setMoodDraftNote={setMoodDraftNote}
        onClose={() => setMoodModalVisible(false)}
        onSaveMood={handleSaveMood}
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
  topBannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    paddingVertical: 2,
  },
  topBannerCloseButton: {
    position: 'absolute',
    right: 4,
    top: 2,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  fabText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
