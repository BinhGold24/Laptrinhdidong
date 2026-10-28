import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EventCard({
  theme,
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
        {event.description ? (
          <Text style={[styles.eventDescription, { color: theme.muted }]} numberOfLines={1}>
            {event.description}
          </Text>
        ) : null}
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
}

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
  eventActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
});
