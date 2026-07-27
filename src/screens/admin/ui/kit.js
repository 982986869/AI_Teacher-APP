// src/screens/admin/ui/kit.js
// Shared Admin UI kit — the Admin mode's chrome, assembled ENTIRELY from the existing
// Student/Parent design system (studentTheme `S` + shadow, Nunito `T`, the shared anim
// primitives). No new visual language: same cards, radii, spacing rhythm, icon chips and
// motion the Student and Parent apps use, so Admin reads as another mode of one app.
import React from 'react';
import { View, StyleSheet, TextInput, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Search, Inbox, CircleAlert, X, RefreshCw } from 'lucide-react-native';
import { S, shadow, shadowSm } from '../../../theme/studentTheme';
import { T } from '../../parent/ParentApp/constants';
import { PressableScale, CountUp, Shimmer } from '../../parent/ParentApp/anim';
import { initials, colorFor } from './format';

export const TONE = {
  indigo: { c: S.indigo, s: S.indigoSoft },
  blue: { c: S.blue, s: S.blueSoft },
  emerald: { c: S.emerald, s: S.emeraldSoft },
  orange: { c: S.orange, s: S.orangeSoft },
  gold: { c: S.gold, s: S.goldSoft },
  purple: { c: S.purple, s: S.purpleSoft },
  cyan: { c: S.cyan, s: S.cyanSoft },
  red: { c: S.red, s: S.redSoft },
};
export const tone = (k) => TONE[k] || TONE.indigo;

const STATUS_TONE = {
  active: 'emerald', published: 'emerald', linked: 'emerald', resolved: 'emerald',
  draft: 'gold', pending: 'gold', unlinked: 'gold',
  deactivated: 'red', failed: 'red',
};

// ── Screen frame ────────────────────────────────────────────────────────────────
export function AdminScreen({ children, style }) {
  return <View style={[st.screen, style]}>{children}</View>;
}

// ── Header (title + optional back + optional right slot), safe-area padded ────────
export function AdminHeader({ title, subtitle, onBack, right }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[st.header, { paddingTop: insets.top + 8 }]}>
      {onBack ? (
        <PressableScale style={st.backBtn} onPress={onBack} hitSlop={8} accessibilityRole="button" accessibilityLabel="Go back">
          <ChevronLeft size={22} color={S.ink} strokeWidth={2.4} />
        </PressableScale>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <T w="black" s={22} c={S.ink} style={{ letterSpacing: -0.5 }} numberOfLines={1} accessibilityRole="header">{title}</T>
        {!!subtitle && <T w="semi" s={12.5} c={S.muted} style={{ marginTop: 1 }} numberOfLines={1}>{subtitle}</T>}
      </View>
      {right}
    </View>
  );
}

// ── Editorial section label — uppercase tracked text + hairline rule ─────────────
export function SectionLabel({ children, right, style }) {
  return (
    <View style={[st.labelRow, style]}>
      <T w="xbold" s={11.5} c={S.muted} style={st.labelText} accessibilityRole="header">{children}</T>
      <View style={st.labelRule} />
      {right}
    </View>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────────
export function AdminCard({ children, style, onPress, ...rest }) {
  if (onPress) {
    return <PressableScale style={[st.card, style]} onPress={onPress} {...rest}>{children}</PressableScale>;
  }
  return <View style={[st.card, style]} {...rest}>{children}</View>;
}

// ── Icon chip (soft-tinted rounded square) ───────────────────────────────────────
export function IconChip({ icon: Icon, toneKey = 'indigo', size = 44 }) {
  const t = tone(toneKey);
  return (
    <View style={{ width: size, height: size, borderRadius: size >= 44 ? 14 : 11, backgroundColor: t.s, alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={size * 0.46} color={t.c} strokeWidth={2.4} />
    </View>
  );
}

// ── Avatar (initials on a deterministic tint) ────────────────────────────────────
export function Avatar({ seed, name, size = 44 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: colorFor(seed), alignItems: 'center', justifyContent: 'center' }}>
      <T w="black" s={size * 0.36} c="#fff">{initials(name)}</T>
    </View>
  );
}

// ── Status badge / pill ──────────────────────────────────────────────────────────
export function AdminBadge({ children, toneKey, dot = true }) {
  const key = toneKey || (typeof children === 'string' ? STATUS_TONE[children.toLowerCase()] : null) || 'indigo';
  const t = tone(key);
  return (
    <View style={[st.badge, { backgroundColor: t.s }]}>
      {dot && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.c }} />}
      <T w="xbold" s={11} c={t.c} numberOfLines={1} style={{ textTransform: 'capitalize' }}>{children}</T>
    </View>
  );
}

