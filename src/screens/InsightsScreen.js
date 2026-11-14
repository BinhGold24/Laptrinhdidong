import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOOD_KEYS } from '../constants/data';
import { analyzeCategoryStats } from '../utils/categoryUtils';
import PyramidView from '../components/PyramidView';
import AiInsightsCard from '../components/AiInsightsCard';

function InsightsScreen({
  theme,
  lang = 'vi',
  t,
  events = [],
  todos = [],
  habits = [],
  moodsMap = {},
  completedEventsCount,
  onPressGift,
  isProUser = false,
  proDaysLeft = 0,
  aiEnabled = true,
  aiInsights = null,
  aiInsightsLoading = false,
  onRefreshAiInsights,
  onQuickAddEvent,
  onReportAi,
}) {
  const [statsPeriodDays, setStatsPeriodDays] = useState(7);
  const isEn = lang === 'en';

  const moodCountsMap = useMemo(() => {
    const counts = {};
    Object.values(moodsMap).forEach((item) => {
      if (item?.key) {
        counts[item.key] = (counts[item.key] || 0) + 1;
      }
    });
    return counts;
  }, [moodsMap]);

  const liveWeeklyStats = useMemo(() => {
    const weekly = analyzeCategoryStats({ events, todos, habits, days: 7 });
    if (weekly.grandTotalCompleted === 0 && weekly.grandTotalTasks === 0) {
      const allTime = analyzeCategoryStats({ events, todos, habits, days: 0 });
      if (allTime.grandTotalCompleted > 0 || allTime.grandTotalTasks > 0) {
        return allTime;
      }
    }
    return weekly;
  }, [events, todos, habits]);

  const displayedCategoryStats = useMemo(
    () => analyzeCategoryStats({ events, todos, habits, days: statsPeriodDays }),
    [events, todos, habits, statsPeriodDays]
  );

  return (
    <View>
      <Text style={[styles.greeting, { color: theme.ink }]}>{t.insightsTitle}</Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>{t.insightsSub}</Text>

      {/* Tính năng #3: AI Phân tích theo nhãn & Đưa ra lời khuyên */}
      {aiEnabled && (
        <AiInsightsCard
          theme={theme}
          lang={lang}
          t={t}
          insights={aiInsights}
          categoryStats={liveWeeklyStats}
          loading={aiInsightsLoading}
          onRefresh={onRefreshAiInsights}
          onQuickAddEvent={onQuickAddEvent}
          onReport={onReportAi}
        />
      )}

      {/* Thống kê tổng hợp theo nhãn (Công việc, Học tập, Sức khỏe, Cá nhân, Khác) */}
      <View style={[styles.sectionWrap, { marginTop: 18 }]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.ink, flex: 1 }]}>
            {isEn ? 'Completed by Label' : 'Thống kê hoàn thành theo nhãn'}
          </Text>
          <View style={[styles.periodToggle, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {[
              { days: 7, label: isEn ? '7 days' : '7 ngày' },
              { days: 0, label: isEn ? 'All' : 'Tất cả' },
            ].map((opt) => {
              const active = statsPeriodDays === opt.days;
              return (
                <Pressable
                  key={opt.days}
                  onPress={() => setStatsPeriodDays(opt.days)}
                  style={[
                    styles.periodPill,
                    active && { backgroundColor: theme.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.periodPillText,
                      { color: active ? '#fff' : theme.muted },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {displayedCategoryStats.byCategory.map((cat) => {
          const hasAny = cat.totalCompleted > 0 || cat.totalTasks > 0 || cat.habitsCount > 0;
          const barWidth =
            cat.totalTasks > 0
              ? Math.min(100, cat.completionRate)
              : cat.habitCheckins > 0
              ? 100
              : 0;

          let detailLine = '';
          if (cat.totalTasks > 0 && cat.habitCheckins > 0) {
            detailLine = isEn
              ? `${cat.completedTasks}/${cat.totalTasks} tasks · ${cat.habitCheckins} habit check-ins`
              : `Xong ${cat.completedTasks}/${cat.totalTasks} việc · ${cat.habitCheckins} lượt thói quen`;
          } else if (cat.totalTasks > 0) {
            detailLine = isEn
              ? `${cat.completedTasks}/${cat.totalTasks} tasks completed`
              : `Đã xong ${cat.completedTasks}/${cat.totalTasks} việc`;
          } else if (cat.habitCheckins > 0) {
            detailLine = isEn
              ? `${cat.habitCheckins} habit check-in(s)`
              : `${cat.habitCheckins} lượt hoàn thành thói quen`;
          } else {
            detailLine = isEn ? 'No completed items yet' : 'Chưa có mục nào hoàn thành';
          }

          return (
            <View
              key={cat.key}
              style={[
                styles.statsRowCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
                !hasAny && { opacity: 0.72 },
              ]}
            >
              <View style={styles.statsTopRow}>
                <View style={[styles.statsIcon, { backgroundColor: cat.color + '20' }]}>
                  <Ionicons name={cat.icon} size={16} color={cat.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statsName, { color: theme.ink }]}>
                    {t.categories[cat.key]}
                  </Text>
                  <Text style={[styles.statsDetail, { color: theme.muted }]}>
                    {detailLine}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.statsCount, { color: cat.color }]}>
                    {cat.totalCompleted}
                  </Text>
                  <Text style={[styles.statsRateLabel, { color: theme.muted }]}>
                    {cat.totalTasks > 0 || cat.habitCheckins > 0
                      ? `${cat.completionRate}%`
                      : '0%'}
                  </Text>
                </View>
              </View>

              <View style={[styles.progressTrack, { backgroundColor: theme.line }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${barWidth}%`,
                      backgroundColor: cat.color,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* Kim Tự Tháp 20 Tầng Lịch Trình Lưu Trữ */}
      <PyramidView
        theme={theme}
        t={t}
        completedCount={completedEventsCount}
        onPressGift={onPressGift}
        isProUser={isProUser}
        proDaysLeft={proDaysLeft}
      />

      {/* Big Recap Hero */}
      <View style={[styles.insightHero, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
        <View style={styles.insightIcon}>
          <Text style={{ fontSize: 26 }}>🍓</Text>
        </View>
        <Text style={[styles.insightNumber, { color: theme.ink }]}>{events.length}</Text>
        <Text style={[styles.insightLabel, { color: theme.muted }]}>{t.eventsStoredLabel}</Text>
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
            const count = moodCountsMap[m.key] || 0;
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
    </View>
  );
}

export default React.memo(InsightsScreen);

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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  periodToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 2,
    gap: 2,
  },
  periodPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  periodPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
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
  statsRowCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 9,
    gap: 8,
  },
  statsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statsIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  statsName: { fontSize: 13, fontWeight: '700' },
  statsDetail: { fontSize: 11, marginTop: 1 },
  statsCount: { fontWeight: '800', fontSize: 15 },
  statsRateLabel: { fontSize: 10, fontWeight: '700' },
  progressTrack: {
    height: 6,
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
  },
});
