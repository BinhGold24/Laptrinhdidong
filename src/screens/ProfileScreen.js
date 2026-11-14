import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEMES } from '../constants/themes';

export default function ProfileScreen({
  theme,
  lang,
  t,
  currentThemeKey,
  onToggleLang,
  onSaveTheme,
  onRefreshData,
  userAccount = null,
  isProUser = false,
  accountRole = 'guest', // 'guest' | 'member' | 'pro'
  proDaysLeft = 0,
  ownedStickers = [],
  onOpenAuthModal,
  onOpenProModal,
  onCancelPro,
  onLogout,
  bottomBannerVisible = true,
  onShowBanner,
  onOpenSettings,
}) {
  return (
    <View style={styles.profileScreen}>
      <Text style={[styles.greeting, { color: theme.ink }]}>{t.profileTitle}</Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>{t.profileSub}</Text>

      {/* Cute Profile & Account Card theo Cấp Độ Phân Quyền */}
      <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View
          style={[
            styles.profileAvatar,
            {
              backgroundColor:
                accountRole === 'pro'
                  ? '#FFEAA7'
                  : accountRole === 'member'
                  ? theme.primaryLight
                  : theme.line,
            },
          ]}
        >
          <Text style={{ fontSize: 32 }}>
            {accountRole === 'pro' ? '👑' : accountRole === 'member' ? '🐰' : '👤'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 6 }}>
          <Text style={[styles.profileName, { color: theme.ink }]}>
            {accountRole === 'pro'
              ? (userAccount?.phone || 'Thành Viên PRO')
              : accountRole === 'member'
              ? (userAccount?.phone || 'Thành Viên')
              : 'Tài Khoản Thường'}
          </Text>

          {accountRole === 'pro' && (
            <View style={[styles.proBadge, { backgroundColor: '#FFD700' }]}>
              <Text style={styles.proBadgeText}>PRO VIP</Text>
            </View>
          )}
          {accountRole === 'member' && (
            <View style={[styles.proBadge, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.proBadgeText, { color: theme.primary }]}>Thành Viên</Text>
            </View>
          )}
          {accountRole === 'guest' && (
            <View style={[styles.freeBadge, { backgroundColor: theme.line }]}>
              <Text style={[styles.freeBadgeText, { color: theme.muted }]}>Chưa Đăng Ký</Text>
            </View>
          )}
        </View>

        <Text style={[styles.profileCaption, { color: theme.muted }]}>
          {accountRole === 'pro'
            ? `Đặc quyền PRO VIP đang hoạt động (Còn ${proDaysLeft} ngày). Full sticker, không quảng cáo.`
            : accountRole === 'member'
            ? `Email: ${userAccount?.email || 'Chưa cập nhật'} • Sở hữu ${ownedStickers.length} sticker xinh xắn`
            : 'Tài khoản thường có 1 sticker cơ bản. Đăng ký để đồng bộ lịch và nhận 3 sticker ngẫu nhiên!'}
        </Text>

        {accountRole !== 'guest' ? (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <Pressable
              style={[styles.accountActionBtn, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
              onPress={onOpenAuthModal}
            >
              <Ionicons name="person-outline" size={14} color={theme.primary} />
              <Text style={[styles.accountActionText, { color: theme.primary }]}>Đổi tài khoản</Text>
            </Pressable>
            <Pressable
              style={[styles.accountActionBtn, { backgroundColor: theme.surface, borderColor: '#FFAAA6' }]}
              onPress={onLogout}
            >
              <Ionicons name="log-out-outline" size={14} color="#D46B78" />
              <Text style={[styles.accountActionText, { color: '#D46B78' }]}>Đăng xuất</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.primaryLoginBtn, { backgroundColor: theme.primary }]}
            onPress={onOpenAuthModal}
          >
            <Ionicons name="gift-outline" size={16} color="#fff" />
            <Text style={styles.primaryLoginBtnText}>Đăng ký tài khoản (Nhận 3 Sticker) 🎁</Text>
          </Pressable>
        )}
      </View>

      {/* PRO & PYRAMID BANNER CARD */}
      <Pressable
        style={[
          styles.proCardBanner,
          {
            backgroundColor: accountRole === 'pro' ? (theme.isDark ? '#3A301C' : '#FFF8E7') : theme.surface,
            borderColor: accountRole === 'pro' ? '#FFD166' : theme.primary,
          },
        ]}
        onPress={onOpenProModal}
      >
        <View style={styles.proCardLeft}>
          <Text style={{ fontSize: 28 }}>{accountRole === 'pro' ? '👑' : '🏛️'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <Text style={[styles.proCardTitle, { color: theme.ink, flexShrink: 1 }]}>
              {accountRole === 'pro' ? 'Bạn là Thành Viên PRO 👑' : 'Kim Tự Tháp 20 Tầng & Bản PRO'}
            </Text>
          </View>
          <Text style={[styles.proCardSub, { color: theme.muted }]}>
            {accountRole === 'pro'
              ? `Hạn dùng: Còn ${proDaysLeft} ngày. Không quảng cáo, full sticker, lặp lịch.`
              : 'Hoàn thành 20 tầng tặng 3 ngày dùng thử. Gói 30k (1 tháng), 79k (3 tháng) hoặc 150k (6 tháng)!'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.primary} />
      </Pressable>

      {accountRole === 'pro' && onCancelPro && (
        <Pressable
          style={[styles.cancelProBtn, { backgroundColor: theme.surface, borderColor: '#FFAAA6' }]}
          onPress={onCancelPro}
        >
          <Ionicons name="close-circle-outline" size={16} color="#D46B78" />
          <Text style={[styles.accountActionText, { color: '#D46B78', fontSize: 12 }]}>Hủy gói PRO</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  profileScreen: { paddingTop: 6 },
  greeting: { fontSize: 24, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { fontSize: 13, marginTop: 4 },
  profileCard: {
    marginTop: 18,
    marginBottom: 16,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  profileAvatar: { width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  profileName: { fontSize: 16, fontWeight: '800' },
  profileCaption: { fontSize: 11.5, marginTop: 6, textAlign: 'center', lineHeight: 16, paddingHorizontal: 4 },
  proBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  proBadgeText: { fontSize: 10, fontWeight: '900', color: '#6A4300' },
  freeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  freeBadgeText: { fontSize: 10, fontWeight: '700' },
  accountActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  accountActionText: { fontSize: 11, fontWeight: '700' },
  primaryLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 15,
    marginTop: 16,
  },
  primaryLoginBtnText: {
    color: '#fff',
    fontSize: 11.5,
    fontWeight: '800',
    textAlign: 'center',
    flexShrink: 1,
    lineHeight: 17,
  },
  proCardBanner: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cancelProBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: -6,
    marginBottom: 16,
  },
  proCardLeft: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proCardTitle: { fontSize: 14, fontWeight: '800' },
  proCardSub: { fontSize: 11, marginTop: 2, lineHeight: 15 },
  sectionWrap: { marginBottom: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  themeCard: {
    width: '48%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  themeCardName: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  themeColorDot: { width: 14, height: 14, borderRadius: 7, marginTop: 6 },
  themeCheckmark: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  profileInfo: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  infoTitle: { fontWeight: '700', fontSize: 12 },
  infoSubtitle: { fontSize: 10, marginTop: 3 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  tierCardBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  tierRow: {
    paddingVertical: 4,
  },
  tierHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  tierTitle: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  currentTierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  currentTierText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  tierDetailText: {
    fontSize: 11,
    lineHeight: 18,
    paddingLeft: 26,
  },
  tierDivider: {
    height: 1,
    marginVertical: 4,
  },
});

