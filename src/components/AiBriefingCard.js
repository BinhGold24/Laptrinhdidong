import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default React.memo(function AiBriefingCard({
  theme,
  lang = 'vi',
  briefing,
  loading = false,
  onRefresh,
  onReport,
}) {
  if ((!briefing || briefing.hidden) && !loading) return null;

  const isEn = lang === 'en';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.isDark ? theme.border : theme.primary + '55',
        },
      ]}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={[styles.aiBadge, { backgroundColor: theme.primaryLight }]}>
          <Text style={{ fontSize: 12 }}>✨</Text>
          <Text style={[styles.aiBadgeText, { color: theme.primary }]}>
            {loading
              ? isEn
                ? 'Updating with Gemini AI...'
                : 'Đang cập nhật từ AI...'
              : isEn
              ? 'MyLife AI Assistant'
              : 'Trợ lý AI MyLife'}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={onRefresh}
            disabled={loading}
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: theme.isDark ? theme.line : theme.background },
              (pressed || loading) && { opacity: 0.55 },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="refresh-outline" size={16} color={theme.primary} />
          </Pressable>

          {onReport && briefing?.message ? (
            <Pressable
              onPress={() => onReport('daily_briefing', briefing.message)}
              style={({ pressed }) => [
                styles.iconBtn,
                { backgroundColor: theme.isDark ? theme.line : theme.background },
                pressed && { opacity: 0.65 },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="flag-outline" size={13} color={theme.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Main Message - Luôn hiển thị nội dung trọn vẹn, không bao giờ để khung trống */}
      <View>
        <Text style={[styles.messageText, { color: theme.ink }]}>
          {briefing?.message ||
            (isEn
              ? 'Today is clear and calm — a wonderful day to make steady progress on your habits! 🌸'
              : 'Thời tiết hôm nay khá dễ chịu — một ngày tuyệt vời để hoàn thành các mục tiêu và thói quen tốt nhé! 🌸')}
        </Text>

        {/* Highlight Pill & AI Disclaimer */}
        <View style={styles.footerRow}>
          {briefing?.highlightTag ? (
            <View style={[styles.highlightPill, { backgroundColor: theme.secondaryLight || theme.primaryLight }]}>
              <Text
                style={[styles.highlightPillText, { color: theme.secondary || theme.primary }]}
                numberOfLines={1}
              >
                {briefing.highlightTag}
              </Text>
            </View>
          ) : (
            <View style={[styles.highlightPill, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.highlightPillText, { color: theme.primary }]}>
                {isEn ? 'Daily AI Plan' : 'Khởi đầu ngày mới'}
              </Text>
            </View>
          )}

          <Text style={[styles.disclaimerText, { color: theme.muted }]}>
            {isEn ? 'AI suggestion • Reference only' : 'Gợi ý AI • Tham khảo'}
          </Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  aiBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: {
    paddingVertical: 10,
  },
  loadingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  footerRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  highlightPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    maxWidth: '62%',
  },
  highlightPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  disclaimerText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
});
