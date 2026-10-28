import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dateKey } from '../utils/dateUtils';
import { MOOD_KEYS } from '../constants/data';

export default function CalendarView({
  theme,
  t,
  selectedDate,
  calendarMode,
  week,
  monthDays,
  events,
  stickersMap,
  moodsMap,
  onToggleMode,
  onChangeDate,
  onSelectDate,
  onSelectToday,
}) {
  return (
    <View style={[styles.calendarCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.monthHeader}>
        <Pressable style={styles.monthTitleButton} onPress={onToggleMode}>
          <Text style={[styles.monthTitle, { color: theme.ink }]}>
            {t.months[selectedDate.getMonth()]}, {selectedDate.getFullYear()}
          </Text>
          <Ionicons
            name={calendarMode === 'month' ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={theme.muted}
          />
        </Pressable>
        <View style={styles.monthControls}>
          <Pressable
            style={[styles.arrowButton, { backgroundColor: theme.background }]}
            onPress={() => onChangeDate(-1, calendarMode === 'month' ? 'month' : 'week')}
          >
            <Ionicons name="chevron-back" size={17} color={theme.ink} />
          </Pressable>
          <Pressable
            style={[styles.arrowButton, { backgroundColor: theme.background }]}
            onPress={onSelectToday}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primary }}>{t.todayShort}</Text>
          </Pressable>
          <Pressable
            style={[styles.arrowButton, { backgroundColor: theme.background }]}
            onPress={() => onChangeDate(1, calendarMode === 'month' ? 'month' : 'week')}
          >
            <Ionicons name="chevron-forward" size={17} color={theme.ink} />
          </Pressable>
        </View>
      </View>

      {/* Weekday headers */}
      <View style={styles.weekLabels}>
        {t.weekdays.map((day) => (
          <Text style={[styles.weekLabel, { color: theme.muted }]} key={day}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar View (Month vs Week) */}
      {calendarMode === 'week' ? (
        <View style={styles.weekDates}>
          {week.map((day) => {
            const dKey = dateKey(day);
            const selected = dKey === dateKey(selectedDate);
            const today = dKey === dateKey(new Date());
            const hasEvent = events.some((event) => event.date === dKey);
            const sticker = stickersMap[dKey];
            return (
              <Pressable
                key={dKey}
                onPress={() => onSelectDate(day)}
                style={[styles.dayCell, selected && { backgroundColor: theme.primary }]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    { color: theme.ink },
                    today && { color: theme.primary, fontWeight: '800' },
                    selected && { color: '#fff' },
                  ]}
                >
                  {day.getDate()}
                </Text>
                {sticker ? (
                  <Text style={{ fontSize: 12 }}>{sticker}</Text>
                ) : (
                  <View
                    style={[
                      styles.dayIndicator,
                      { backgroundColor: hasEvent ? (selected ? '#fff' : theme.primary) : 'transparent' },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.monthGrid}>
          {monthDays.map((day, index) => {
            if (!day) {
              return <View key={`blank-${index}`} style={styles.monthDay} />;
            }
            const dateObj = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
            const dKey = dateKey(dateObj);
            const selected = day === selectedDate.getDate();
            const today = dKey === dateKey(new Date());
            const hasEvent = events.some((event) => event.date === dKey);
            const sticker = stickersMap[dKey];
            const mood = moodsMap[dKey];
            return (
              <Pressable
                key={`day-${day}`}
                onPress={() => onSelectDate(dateObj)}
                style={[
                  styles.monthDay,
                  selected && {
                    backgroundColor: theme.primaryLight,
                    borderColor: theme.primary,
                    borderWidth: 1.5,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.monthDayText,
                    { color: theme.ink },
                    today && { color: theme.primary, fontWeight: '800' },
                    selected && { color: theme.primary, fontWeight: '800' },
                  ]}
                >
                  {day}
                </Text>
                {sticker ? (
                  <Text style={{ fontSize: 11 }}>{sticker}</Text>
                ) : mood ? (
                  <Text style={{ fontSize: 10 }}>
                    {MOOD_KEYS.find((m) => m.key === mood.key)?.emoji || '🌸'}
                  </Text>
                ) : hasEvent ? (
                  <View style={[styles.monthIndicator, { backgroundColor: theme.primary }]} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#5C4E5E',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthTitleButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  monthTitle: { fontWeight: '800', fontSize: 16 },
  monthControls: { flexDirection: 'row', gap: 6 },
  arrowButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabels: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  weekLabel: { width: '13%', textAlign: 'center', fontSize: 10, fontWeight: '700' },
  weekDates: { flexDirection: 'row', justifyContent: 'space-around' },
  dayCell: {
    width: '13%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dayNumber: { fontSize: 13, fontWeight: '600' },
  dayIndicator: { width: 4, height: 4, borderRadius: 2 },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  monthDay: {
    width: '14.285%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginVertical: 1,
  },
  monthDayText: { fontSize: 12, fontWeight: '600' },
  monthIndicator: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
});
