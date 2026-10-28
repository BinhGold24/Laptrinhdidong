import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calculateDDay, dateLabel } from '../utils/dateUtils';

export default function HabitsScreen({
  theme,
  lang,
  t,
  selectedDateStr,
  countdowns,
  habits,
  onOpenAddDDay,
  onDeleteDDay,
  onOpenAddHabit,
  onToggleHabit,
  onEditHabit,
  onDeleteHabit,
}) {
  return (
    <View>
      <Text style={[styles.greeting, { color: theme.ink }]}>{t.habitsTabTitle}</Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>{t.habitsTabSub}</Text>

      {/* D-Day Management */}
      <View style={[styles.sectionWrap, { marginTop: 18 }]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>{t.ddayManageTitle}</Text>
          <Pressable onPress={onOpenAddDDay}>
            <Text style={[styles.sectionActionText, { color: theme.primary }]}>{t.addBtn}</Text>
          </Pressable>
        </View>

        {countdowns.map((c) => (
          <View
            key={c.id}
            style={[styles.ddayFullCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={[styles.ddayIconWrap, { backgroundColor: theme.primaryLight }]}>
              <Text style={{ fontSize: 26 }}>{c.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.ddayTitle, { color: theme.ink, fontSize: 15 }]}>{c.title}</Text>
              <Text style={[styles.ddayDate, { color: theme.muted, fontSize: 12 }]}>
                {t.targetDateLabel}: {dateLabel(c.targetDate, lang)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={[styles.ddayBadge, { backgroundColor: theme.primary, paddingHorizontal: 12 }]}>
                <Text style={[styles.ddayBadgeText, { fontSize: 13 }]}>{calculateDDay(c.targetDate)}</Text>
              </View>
              <Pressable onPress={() => onDeleteDDay(c.id)}>
                <Ionicons name="trash-outline" size={16} color={theme.muted} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      {/* Habits Management */}
      <View style={[styles.sectionWrap, { marginTop: 14 }]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>{t.habitsManageTitle}</Text>
          <Pressable onPress={onOpenAddHabit}>
            <Text style={[styles.sectionActionText, { color: theme.primary }]}>{t.addBtn}</Text>
          </Pressable>
        </View>

        {habits.map((h) => {
          const streak = Object.keys(h.history || {}).length;
          const isDoneToday = Boolean(h.history?.[selectedDateStr]);
          return (
            <View
              key={h.id}
              style={[styles.habitFullCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <View style={[styles.habitIconBox, { backgroundColor: theme.primaryLight, width: 44, height: 44 }]}>
                <Text style={{ fontSize: 22 }}>{h.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.habitTitle, { color: theme.ink, fontSize: 14 }]}>{h.title}</Text>
                <Text style={[styles.habitStreak, { color: theme.primary }]}>{t.streakStreak(streak)}</Text>
              </View>
              <Pressable onPress={() => onToggleHabit(h.id)} style={{ marginRight: 6 }}>
                <Ionicons
                  name={isDoneToday ? 'checkmark-circle' : 'ellipse-outline'}
                  size={26}
                  color={isDoneToday ? theme.primary : theme.muted}
                />
              </Pressable>
              <Pressable onPress={() => onEditHabit(h)} style={{ padding: 5, marginRight: 2 }}>
                <Ionicons name="pencil-outline" size={19} color={theme.muted} />
              </Pressable>
              <Pressable onPress={() => onDeleteHabit(h.id)} style={{ padding: 5 }}>
                <Ionicons name="trash-outline" size={19} color={theme.muted} />
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: 24, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { fontSize: 13, marginTop: 4 },
  sectionWrap: { marginBottom: 18 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  sectionActionText: { fontSize: 12, fontWeight: '700' },
  ddayFullCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  ddayIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ddayTitle: { fontSize: 13, fontWeight: '700' },
  ddayDate: { fontSize: 10, marginTop: 2 },
  ddayBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'center',
  },
  ddayBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  habitFullCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  habitIconBox: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTitle: { fontSize: 13, fontWeight: '600' },
  habitStreak: { fontSize: 10, marginTop: 2 },
});
