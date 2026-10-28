import React from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CUTE_STICKERS } from '../constants/data';
import { dateLabel } from '../utils/dateUtils';

export default function StickerModal({
  visible,
  theme,
  lang,
  t,
  selectedDateStr,
  selectedDateSticker,
  onClose,
  onSelectSticker,
  onRemoveSticker,
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: theme.ink }]}>{t.modalStickerTitle}</Text>
              <Text style={[styles.modalSubtitle, { color: theme.muted }]}>
                {t.modalStickerSub(dateLabel(selectedDateStr, lang))}
              </Text>
            </View>
            <Pressable style={[styles.closeButton, { backgroundColor: theme.surface }]} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.ink} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.stickerGrid}>
            {CUTE_STICKERS.map((stk, idx) => (
              <Pressable
                key={`stk-${idx}`}
                style={[styles.stickerCell, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => onSelectSticker(stk)}
              >
                <Text style={{ fontSize: 28 }}>{stk}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {selectedDateSticker ? (
            <Pressable
              style={[styles.removeStickerBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={onRemoveSticker}
            >
              <Ionicons name="trash-outline" size={16} color="#D46B78" />
              <Text style={{ color: '#D46B78', fontSize: 13, fontWeight: '700' }}>{t.removeSticker}</Text>
            </Pressable>
          ) : null}
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
  stickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingVertical: 10 },
  stickerCell: {
    width: 62,
    height: 62,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeStickerBtn: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
});
