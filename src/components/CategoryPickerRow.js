import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_KEYS } from '../constants/data';
import { getCategoryMeta } from '../utils/categoryUtils';

/**
 * Hàng chọn nhãn danh mục dùng chung cho TodoModal & HabitModal
 */
export function CategoryPickerRow({ theme, t, label, selectedCategory, onSelect }) {
  return (
    <View>
      <Text style={[styles.inputLabel, { color: theme.ink }]}>{label}</Text>
      <View style={styles.categoryChoices}>
        {CATEGORY_KEYS.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <Pressable
              key={cat.key}
              onPress={() => onSelect(cat.key)}
              style={[
                styles.categoryChoice,
                {
                  backgroundColor: isSelected ? cat.color + '22' : theme.surface,
                  borderColor: isSelected ? cat.color : theme.border,
                },
              ]}
            >
              <Ionicons
                name={cat.icon}
                size={13}
                color={isSelected ? cat.color : theme.muted}
              />
              <Text
                style={[
                  styles.categoryChoiceText,
                  { color: isSelected ? cat.color : theme.muted },
                  isSelected && { fontWeight: '700' },
                ]}
              >
                {t.categories?.[cat.key] || cat.key}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Huy hiệu nhỏ hiển thị nhãn (Công việc / Học tập / Sức khỏe / Cá nhân / Khác)
 */
export function CategoryBadge({ categoryKey, t, theme, compact = false }) {
  const meta = getCategoryMeta(categoryKey);
  const label = t?.categories?.[meta.key] || meta.key;

  return (
    <View
      style={[
        styles.badge,
        compact && styles.badgeCompact,
        {
          backgroundColor: theme?.isDark ? meta.color + '2B' : meta.color + '1A',
          borderColor: meta.color + '44',
        },
      ]}
    >
      <Ionicons name={meta.icon} size={compact ? 10 : 11} color={meta.color} />
      <Text style={[styles.badgeText, compact && styles.badgeTextCompact, { color: meta.color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 12 },
  categoryChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  categoryChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryChoiceText: { fontSize: 11.5, fontWeight: '500' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeCompact: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 7,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextCompact: {
    fontSize: 9.5,
  },
});
