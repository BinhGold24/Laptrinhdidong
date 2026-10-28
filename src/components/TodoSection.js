import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TodoSection({
  theme,
  t,
  dayTodos,
  onOpenAdd,
  onToggle,
  onEdit,
  onDelete,
}) {
  return (
    <View style={styles.sectionWrap}>
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>{t.todoSectionTitle}</Text>
        <Pressable onPress={onOpenAdd}>
          <Text style={[styles.sectionActionText, { color: theme.primary }]}>{t.newTodoBtn}</Text>
        </Pressable>
      </View>

      {dayTodos.length > 0 ? (
        <View style={[styles.cardBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {dayTodos.map((tItem) => (
            <View key={tItem.id} style={[styles.todoRow, { borderBottomColor: theme.line }]}>
              <Pressable onPress={() => onToggle(tItem.id)} style={{ marginRight: 10 }}>
                <Ionicons
                  name={tItem.completed ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={tItem.completed ? theme.green : theme.muted}
                />
              </Pressable>
              <Pressable style={{ flex: 1 }} onPress={() => onEdit(tItem)}>
                <Text
                  style={[
                    styles.todoTitle,
                    { color: theme.ink },
                    tItem.completed && styles.completedText,
                  ]}
                >
                  {tItem.title}
                </Text>
              </Pressable>
              <Pressable onPress={() => onEdit(tItem)} style={{ padding: 5, marginRight: 4 }}>
                <Ionicons name="pencil-outline" size={16} color={theme.muted} />
              </Pressable>
              <Pressable onPress={() => onDelete(tItem.id)} style={{ padding: 5 }}>
                <Ionicons name="trash-outline" size={16} color={theme.muted} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <Pressable
          style={[styles.emptyTodoBox, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={onOpenAdd}
        >
          <Text style={{ fontSize: 13, color: theme.muted }}>{t.emptyTodoPrompt}</Text>
        </Pressable>
      )}
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
  cardBox: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  todoTitle: { flex: 1, fontSize: 13, fontWeight: '500' },
  completedText: { textDecorationLine: 'line-through', opacity: 0.6 },
  emptyTodoBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
