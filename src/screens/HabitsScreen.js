import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { calculateDDay, dateLabel, localizeText } from '../utils/dateUtils';
import { CategoryBadge } from '../components/CategoryPickerRow';
import { resolveItemCategory } from '../utils/categoryUtils';

export default React.memo(function HabitsScreen({
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
          <Text style={[styles.sectionTitle, { color: theme.ink, flex: 1, paddingRight: 8 }]}>{t.ddayManageTitle}</Text>
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
              <Text style={[styles.ddayTitle, { color: theme.ink, fontSize: 15 }]}>{localizeText(c.title, lang)}</Text>
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
          <Text style={[styles.sectionTitle, { color: theme.ink, flex: 1, paddingRight: 8 }]}>{t.habitsManageTitle}</Text>
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
              style={[
                styles.habitFullCard,
                { backgroundColor: theme.surface, borderColor: isDoneToday ? theme.primary : theme.border },
              ]}
            >
              {/* Cụm điều khiển bên TRÁI thu nhỏ: Tick + Icon + Sửa + Xóa */}
              <View style={styles.habitLeftControls}>
                <Pressable
                  onPress={() => onToggleHabit(h.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.miniTickBtn}
                  accessibilityLabel="Đánh dấu hoàn thành"
                >
                  <Ionicons
                    name={isDoneToday ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={isDoneToday ? theme.primary : theme.muted}
                  />
                </Pressable>

                <View
                  style={[
                    styles.habitIconBox,
                    { backgroundColor: isDoneToday ? theme.primaryLight : (theme.isDark ? '#2A2533' : '#F5F3F8') },
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>{h.icon || '✨'}</Text>
                </View>

                <Pressable
                  onPress={() => onEditHabit(h)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={styles.miniActionBtn}
                  accessibilityLabel="Chỉnh sửa"
                >
                  <Ionicons name="pencil-outline" size={14} color={theme.muted} />
                </Pressable>

                <Pressable
                  onPress={() => onDeleteHabit(h.id)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={styles.miniActionBtn}
                  accessibilityLabel="Xóa"
                >
                  <Ionicons name="trash-outline" size={14} color={theme.muted} />
                </Pressable>
              </View>

              {/* Phần Tiêu đề dàn dài ra bên phải với cỡ chữ bé lại vừa vặn */}
              <View style={styles.habitTextWrap}>
                <Text
                  style={[
                    styles.habitTitle,
                    { color: theme.ink },
                    isDoneToday && { color: theme.primary, fontWeight: '700' },
                  ]}
                  numberOfLines={2}
                >
                  {localizeText(h.title, lang)}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  <CategoryBadge
                    categoryKey={resolveItemCategory(h)}
                    t={t}
                    theme={theme}
                    compact
                  />
                  <Text style={[styles.habitStreak, { color: isDoneToday ? theme.primary : theme.muted, marginTop: 0 }]}>
                    {t.streakStreak(streak)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
});

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
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  habitLeftControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniTickBtn: {
    padding: 2,
  },
  miniActionBtn: {
    padding: 3,
  },
  habitIconBox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTextWrap: {
    flex: 1,
    paddingLeft: 4,
  },
  habitTitle: { fontSize: 12.5, fontWeight: '700', lineHeight: 17 },
  habitStreak: { fontSize: 10.5, marginTop: 2, fontWeight: '600' },
});
