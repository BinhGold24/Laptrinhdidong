import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOOD_KEYS, CATEGORY_KEYS } from '../constants/data';

export default function InsightsScreen({
  theme,
  t,
  events,
  moodsMap,
  completedEventsCount,
}) {
  return (
    <View>
      <Text style={[styles.greeting, { color: theme.ink }]}>{t.insightsTitle}</Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>{t.insightsSub}</Text>

      {/* Big Recap Hero */}
      <View style={[styles.insightHero, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
        <View style={styles.insightIcon}>
          <Text style={{ fontSize: 26 }}>🍓</Text>
        </View>
        <Text style={[styles.insightNumber, { color: theme.ink }]}>{events.length}</Text>
        <Text style={styles.insightLabel}>{t.eventsStoredLabel}</Text>
        <Text style={[styles.insightFoot, { color: theme.primary }]}>
          {completedEventsCount > 0
            ? t.insightsCompletedMsg(completedEventsCount)
            : t.insightsEncouragement}
        </Text>
      </View>

      {/* Mood breakdown */}
      <View style={[styles.sectionWrap, { marginTop: 22 }]}>
        <Text style={[styles.sectionTitle, { color: theme.ink, marginBottom: 12 }]}>
          {t.moodHistoryTitle}
        </Text>
        <View style={[styles.cardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {MOOD_KEYS.map((m) => {
            const count = Object.values(moodsMap).filter((item) => item.key === m.key).length;
            return (
              <View key={m.key} style={[styles.moodStatRow, { borderBottomColor: theme.line }]}>
                <Text style={{ fontSize: 22, marginRight: 10 }}>{m.emoji}</Text>
                <Text style={[styles.moodStatLabel, { color: theme.ink }]}>{t.moods[m.key]}</Text>
                <View style={[styles.moodStatCountBadge, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.moodStatCountText, { color: theme.primary }]}>
                    {t.daysCount(count)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Events by Category */}
      <View style={[styles.sectionWrap, { marginTop: 18 }]}>
        <Text style={[styles.sectionTitle, { color: theme.ink, marginBottom: 12 }]}>
          {t.byCategoryTitle}
        </Text>
        {CATEGORY_KEYS.map((cat) => {
          const count = events.filter((e) => e.category === cat.key).length;
          return (
            <View
              key={cat.key}
              style={[styles.statsRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <View style={[styles.statsIcon, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name={cat.icon} size={16} color={theme.primary} />
              </View>
              <Text style={[styles.statsName, { color: theme.ink }]}>{t.categories[cat.key]}</Text>
              <Text style={[styles.statsCount, { color: theme.primary }]}>{count}</Text>
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
  insightHero: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    marginTop: 16,
  },
  insightIcon: { width: 50, height: 50, backgroundColor: '#fff', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  insightNumber: { fontSize: 40, fontWeight: '800', marginTop: 10 },
  insightLabel: { fontSize: 12, fontWeight: '600', marginTop: 2, opacity: 0.7 },
  insightFoot: { fontSize: 12, marginTop: 12, fontWeight: '600' },
  sectionWrap: { marginBottom: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  cardBox: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  moodStatRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  moodStatLabel: { flex: 1, fontSize: 13, fontWeight: '600' },
  moodStatCountBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  moodStatCountText: { fontSize: 11, fontWeight: '700' },
  statsRow: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  statsIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statsName: { fontSize: 13, fontWeight: '600', flex: 1 },
  statsCount: { fontWeight: '800', fontSize: 13 },
});
