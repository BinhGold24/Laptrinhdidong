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
}) {
  return (
    <View style={styles.profileScreen}>
      <Text style={[styles.greeting, { color: theme.ink }]}>{t.profileTitle}</Text>
      <Text style={[styles.subtitle, { color: theme.muted }]}>{t.profileSub}</Text>

      {/* Cute Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.profileAvatar, { backgroundColor: theme.primaryLight }]}>
          <Text style={{ fontSize: 32 }}>🐰</Text>
        </View>
        <Text style={[styles.profileName, { color: theme.ink }]}>{t.profileName}</Text>
        <Text style={[styles.profileCaption, { color: theme.muted }]}>{t.profileCaption}</Text>
      </View>

      {/* LANGUAGE SWITCHER SECTION */}
      <View style={styles.sectionWrap}>
        <Text style={[styles.sectionTitle, { color: theme.ink, marginBottom: 10 }]}>
          {t.languageSectionTitle}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={() => onToggleLang('vi')}
            style={[
              styles.langCard,
              { backgroundColor: theme.surface, borderColor: lang === 'vi' ? theme.primary : theme.border },
              lang === 'vi' && { borderWidth: 2, backgroundColor: theme.primaryLight },
            ]}
          >
            <Text style={{ fontSize: 24, marginRight: 10 }}>🇻🇳</Text>
            <Text
              style={[
                styles.langCardTitle,
                { color: theme.ink, flex: 1 },
                lang === 'vi' && { color: theme.primary, fontWeight: '800' },
              ]}
            >
              Tiếng Việt
            </Text>
            {lang === 'vi' && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
          </Pressable>

          <Pressable
            onPress={() => onToggleLang('en')}
            style={[
              styles.langCard,
              { backgroundColor: theme.surface, borderColor: lang === 'en' ? theme.primary : theme.border },
              lang === 'en' && { borderWidth: 2, backgroundColor: theme.primaryLight },
            ]}
          >
            <Text style={{ fontSize: 24, marginRight: 10 }}>🇬🇧</Text>
            <Text
              style={[
                styles.langCardTitle,
                { color: theme.ink, flex: 1 },
                lang === 'en' && { color: theme.primary, fontWeight: '800' },
              ]}
            >
              English
            </Text>
            {lang === 'en' && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}
          </Pressable>
        </View>
      </View>

      {/* Theme Selector */}
      <View style={styles.sectionWrap}>
        <Text style={[styles.sectionTitle, { color: theme.ink, marginBottom: 12 }]}>
          {t.themeSectionTitle}
        </Text>
        <View style={styles.themeGrid}>
          {Object.values(THEMES).map((thItem) => {
            const isSelected = thItem.id === currentThemeKey;
            return (
              <Pressable
                key={thItem.id}
                onPress={() => onSaveTheme(thItem.id)}
                style={[
                  styles.themeCard,
                  { backgroundColor: thItem.background, borderColor: isSelected ? thItem.primary : thItem.border },
                  isSelected && { borderWidth: 2 },
                ]}
              >
                <Text style={{ fontSize: 24, marginBottom: 4 }}>{thItem.icon}</Text>
                <Text style={[styles.themeCardName, { color: thItem.ink }]}>{thItem.name}</Text>
                <View style={[styles.themeColorDot, { backgroundColor: thItem.primary }]} />
                {isSelected && (
                  <View style={[styles.themeCheckmark, { backgroundColor: thItem.primary }]}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Sync Info */}
      <View style={[styles.profileInfo, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="cloud-done-outline" size={21} color={theme.green} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.infoTitle, { color: theme.ink }]}>{t.syncTitle}</Text>
          <Text style={[styles.infoSubtitle, { color: theme.muted }]}>{t.syncSub}</Text>
        </View>
        <View style={[styles.onlineDot, { backgroundColor: theme.green }]} />
      </View>

      <Pressable
        style={[styles.profileInfo, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={onRefreshData}
      >
        <Ionicons name="refresh-outline" size={21} color={theme.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.infoTitle, { color: theme.ink }]}>{t.refreshTitle}</Text>
          <Text style={[styles.infoSubtitle, { color: theme.muted }]}>{t.refreshSub}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.muted} />
      </Pressable>
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
    paddingVertical: 22,
  },
  profileAvatar: { width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  profileName: { fontSize: 16, fontWeight: '800' },
  profileCaption: { fontSize: 11, marginTop: 4 },
  sectionWrap: { marginBottom: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  langCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  langCardTitle: { fontSize: 13, fontWeight: '700' },
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
});
