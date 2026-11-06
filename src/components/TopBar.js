import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MOOD_KEYS } from '../constants/data';

export default function TopBar({
  theme,
  lang,
  t,
  onToggleLang,
  selectedDateSticker,
  selectedDateMood,
  onPressSticker,
  onPressProfile,
  isProUser = false,
  accountRole = 'guest', // 'guest' | 'member' | 'pro'
  onPressPro,
  onPressAuth,
}) {
  return (
    <View style={styles.topBar}>
      <Pressable style={styles.brand} onPress={onPressProfile}>
        <View style={[styles.brandIcon, { backgroundColor: accountRole === 'pro' ? '#FFD700' : theme.primary }]}>
          <Text style={{ fontSize: 16 }}>{accountRole === 'pro' ? '👑' : accountRole === 'member' ? '🐰' : theme.icon}</Text>
        </View>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={[styles.brandName, { color: theme.ink }]}>
              CalendarCute<Text style={{ color: theme.primary }}>.</Text>
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
          <Text style={[styles.brandTagline, { color: theme.muted }]}>
            {accountRole === 'guest' ? 'Chưa đăng ký • Chạm để tạo' : t.brandTagline}
          </Text>
        </View>
      </Pressable>



      <View style={styles.topBarActions}>
        {/* Quick Language Switcher */}
        <Pressable
          style={[styles.langTogglePill, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => onToggleLang(lang === 'vi' ? 'en' : 'vi')}
          accessibilityLabel="Chuyển ngôn ngữ / Switch language"
        >
          <Text style={{ fontSize: 14 }}>{lang === 'vi' ? '🇻🇳' : '🇬🇧'}</Text>
          <Text style={[styles.langToggleText, { color: theme.ink }]}>
            {lang === 'vi' ? 'VI' : 'EN'}
          </Text>
        </Pressable>

        {/* Sticker Button */}
        <Pressable
          style={[styles.cuteIconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={onPressSticker}
          accessibilityLabel={t.stickerA11y}
        >
          <Text style={{ fontSize: 18 }}>{selectedDateSticker || '🎀'}</Text>
        </Pressable>

        {/* Avatar / Mood Button */}
        <Pressable
          style={[styles.avatar, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
          onPress={onPressProfile}
        >
          <Text style={{ fontSize: 16 }}>
            {selectedDateMood ? MOOD_KEYS.find((m) => m.key === selectedDateMood.key)?.emoji || '🌸' : '🐰'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
  langTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  langToggleText: { fontSize: 11, fontWeight: '800' },
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