// ── List row — avatar + title + sub + right meta + chevron (one tappable row) ─────
export function AdminListRow({ seed, name, sub, right, when, onPress, last }) {
  return (
    <PressableScale style={[st.row, last && { borderBottomWidth: 0 }]} onPress={onPress} scaleTo={0.98} accessibilityRole="button" accessibilityLabel={name}>
      <Avatar seed={seed} name={name} size={42} />
      <View style={st.rowMain}>
        <T w="xbold" s={14} c={S.ink} numberOfLines={1}>{name}</T>
        {sub != null && <T w="semi" s={12} c={S.muted} numberOfLines={1} style={{ marginTop: 1 }}>{sub}</T>}
      </View>
      <View style={st.rowMeta}>
        {right}
        {!!when && <T w="bold" s={11.5} c={S.faint}>{when}</T>}
        <ChevronRight size={16} color={S.faint} strokeWidth={2.2} />
      </View>
    </PressableScale>
  );
}

// ── Stat tile — icon chip + gently counting value + label ────────────────────────
// Numbers ease up smoothly (CountUp), never a mechanical spin — calm, not attention-grabbing.
export function AdminStatTile({ icon, toneKey = 'indigo', value, label, suffix = '' }) {
  const numeric = typeof value === 'number';
  return (
    <View style={st.statTile}>
      <IconChip icon={icon} toneKey={toneKey} size={40} />
      <View style={{ flex: 1, minWidth: 0 }}>
        {numeric
          ? <CountUp value={value} duration={760} suffix={suffix} w="xbold" s={21} c={S.ink} />
          : <T w="xbold" s={21} c={S.ink} numberOfLines={1}>{value ?? '—'}{value != null ? suffix : ''}</T>}
        <T w="semi" s={11.5} c={S.muted} numberOfLines={1} style={{ marginTop: 1 }}>{label}</T>
      </View>
    </View>
  );
}

// ── Primary insight — one large, calm, actionable statement ──────────────────────
export function AdminInsight({ icon: Icon, toneKey = 'gold', value, title, note, action }) {
  const t = tone(toneKey);
  return (
    <View style={[st.insight, { backgroundColor: t.s }]}>
      {Icon ? <View style={st.insightIcon}><Icon size={24} color={t.c} strokeWidth={2.3} /></View> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <T w="black" s={30} c={t.c} style={{ letterSpacing: -0.8 }}>{value}</T>
        <T w="xbold" s={14.5} c={S.ink} style={{ marginTop: 3 }}>{title}</T>
        {!!note && <T w="semi" s={12.5} c={S.muted} style={{ marginTop: 2, lineHeight: 18 }}>{note}</T>}
        {action ? <View style={{ marginTop: 12 }}>{action}</View> : null}
      </View>
    </View>
  );
}

// ── Module card — hub entry ──────────────────────────────────────────────────────
export function AdminModuleCard({ icon, toneKey = 'indigo', name, blurb, count, onPress, soon }) {
  return (
    <AdminCard style={st.moduleCard} onPress={onPress} accessibilityLabel={name}>
      <View style={st.rowBetween}>
        <IconChip icon={icon} toneKey={toneKey} size={44} />
        {count != null && !soon ? <T w="black" s={22} c={S.ink}>{count}</T> : null}
        {soon ? <AdminBadge toneKey="gold" dot={false}>Soon</AdminBadge> : null}
      </View>
      <T w="black" s={15.5} c={S.ink} style={{ marginTop: 12 }}>{name}</T>
      <T w="semi" s={12} c={S.muted} style={{ marginTop: 3, lineHeight: 17 }}>{blurb}</T>
      {!soon && (
        <View style={[st.rowCenter, { marginTop: 10, gap: 4 }]}>
          <T w="xbold" s={12.5} c={tone(toneKey).c}>Open</T>
          <ChevronRight size={14} color={tone(toneKey).c} strokeWidth={2.6} />
        </View>
      )}
    </AdminCard>
  );
}

// ── Search bar (with clear) ──────────────────────────────────────────────────────
export function AdminSearchBar({ value, onChangeText, placeholder = 'Search…' }) {
  return (
    <View style={st.search} accessibilityRole="search">
      <Search size={17} color={S.faint} strokeWidth={2.2} />
      <TextInput
        style={st.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={S.faint}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="never"
        accessibilityLabel={placeholder}
      />
      {value ? (
        <PressableScale onPress={() => onChangeText('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search" style={st.searchClear}>
          <X size={14} color={S.muted} strokeWidth={2.6} />
        </PressableScale>
      ) : null}
    </View>
  );
}

// ── Chip row — horizontally scrollable filter chips (always visible, no dropdown) ──
export function ChipRow({ value, onChange, options }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 12 }} keyboardShouldPersistTaps="handled">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <PressableScale key={o.value || 'all'} onPress={() => onChange(o.value)} scaleTo={0.95}
            accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={o.label}
            style={[st.chip, on && st.chipOn]}>
            <T w="bold" s={12.5} c={on ? '#fff' : S.sub}>{o.label}</T>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

// ── Segmented pill filter ────────────────────────────────────────────────────────
export function AdminSegmented({ value, onChange, options }) {
  return (
    <View style={st.segment}>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <PressableScale key={o.value} style={[st.segItem, on && st.segItemOn]} onPress={() => onChange(o.value)} scaleTo={0.96}>
            <T w="xbold" s={12.5} c={on ? '#fff' : S.muted}>{o.label}</T>
          </PressableScale>
        );
      })}
    </View>
  );
}

