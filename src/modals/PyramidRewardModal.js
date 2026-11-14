import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PyramidRewardModal({
  visible,
  theme,
  t,
  onClose,
  completedCount = 0,
  isProUser = false,
  accountRole = 'guest', // 'guest' | 'member' | 'pro'
  proTrialUsed = false,
  onClaimTrial,
  onUpgradeProPackage,
  onOpenAuthModal,
}) {
  const [selectedPackage, setSelectedPackage] = useState('3months'); // '1month' | '3months' | '6months'
  const isEligibleForTrial = completedCount >= 20 && !proTrialUsed;

  const handleClaimTrial = () => {
    if (accountRole === 'guest') {
      Alert.alert(
        'Đăng Ký Nhận Quà PRO',
        'Bạn đang dùng Tài khoản Thường (chưa đăng ký). Hãy đăng ký bằng số điện thoại để lưu giữ 3 ngày dùng thử PRO và nhận ngay 3 sticker Kawaii ngẫu nhiên nhé!',
        [
          { text: 'Để sau', style: 'cancel' },
          {
            text: 'Đăng Ký Nhận Quà 🎁',
            onPress: () => {
              onClose();
              if (onOpenAuthModal) onOpenAuthModal();
            },
          },
        ]
      );
      return;
    }
    onClaimTrial();
  };

  const handleBuyPackage = () => {
    if (accountRole === 'guest') {
      Alert.alert(
        'Đăng Ký Tài Khoản',
        'Vui lòng đăng ký bằng số điện thoại để liên kết và bảo vệ gói Thành viên PRO của bạn!',
        [
          { text: 'Để sau', style: 'cancel' },
          {
            text: 'Đăng Ký Ngay 📲',
            onPress: () => {
              onClose();
              if (onOpenAuthModal) onOpenAuthModal();
            },
          },
        ]
      );
      return;
    }
    onUpgradeProPackage(selectedPackage);
  };


  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalSheet, { backgroundColor: theme.background }]}>
          <View style={styles.sheetHandle} />

          <View style={styles.modalHeader}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.modalTitle, { color: theme.ink }]}>
                {isEligibleForTrial ? '🎉 Quà Tặng 20 Tầng Kim Tự Tháp' : '👑 Gói Thành Viên PRO'}
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.muted }]}>
                {isEligibleForTrial
                  ? 'Bạn đã hoàn thành đủ 20 tầng lịch trình!'
                  : 'Nâng cấp để trải nghiệm các đặc quyền cao cấp nhất'}
              </Text>
            </View>
            <Pressable style={[styles.closeButton, { backgroundColor: theme.surface }]} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.ink} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Nếu đủ 20 tầng và chưa nhận thử 3 ngày */}
            {isEligibleForTrial ? (
              <View style={[styles.rewardBox, { backgroundColor: '#FFF9E6', borderColor: '#FFD166' }]}>
                <Text style={{ fontSize: 42, textAlign: 'center', marginBottom: 8 }}>👑</Text>
                <Text style={styles.rewardBoxTitle}>TẶNG GÓI THÀNH VIÊN DÙNG THỬ 3 NGÀY!</Text>
                <Text style={styles.rewardBoxDesc}>
                  Tuyệt vời! Bạn đã hoàn thành xuất sắc 20 tầng lịch trình. Hãy tận hưởng 3 ngày trải nghiệm không quảng cáo, mở full sticker và lặp lịch tự động!
                </Text>
                <Pressable
                  style={[styles.primaryActionBtn, { backgroundColor: '#FF7E95' }]}
                  onPress={handleClaimTrial}
                >
                  <Text style={styles.primaryActionBtnText}>🎁 Nhận Dùng Thử 3 Ngày Ngay</Text>
                </Pressable>
              </View>
            ) : null}

            {/* Các đặc quyền của bản PRO */}
            <View style={[styles.benefitsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.ink }]}>Đặc quyền dành riêng cho Bản Thành Viên:</Text>

              <View style={styles.benefitRow}>
                <Ionicons name="ban-outline" size={20} color="#FF7E95" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.benefitTitle, { color: theme.ink }]}>Hoàn toàn KHÔNG quảng cáo</Text>
                  <Text style={[styles.benefitDesc, { color: theme.muted }]}>
                    Tắt cả Banner lẫn quảng cáo toàn màn hình. Mượt mà 100%.
                  </Text>
                </View>
              </View>

              <View style={styles.benefitRow}>
                <Ionicons name="repeat-outline" size={20} color="#A290E8" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.benefitTitle, { color: theme.ink }]}>Xếp lịch lặp đi lặp lại</Text>
                  <Text style={[styles.benefitDesc, { color: theme.muted }]}>
                    Tự động lặp lại theo Hàng ngày, Hàng tuần, Hàng tháng.
                  </Text>
                </View>
              </View>

              <View style={styles.benefitRow}>
                <Ionicons name="happy-outline" size={20} color="#FFB84C" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.benefitTitle, { color: theme.ink }]}>Chọn Sticker thoải mái</Text>
                  <Text style={[styles.benefitDesc, { color: theme.muted }]}>
                    Mở khóa toàn bộ bộ sưu tập Kawaii Sticker từ máy chủ API.
                  </Text>
                </View>
              </View>
            </View>

            {/* Mục Ưu Đãi: 30k/1 tháng, 79k/3 tháng hoặc 150k/6 tháng (Giá gốc 30k/tháng) */}
            <View style={{ marginTop: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
                <Text style={[styles.sectionHeading, { color: theme.ink, flexShrink: 1 }]}>
                  Ưu đãi sau khi hết dùng thử:
                </Text>
                <Text style={[styles.basePriceText, { color: theme.muted }]}>
                  (Giá gốc: 30k/tháng)
                </Text>
              </View>

              {/* Lựa chọn 0: 30k / 1 tháng */}
              <Pressable
                style={[
                  styles.packageCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: selectedPackage === '1month' ? theme.primary : theme.border,
                  },
                  selectedPackage === '1month' && { borderWidth: 2, backgroundColor: theme.primaryLight },
                ]}
                onPress={() => setSelectedPackage('1month')}
              >
                <View style={{ flex: 1, paddingRight: 8, justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                    <Text style={[styles.packageName, { color: theme.ink, flexShrink: 1 }]}>Gói 1 Tháng Linh Hoạt</Text>
                  </View>
                  <Text style={[styles.packageCalc, { color: theme.muted }]}>
                    30.000đ/tháng • Dùng thử không ràng buộc
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', justifyContent: 'center', minWidth: 76 }}>
                  <Text style={[styles.packagePrice, { color: theme.primary }]}>30.000đ</Text>
                </View>
                {selectedPackage === '1month' && (
                  <Ionicons name="checkmark-circle" size={22} color={theme.primary} style={{ marginLeft: 6 }} />
                )}
              </Pressable>

              {/* Lựa chọn 1: 79k / 3 tháng */}
              <Pressable
                style={[
                  styles.packageCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: selectedPackage === '3months' ? theme.primary : theme.border,
                  },
                  selectedPackage === '3months' && { borderWidth: 2, backgroundColor: theme.primaryLight },
                ]}
                onPress={() => setSelectedPackage('3months')}
              >
                <View style={{ flex: 1, paddingRight: 8, justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                    <Text style={[styles.packageName, { color: theme.ink, flexShrink: 1 }]}>Gói 3 Tháng Siêu Tiết Kiệm</Text>
                    <View style={styles.tagBadge}>
                      <Text style={styles.tagBadgeText}>Ưu đãi</Text>
                    </View>
                  </View>
                  <Text style={[styles.packageCalc, { color: theme.muted }]}>
                    Chỉ ~26.000đ/tháng (Giá gốc 90.000đ)
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', justifyContent: 'center', minWidth: 76 }}>
                  <Text style={[styles.packagePrice, { color: theme.primary }]}>79.000đ</Text>
                  <Text style={styles.packageStrikePrice}>90.000đ</Text>
                </View>
                {selectedPackage === '3months' && (
                  <Ionicons name="checkmark-circle" size={22} color={theme.primary} style={{ marginLeft: 6 }} />
                )}
              </Pressable>

              {/* Lựa chọn 2: 150k / 6 tháng */}
              <Pressable
                style={[
                  styles.packageCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: selectedPackage === '6months' ? theme.primary : theme.border,
                  },
                  selectedPackage === '6months' && { borderWidth: 2, backgroundColor: theme.primaryLight },
                ]}
                onPress={() => setSelectedPackage('6months')}
              >
                <View style={{ flex: 1, paddingRight: 8, justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                    <Text style={[styles.packageName, { color: theme.ink, flexShrink: 1 }]}>Gói 6 Tháng Siêu Ưu Đãi</Text>
                    <View style={[styles.tagBadge, { backgroundColor: '#FFD166' }]}>
                      <Text style={[styles.tagBadgeText, { color: '#8A5200' }]}>HOT Nhất</Text>
                    </View>
                  </View>
                  <Text style={[styles.packageCalc, { color: theme.muted }]}>
                    Chỉ 25.000đ/tháng (Tiết kiệm 30.000đ)
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', justifyContent: 'center', minWidth: 76 }}>
                  <Text style={[styles.packagePrice, { color: theme.primary }]}>150.000đ</Text>
                  <Text style={styles.packageStrikePrice}>180.000đ</Text>
                </View>
                {selectedPackage === '6months' && (
                  <Ionicons name="checkmark-circle" size={22} color={theme.primary} style={{ marginLeft: 6 }} />
                )}
              </Pressable>
            </View>

            {/* Nút đăng ký gói ưu đãi qua VietQR SePay */}
            <Pressable
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary, marginTop: 16 }]}
              onPress={handleBuyPackage}
            >
              <Text style={styles.primaryActionBtnText}>
                💳 Thanh toán VietQR gói {selectedPackage === '1month'
                  ? '30.000đ (1 tháng)'
                  : selectedPackage === '3months'
                  ? '79.000đ (3 tháng)'
                  : '150.000đ (6 tháng)'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(28,22,34,0.45)' },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 26,
    maxHeight: '90%',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D6D0DA', alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSubtitle: { fontSize: 12, marginTop: 2 },
  closeButton: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rewardBox: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  rewardBoxTitle: { fontSize: 15, fontWeight: '900', color: '#D35400', textAlign: 'center', marginBottom: 6 },
  rewardBoxDesc: { fontSize: 12, color: '#555', textAlign: 'center', lineHeight: 18, marginBottom: 14 },
  primaryActionBtn: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    color: '#fff',
    fontSize: 13.5,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 19,
  },
  benefitsCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitTitle: { fontSize: 13, fontWeight: '700' },
  benefitDesc: { fontSize: 11, marginTop: 1 },
  sectionHeading: { fontSize: 14, fontWeight: '800' },
  basePriceText: { fontSize: 11, fontWeight: '600' },
  packageCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  packageName: { fontSize: 14, fontWeight: '800' },
  tagBadge: {
    backgroundColor: '#FF7E95',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  packageCalc: { fontSize: 11, marginTop: 3 },
  packagePrice: { fontSize: 17, fontWeight: '900' },
  packageStrikePrice: { fontSize: 11, color: '#999', textDecorationLine: 'line-through' },
});
