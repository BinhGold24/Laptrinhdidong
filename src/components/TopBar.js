import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOOD_KEYS } from '../constants/data';

export default function TopBar({
  theme,
  lang,
  t,
  selectedDateSticker,
  selectedDateMood,
  onPressSticker,
  onPressProfile,
  isProUser = false,
  accountRole = 'guest', // 'guest' | 'member' | 'pro'
  userAccount = null,
  onPressPro,
  onPressAuth,
  onOpenSettings,
}) {
  return (
    <View style={styles.topBar}>
      <Pressable
        style={styles.brand}
        onPress={accountRole === 'guest' && onPressAuth ? onPressAuth : onPressProfile}
      >
        <View style={[styles.brandIcon, { backgroundColor: accountRole === 'pro' ? '#FFD700' : theme.primary }]}>
          <Text style={{ fontSize: 16 }}>{accountRole === 'pro' ? '👑' : accountRole === 'member' ? '🐰' : theme.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 }}>
            <Text style={[styles.brandName, { color: theme.ink }]}>
              MyLife<Text style={{ color: theme.primary }}>.</Text>
            </Text>
            {accountRole === 'pro' && (
              <View style={[styles.proPill, { backgroundColor: '#FFD700' }]}>
                <Text style={styles.proPillText}>PRO VIP</Text>
              </View>
            )}
            {accountRole === 'member' && (
              <View style={[styles.proPill, { backgroundColor: theme.primaryLight }]}>
                <Text style={[styles.proPillText, { color: theme.primary }]}>Thành viên</Text>
              </View>
            )}
            {accountRole === 'guest' && (
              <View style={[styles.proPill, { backgroundColor: theme.line }]}>
                <Text style={[styles.proPillText, { color: theme.muted }]}>Thường</Text>
              </View>
            )}
          </View>
          <Text style={[styles.brandTagline, { color: theme.muted }]} numberOfLines={1}>
            {accountRole === 'guest'
              ? (lang === 'vi' ? 'Chưa đăng ký • Chạm để tạo' : 'Guest • Tap to register')
              : `${userAccount?.phone || 'Cá nhân'} • ${lang === 'vi' ? 'Lịch cá nhân' : 'My Schedule'}`}
          </Text>
        </View>
      </Pressable>

      <View style={styles.topBarActions}>
        {/* Nút Cài đặt (Ngôn ngữ, Dark Mode, Màu nền, Sticker) ĐẶT Ở GÓC TRÊN BÊN PHẢI */}
        <Pressable
          style={({ pressed }) => [
            styles.settingsBtn,
            { backgroundColor: theme.surface, borderColor: theme.border },
            pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
          ]}
          onPress={onOpenSettings}
          accessibilityLabel="Cài đặt giao diện & Ngôn ngữ"
        >
          <Ionicons name="settings-outline" size={20} color={theme.ink} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 58,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 10,
  },
  brandIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { fontSize: 19, fontWeight: '800', letterSpacing: -0.6 },
  brandTagline: { fontSize: 10, marginTop: -2, fontWeight: '500' },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cuteIconButton: {
    width: 36,
    height: 36,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  proPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#6A4300',
  },
});

