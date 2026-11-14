import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOOD_KEYS } from '../constants/data';
import { fetchMoodCompanion, getInstantMoodPreview } from '../services/aiService';
import { useModalKeyboardPadding } from '../utils/keyboardUtils';

export default function MoodModal({
  visible,
  theme,
  lang = 'vi',
  t,
  selectedMoodKey,
  setSelectedMoodKey,
  moodDraftNote,
  setMoodDraftNote,
  onClose,
  onSaveMood,
  aiEnabled = true,
  accountKey = 'guest',
  isProUser = false,
  onQuickAddEvent,
  onReportAi,
}) {
  const isEn = lang === 'en';
  const [aiReply, setAiReply] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [actionAdded, setActionAdded] = useState(false);
  const keyboardPadding = useModalKeyboardPadding(visible);

  // Hiển thị gợi ý đồng hành tức thì khi mở modal hoặc đổi mood
  useEffect(() => {
    if (visible && aiEnabled) {
      setActionAdded(false);
      const preview = getInstantMoodPreview({
        moodKey: selectedMoodKey,
        note: moodDraftNote,
        lang,
      });
      setAiReply(preview);
    }
  }, [visible, selectedMoodKey, aiEnabled, lang]);

  const handleAskLiveAi = async () => {
    if (!aiEnabled || aiLoading) return;
    setAiLoading(true);
    setActionAdded(false);
    try {
      const res = await fetchMoodCompanion({
        accountKey,
        isProUser,
        lang,
        moodKey: selectedMoodKey,
        note: moodDraftNote,
        useLiveAi: true,
      });
      if (res) setAiReply(res);
    } catch (e) {
    } finally {
      setAiLoading(false);
    }
  };

  const handleQuickAdd = async () => {
    if (!aiReply?.suggestedAction || actionAdded || !onQuickAddEvent) return;
    await onQuickAddEvent(aiReply.suggestedAction);
    setActionAdded(true);
  };

  const bubbleHeader =
    selectedMoodKey === 'tired' || selectedMoodKey === 'sad'
      ? isEn
        ? '🐰 MyLife sends you a hug:'
        : '🐰 MyLife ôm bạn một cái:'
      : isEn
      ? '🐰 MyLife companion:'
      : '🐰 MyLife đồng hành:';

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View
        style={[
          styles.modalBackdrop,
          keyboardPadding > 0 && { paddingBottom: keyboardPadding },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.modalTitle, { color: theme.ink }]}>{t.modalMoodTitle}</Text>
              <Text style={[styles.modalSubtitle, { color: theme.muted }]}>{t.modalMoodSub}</Text>
            </View>
            <Pressable style={[styles.closeButton, { backgroundColor: theme.surface }]} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.ink} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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

            <View style={styles.noteHeaderRow}>
              <Text style={[styles.inputLabel, { color: theme.ink, flex: 1, marginTop: 0, marginBottom: 0 }]}>
                {t.moodNotePrompt}
              </Text>
              {aiEnabled ? (
                <Pressable
                  onPress={handleAskLiveAi}
                  disabled={aiLoading}
                  style={({ pressed }) => [
                    styles.askAiPill,
                    { backgroundColor: theme.secondaryLight || theme.primaryLight },
                    (pressed || aiLoading) && { opacity: 0.65 },
                  ]}
                >
                  <Text style={{ fontSize: 11 }}>✨</Text>
                  <Text style={[styles.askAiText, { color: theme.secondary || theme.primary }]}>
                    {aiLoading
                      ? isEn
                        ? 'Writing...'
                        : 'Đang viết...'
                      : isEn
                      ? 'Ask AI reply'
                      : 'Xin lời nhắn AI'}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.ink,
                  height: 75,
                  textAlignVertical: 'top',
                  paddingTop: 10,
                },
              ]}
              value={moodDraftNote}
              onChangeText={setMoodDraftNote}
              placeholder={isEn ? 'A sweet memory or simple thought from today...' : 'Ghi lại một cảm xúc nhỏ hoặc tâm sự hôm nay...'}
              placeholderTextColor={theme.isDark ? '#7E7A8C' : '#B6B1BB'}
              multiline
              maxLength={150}
            />

            {/* AI Companion Bubble (Tính năng #4) */}
            {aiEnabled && aiReply ? (
              <View
                style={[
                  styles.aiBubble,
                  {
                    backgroundColor: theme.secondaryLight || theme.primaryLight,
                    borderColor: theme.isDark ? theme.border : (theme.secondary || theme.primary) + '45',
                  },
                ]}
              >
                <View style={styles.aiBubbleTop}>
                  <Text style={[styles.aiBubbleTitle, { color: theme.ink }]}>{bubbleHeader}</Text>
                  {onReportAi ? (
                    <Pressable
                      onPress={() => onReportAi('mood_companion', aiReply.reply)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="flag-outline" size={12} color={theme.muted} />
                    </Pressable>
                  ) : null}
                </View>

                <Text style={[styles.aiBubbleText, { color: theme.ink }]}>{aiReply.reply}</Text>

                {aiReply.suggestedAction?.title && onQuickAddEvent ? (
                  <Pressable
                    onPress={handleQuickAdd}
                    disabled={actionAdded}
                    style={({ pressed }) => [
                      styles.quickActionPill,
                      {
                        backgroundColor: actionAdded ? theme.greenLight : theme.surface,
                        borderColor: actionAdded ? theme.green : theme.border,
                      },
                      pressed && !actionAdded && { opacity: 0.75 },
                    ]}
                  >
                    <Ionicons
                      name={actionAdded ? 'checkmark-circle' : 'add-circle-outline'}
                      size={14}
                      color={actionAdded ? theme.green : theme.primary}
                    />
                    <Text
                      style={[
                        styles.quickActionText,
                        { color: actionAdded ? theme.green : theme.ink },
                      ]}
                    >
                      {actionAdded
                        ? isEn
                          ? 'Added to today!'
                          : 'Đã thêm vào lịch hôm nay!'
                        : isEn
                        ? `+ Add "${aiReply.suggestedAction.title}"`
                        : `+ Thêm lịch "${aiReply.suggestedAction.title}"`}
                    </Text>
                  </Pressable>
                ) : null}

                <Text style={[styles.aiDisclaimer, { color: theme.muted }]}>
                  {isEn
                    ? 'AI companion • Not medical or mental health advice'
                    : 'Gợi ý AI • Không thay thế tư vấn y tế'}
                </Text>
              </View>
            ) : null}

            <Pressable style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={onSaveMood}>
              <Text style={styles.saveButtonText}>{t.saveMoodBtn}</Text>
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
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalSubtitle: { fontSize: 11, marginTop: 3 },
  closeButton: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  noteHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  askAiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  askAiText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 12 },
  textInput: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  aiBubble: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  aiBubbleTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  aiBubbleTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  aiBubbleText: {
    fontSize: 12.5,
    lineHeight: 18.5,
    fontWeight: '500',
  },
  quickActionPill: {
    marginTop: 9,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickActionText: {
    fontSize: 11.5,
    fontWeight: '700',
    flexShrink: 1,
  },
  aiDisclaimer: {
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 8,
  },
  saveButton: { marginTop: 18, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  moodChoicesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', marginVertical: 10 },
  moodChoiceItem: { width: '31%', borderRadius: 16, borderWidth: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  moodChoiceLabel: { fontSize: 11, fontWeight: '600' },
});
