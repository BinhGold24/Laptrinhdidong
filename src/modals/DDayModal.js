import React from 'react';
import { View, Text, Pressable, Modal, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DDayModal({
  visible,
  theme,
  t,
  newDDayTitle,
  setNewDDayTitle,
  newDDayDate,
  setNewDDayDate,
  newDDayIcon,
  setNewDDayIcon,
  onClose,
  onCreateDDay,
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.ink }]}>{t.modalDDayTitle}</Text>
            <Pressable style={[styles.closeButton, { backgroundColor: theme.surface }]} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.ink} />
            </Pressable>
          </View>

          <Text style={[styles.inputLabel, { color: theme.ink }]}>{t.ddayNameLabel}</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.surface, borderColor: theme.border }]}
            value={newDDayTitle}
            onChangeText={setNewDDayTitle}
            placeholder={t.ddayNamePlaceholder}
            placeholderTextColor="#B6B1BB"
            maxLength={60}
          />

          <Text style={[styles.inputLabel, { color: theme.ink }]}>{t.targetDateInputLabel}</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.surface, borderColor: theme.border }]}
            value={newDDayDate}
            onChangeText={setNewDDayDate}
            placeholder="2026-12-25"
            placeholderTextColor="#B6B1BB"
          />

          <Text style={[styles.inputLabel, { color: theme.ink }]}>{t.chooseIconLabel}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 8 }}>
            {['🎂', '✈️', '🎁', '🏖️', '🎓', '💍', '🎄', '🎆', '🚀', '⭐'].map((ic) => (
              <Pressable
                key={ic}
                onPress={() => setNewDDayIcon(ic)}
                style={[
                  styles.iconPickerBox,
                  {
                    backgroundColor: newDDayIcon === ic ? theme.primaryLight : theme.surface,
                    borderColor: newDDayIcon === ic ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text style={{ fontSize: 20 }}>{ic}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={onCreateDDay}>
            <Text style={styles.saveButtonText}>{t.createDDaySubmit}</Text>
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
  iconPickerBox: { width: 44, height: 44, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