// ── Meta grid (key / value pairs) ────────────────────────────────────────────────
export function AdminMetaGrid({ items }) {
  return (
    <View style={st.metaGrid}>
      {items.map((it, i) => (
        <View key={i} style={st.metaItem}>
          <T w="xbold" s={10.5} c={S.faint} style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}>{it.k}</T>
          <T w="bold" s={13.5} c={S.ink} style={{ marginTop: 3 }} numberOfLines={1}>{it.v ?? '—'}</T>
        </View>
      ))}
    </View>
  );
}

// ── Section (editorial label + optional card body) ───────────────────────────────
export function Section({ label, right, card, children, style }) {
  return (
    <View style={style}>
      <SectionLabel right={right}>{label}</SectionLabel>
      {card ? <AdminCard>{children}</AdminCard> : children}
    </View>
  );
}

// ── Metric grid — a wrapping row of stat tiles ────────────────────────────────────
export function MetricGrid({ items }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {items.map((m, i) => <AdminStatTile key={m.label || i} {...m} />)}
    </View>
  );
}

// ── Resource view — one place for the loading / error / data gate every screen used ─
// Pass a render function as children: (data) => <JSX/>.
export function ResourceView({ loading, error, data, onRetry, skeleton, children }) {
  if (loading && !data) return skeleton || <ListSkeleton />;
  if (error && !data) return <AdminErrorState message={error} onRetry={onRetry} />;
  if (!data) return null;
  return children(data);
}

// ── Empty state ──────────────────────────────────────────────────────────────────
export function AdminEmptyState({ icon: Icon = Inbox, title, message, action, secondaryAction }) {
  return (
    <View style={st.center} accessibilityRole="summary">
      <View style={st.stateIcon}><Icon size={28} color={S.faint} strokeWidth={2} /></View>
      <T w="xbold" s={16} c={S.ink} style={{ textAlign: 'center' }}>{title}</T>
      {!!message && <T w="semi" s={13} c={S.muted} style={{ textAlign: 'center', lineHeight: 19, maxWidth: 300 }}>{message}</T>}
      {action ? <View style={{ marginTop: 8, alignSelf: 'stretch', maxWidth: 260 }}>{action}</View> : null}
      {secondaryAction ? <View style={{ marginTop: 2 }}>{secondaryAction}</View> : null}
    </View>
  );
}

