// src/screens/admin/learning/parts.js
// A single content-tree row — icon by level, name, status + child count, and (in reorder
// mode) up/down controls. Shared by the list and detail screens so the tree reads the same.
import React from 'react';
import { View } from 'react-native';
import { ChevronRight, ArrowUp, ArrowDown, FileText, Check } from 'lucide-react-native';
import { IconChip, AdminBadge, S } from '../ui/kit';
import { PressableScale } from '../../parent/ParentApp/anim';
import { T } from '../../parent/ParentApp/constants';
import { LEVEL_ICON, LEVEL_TONE, LEVEL_PLURAL, STATUS_TONE, STATUS_LABEL, childLevelOf } from './levels';

export function NodeRow({ node, onPress, onLongPress, reordering, onUp, onDown, canUp, canDown, last, selecting, selected, onToggle }) {
  const Icon = LEVEL_ICON[node.level] || FileText;
  const child = childLevelOf(node.level);
  const countLabel = node.level !== 'lesson' && child
    ? `${node.childCount || 0} ${(LEVEL_PLURAL[child] || '').toLowerCase()}`.trim()
    : (node.difficulty ? node.difficulty : 'Lesson');
  const press = selecting ? onToggle : (reordering ? undefined : onPress);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: last ? 0 : 1, borderBottomColor: S.hair, backgroundColor: selecting && selected ? S.indigoSoft : 'transparent' }}>
      <PressableScale
        onPress={press}
        onLongPress={onLongPress}
        disabled={reordering}
        scaleTo={0.98}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14 }}
        accessibilityRole={selecting ? 'checkbox' : 'button'}
        accessibilityState={selecting ? { checked: !!selected } : undefined}
        accessibilityLabel={`${node.name}, ${STATUS_LABEL[node.status] || node.status}`}
      >
        {selecting ? (
          <View style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: selected ? S.indigo : S.border, backgroundColor: selected ? S.indigo : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            {selected ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
          </View>
        ) : (
          <IconChip icon={Icon} toneKey={LEVEL_TONE[node.level] || 'indigo'} size={40} />
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <T w="xbold" s={14} c={S.ink} numberOfLines={1}>{node.name}</T>
          <T w="semi" s={12} c={S.muted} numberOfLines={1} style={{ marginTop: 1 }}>{STATUS_LABEL[node.status] || node.status} · {countLabel}</T>
        </View>
        {!reordering && !selecting && (
          <>
            <AdminBadge toneKey={STATUS_TONE[node.status] || 'gold'}>{node.status}</AdminBadge>
            <ChevronRight size={16} color={S.faint} />
          </>
        )}
      </PressableScale>
      {reordering && (
        <View style={{ flexDirection: 'row', gap: 2, paddingRight: 10 }}>
          <PressableScale onPress={canUp ? onUp : undefined} disabled={!canUp} hitSlop={6} style={{ opacity: canUp ? 1 : 0.3, padding: 6 }} accessibilityLabel="Move up"><ArrowUp size={18} color={S.sub} strokeWidth={2.4} /></PressableScale>
          <PressableScale onPress={canDown ? onDown : undefined} disabled={!canDown} hitSlop={6} style={{ opacity: canDown ? 1 : 0.3, padding: 6 }} accessibilityLabel="Move down"><ArrowDown size={18} color={S.sub} strokeWidth={2.4} /></PressableScale>
        </View>
      )}
    </View>
  );
}
