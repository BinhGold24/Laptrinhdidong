import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryBadge } from './CategoryPickerRow';
import { resolveItemCategory } from '../utils/categoryUtils';

export default React.memo(function EventCard({
  theme,
  t,
  event,
  onToggle,
  onEdit,
  onDelete,
}) {
  return (
    <View
      style={[
        styles.eventCard,
        { backgroundColor: theme.surface, borderColor: theme.border },
        event.completed && styles.eventCompleted,
      ]}
    >
      <View style={[styles.eventStickerBox, { backgroundColor: theme.primaryLight }]}>
        <Text style={{ fontSize: 20 }}>{event.sticker || '🌸'}</Text>
      </View>
      <View style={styles.eventTime}>
        <Text style={[styles.eventTimeText, { color: theme.ink }]}>{event.time}</Text>
        {event.endTime ? (
          <Text style={[styles.eventEndTime, { color: theme.muted }]}>{event.endTime}</Text>
        ) : null}
      </View>
      <Pressable style={styles.eventMain} onPress={() => onEdit(event)}>
        <Text
          style={[styles.eventTitle, { color: theme.ink }, event.completed && styles.completedText]}
          numberOfLines={1}
        >
          {event.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
          {t ? (
            <CategoryBadge
              categoryKey={resolveItemCategory(event)}
              t={t}
              theme={theme}
              compact
            />
          ) : null}
          {Number(event.remindBeforeMinutes) > 0 ? (
            <View
              style={[
                styles.remindBadge,
                {
                  backgroundColor: theme.isDark ? 'rgba(255, 184, 76, 0.16)' : '#FFF4E5',
                  borderColor: 'rgba(245, 158, 11, 0.35)',
                },
              ]}
            >
              <Ionicons name="notifications-outline" size={10} color="#D97706" />
              <Text style={styles.remindBadgeText} numberOfLines={1}>
                -{event.remindBeforeMinutes}{t?.remindMinutesUnit === 'min' ? 'm' : 'p'}
              </Text>
            </View>
          ) : null}
          {event.description ? (
            <Text style={[styles.eventDescription, { color: theme.muted, flexShrink: 1, minWidth: 50 }]} numberOfLines={1}>
              {event.description}
            </Text>
          ) : null}
        </View>
      </Pressable>
      <View style={styles.eventActions}>
        <Pressable onPress={() => onToggle(event)} style={styles.iconButton}>
          <Ionicons
            name={event.completed ? 'checkmark-circle' : 'ellipse-outline'}
            size={22}
            color={event.completed ? theme.green : theme.muted}
          />
        </Pressable>
        <Pressable onPress={() => onDelete(event)} style={styles.iconButton}>
          <Ionicons name="trash-outline" size={17} color={theme.muted} />
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  eventCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventCompleted: { opacity: 0.6 },
  eventStickerBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  eventTime: { width: 50 },
  eventTimeText: { fontWeight: '700', fontSize: 12 },
  eventEndTime: { fontSize: 10, marginTop: 2 },
  eventMain: { flex: 1, paddingRight: 6 },
  eventTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  completedText: { textDecorationLine: 'line-through', opacity: 0.6 },
  eventDescription: { fontSize: 11 },
  remindBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 7,
    borderWidth: 1,
    flexShrink: 0,
  },
  remindBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#D97706',
  },
  eventActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
});
