import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { REMIND_PRESET_MINUTES } from '../constants/data';
import {
  dateKey,
  dateLabel,
  timeString,
  isValidTime,
  clampRemindMinutes,
  getRemindBeforeDate,
  formatRemindBeforeLabel,
} from '../utils/dateUtils';

/**
 * Bộ chọn số phút thông báo trước khi lịch trình bắt đầu (Preset + Tùy chỉnh số phút bất kỳ)
 * Dùng chung cho EventEditorModal (theo từng lịch) và SettingsModal (mặc định toàn app).
 */
export default function RemindBeforePicker({
  theme,
  lang = 'vi',
  t,
  minutes = 0,
  onChangeMinutes,
  eventDate = null,
  eventTime = null,
  visible = true,
  leadLabel = null,
}) {
  const currentMins = clampRemindMinutes(minutes);
  const isCustomPreset = currentMins > 0 && !REMIND_PRESET_MINUTES.includes(currentMins);

  const [customExpanded, setCustomExpanded] = useState(isCustomPreset);
  const [customInputText, setCustomInputText] = useState(String(currentMins));

  useEffect(() => {
    if (visible) {
      const m = clampRemindMinutes(minutes);
      setCustomInputText(String(m));
      setCustomExpanded(m > 0 && !REMIND_PRESET_MINUTES.includes(m));
    }
  }, [visible, minutes]);

  const applyMinutes = (nextMins, closeCustom = false) => {
    const clamped = clampRemindMinutes(nextMins);
    setCustomInputText(String(clamped));
    if (closeCustom) setCustomExpanded(false);
    if (onChangeMinutes) onChangeMinutes(clamped);
  };

  const handleCustomTextChange = (text) => {
    const digits = text.replace(/[^0-9]/g, '');
    if (!digits) {
      setCustomInputText('');
      if (onChangeMinutes) onChangeMinutes(0);
      return;
    }
    const clamped = clampRemindMinutes(digits);
    setCustomInputText(String(clamped));
    if (onChangeMinutes) onChangeMinutes(clamped);
  };

  const hasValidScheduleTime = Boolean(eventDate && eventTime && isValidTime(eventTime));
  const remindDate = hasValidScheduleTime ? getRemindBeforeDate(eventDate, eventTime, currentMins) : null;
  const isRemindInPast = Boolean(remindDate && currentMins > 0 && remindDate <= new Date());
  const remindTimeStr = remindDate ? timeString(remindDate) : '';
  const remindDateStr = remindDate ? dateLabel(dateKey(remindDate), lang) : '';

  const chipLabelFor = (m) => {
    if (m === 0) return t.remindOnTime;
    if (m === 60) return `1 ${t.remindHourUnit}`;
    return `${m} ${t.remindMinutesUnit}`;
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Hàng tiêu đề kiểu Sửa báo thức: Nhãn bên trái, Giá trị màu nhấn bên phải */}
      <Pressable
        style={({ pressed }) => [styles.headerRow, pressed && { opacity: 0.75 }]}
        onPress={() => setCustomExpanded((prev) => !prev)}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="notifications-outline" size={18} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.ink }]}>
            {leadLabel || t.remindAlertTitle}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Text
            style={[
              styles.headerValue,
              { color: currentMins > 0 ? theme.primary : theme.muted },
            ]}
          >
            {formatRemindBeforeLabel(currentMins, lang)}
          </Text>
          <Ionicons
            name={customExpanded ? 'chevron-up' : 'chevron-down'}
            size={15}
            color={theme.muted}
          />
        </View>
      </Pressable>

      <View style={[styles.divider, { backgroundColor: theme.line || theme.border }]} />

      {/* Các mốc thời gian chọn nhanh */}
      <View style={styles.chipsRow}>
        {REMIND_PRESET_MINUTES.map((mins) => {
          const isSelected = !customExpanded && currentMins === mins;
          return (
            <Pressable
              key={`remind-preset-${mins}`}
              onPress={() => applyMinutes(mins, true)}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? theme.primaryLight : theme.background,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
                isSelected && { borderWidth: 1.5 },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? theme.primary : theme.muted },
                  isSelected && { fontWeight: '800' },
                ]}
              >
                {chipLabelFor(mins)}
              </Text>
            </Pressable>
          );
        })}

        {/* Nút Tùy chỉnh số phút bất kỳ */}
        <Pressable
          onPress={() => setCustomExpanded((prev) => !prev)}
          style={[
            styles.chip,
            {
              backgroundColor: customExpanded || isCustomPreset ? theme.primaryLight : theme.background,
              borderColor: customExpanded || isCustomPreset ? theme.primary : theme.border,
            },
            (customExpanded || isCustomPreset) && { borderWidth: 1.5 },
          ]}
        >
          <Ionicons
            name="create-outline"
            size={12}
            color={customExpanded || isCustomPreset ? theme.primary : theme.muted}
          />
          <Text
            style={[
              styles.chipText,
              { color: customExpanded || isCustomPreset ? theme.primary : theme.muted },
              (customExpanded || isCustomPreset) && { fontWeight: '800' },
            ]}
          >
            {isCustomPreset && !customExpanded
              ? `${currentMins} ${t.remindMinutesUnit}`
              : t.remindCustom}
          </Text>
        </Pressable>
      </View>

      {/* Bộ chỉnh số phút tùy chỉnh (- [ input ] +) */}
      {customExpanded ? (
        <View style={[styles.customBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <Text style={[styles.customHint, { color: theme.muted }]}>
            {t.remindCustomHint}
          </Text>
          <View style={styles.stepperRow}>
            <Pressable
              style={({ pressed }) => [
                styles.stepperBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => applyMinutes(Math.max(0, currentMins - 1))}
            >
              <Ionicons name="remove" size={18} color={theme.ink} />
            </Pressable>

            <View style={[styles.stepperInputWrap, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
              <TextInput
                style={[styles.stepperInput, { color: theme.ink }]}
                keyboardType="number-pad"
                maxLength={4}
                value={customInputText}
                onChangeText={handleCustomTextChange}
                placeholder="0"
                placeholderTextColor={theme.muted}
                selectTextOnFocus
              />
              <Text style={[styles.stepperUnit, { color: theme.muted }]}>
                {t.remindMinutesUnit}
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.stepperBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => applyMinutes(Math.min(1440, currentMins + 1))}
            >
              <Ionicons name="add" size={18} color={theme.ink} />
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Hiển thị giờ thực tế sẽ đổ chuông khi gắn vào 1 lịch trình cụ thể */}
      {hasValidScheduleTime && currentMins > 0 ? (
        <View
          style={[
            styles.previewBanner,
            { backgroundColor: isRemindInPast ? 'rgba(245, 158, 11, 0.14)' : theme.primaryLight },
          ]}
        >
          <Ionicons
            name={isRemindInPast ? 'information-circle-outline' : 'alarm-outline'}
            size={14}
            color={isRemindInPast ? '#D97706' : theme.primary}
          />
          <Text
            style={[
              styles.previewText,
              { color: isRemindInPast ? '#B45309' : theme.primary },
            ]}
          >
            {isRemindInPast
              ? t.remindPassedPreview(remindTimeStr, eventTime)
              : t.remindAtPreview(remindTimeStr, remindDateStr)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  headerTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  headerValue: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 11,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  customBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  customHint: {
    fontSize: 11,
    marginBottom: 8,
    fontWeight: '600',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperInputWrap: {
    flex: 1,
    height: 38,
    borderRadius: 11,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    gap: 6,
  },
  stepperInput: {
    minWidth: 44,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 0,
  },
  stepperUnit: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  previewText: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
    lineHeight: 16,
  },
});
