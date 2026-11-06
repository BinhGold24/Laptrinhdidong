import React from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CUTE_STICKERS, CATEGORY_KEYS } from '../constants/data';
import { dateLabel } from '../utils/dateUtils';

export default function EventEditorModal({
  visible,
  theme,
  lang,
  t,
  editingEvent,
  form,
  setForm,
  saving,
  pickerMode,
  setPickerMode,
  pickerDraftDate,
  openPicker,
  handlePickerChange,
  updateFormFromPicker,
  onClose,
  onSaveEvent,
  isProUser = false,
  accountRole = 'guest', // 'guest' | 'member' | 'pro'
  ownedStickers = [],
  allStickers = CUTE_STICKERS,
  userAccount = null,
  onOpenProModal,
  onOpenAuthModal,
}) {
  const stickerList = allStickers && allStickers.length > 0 ? allStickers : CUTE_STICKERS;
  const effectiveOwned = accountRole === 'guest' ? ['🌸'] : ownedStickers;

  const handleSelectSticker = (stk) => {
    const isUnlocked = isProUser || effectiveOwned.includes(stk);
    if (!isUnlocked) {
      if (accountRole === 'guest') {
        Alert.alert(
          'Tài khoản Thường (Chưa đăng ký)',
          'Tài khoản Thường chỉ có 1 sticker cơ bản. Hãy đăng ký bằng số điện thoại để nhận 3 sticker ngẫu nhiên hoặc nâng cấp PRO để mở toàn bộ!',
          [
            { text: 'Để sau', style: 'cancel' },
            { text: 'Đăng Ký Ngay 🎁', onPress: onOpenAuthModal },
            { text: 'Gói PRO 👑', onPress: onOpenProModal },
          ]
        );
        return;
      }
      if (onOpenProModal) onOpenProModal();
      return;
    }
    setForm((c) => ({ ...c, sticker: stk }));
  };

  const handleSelectRepeat = (type) => {
    if (type !== 'none' && !isProUser) {
      Alert.alert(
        'Đặc quyền PRO VIP',
        'Tính năng xếp lịch lặp đi lặp lại (Hàng ngày, Hàng tuần, Hàng tháng) dành riêng cho Thành viên PRO. Hãy hoàn thành 20 tầng Kim Tự Tháp hoặc nâng cấp để sử dụng nhé!',
        [
          { text: 'Đóng', style: 'cancel' },
          { text: 'Xem Gói PRO 👑', onPress: onOpenProModal },
        ]
      );
      return;
    }
    setForm((c) => ({ ...c, repeat: type }));
  };


  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: theme.ink }]}>
                {editingEvent ? t.modalEventEditTitle : t.modalEventNewTitle}
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.muted }]}>
                {t.modalEventSub}
              </Text>
            </View>
            <Pressable style={[styles.closeButton, { backgroundColor: theme.surface }]} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.ink} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            <Text style={[styles.inputLabel, { color: theme.ink }]}>{t.eventNameLabel}</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: theme.surface, borderColor: theme.border }]}
              value={form.title}
              onChangeText={(title) => setForm((current) => ({ ...current, title }))}
              placeholder={t.eventNamePlaceholder}
              placeholderTextColor="#B6B1BB"
              maxLength={100}
            />

            {/* Sticker selector */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.inputLabel, { color: theme.ink }]}>{t.stickerAttachLabel}</Text>
              <Text style={{ fontSize: 10, color: accountRole === 'pro' ? '#FFD700' : theme.muted, fontWeight: '700' }}>
                {accountRole === 'pro'
                  ? '👑 PRO: Toàn bộ sticker'
                  : accountRole === 'member'
                  ? `🌸 Thành viên: ${ownedStickers.length} sticker 🔒`
                  : 'Tài khoản Thường: 1 sticker 🔒'}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
            >
              {stickerList.map((stk) => {
                const isUnlocked = isProUser || effectiveOwned.includes(stk);
                const isSelected = form.sticker === stk;

                return (
                  <Pressable
                    key={stk}
                    onPress={() => handleSelectSticker(stk)}
                    style={[
                      styles.iconPickerBox,
                      {
                        backgroundColor: isSelected ? theme.primaryLight : isUnlocked ? theme.surface : theme.line,
                        borderColor: isSelected ? theme.primary : theme.border,
                        opacity: isUnlocked ? 1 : 0.6,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 20 }}>{stk}</Text>
                    {!isUnlocked && (
                      <View style={styles.miniLock}>
                        <Ionicons name="lock-closed" size={9} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>


            <View style={styles.formRow}>
              <View style={styles.formColumn}>
                <Text style={[styles.inputLabel, { color: theme.ink }]}>{t.dateLabelText}</Text>
                <Pressable
                  style={[styles.pickerButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => openPicker('date')}
                >
                  <Ionicons name="calendar-outline" size={17} color={theme.primary} />
                  <Text style={[styles.pickerButtonText, { color: theme.ink }]}>
                    {dateLabel(form.date, lang)}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.formColumn}>
                <Text style={[styles.inputLabel, { color: theme.ink }]}>{t.startLabel}</Text>
                <Pressable
                  style={[styles.pickerButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => openPicker('time')}
                >
                  <Ionicons name="time-outline" size={17} color={theme.primary} />
                  <Text style={[styles.pickerButtonText, { color: theme.ink }]}>{form.time}</Text>
                </Pressable>
              </View>
            </View>

            <Text style={[styles.inputLabel, { color: theme.ink }]}>{t.endLabel}</Text>
            <Pressable
              style={[styles.pickerButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => openPicker('endTime')}
            >
              <Ionicons name="time-outline" size={17} color={theme.primary} />
              <Text style={[styles.pickerButtonText, { color: form.endTime ? theme.ink : '#B6B1BB' }]}>
                {form.endTime || t.pickEndPlaceholder}
              </Text>
            </Pressable>

            {pickerMode ? (
              <View style={[styles.pickerContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {Platform.OS === 'ios' ? (
                  <View style={styles.pickerActions}>
                    <Pressable onPress={() => setPickerMode(null)}>
                      <Text style={{ color: theme.muted, fontSize: 13 }}>{t.cancel}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        updateFormFromPicker(pickerMode, pickerDraftDate);
                        setPickerMode(null);
                      }}
                    >
                      <Text style={{ color: theme.primary, fontSize: 13, fontWeight: '700' }}>{t.done}</Text>
                    </Pressable>
                  </View>
                ) : null}
                <DateTimePicker
                  value={pickerDraftDate}
                  mode={pickerMode === 'date' ? 'date' : 'time'}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handlePickerChange}
                  accentColor={theme.primary}
                />
              </View>
            ) : null}

            <Text style={[styles.inputLabel, { color: theme.ink }]}>{t.categoryLabel}</Text>
            <View style={styles.categoryChoices}>
              {CATEGORY_KEYS.map((category) => (
                <Pressable
                  key={category.key}
                  onPress={() => setForm((current) => ({ ...current, category: category.key }))}
                  style={[
                    styles.categoryChoice,
                    {
                      backgroundColor: form.category === category.key ? theme.primaryLight : theme.surface,
                      borderColor: form.category === category.key ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={category.icon}
                    size={14}
                    color={form.category === category.key ? theme.primary : theme.muted}
                  />
                  <Text
                    style={[
                      styles.categoryChoiceText,
                      { color: form.category === category.key ? theme.primary : theme.muted },
                      form.category === category.key && { fontWeight: '700' },
                    ]}
                  >
                    {t.categories[category.key]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Lặp lại lịch trình (Recurring) - Bản PRO */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <Text style={[styles.inputLabel, { color: theme.ink }]}>Lặp lại lịch trình (Tự động)</Text>
              {!isProUser && (
                <View style={[styles.proMiniBadge, { backgroundColor: '#FFD700' }]}>
                  <Text style={styles.proMiniBadgeText}>👑 PRO</Text>
                </View>
              )}
            </View>
            <View style={styles.repeatChoices}>
              {[
                { key: 'none', label: 'Không lặp' },
                { key: 'daily', label: 'Hàng ngày' },
                { key: 'weekly', label: 'Hàng tuần' },
                { key: 'monthly', label: 'Hàng tháng' },
              ].map((rep) => {
                const isSelected = (form.repeat || 'none') === rep.key;
                return (
                  <Pressable
                    key={rep.key}
                    onPress={() => handleSelectRepeat(rep.key)}
                    style={[
                      styles.repeatChoice,
                      {
                        backgroundColor: isSelected ? theme.primaryLight : theme.surface,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.repeatChoiceText,
                        { color: isSelected ? theme.primary : theme.muted },
                        isSelected && { fontWeight: '800' },
                      ]}
                    >
                      {rep.label}
                    </Text>
                    {rep.key !== 'none' && !isProUser && (
                      <Ionicons name="lock-closed" size={10} color="#888" style={{ marginLeft: 3 }} />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Thông báo SMS & Gmail */}
            <Pressable
              style={[
                styles.smsEmailCard,
                {
                  backgroundColor: form.sendSmsEmail ? theme.primaryLight : theme.surface,
                  borderColor: form.sendSmsEmail ? theme.primary : theme.border,
                },
              ]}
              onPress={() => {
                if (accountRole === 'guest') {
                  Alert.alert(
                    'Tài khoản Thường (Chưa đăng ký)',
                    'Để nhận thông báo lịch trình qua tin nhắn SMS và Email Gmail, bạn cần đăng ký số điện thoại và Gmail của mình.',
                    [
                      { text: 'Để sau', style: 'cancel' },
                      { text: 'Đăng Ký Ngay 📲', onPress: onOpenAuthModal },
                    ]
                  );
                  return;
                }
                setForm((c) => ({ ...c, sendSmsEmail: !c.sendSmsEmail }));
              }}

            >
              <Ionicons
                name={form.sendSmsEmail ? 'checkbox' : 'square-outline'}
                size={22}
                color={form.sendSmsEmail ? theme.primary : theme.muted}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.smsEmailTitle, { color: theme.ink }]}>
                  Gửi thông báo lịch đến SMS và Gmail 📲✉️
                </Text>
                <Text style={[styles.smsEmailSub, { color: theme.muted }]}>
                  {userAccount
                    ? `Đến SĐT: ${userAccount.phone} & Gmail: ${userAccount.email}`
                    : 'Chạm để đăng ký SĐT & Gmail nhận thông báo'}
                </Text>
              </View>
            </Pressable>

            <Text style={[styles.inputLabel, { color: theme.ink, marginTop: 12 }]}>{t.noteLabel}</Text>
            <TextInput
              style={[styles.textInput, styles.descriptionInput, { backgroundColor: theme.surface, borderColor: theme.border }]}
              value={form.description}
              onChangeText={(description) => setForm((current) => ({ ...current, description }))}
              placeholder={t.notePlaceholder}
              placeholderTextColor="#B6B1BB"
              multiline
              maxLength={250}
            />


            <Pressable
              style={[styles.saveButton, { backgroundColor: theme.primary }, saving && styles.saveButtonDisabled]}
              onPress={onSaveEvent}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingEvent ? t.saveEventEdit : t.saveEventNew}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(28,22,34,0.35)' },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 26,
    maxHeight: '92%',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D6D0DA', alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalSubtitle: { fontSize: 11, marginTop: 3 },
  closeButton: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 12 },
  textInput: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  formRow: { flexDirection: 'row', gap: 10 },
  formColumn: { flex: 1 },
  pickerButton: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerButtonText: { fontSize: 12, fontWeight: '600' },
  pickerContainer: { marginTop: 10, padding: 8, borderRadius: 16, borderWidth: 1 },
  pickerActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 6 },
  categoryChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  categoryChoice: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  categoryChoiceText: { fontSize: 11 },
  descriptionInput: { height: 75, paddingTop: 10, textAlignVertical: 'top' },
  saveButton: { marginTop: 22, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  iconPickerBox: { width: 44, height: 44, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  miniLock: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#777',
    borderRadius: 6,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proMiniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proMiniBadgeText: { fontSize: 9, fontWeight: '900', color: '#6A4300' },
  repeatChoices: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  repeatChoice: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  repeatChoiceText: { fontSize: 11 },
  smsEmailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  smsEmailTitle: { fontSize: 12, fontWeight: '700' },
  smsEmailSub: { fontSize: 10, marginTop: 2 },
});

