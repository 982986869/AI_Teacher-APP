// src/screens/admin/ui/sections.js
// Reusable composite sections shared across Admin screens — extracted from the profile
// and home screens so each screen stays short and the rhythm stays identical.
import React from 'react';
import { View } from 'react-native';
import { UserPlus, BookOpen, ClipboardCheck, Sparkles, Settings as SettingsIcon, Activity } from 'lucide-react-native';
import { AdminCard, Avatar, AdminBadge, IconChip, GhostButton, S } from './kit';
import { T } from '../../parent/ParentApp/constants';
import { Shimmer } from '../../parent/ParentApp/anim';
import { timeAgo } from './format';

// ── Layout-matching skeletons (so content arrives in place, no jump) ──────────────
function TilesSkeleton({ n = 3 }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {Array.from({ length: n }).map((_, i) => (
        <View key={i} style={{ flex: 1, minWidth: 150 }}><Shimmer w="100%" h={66} r={16} /></View>
      ))}
    </View>
  );
}
export function HomeSkeleton() {
  return (
    <View>
      <Shimmer w="100%" h={104} r={22} />
      <View style={{ height: 14 }} />
      <TilesSkeleton n={3} />
      <View style={{ height: 26 }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {[0, 1, 2, 3].map((i) => <View key={i} style={{ flex: 1, minWidth: '46%' }}><Shimmer w="100%" h={132} r={20} /></View>)}
      </View>
    </View>
  );
}
export function PeopleSkeleton() {
  return (
    <View style={{ marginTop: 4 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {[0, 1, 2].map((i) => <View key={i} style={{ flex: 1, minWidth: '46%' }}><Shimmer w="100%" h={150} r={20} /></View>)}
      </View>
      <View style={{ height: 26 }} />
      <TilesSkeleton n={3} />
    </View>
  );
}
export function ProfileSkeleton() {
  return (
    <View>
      <Shimmer w="100%" h={92} r={20} />
      <View style={{ height: 20 }} />
      <Shimmer w="100%" h={120} r={20} />
      <View style={{ height: 20 }} />
      <TilesSkeleton n={4} />
    </View>
  );
}

// ── Profile identity card (avatar + name + contact + status badges) ───────────────
export function ProfileHeaderCard({ seed, name, contact, badges = [] }) {
  return (
    <AdminCard style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <Avatar seed={seed} name={name} size={58} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T w="black" s={19} c={S.ink} numberOfLines={1} accessibilityRole="header">{name}</T>
        <T w="semi" s={12.5} c={S.muted} numberOfLines={1} style={{ marginTop: 2 }}>{contact || '—'}</T>
        {badges.length ? (
          <View style={{ marginTop: 8, flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {badges.map((b, i) => <AdminBadge key={i} toneKey={b.toneKey} dot={b.dot !== false}>{b.label}</AdminBadge>)}
          </View>
        ) : null}
      </View>
    </AdminCard>
  );
}

// ── Small person row (linked parent / child) ─────────────────────────────────────
export function PersonMiniRow({ seed, name, sub, right, last }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: last ? 0 : 1, borderBottomColor: S.hair }}>
      <Avatar seed={seed} name={name} size={38} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T w="xbold" s={13.5} c={S.ink} numberOfLines={1}>{name}</T>
        {sub != null && <T w="semi" s={12} c={S.muted} numberOfLines={1}>{sub}</T>}
      </View>
      {right}
    </View>
  );
}

const TYPE = {
  signup: { icon: UserPlus, tone: 'indigo', verb: 'Signed up' },
  lesson_completed: { icon: BookOpen, tone: 'blue', verb: 'Completed a lesson' },
  mock_submitted: { icon: ClipboardCheck, tone: 'emerald', verb: 'Submitted a mock test' },
  braingym_completed: { icon: Sparkles, tone: 'orange', verb: 'Finished Brain Gym' },
  admin_action: { icon: SettingsIcon, tone: 'purple', verb: 'Admin action' },
};

// ── Activity feed — one component for Home + profile "recent activity" ────────────
// Accepts either dashboard items ({type,title,subtitle}) or per-user items
// ({type,subject,chapter}); normalises both, so the row reads the same everywhere.
export function ActivityFeed({ items, emptyText = 'No recent activity.' }) {
  if (!items?.length) {
    return <T w="bold" s={13} c={S.muted} style={{ paddingVertical: 4 }}>{emptyText}</T>;
  }
  return items.slice(0, 6).map((it, i, arr) => {
    const cfg = TYPE[it.type] || { icon: Activity, tone: 'indigo', verb: 'Activity' };
    const title = it.title || it.subject || cfg.verb;
    const sub = it.subtitle || it.chapter || null;
    return (
      <View key={it.id || i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: i === arr.length - 1 ? 0 : 1, borderBottomColor: S.hair }}>
        <IconChip icon={cfg.icon} toneKey={cfg.tone} size={36} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T w="xbold" s={13} c={S.ink} numberOfLines={1}>{title}</T>
          {!!sub && <T w="semi" s={11.5} c={S.muted} numberOfLines={1}>{sub}</T>}
        </View>
        <T w="bold" s={11} c={S.faint}>{timeAgo(it.at)}</T>
      </View>
    );
  });
}

// ── Action group — a stack of secondary/destructive buttons ──────────────────────
export function ActionGroup({ actions }) {
  const visible = actions.filter((a) => a && !a.hidden);
  if (!visible.length) return null;
  return (
    <View style={{ gap: 10 }}>
      {visible.map((a, i) => (
        <GhostButton key={i} label={a.label} icon={a.icon} danger={a.danger} disabled={a.disabled} onPress={a.onPress} />
      ))}
    </View>
  );
}
