import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryMeta } from '../utils/categoryUtils';
import { CATEGORY_KEYS } from '../constants/data';

export default React.memo(function AiInsightsCard({
  theme,
  lang = 'vi',
  t,
  insights,
  categoryStats = null,
  loading = false,
  onRefresh,
  onQuickAddEvent,
  onReport,
}) {
  const [addedActionTitle, setAddedActionTitle] = useState('');
  const [showLabelDetails, setShowLabelDetails] = useState(true);

  useEffect(() => {
    setAddedActionTitle('');
  }, [insights?.updatedAt, insights?.recommendedAction?.title]);

  if (insights?.hidden) return null;

  const isEn = lang === 'en';
  const catNames = t?.categories || (isEn
    ? { work: 'Work', study: 'Study', personal: 'Personal', health: 'Health', other: 'Other' }
    : { work: 'Công việc', study: 'Học tập', personal: 'Cá nhân', health: 'Sức khỏe', other: 'Khác' });

  const defaultInsights = isEn
    ? {
        brightSpot: 'Ready to analyze your Work, Study, and Health labels. Check off tasks to unlock tailored advice!',
        pattern: 'AI summarizes completion rates across all labels alongside your mood and habits.',
        suggestion: 'Tag your schedules, to-dos, and habits so AI can suggest the best next step.',
      }
    : {
        brightSpot: 'Sẵn sàng phân tích theo nhãn Công việc, Học tập, Sức khỏe. Hãy hoàn thành các mục để AI tổng hợp kết quả!',
        pattern: 'AI sẽ thống kê tỷ lệ hoàn thành từng nhãn kết hợp thói quen và tâm trạng của bạn.',
        suggestion: 'Gắn nhãn cho lịch trình, việc cần làm và thói quen để nhận lời khuyên tối ưu nhất.',
      };

  const effectiveInsights = insights || defaultInsights;
  const stats = categoryStats || effectiveInsights?.categoryStats || null;
  const bestLabelKey = effectiveInsights?.bestLabel || stats?.bestLabel || null;
  const focusLabelKey = effectiveInsights?.focusLabel || stats?.focusLabel || null;
  const labelAdvice = effectiveInsights?.labelAdvice || null;
  const adviceEntries = labelAdvice
    ? CATEGORY_KEYS.filter((c) => labelAdvice[c.key] && String(labelAdvice[c.key]).trim().length > 0)
    : [];

  const recommendedAction = effectiveInsights?.recommendedAction;
  const isActionAdded = Boolean(recommendedAction?.title && addedActionTitle === recommendedAction.title);

  const handleTapQuickAdd = () => {
    if (!recommendedAction?.title || !onQuickAddEvent || isActionAdded) return;
    onQuickAddEvent(recommendedAction);
    setAddedActionTitle(recommendedAction.title);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.isDark ? theme.border : (theme.secondary || theme.primary) + '66',
        },
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={{ fontSize: 17 }}>🔮</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: theme.ink }]}>
              {isEn ? 'AI Label Insights & Advisor' : 'AI Phân tích & Lời khuyên'}
            </Text>
            {stats && stats.grandTotalCompleted > 0 ? (
              <Text style={[styles.cardSub, { color: theme.muted }]}>
                {isEn
                  ? `${stats.grandTotalCompleted} completed • ${stats.overallCompletionRate}% task rate`
                  : `Đã xong ${stats.grandTotalCompleted} mục • Đạt ${stats.overallCompletionRate}% kế hoạch`}
              </Text>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={onRefresh}
          disabled={loading}
          style={({ pressed }) => [
            styles.refreshBtn,
            { backgroundColor: theme.secondaryLight || theme.primaryLight },
            (pressed || loading) && { opacity: 0.65 },
          ]}
        >
          <Ionicons
            name={loading ? 'hourglass-outline' : 'sparkles-outline'}
            size={12}
            color={theme.secondary || theme.primary}
          />
          <Text style={[styles.refreshBtnText, { color: theme.secondary || theme.primary }]}>
            {loading
              ? isEn
                ? 'Analyzing...'
                : 'Đang phân tích...'
              : isEn
              ? 'Analyze'
              : 'Phân tích lại'}
          </Text>
        </Pressable>
      </View>

      {/* Tổng hợp nhanh theo nhãn (Best & Focus + Mini chips) */}
      {(bestLabelKey || focusLabelKey || (stats && stats.grandTotalCompleted > 0)) && (
        <View style={styles.summaryStrip}>
          <View style={styles.highlightTagsRow}>
            {bestLabelKey ? (
              <View
                style={[
                  styles.metaPill,
                  { backgroundColor: getCategoryMeta(bestLabelKey).color + '20' },
                ]}
              >
                <Text style={[styles.metaPillText, { color: getCategoryMeta(bestLabelKey).color }]}>
                  🏆 {isEn ? 'Top:' : 'Mạnh nhất:'} {catNames[bestLabelKey]}
                </Text>
              </View>
            ) : null}
            {focusLabelKey ? (
              <View
                style={[
                  styles.metaPill,
                  { backgroundColor: getCategoryMeta(focusLabelKey).color + '20' },
                ]}
              >
                <Text style={[styles.metaPillText, { color: getCategoryMeta(focusLabelKey).color }]}>
                  🎯 {isEn ? 'Focus:' : 'Cần ưu tiên:'} {catNames[focusLabelKey]}
                </Text>
              </View>
            ) : null}
          </View>

          {stats && stats.grandTotalCompleted > 0 ? (
            <View style={styles.miniChipsRow}>
              {stats.byCategory
                .filter((c) => c.totalCompleted > 0 || c.totalTasks > 0)
                .map((c) => (
                  <View
                    key={c.key}
                    style={[
                      styles.miniCatChip,
                      {
                        backgroundColor: theme.isDark ? theme.line : theme.background,
                        borderColor: c.color + '55',
                      },
                    ]}
                  >
                    <Ionicons name={c.icon} size={11} color={c.color} />
                    <Text style={[styles.miniCatText, { color: theme.ink }]}>
                      {catNames[c.key]}: <Text style={{ color: c.color, fontWeight: '800' }}>{c.totalCompleted}</Text>
                    </Text>
                  </View>
                ))}
            </View>
          ) : null}
        </View>
      )}

      <View style={{ gap: 8 }}>
        {/* 1. Điểm sáng */}
        {effectiveInsights.brightSpot ? (
          <View
            style={[
              styles.insightBox,
              { backgroundColor: theme.isDark ? theme.line : theme.background },
            ]}
          >
            <Text style={[styles.insightLabel, { color: theme.primary }]}>
              {isEn ? '✨ Completion Highlights' : '✨ Kết quả nổi bật'}
            </Text>
            <Text style={[styles.insightText, { color: theme.ink }]}>
              {effectiveInsights.brightSpot}
            </Text>
          </View>
        ) : null}

        {/* 2. Quy luật & Cân bằng nhãn */}
        {effectiveInsights.pattern ? (
          <View
            style={[
              styles.insightBox,
              { backgroundColor: theme.isDark ? theme.line : theme.background },
            ]}
          >
            <Text style={[styles.insightLabel, { color: theme.secondary || theme.primary }]}>
              {isEn ? '📊 Label Balance & Rhythm' : '📊 Cân bằng giữa các nhãn'}
            </Text>
            <Text style={[styles.insightText, { color: theme.ink }]}>
              {effectiveInsights.pattern}
            </Text>
          </View>
        ) : null}

        {/* 3. Lời khuyên tốt nhất */}
        {effectiveInsights.suggestion ? (
          <View
            style={[
              styles.insightBox,
              { backgroundColor: theme.secondaryLight || theme.primaryLight },
            ]}
          >
            <Text style={[styles.insightLabel, { color: theme.secondary || theme.primary }]}>
              {isEn ? '💡 Best Advice For You' : '💡 Lời khuyên tốt nhất cho bạn'}
            </Text>
            <Text style={[styles.insightText, { color: theme.ink }]}>
              {effectiveInsights.suggestion}
            </Text>
          </View>
        ) : null}

        {/* 4. Lời khuyên chi tiết theo từng nhãn (Công việc, Học tập, Sức khỏe...) */}
        {adviceEntries.length > 0 && (
          <View
            style={[
              styles.adviceContainer,
              {
                backgroundColor: theme.isDark ? theme.line : theme.background,
                borderColor: theme.border,
              },
            ]}
          >
            <Pressable
              onPress={() => setShowLabelDetails((prev) => !prev)}
              style={styles.adviceHeader}
            >
              <Text style={[styles.adviceHeaderTitle, { color: theme.ink }]}>
                {isEn ? '🏷️ Advice by Label' : '🏷️ Gợi ý riêng theo từng nhãn'}
              </Text>
              <Ionicons
                name={showLabelDetails ? 'chevron-up' : 'chevron-down'}
                size={15}
                color={theme.muted}
              />
            </Pressable>

            {showLabelDetails && (
              <View style={{ gap: 7, marginTop: 8 }}>
                {adviceEntries.map((cat) => (
                  <View key={cat.key} style={styles.adviceRow}>
                    <View style={[styles.adviceIconWrap, { backgroundColor: cat.color + '20' }]}>
                      <Ionicons name={cat.icon} size={13} color={cat.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.adviceCatName, { color: cat.color }]}>
                        {catNames[cat.key]}
                      </Text>
                      <Text style={[styles.adviceText, { color: theme.ink }]}>
                        {labelAdvice[cat.key]}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* 5. Hành động gợi ý 1 chạm */}
        {recommendedAction?.title && onQuickAddEvent ? (
          <Pressable
            onPress={handleTapQuickAdd}
            disabled={isActionAdded}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: isActionAdded
                  ? theme.greenLight
                  : getCategoryMeta(recommendedAction.category).color + '18',
                borderColor: isActionAdded
                  ? theme.green
                  : getCategoryMeta(recommendedAction.category).color + '55',
              },
              pressed && !isActionAdded && { opacity: 0.75 },
            ]}
          >
            <Text style={{ fontSize: 15 }}>
              {isActionAdded ? '✅' : recommendedAction.sticker || '✨'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.actionBtnLabel,
                  {
                    color: isActionAdded
                      ? theme.green
                      : getCategoryMeta(recommendedAction.category).color,
                  },
                ]}
              >
                {isActionAdded
                  ? isEn
                    ? 'Added to today’s schedule!'
                    : 'Đã thêm vào lịch hôm nay!'
                  : isEn
                  ? `Quick Add (${catNames[recommendedAction.category] || ''}): ${recommendedAction.title}`
                  : `Thêm ngay (${catNames[recommendedAction.category] || ''}): ${recommendedAction.title}`}
              </Text>
            </View>
            {!isActionAdded && (
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={getCategoryMeta(recommendedAction.category).color}
              />
            )}
          </Pressable>
        ) : null}

        {/* Footer Disclaimer + Report */}
        <View style={styles.footerRow}>
          <Text style={[styles.disclaimerText, { color: theme.muted }]}>
            {isEn
              ? '✨ AI analysis • Reference only, not medical advice'
              : '✨ Phân tích bởi AI • Chỉ mang tính tham khảo'}
          </Text>
          {onReport ? (
            <Pressable
              onPress={() =>
                onReport(
                  'weekly_insights',
                  `${effectiveInsights?.brightSpot || ''} ${effectiveInsights?.pattern || ''} ${effectiveInsights?.suggestion || ''}`
                )
              }
              style={({ pressed }) => [styles.reportBtn, pressed && { opacity: 0.6 }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="flag-outline" size={12} color={theme.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 15,
    marginTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 1,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    minHeight: 28,
    minWidth: 92,
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  summaryStrip: {
    marginBottom: 10,
    gap: 7,
  },
  highlightTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metaPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  metaPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  miniChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  miniCatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    borderWidth: 1,
  },
  miniCatText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  insightBox: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  insightLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 3,
  },
  insightText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
  },
  adviceContainer: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adviceHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  adviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  adviceIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  adviceCatName: {
    fontSize: 11,
    fontWeight: '800',
  },
  adviceText: {
    fontSize: 11.5,
    lineHeight: 16.5,
    fontWeight: '500',
    marginTop: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 2,
  },
  actionBtnLabel: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  disclaimerText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  reportBtn: {
    padding: 4,
  },
});
