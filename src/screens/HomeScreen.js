import React from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WeatherCard from '../components/WeatherCard';
import CountdownList from '../components/CountdownList';
import HabitSection from '../components/HabitSection';
import TodoSection from '../components/TodoSection';
import EventCard from '../components/EventCard';

export default function HomeScreen({
  theme,
  lang,
  t,
  weather,
  dailyQuote,
  selectedDate,
  selectedDateStr,
  selectedDateMood,
  countdowns,
  habits,
  dayTodos,
  dayEvents,
  loading,
  completedEventsCount,
  onPressWeather,
  onPressMood,
  onOpenAddDDay,
  onDeleteDDay,
  onOpenAddHabit,
  onToggleHabit,
  onEditHabit,
  onDeleteHabit,
  onOpenAddTodo,
  onToggleTodo,
  onEditTodo,
  onDeleteTodo,
  onToggleEvent,
  onEditEvent,
  onDeleteEvent,
  onOpenNewEvent,
}) {
  return (
    <>
      {/* Real-time Weather & Quote Card */}
      <WeatherCard
        theme={theme}
        lang={lang}
        t={t}
        weather={weather}
        dailyQuote={dailyQuote}
        selectedDateMood={selectedDateMood}
        onPressWeather={onPressWeather}
        onPressMood={onPressMood}
      />

      {/* D-Day Carousel */}
      <CountdownList
        theme={theme}
        lang={lang}
        t={t}
        countdowns={countdowns}
        onOpenAdd={onOpenAddDDay}
        onDelete={onDeleteDDay}
      />

      {/* Habit Section */}
      <HabitSection
        theme={theme}
        t={t}
        habits={habits}
        selectedDateStr={selectedDateStr}
        onOpenAdd={onOpenAddHabit}
        onToggle={onToggleHabit}
        onEdit={onEditHabit}
        onDelete={onDeleteHabit}
      />

      {/* To-Do Section */}
      <TodoSection
        theme={theme}
        t={t}
        dayTodos={dayTodos}
        onOpenAdd={onOpenAddTodo}
        onToggle={onToggleTodo}
        onEdit={onEditTodo}
        onDelete={onDeleteTodo}
      />

      {/* Daily Events Header */}
      <View style={styles.agendaHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>{t.todayAgendaTitle}</Text>
          <Text style={[styles.agendaDate, { color: theme.muted }]}>
            {t.weekdays[(selectedDate.getDay() + 6) % 7]}, {selectedDate.getDate()}{' '}
            {t.months[selectedDate.getMonth()].toLowerCase()} · {t.itemsCount(dayEvents.length)}
          </Text>
        </View>
        <View style={[styles.progressBadge, { backgroundColor: theme.greenLight }]}>
          <Ionicons name="checkmark-done" size={15} color={theme.green} />
          <Text style={[styles.progressText, { color: theme.green }]}>
            {completedEventsCount}/{dayEvents.length}
          </Text>
        </View>
      </View>

      {/* Events List */}
      {loading ? (
        <View style={[styles.loadingBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ActivityIndicator color={theme.primary} />
          <Text style={[styles.emptyCaption, { color: theme.muted }]}>{t.loadingEvents}</Text>
        </View>
      ) : dayEvents.length ? (
        <FlatList
          data={dayEvents}
          renderItem={({ item }) => (
            <EventCard
              theme={theme}
              event={item}
              onToggle={onToggleEvent}
              onEdit={onEditEvent}
              onDelete={onDeleteEvent}
            />
          )}
          keyExtractor={(item, index) => String(item.id || index)}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      ) : (
        <View style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.emptyIllustration, { backgroundColor: theme.primaryLight }]}>
            <Text style={{ fontSize: 32 }}>🧸</Text>
          </View>
          <Text style={[styles.emptyTitle, { color: theme.ink }]}>{t.emptyEventsTitle}</Text>
          <Text style={[styles.emptyCaption, { color: theme.muted }]}>{t.emptyEventsSub}</Text>
          <Pressable
            style={[styles.emptyAddButton, { backgroundColor: theme.primary }]}
            onPress={onOpenNewEvent}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.emptyAddText}>{t.addNewEventBtn}</Text>
          </Pressable>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  agendaHeader: {
    marginTop: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  agendaDate: { fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
  progressBadge: {
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressText: { fontWeight: '700', fontSize: 11 },
  loadingBox: { minHeight: 130, alignItems: 'center', justifyContent: 'center', borderRadius: 18, borderWidth: 1 },
  emptyCaption: { fontSize: 11, textAlign: 'center', marginTop: 6 },
  emptyState: {
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 180,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  emptyIllustration: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: { fontSize: 14, fontWeight: '700' },
  emptyAddButton: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  emptyAddText: { color: '#fff', fontWeight: '700', fontSize: 11 },
});
