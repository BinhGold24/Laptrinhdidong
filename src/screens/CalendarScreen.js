import React from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CalendarView from '../components/CalendarView';
import EventCard from '../components/EventCard';
import { dateLabel } from '../utils/dateUtils';

export default function CalendarScreen({
  theme,
  lang,
  t,
  selectedDate,
  selectedDateStr,
  calendarMode,
  week,
  monthDays,
  events,
  stickersMap,
  moodsMap,
  selectedDateSticker,
  dayEvents,
  onToggleMode,
  onChangeDate,
  onSelectDate,
  onSelectToday,
  onOpenStickerPicker,
  onToggleEvent,
  onEditEvent,
  onDeleteEvent,
  onOpenNewEvent,
}) {
  return (
    <>
      <CalendarView
        theme={theme}
        t={t}
        selectedDate={selectedDate}
        calendarMode={calendarMode}
        week={week}
        monthDays={monthDays}
        events={events}
        stickersMap={stickersMap}
        moodsMap={moodsMap}
        onToggleMode={onToggleMode}
        onChangeDate={onChangeDate}
        onSelectDate={onSelectDate}
        onSelectToday={onSelectToday}
      />

      {/* Day Quick Sticker Bar */}
      <View style={[styles.dateStickerBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.dateStickerTitle, { color: theme.ink }]}>
            {dateLabel(selectedDateStr, lang)} {selectedDateSticker ? `· Sticker: ${selectedDateSticker}` : ''}
          </Text>
          <Text style={[styles.dateStickerSub, { color: theme.muted }]}>{t.stickerSub}</Text>
        </View>
        <Pressable
          style={[styles.stickerPickBtn, { backgroundColor: theme.primaryLight }]}
          onPress={onOpenStickerPicker}
        >
          <Text style={{ fontSize: 16 }}>{selectedDateSticker || '🌸'}</Text>
          <Text style={[styles.stickerPickBtnText, { color: theme.primary }]}>{t.pickStickerBtn}</Text>
        </Pressable>
      </View>

      {/* Day's Agenda */}
      <View style={styles.agendaHeader}>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>{t.calendarAgendaTitle}</Text>
        <Text style={[styles.agendaDate, { color: theme.muted }]}>{t.itemsCount(dayEvents.length)}</Text>
      </View>

      {dayEvents.length ? (
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
        <View
          style={[
            styles.emptyState,
            { backgroundColor: theme.surface, borderColor: theme.border, minHeight: 140 },
          ]}
        >
          <Text style={{ fontSize: 24, marginBottom: 8 }}>🍃</Text>
          <Text style={[styles.emptyTitle, { color: theme.ink }]}>{t.emptyCalendarDayTitle}</Text>
          <Pressable
            style={[styles.emptyAddButton, { backgroundColor: theme.primary, marginTop: 10 }]}
            onPress={onOpenNewEvent}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.emptyAddText}>{t.addEventForDay}</Text>
          </Pressable>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  dateStickerBar: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dateStickerTitle: { fontSize: 13, fontWeight: '700' },
  dateStickerSub: { fontSize: 11, marginTop: 2 },
  stickerPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  stickerPickBtnText: { fontSize: 11, fontWeight: '700' },
  agendaHeader: {
    marginTop: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  agendaDate: { fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
  emptyState: {
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 180,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
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
