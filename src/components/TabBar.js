import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabBar({
  theme,
  t,
  activeTab,
  onNavigateTab,
  disabled,
}) {
  const tabs = [
    { key: 'home', label: t.tabHome, icon: 'sunny-outline', selectedIcon: 'sunny' },
    { key: 'calendar', label: t.tabCalendar, icon: 'calendar-outline', selectedIcon: 'calendar' },
    { key: 'habits', label: t.tabHabits, icon: 'heart-outline', selectedIcon: 'heart' },
    { key: 'insights', label: t.tabInsights, icon: 'pie-chart-outline', selectedIcon: 'pie-chart' },
    { key: 'profile', label: t.tabProfile, icon: 'color-palette-outline', selectedIcon: 'color-palette' },
  ];

  return (
    <View style={[styles.tabBar, { backgroundColor: theme.surface, borderTopColor: theme.line }]}>
      {tabs.map((tab) => {
        const selected = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={styles.tabItem}
            onPress={() => onNavigateTab(tab.key)}
            disabled={disabled}
          >
            <Ionicons
              name={selected ? tab.selectedIcon : tab.icon}
              size={21}
              color={selected ? theme.primary : theme.muted}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: selected ? theme.primary : theme.muted },
                selected && styles.tabLabelSelected,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 64,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 4,
  },
  tabItem: { width: '20%', height: 50, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabLabel: { fontSize: 9, fontWeight: '500' },
  tabLabelSelected: { fontWeight: '800' },
});
