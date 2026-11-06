import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PyramidView({
  theme,
  t,
  completedCount = 0,
  onPressGift,
  isProUser = false,
  proDaysLeft = 0,
}) {
  const currentLevel = Math.min(20, Math.max(0, completedCount));
  const isFull = currentLevel >= 20;

  // Cấu trúc 20 tầng kim tự tháp (từ đỉnh xuống đáy):
  // Hàng 1 (Đỉnh - Tầng 20): 1 ô (Vương miện)
  // Hàng 2 (Tầng 18, 19): 2 ô
  // Hàng 3 (Tầng 15, 16, 17): 3 ô
  // Hàng 4 (Tầng 11, 12, 13, 14): 4 ô
  // Hàng 5 (Tầng 6, 7, 8, 9, 10): 5 ô
  // Hàng 6 (Tầng 1, 2, 3, 4, 5): 5 ô
  const rows = [
    [20],
    [18, 19],
    [15, 16, 17],
    [11, 12, 13, 14],
    [6, 7, 8, 9, 10],
    [1, 2, 3, 4, 5],
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Tiêu đề & Tiến độ */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: theme.ink }]}>
            🏛️ Kim Tự Tháp Lịch Trình
          </Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Mỗi lịch trình hoàn thành là 1 tầng tháp
          </Text>
        </View>

        <Pressable
          style={[styles.giftButton, { backgroundColor: isFull ? '#FFEAA7' : theme.primaryLight }]}
          onPress={onPressGift}
        >
          <Text style={{ fontSize: 16 }}>{isFull ? '👑' : '🎁'}</Text>
          <Text style={[styles.giftBtnText, { color: isFull ? '#D35400' : theme.primary }]}>
            {isFull ? 'Đã nhận quà' : 'Xem quà'}
          </Text>
        </Pressable>
      </View>

      {/* Thanh tiến độ */}
      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <Text style={[styles.progressText, { color: theme.ink }]}>
            Tiến độ: <Text style={{ color: theme.primary, fontWeight: '800' }}>{currentLevel}/20 tầng</Text>
          </Text>
          <Text style={[styles.percentText, { color: theme.muted }]}>
            {Math.round((currentLevel / 20) * 100)}%
          </Text>
        </View>
        <View style={[styles.progressBarTrack, { backgroundColor: theme.line }]}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${(currentLevel / 20) * 100}%`,
                backgroundColor: isFull ? '#FFB84C' : theme.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* Đồ họa Kim Tự Tháp 20 tầng */}
      <View style={styles.pyramidContainer}>
        {rows.map((row, rIdx) => (
          <View key={`row-${rIdx}`} style={styles.pyramidRow}>
            {row.map((lvl) => {
              const isAchieved = currentLevel >= lvl;
              const isPinnacle = lvl === 20;

              return (
                <View
                  key={`lvl-${lvl}`}
                  style={[
                    styles.pyramidBlock,
                    isPinnacle && styles.pinnacleBlock,
                    {
                      backgroundColor: isAchieved
                        ? isPinnacle
                          ? '#FFD700'
                          : theme.primary
                        : theme.background,
                      borderColor: isAchieved ? '#FFA502' : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.blockText,
                      {
                        color: isAchieved ? '#fff' : theme.muted,
                        fontWeight: isAchieved ? '800' : '600',
                      },
                    ]}
                  >
                    {isPinnacle ? (isAchieved ? '👑' : '20 👑') : isAchieved ? '✓' : lvl}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* Banner thông tin phần thưởng */}
      <Pressable
        style={[
          styles.rewardBanner,
          {
            backgroundColor: isFull ? '#FFF8E7' : theme.primaryLight,
            borderColor: isFull ? '#FFD166' : theme.primary,
          },
        ]}
        onPress={onPressGift}
      >
        <Ionicons
          name={isFull ? 'sparkles' : 'gift-outline'}
          size={18}
          color={isFull ? '#E67E22' : theme.primary}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.rewardTitle, { color: theme.ink }]}>
            {isFull
              ? '🎉 Chúc mừng! Bạn đã mở khóa Quà Tặng 3 Ngày PRO'
              : '🎁 Hoàn thành 20 tầng để nhận 3 Ngày Dùng Thử PRO Miễn Phí!'}
          </Text>
          <Text style={[styles.rewardSub, { color: theme.muted }]}>
            {isProUser
              ? `Tài khoản PRO đang kích hoạt (Còn ${proDaysLeft} ngày). Không quảng cáo, chọn full sticker.`
              : 'Bản PRO: Không quảng cáo, xếp lịch lặp lại, chọn sticker thả ga.'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 11, marginTop: 2 },
  giftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  giftBtnText: { fontSize: 11, fontWeight: '700' },
  progressSection: { marginBottom: 16 },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: { fontSize: 12, fontWeight: '600' },
  percentText: { fontSize: 11, fontWeight: '700' },
  progressBarTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  pyramidContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  pyramidRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  pyramidBlock: {
    width: 38,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinnacleBlock: {
    width: 52,
    height: 36,
    borderRadius: 10,
    borderWidth: 2,
  },
  blockText: {
    fontSize: 11,
  },
  rewardBanner: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rewardTitle: { fontSize: 12, fontWeight: '700' },
  rewardSub: { fontSize: 10, marginTop: 2 },
});
