import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { calculateDDay, dateLabel } from '../utils/dateUtils';

export default function CountdownList({
  theme,
  lang,
  t,
  countdowns,
  onOpenAdd,
  onDelete,
}) {
  if (!countdowns || countdowns.length === 0) return null;

  return (
    <View style={styles.sectionWrap}>
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>{t.ddaySectionTitle}</Text>
        <Pressable onPress={onOpenAdd}>
          <Text style={[styles.sectionActionText, { color: theme.primary }]}>{t.addBtn}</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {countdowns.map((item) => (
          <Pressable
            key={item.id}
            onLongPress={() => onDelete(item.id)}
            style={[styles.ddayCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={[styles.ddayIconWrap, { backgroundColor: theme.secondaryLight }]}>
              <Text style={{ fontSize: 20 }}>{item.icon}</Text>
            </View>
            <View style={{ flex: 1, paddingRight: 6 }}>
              <Text style={[styles.ddayTitle, { color: theme.ink }]} numberOfLines={1}>{item.title}</Text>
              <Text style={[styles.ddayDate, { color: theme.muted }]}>{dateLabel(item.targetDate, lang)}</Text>
            </View>
            <View style={[styles.ddayBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.ddayBadgeText}>{calculateDDay(item.targetDate)}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionWrap: { marginBottom: 18 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  sectionActionText: { fontSize: 12, fontWeight: '700' },
  ddayCard: {
    width: 170,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ddayIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ddayTitle: { fontSize: 13, fontWeight: '700' },
  ddayDate: { fontSize: 10, marginTop: 2 },
  ddayBadge: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'center',
  },
  ddayBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
