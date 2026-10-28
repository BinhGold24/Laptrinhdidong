import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HabitSection({
  theme,
  t,
  habits,
  selectedDateStr,
  onOpenAdd,
  onToggle,
  onEdit,
  onDelete,
}) {
  return (
    <View style={styles.sectionWrap}>
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>{t.habitsSectionTitle}</Text>
        <Pressable onPress={onOpenAdd}>
          <Text style={[styles.sectionActionText, { color: theme.primary }]}>{t.createHabitBtn}</Text>
        </Pressable>
      </View>

      <View style={styles.habitsGrid}>
        {habits.map((h) => {
          const isDone = Boolean(h.history?.[selectedDateStr]);
          const streakCount = Object.keys(h.history || {}).length;
          return (
            <View
              key={h.id}
              style={[
                styles.habitItem,
                {
                  backgroundColor: isDone ? theme.primaryLight : theme.surface,
                  borderColor: isDone ? theme.primary : theme.border,
                },
              ]}
            >
              <Pressable
                onPress={() => onToggle(h.id)}
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}
              >
                <View style={[styles.habitIconBox, { backgroundColor: isDone ? theme.primary : '#F5F3F8' }]}>
                  <Text style={{ fontSize: 16 }}>{h.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.habitTitle, { color: theme.ink }, isDone && { fontWeight: '700' }]}
                    numberOfLines={1}
                  >
                    {h.title}
                  </Text>
                  <Text style={[styles.habitStreak, { color: isDone ? theme.primary : theme.muted }]}>
                    {isDone ? t.completedHabit : t.streakDays(streakCount)}
                  </Text>
                </View>
                <Ionicons
                  name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={isDone ? theme.primary : theme.muted}
                />
              </Pressable>
              <Pressable onPress={() => onEdit(h)} style={{ padding: 5, marginLeft: 4 }}>
                <Ionicons name="pencil-outline" size={17} color={theme.muted} />
              </Pressable>
              <Pressable onPress={() => onDelete(h.id)} style={{ padding: 5 }}>
                <Ionicons name="trash-outline" size={17} color={theme.muted} />
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionWrap: { marginBottom: 18 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  sectionActionText: { fontSize: 12, fontWeight: '700' },
  habitsGrid: { flexDirection: 'column', gap: 8 },
  habitItem: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTitle: { fontSize: 13, fontWeight: '600' },
  habitStreak: { fontSize: 10, marginTop: 2 },
});
