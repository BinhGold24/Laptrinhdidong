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
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
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

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
            <Text style={[styles.inputLabel, { color: theme.ink }]}>{t.stickerAttachLabel}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
            >
              {CUTE_STICKERS.slice(0, 16).map((stk) => (
                <Pressable
                  key={stk}
                  onPress={() => setForm((c) => ({ ...c, sticker: stk }))}
                  style={[
                    styles.iconPickerBox,
                    {
                      backgroundColor: form.sticker === stk ? theme.primaryLight : theme.surface,
                      borderColor: form.sticker === stk ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 20 }}>{stk}</Text>
                </Pressable>
              ))}
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

            <Text style={[styles.inputLabel, { color: theme.ink }]}>{t.noteLabel}</Text>
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
      </View>
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
});