// ── Error state — says what happened + what to do, with a prominent retry ─────────
export function AdminErrorState({ title = "That didn't load", message = "We couldn't reach the server just now. It's usually a brief connection hiccup — try again in a moment.", onRetry }) {
  return (
    <View style={st.center} accessibilityRole="alert">
      <View style={[st.stateIcon, { backgroundColor: S.redSoft, borderColor: S.redSoft }]}><CircleAlert size={28} color={S.red} strokeWidth={2.2} /></View>
      <T w="xbold" s={16} c={S.ink} style={{ textAlign: 'center' }}>{title}</T>
      <T w="semi" s={13} c={S.muted} style={{ textAlign: 'center', lineHeight: 19, maxWidth: 300 }}>{message}</T>
      {!!onRetry && (
        <PressableScale style={st.retryBtn} onPress={onRetry} accessibilityRole="button" accessibilityLabel="Try again">
          <RefreshCw size={15} color="#fff" strokeWidth={2.6} />
          <T w="bold" s={14} c="#fff">Try again</T>
        </PressableScale>
      )}
    </View>
  );
}

// ── List skeleton (shimmer rows) ─────────────────────────────────────────────────
export function ListSkeleton({ rows = 7 }) {
  return (
    <View style={{ paddingHorizontal: 4 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={st.skRow}>
          <Shimmer w={42} h={42} r={13} />
          <View style={{ flex: 1, gap: 7 }}>
            <Shimmer w={'55%'} h={12} r={6} />
            <Shimmer w={'35%'} h={10} r={5} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Ghost / secondary button ─────────────────────────────────────────────────────
export function GhostButton({ label, icon: Icon, onPress, danger, disabled }) {
  const col = danger ? S.red : S.sub;
  return (
    <PressableScale style={[st.ghostBtn, danger && { borderColor: S.redSoft, backgroundColor: S.redSoft }, disabled && { opacity: 0.5 }]}
      onPress={disabled ? undefined : onPress} disabled={disabled} accessibilityLabel={label}>
      {Icon ? <Icon size={16} color={col} strokeWidth={2.4} /> : null}
      <T w="bold" s={13.5} c={col}>{label}</T>
    </PressableScale>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: S.canvas },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: S.card, borderWidth: 1, borderColor: S.hair, alignItems: 'center', justifyContent: 'center', ...shadowSm },

  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24, marginBottom: 12 },
  labelText: { letterSpacing: 1.3, textTransform: 'uppercase' },
  labelRule: { flex: 1, height: 1, backgroundColor: S.hair },

  card: { backgroundColor: S.card, borderRadius: 20, borderWidth: 1, borderColor: S.hair, padding: 16, ...shadow },
  moduleCard: { padding: 16 },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9, alignSelf: 'flex-start', flexShrink: 0 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: S.hair },
  rowMain: { flex: 1, minWidth: 0 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  statTile: { flex: 1, minWidth: 150, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: S.card, borderRadius: 16, borderWidth: 1, borderColor: S.hair, padding: 13, ...shadowSm },

  insight: { flexDirection: 'row', gap: 16, borderRadius: 22, padding: 20 },
  insightIcon: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadowSm },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },

  search: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: S.card, borderWidth: 1, borderColor: S.border, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 2 },
  searchInput: { flex: 1, fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: S.ink, paddingVertical: 11 },
  searchClear: { width: 22, height: 22, borderRadius: 11, backgroundColor: S.hair, alignItems: 'center', justifyContent: 'center' },

  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: S.border, backgroundColor: S.card },
  chipOn: { backgroundColor: S.ink, borderColor: S.ink },

  segment: { flexDirection: 'row', gap: 6, backgroundColor: S.card, borderWidth: 1, borderColor: S.hair, borderRadius: 13, padding: 4, alignSelf: 'flex-start' },
  segItem: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 9 },
  segItemOn: { backgroundColor: S.ink },

  metaGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  metaItem: { width: '50%', paddingVertical: 9 },

  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 46, paddingHorizontal: 24, gap: 9 },
  stateIcon: { width: 68, height: 68, borderRadius: 22, backgroundColor: S.card, borderWidth: 1, borderColor: S.hair, alignItems: 'center', justifyContent: 'center', marginBottom: 4, ...shadowSm },
  retryBtn: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: S.indigo, borderRadius: 13, paddingVertical: 12, paddingHorizontal: 26, ...shadowSm },

  skRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 10 },

  ghostBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1.5, borderColor: S.border, backgroundColor: S.card, borderRadius: 13, paddingVertical: 12, paddingHorizontal: 16 },
});

export { S, shadow, shadowSm } from '../../../theme/studentTheme';
