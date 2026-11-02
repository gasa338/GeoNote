/**
 * @module features/zones/components/ChecklistEditor
 * @category Feature: Zones
 */
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Icon } from '@/components/ui';
import type { ChecklistItem } from '@/data/types';
import { useT } from '@/i18n/useT';
import { radius, spacing, typography, useTheme } from '@/theme';
import { newId } from '@/utils/id';

/** Props of {@link ChecklistEditor}. */
export interface ChecklistEditorProps {
  items: ChecklistItem[];
  /** Called with the full new list after every change. */
  onChange: (items: ChecklistItem[]) => void;
  /** `card` = framed list (editor); `plain` = no frame (zone details). Default `card`. */
  look?: 'card' | 'plain';
  /** Hide the "Add task" row (zone details shows ticking only). */
  readOnlyItems?: boolean;
}

/**
 * A task list: tap the square to tick, ✕ to remove, "+ Add task" to add.
 * Several items at once: separate them with commas — "milk, bread, eggs".
 */
export function ChecklistEditor({ items, onChange, look = 'card', readOnlyItems }: ChecklistEditorProps) {
  const t = useT();
  const { colors } = useTheme();
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');

  /** Adds the typed text as one or more items. */
  function addItems() {
    const texts = newText
      .split(/[,\n]/)
      .map((text) => text.trim())
      .filter((text) => text.length > 0);
    if (texts.length > 0) {
      onChange([...items, ...texts.map((text) => ({ id: newId(), text, done: false }))]);
    }
    setNewText('');
  }

  function toggleItem(id: string) {
    onChange(items.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  }

  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  const frame = look === 'card' ? [styles.card, { borderColor: colors.border, backgroundColor: colors.surface }] : null;

  return (
    <View style={frame}>
      {items.map((item) => (
        <View key={item.id} style={styles.row}>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.done }}
            accessibilityLabel={item.text}
            hitSlop={8}
            onPress={() => toggleItem(item.id)}
            style={[
              styles.box,
              { borderColor: item.done ? colors.primary : colors.textTertiary },
              item.done && { backgroundColor: colors.primary },
            ]}>
            {item.done ? <Icon name="checkmark" size={15} color="onPrimary" /> : null}
          </Pressable>
          <AppText
            variant="body"
            color={item.done ? 'textTertiary' : 'text'}
            style={[{ flex: 1 }, item.done && { textDecorationLine: 'line-through' }]}>
            {item.text}
          </AppText>
          {!readOnlyItems ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t.common.delete}: ${item.text}`}
              hitSlop={12}
              onPress={() => removeItem(item.id)}>
              <Icon name="close" size={18} color="textTertiary" />
            </Pressable>
          ) : null}
        </View>
      ))}

      {!readOnlyItems ? (
        adding ? (
          <View style={styles.row}>
            <Icon name="add" size={20} color="primary" />
            <TextInput
              autoFocus
              value={newText}
              onChangeText={setNewText}
              onSubmitEditing={addItems}
              onBlur={() => {
                addItems();
                setAdding(false);
              }}
              submitBehavior="submit"
              returnKeyType="done"
              placeholder={t.zoneEditor.addTaskPlaceholder}
              placeholderTextColor={colors.textTertiary}
              style={[typography.body, styles.input, { color: colors.text }]}
            />
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => setAdding(true)} style={styles.row} hitSlop={6}>
            <Icon name="add" size={20} color="primary" />
            <AppText variant="body" color="primary" style={{ fontWeight: '500' }}>
              {t.zoneEditor.addTask}
            </AppText>
          </Pressable>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth * 2, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 40 },
  box: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, paddingVertical: spacing.sm },
});
