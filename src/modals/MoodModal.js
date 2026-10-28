import React from 'react';
import { View, Text, Pressable, Modal, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOOD_KEYS } from '../constants/data';

export default function MoodModal({
  visible,
  theme,
  t,
  selectedMoodKey,
  setSelectedMoodKey,
  moodDraftNote,
  setMoodDraftNote,
  onClose,
  onSaveMood,
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: theme.ink }]}>{t.modalMoodTitle}</Text>
              <Text style={[styles.modalSubtitle, { color: theme.muted }]}>{t.modalMoodSub}</Text>
            </View>
            <Pressable style={[styles.closeButton, { backgroundColor: theme.surface }]} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.ink} />
            </Pressable>
          </View>

          <View style={styles.moodChoicesRow}>
            {MOOD_KEYS.map((m) => (
              <Pressable
                key={m.key}
                onPress={() => setSelectedMoodKey(m.key)}
                style={[
                  styles.moodChoiceItem,
                  {
                    backgroundColor: selectedMoodKey === m.key ? theme.primaryLight : theme.surface,
                    borderColor: selectedMoodKey === m.key ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text style={{ fontSize: 26, marginBottom: 4 }}>{m.emoji}</Text>
                <Text
                  style={[
                    styles.moodChoiceLabel,
                    { color: theme.ink },
                    selectedMoodKey === m.key && { color: theme.primary, fontWeight: '700' },
                  ]}
                >
                  {t.moods[m.key]}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.inputLabel, { color: theme.ink }]}>{t.moodNotePrompt}</Text>
          <TextInput
            style={[
              styles.textInput,
              { backgroundColor: theme.surface, borderColor: theme.border, height: 75, textAlignVertical: 'top', paddingTop: 10 },
            ]}
            value={moodDraftNote}
            onChangeText={setMoodDraftNote}
            placeholder="A sweet memory or simple thought from today..."
            placeholderTextColor="#B6B1BB"
            multiline
            maxLength={150}
          />

          <Pressable style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={onSaveMood}>
            <Text style={styles.saveButtonText}>{t.saveMoodBtn}</Text>
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
  saveButton: { marginTop: 22, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  moodChoicesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', marginVertical: 10 },
  moodChoiceItem: { width: '31%', borderRadius: 16, borderWidth: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  moodChoiceLabel: { fontSize: 11, fontWeight: '600' },
});
