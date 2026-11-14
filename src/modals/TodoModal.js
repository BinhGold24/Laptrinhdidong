import React from 'react';
import { View, Text, Pressable, Modal, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useModalKeyboardPadding } from '../utils/keyboardUtils';
import { CategoryPickerRow } from '../components/CategoryPickerRow';

export default function TodoModal({
  visible,
  theme,
  lang,
  t,
  editingTodo,
  newTodoTitle,
  setNewTodoTitle,
  newTodoCategory = 'other',
  setNewTodoCategory,
  onClose,
  onSaveTodo,
}) {
  const keyboardPadding = useModalKeyboardPadding(visible);

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.modalBackdrop, keyboardPadding > 0 && { paddingBottom: keyboardPadding }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.ink, flex: 1, paddingRight: 10 }]}>
              {editingTodo ? (lang === 'vi' ? 'Chỉnh sửa việc cần làm 📝' : 'Edit To-Do 📝') : t.modalTodoTitle}
            </Text>
            <Pressable style={[styles.closeButton, { backgroundColor: theme.surface }]} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.ink} />
            </Pressable>
          </View>

          <Text style={[styles.inputLabel, { color: theme.ink }]}>{t.todoContentLabel}</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.ink }]}
            value={newTodoTitle}
            onChangeText={setNewTodoTitle}
            placeholder={t.todoPlaceholder}
            placeholderTextColor={theme.isDark ? '#7E7A8C' : '#B6B1BB'}
            maxLength={80}
          />

          {setNewTodoCategory && (
            <CategoryPickerRow
              theme={theme}
              t={t}
              label={t.categoryLabel || (lang === 'en' ? 'Label' : 'Nhãn công việc')}
              selectedCategory={newTodoCategory}
              onSelect={setNewTodoCategory}
            />
          )}

          <Pressable style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={onSaveTodo}>
            <Text style={styles.saveButtonText}>
              {editingTodo ? (lang === 'vi' ? 'Lưu thay đổi' : 'Save Changes') : t.addTodoSubmit}
            </Text>
          </Pressable>
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
  closeButton: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 12 },
  textInput: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  saveButton: { marginTop: 22, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
