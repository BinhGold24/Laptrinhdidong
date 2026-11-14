import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  Switch,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEMES } from '../constants/themes';
import RemindBeforePicker from '../components/RemindBeforePicker';

export default function SettingsModal({
  visible,
  theme,
  lang,
  t,
  currentThemeKey,
  isDarkMode = false,
  aiEnabled = true,
  defaultRemindMinutes = 0,
  onChangeDefaultRemindMinutes,
  onToggleAi,
  onToggleLang,
  onSaveTheme,
  onToggleDarkMode,
  selectedDateSticker,
  onOpenStickerPicker,
  onRefreshData,
  onClose,
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshedMsg, setRefreshedMsg] = useState(false);

  const handleRefresh = async () => {
    if (onRefreshData) {
      setRefreshing(true);
      try {
        await onRefreshData();
        setRefreshedMsg(true);
        setTimeout(() => setRefreshedMsg(false), 2500);
      } catch (e) {
      } finally {
        setRefreshing(false);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
          <View style={styles.sheetHandle} />

          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 20 }}>⚙️</Text>
                <Text style={[styles.modalTitle, { color: theme.ink, flexShrink: 1 }]}>
                  {lang === 'vi' ? 'Cài đặt giao diện & Hệ thống' : 'Settings & Appearance'}
                </Text>
              </View>
              <Text style={[styles.modalSubtitle, { color: theme.muted }]}>
                {lang === 'vi'
                  ? 'Tùy chỉnh ngôn ngữ, chế độ tối, màu nền & sticker'
                  : 'Customize language, dark mode, themes & sticker'}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: theme.surface },
                pressed && { opacity: 0.7 },
              ]}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={20} color={theme.ink} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* --- MỤC 1: CHUYỂN ĐỔI NGÔN NGỮ --- */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="globe-outline" size={17} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.ink }]}>
                  {lang === 'vi' ? 'Ngôn ngữ hiển thị' : 'Display Language'}
                </Text>
              </View>

              <View style={styles.rowChoices}>
                {/* Tiếng Việt */}
                <Pressable
                  style={[
                    styles.choiceCard,
                    {
                      backgroundColor: lang === 'vi' ? theme.primaryLight : theme.surface,
                      borderColor: lang === 'vi' ? theme.primary : theme.border,
                    },
                    lang === 'vi' && { borderWidth: 2 },
                  ]}
                  onPress={() => onToggleLang('vi')}
                >
                  <Text style={{ fontSize: 24 }}>🇻🇳</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.choiceTitle,
                        { color: theme.ink },
                        lang === 'vi' && { color: theme.primary, fontWeight: '800' },
                      ]}
                    >
                      Tiếng Việt
                    </Text>
                    <Text style={[styles.choiceSub, { color: theme.muted }]}>Bản dịch đầy đủ</Text>
                  </View>
                  {lang === 'vi' && (
                    <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </Pressable>

                {/* English */}
                <Pressable
                  style={[
                    styles.choiceCard,
                    {
                      backgroundColor: lang === 'en' ? theme.primaryLight : theme.surface,
                      borderColor: lang === 'en' ? theme.primary : theme.border,
                    },
                    lang === 'en' && { borderWidth: 2 },
                  ]}
                  onPress={() => onToggleLang('en')}
                >
                  <Text style={{ fontSize: 24 }}>🇬🇧</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.choiceTitle,
                        { color: theme.ink },
                        lang === 'en' && { color: theme.primary, fontWeight: '800' },
                      ]}
                    >
                      English
                    </Text>
                    <Text style={[styles.choiceSub, { color: theme.muted }]}>International</Text>
                  </View>
                  {lang === 'en' && (
                    <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </Pressable>
              </View>
            </View>

            {/* --- MỤC 2: CHẾ ĐỘ DARK MODE --- */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="moon-outline" size={17} color={theme.secondary || theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.ink }]}>
                  {lang === 'vi' ? 'Chế độ giao diện (Dark Mode)' : 'Appearance Mode'}
                </Text>
              </View>
              <Text style={[styles.sectionDesc, { color: theme.muted }]}>
                {lang === 'vi'
                  ? 'Giao diện tối giúp dịu mắt vào ban đêm và tiết kiệm pin'
                  : 'Dark appearance protects your eyes and saves battery'}
              </Text>

              <View style={styles.rowChoices}>
                {/* Sáng / Light Mode */}
                <Pressable
                  style={[
                    styles.choiceCard,
                    {
                      backgroundColor: !isDarkMode ? theme.primaryLight : theme.surface,
                      borderColor: !isDarkMode ? theme.primary : theme.border,
                    },
                    !isDarkMode && { borderWidth: 2 },
                  ]}
                  onPress={() => onToggleDarkMode(false)}
                >
                  <Text style={{ fontSize: 24 }}>☀️</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.choiceTitle,
                        { color: theme.ink },
                        !isDarkMode && { color: theme.primary, fontWeight: '800' },
                      ]}
                    >
                      {lang === 'vi' ? 'Chế độ Sáng' : 'Light Mode'}
                    </Text>
                    <Text style={[styles.choiceSub, { color: theme.muted }]}>
                      {lang === 'vi' ? 'Tươi sáng pastel' : 'Bright pastel'}
                    </Text>
                  </View>
                  {!isDarkMode && (
                    <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </Pressable>

                {/* Tối / Dark Mode */}
                <Pressable
                  style={[
                    styles.choiceCard,
                    {
                      backgroundColor: isDarkMode ? theme.primaryLight : theme.surface,
                      borderColor: isDarkMode ? theme.primary : theme.border,
                    },
                    isDarkMode && { borderWidth: 2 },
                  ]}
                  onPress={() => onToggleDarkMode(true)}
                >
                  <Text style={{ fontSize: 24 }}>🌙</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.choiceTitle,
                        { color: theme.ink },
                        isDarkMode && { color: theme.primary, fontWeight: '800' },
                      ]}
                    >
                      {lang === 'vi' ? 'Chế độ Tối' : 'Dark Mode'}
                    </Text>
                    <Text style={[styles.choiceSub, { color: theme.muted }]}>
                      {lang === 'vi' ? 'Dịu mắt ban đêm' : 'Night reading'}
                    </Text>
                  </View>
                  {isDarkMode && (
                    <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </Pressable>
              </View>
            </View>

            {/* --- MỤC 3: CHỈNH MÀU NỀN & BẢNG MÀU CHỦ ĐỀ (ĐỒNG BỘ DARKMODE & DỊCH ANH/VIỆT) --- */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="color-palette-outline" size={17} color={theme.accent || theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.ink }]}>
                  {lang === 'vi' ? 'Màu nền & Bảng màu chủ đề' : 'Background & Color Theme'}
                </Text>
              </View>
              <Text style={[styles.sectionDesc, { color: theme.muted }]}>
                {lang === 'vi'
                  ? 'Đổi màu sắc chủ đạo (tự động đồng bộ theo chế độ Sáng/Tối)'
                  : 'Change theme palette (automatically syncs with Light/Dark mode)'}
              </Text>

              <View style={styles.themeGrid}>
                {Object.values(THEMES).map((thItem) => {
                  const isSelected = thItem.id === currentThemeKey;
                  const themeName = lang === 'vi' ? thItem.nameVi : thItem.nameEn;
                  const isDarkTheme = thItem.isDark;
                  const cardBg = isDarkTheme
                    ? (thItem.id === 'darkRose' ? '#241D24' : '#1E1E26')
                    : (isDarkMode ? '#201D28' : thItem.background);

                  return (
                    <Pressable
                      key={thItem.id}
                      onPress={() => {
                        onSaveTheme(thItem.id);
                        onToggleDarkMode(!!thItem.isDark);
                      }}
                      style={({ pressed }) => [
                        styles.themeCard,
                        {
                          backgroundColor: cardBg,
                          borderColor: isSelected ? thItem.primary : (isDarkMode || isDarkTheme ? '#332E40' : thItem.border),
                        },
                        isSelected && { borderWidth: 2.5 },
                        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                      ]}
                    >
                      <View style={styles.themeCardHeader}>
                        <Text style={{ fontSize: 24 }}>{thItem.icon}</Text>
                        {isSelected && (
                          <View style={[styles.themeCheckmark, { backgroundColor: thItem.primary }]}>
                            <Ionicons name="checkmark" size={11} color="#fff" />
                          </View>
                        )}
                      </View>

                      <Text style={[styles.themeCardName, { color: (isDarkTheme || isDarkMode) ? '#F5F4F8' : thItem.ink }]} numberOfLines={1}>
                        {themeName}
                      </Text>

                      <View style={styles.themeFooterRow}>
                        <View style={styles.dotsRow}>
                          <View style={[styles.colorDot, { backgroundColor: thItem.primary }]} />
                          <View style={[styles.colorDot, { backgroundColor: thItem.secondary || thItem.accent }]} />
                        </View>
                        {thItem.isDark ? (
                          <View style={styles.darkMiniBadge}>
                            <Text style={styles.darkMiniBadgeText}>DARK 🌙</Text>
                          </View>
                        ) : (
                          <View style={styles.lightMiniBadge}>
                            <Text style={styles.lightMiniBadgeText}>PASTEL ✨</Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* --- MỤC 4: STICKER CỦA NGÀY (CHUYỂN TỪ NƠ TRÊN CÙNG VÀO ĐÂY) --- */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionTitleRow}>
                <Text style={{ fontSize: 16 }}>🎀</Text>
                <Text style={[styles.sectionTitle, { color: theme.ink }]}>
                  {lang === 'vi' ? 'Sticker Kawaii của ngày' : 'Daily Kawaii Sticker'}
                </Text>
              </View>
              <Text style={[styles.sectionDesc, { color: theme.muted }]}>
                {lang === 'vi'
                  ? 'Gắn một sticker dễ thương để đánh dấu và trang trí cho ngày hôm nay'
                  : 'Attach a cute sticker to highlight and decorate your day'}
              </Text>

              <Pressable
                style={[
                  styles.stickerRowCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => {
                  onClose();
                  if (onOpenStickerPicker) onOpenStickerPicker();
                }}
              >
                <View style={[styles.stickerIconPreview, { backgroundColor: theme.primaryLight }]}>
                  <Text style={{ fontSize: 24 }}>{selectedDateSticker || '🎀'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.choiceTitle, { color: theme.ink }]}>
                    {selectedDateSticker
                      ? (lang === 'vi' ? `Sticker hôm nay: ${selectedDateSticker}` : `Today's Sticker: ${selectedDateSticker}`)
                      : (lang === 'vi' ? 'Chưa chọn sticker' : 'No sticker selected')}
                  </Text>
                  <Text style={[styles.choiceSub, { color: theme.muted }]}>
                    {lang === 'vi' ? 'Chạm để mở bộ sưu tập 32+ sticker cute' : 'Tap to open 32+ cute sticker collection'}
                  </Text>
                </View>
                <View style={[styles.changeStickerBtn, { backgroundColor: theme.primary }]}>
                  <Text style={styles.changeStickerText}>
                    {lang === 'vi' ? 'Đổi 🎀' : 'Pick 🎀'}
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* --- MỤC 5: TRỢ LÝ AI MYLIFE (CHUẨN QUYỀN RIÊNG TƯ CH PLAY) --- */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="sparkles-outline" size={17} color={theme.secondary || theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.ink }]}>
                  {lang === 'vi' ? 'Trợ lý AI MyLife ✨' : 'MyLife AI Assistant ✨'}
                </Text>
              </View>

              <View
                style={[
                  styles.syncCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Ionicons name="hardware-chip-outline" size={22} color={theme.secondary || theme.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.syncTitle, { color: theme.ink }]}>
                    {lang === 'vi' ? 'Gợi ý thông minh bằng AI' : 'Smart AI Suggestions'}
                  </Text>
                  <Text style={[styles.syncSub, { color: theme.muted }]}>
                    {lang === 'vi'
                      ? 'Chỉ phân tích lịch & tâm trạng ẩn danh (không gửi SĐT/Gmail)'
                      : 'Analyzes anonymized schedules & moods only (no phone/email)'}
                  </Text>
                </View>
                <Switch
                  value={aiEnabled}
                  onValueChange={(val) => onToggleAi && onToggleAi(val)}
                  trackColor={{ false: theme.line, true: theme.primaryLight }}
                  thumbColor={aiEnabled ? theme.primary : theme.muted}
                />
              </View>
            </View>

            {/* --- MỤC 5B: NHẮC TRƯỚC LỊCH TRÌNH MẶC ĐỊNH --- */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="notifications-outline" size={17} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.ink }]}>
                  {t.defaultRemindTitle}
                </Text>
              </View>
              <Text style={[styles.sectionDesc, { color: theme.muted }]}>
                {t.defaultRemindSub}
              </Text>
              <RemindBeforePicker
                theme={theme}
                lang={lang}
                t={t}
                visible={visible}
                minutes={defaultRemindMinutes}
                onChangeMinutes={(mins) => onChangeDefaultRemindMinutes && onChangeDefaultRemindMinutes(mins)}
                leadLabel={t.remindAlertTitle}
              />
            </View>

            {/* --- MỤC 6: ĐỒNG BỘ MOCKAPI & LÀM MỚI DỮ LIỆU --- */}
            <View style={styles.sectionWrap}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="cloud-outline" size={17} color={theme.green || '#52B788'} />
                <Text style={[styles.sectionTitle, { color: theme.ink }]}>
                  {lang === 'vi' ? 'Dữ liệu & Đồng bộ đám mây' : 'Data & Cloud Sync'}
                </Text>
              </View>

              {/* MockAPI Card */}
              <View
                style={[
                  styles.syncCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Ionicons name="cloud-done-outline" size={22} color={theme.green || '#52B788'} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.syncTitle, { color: theme.ink }]}>
                    {lang === 'vi' ? 'Đồng bộ đám mây MockAPI' : 'MockAPI Online Cloud Sync'}
                  </Text>
                  <Text style={[styles.syncSub, { color: theme.muted }]}>
                    {lang === 'vi' ? 'Lịch trình được tự động lưu trữ an toàn' : 'Schedules are automatically synced'}
                  </Text>
                </View>
                <View style={styles.onlineBadge}>
                  <View style={[styles.onlineDot, { backgroundColor: theme.green || '#52B788' }]} />
                  <Text style={[styles.onlineText, { color: theme.green || '#52B788' }]}>Online</Text>
                </View>
              </View>

              {/* Refresh Data Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.syncCard,
                  { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 8 },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : (
                  <Ionicons name="refresh-outline" size={22} color={theme.primary} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.syncTitle, { color: theme.ink }]}>
                    {refreshedMsg
                      ? (lang === 'vi' ? '✓ Đã làm mới thành công!' : '✓ Data refreshed successfully!')
                      : (lang === 'vi' ? 'Làm mới dữ liệu từ máy chủ' : 'Refresh Data from Server')}
                  </Text>
                  <Text style={[styles.syncSub, { color: theme.muted }]}>
                    {lang === 'vi' ? 'Tải lại toàn bộ lịch mới nhất' : 'Reload all schedules from server'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.muted} />
              </Pressable>
            </View>

            {/* Nút Hoàn tất */}
            <Pressable
              style={({ pressed }) => [
                styles.doneButton,
                { backgroundColor: theme.primary },
                pressed && { opacity: 0.85 },
              ]}
              onPress={onClose}
            >
              <Text style={styles.doneButtonText}>
                {lang === 'vi' ? 'Hoàn tất ✓' : 'Done ✓'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(28,22,34,0.4)',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: '92%',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D6D0DA',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  sectionDesc: {
    fontSize: 11,
    marginBottom: 10,
    lineHeight: 15,
  },
  rowChoices: {
    flexDirection: 'row',
    gap: 10,
  },
  choiceCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  choiceTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    flexShrink: 1,
  },
  choiceSub: {
    fontSize: 10,
    marginTop: 2,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  themeCard: {
    width: '48.5%',
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 92,
  },
  themeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  themeCheckmark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeCardName: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  themeFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  darkMiniBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  darkMiniBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFD166',
  },
  lightMiniBadge: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  lightMiniBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#888',
  },
  stickerRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  stickerIconPreview: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeStickerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  changeStickerText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  syncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  syncTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  syncSub: {
    fontSize: 10.5,
    marginTop: 2,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  onlineText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  doneButton: {
    marginTop: 10,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
