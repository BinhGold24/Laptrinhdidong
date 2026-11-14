import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { localizeText } from '../utils/dateUtils';
import { CategoryBadge } from './CategoryPickerRow';
import { resolveItemCategory } from '../utils/categoryUtils';

export default React.memo(function HabitSection({
  theme,
  lang = 'vi',
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
        <Text style={[styles.sectionTitle, { color: theme.ink, flex: 1, paddingRight: 8 }]}>{t.habitsSectionTitle}</Text>
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
                <View style={[styles.habitIconBox, { backgroundColor: isDone ? theme.primary : (theme.isDark ? '#2A2533' : '#F5F3F8') }]}>
                  <Text style={{ fontSize: 16 }}>{h.icon}</Text>
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text
                    style={[styles.habitTitle, { color: theme.ink }, isDone && { fontWeight: '700' }]}
                    numberOfLines={1}
                  >
                    {localizeText(h.title, lang)}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <CategoryBadge
                      categoryKey={resolveItemCategory(h)}
                      t={t}
                      theme={theme}
                      compact
                    />
                    <Text style={[styles.habitStreak, { color: isDone ? theme.primary : theme.muted, marginTop: 0 }]}>
                      {isDone ? t.completedHabit : t.streakDays(streakCount)}
                    </Text>
                  </View>
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
});

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
