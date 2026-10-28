import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOOD_KEYS } from '../constants/data';

export default function WeatherCard({
  theme,
  lang,
  t,
  weather,
  dailyQuote,
  selectedDateMood,
  onPressWeather,
  onPressMood,
}) {
  return (
    <View style={[styles.weatherCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.weatherCardHeader}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={[styles.weatherGreeting, { color: theme.ink }]}>
            {t.goodMorning}
          </Text>
          <Text style={[styles.weatherQuote, { color: theme.muted }]}>
            {weather.city ? `${weather.city} · ${lang === 'vi' ? weather.descVi : weather.descEn} · ` : ''}
            {dailyQuote}
          </Text>
        </View>
        <Pressable
          style={[styles.weatherBadge, { backgroundColor: theme.accentLight }]}
          onPress={onPressWeather}
          accessibilityLabel="Cập nhật thời tiết / Refresh weather"
        >
          <Text style={{ fontSize: 22 }}>{weather.icon}</Text>
          <Text style={[styles.weatherTemp, { color: theme.ink }]}>{weather.temp}°C</Text>
          <Text style={[styles.weatherCity, { color: theme.muted }]} numberOfLines={1}>
            {weather.city}
          </Text>
        </Pressable>
      </View>

      {/* Mood Tracker Shortcut */}
      <Pressable
        style={[styles.moodBar, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
        onPress={onPressMood}
      >
        <View style={styles.moodBarLeft}>
          <Text style={{ fontSize: 22 }}>
            {selectedDateMood ? MOOD_KEYS.find((m) => m.key === selectedDateMood.key)?.emoji || '🥰' : '💌'}
          </Text>
          <View>
            <Text style={[styles.moodBarTitle, { color: theme.ink }]}>
              {selectedDateMood ? `${t.moodPrefix}: ${t.moods[selectedDateMood.key]}` : t.howAreYouToday}
            </Text>
            <Text style={[styles.moodBarSubtitle, { color: theme.muted }]} numberOfLines={1}>
              {selectedDateMood?.note ? `“${selectedDateMood.note}”` : t.tapToLogMood}
            </Text>
          </View>
        </View>
        <Ionicons name="sparkles" size={17} color={theme.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  weatherCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#5C4E5E',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  weatherCardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  weatherGreeting: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  weatherQuote: { fontSize: 12, marginTop: 4, lineHeight: 17 },
  weatherBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 58,
  },
  weatherTemp: { fontSize: 11, fontWeight: '700', marginTop: 1 },
  weatherCity: { fontSize: 9, fontWeight: '600', marginTop: 1, maxWidth: 64, textAlign: 'center' },
  moodBar: {
    marginTop: 14,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  moodBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  moodBarTitle: { fontSize: 13, fontWeight: '700' },
  moodBarSubtitle: { fontSize: 11, marginTop: 2 },
});
