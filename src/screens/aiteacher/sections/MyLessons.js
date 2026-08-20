// src/screens/aiteacher/sections/MyLessons.js
// "My Lessons" — the lesson library, moved onto the light palette.
//
// The design does not draw this section at all, but it is the biggest thing on the old
// AI Teacher landing and dropping it would take every lesson the student has ever
// generated off the screen. It keeps all four of its controls: subject filter, date
// range, list/grid toggle, and the per-lesson progress ring.
//
// The rings are REAL. `percent` comes from GET /api/ai/lessons/progress, written on a
// 15s timer while a lesson is open — the same number the old screen showed. Nothing here
// estimates it.
import React from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  LayoutGrid, List, Calendar, ChevronDown, Play, Sparkles,
  Atom, Percent, FlaskConical, Leaf, BookOpen, Landmark,
} from 'lucide-react-native';

import { AIT, AIT_TINTS } from '../../../theme/aiTeacherTheme';
import { T, SectionTitle, PAD, cardSurface } from './ui';

const GRID_GAP = 12;

// Same subject dressing as SubjectsRow, on the thumbnails here. Kept local rather than
// shared because the two use it at different sizes and for different shapes; a single
// exported map would invite one to drift the other.
const META = {
  Physics:   { Icon: Atom,         tint: AIT_TINTS.blue },
  Maths:     { Icon: Percent,      tint: AIT_TINTS.violet },
  Chemistry: { Icon: FlaskConical, tint: AIT_TINTS.green },
  Biology:   { Icon: Leaf,         tint: AIT_TINTS.pink },
  English:   { Icon: BookOpen,     tint: AIT_TINTS.peach },
  History:   { Icon: Landmark,     tint: AIT_TINTS.peach },
};
const metaFor = (s) => META[s] || { Icon: Sparkles, tint: AIT_TINTS.violet };

// ── progress ring ────────────────────────────────────────────────────────────
// Below 1% there is no arc to draw, so the ring shows a play glyph instead of "0%" —
// a lesson never opened reads as "start" rather than as a failed one.
function Ring({ percent = 0, size = 44 }) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const tint = pct >= 100 ? AIT_TINTS.green.fg : AIT.cardAmber;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={AIT.track} strokeWidth={stroke} fill="none" />
        {pct > 0 && (
          <Circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={tint} strokeWidth={stroke} fill="none"
            strokeDasharray={`${(circ * pct) / 100} ${circ}`} strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      {pct > 0
        ? <T w="bold" s={size > 34 ? 11 : 9} c={pct >= 100 ? tint : AIT.ink}>{pct}%</T>
        : <Play size={size > 34 ? 14 : 11} color={AIT.inkMuted} strokeWidth={2.5} fill={AIT.inkMuted} />}
    </View>
  );
}

function Thumb({ subject, style, radius = 12 }) {
  const { Icon, tint } = metaFor(subject);
  return (
    <View style={[{ borderRadius: radius, backgroundColor: tint.bg, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Icon size={24} color={tint.fg} strokeWidth={1.9} />
    </View>
  );
}

// ── one lesson, list form ────────────────────────────────────────────────────
function LessonRow({ lesson, onPress, disabled }) {
  const { subject, title, meta, percent } = lesson;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.row, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityLabel={`Open lesson: ${title}`}
    >
      <Thumb subject={subject} style={s.rowThumb} />
      <View style={s.rowBody}>
        <T w="bold" s={11} c={metaFor(subject).tint.fg} numberOfLines={1} style={s.rowSubject}>
          {(subject || 'Lesson').toUpperCase()}
        </T>
        <T w="bold" s={15} numberOfLines={2} style={{ lineHeight: 20 }}>{title}</T>
        {!!meta && <T w="reg" s={12} c={AIT.inkMuted} numberOfLines={1}>{meta}</T>}
      </View>
      <Ring percent={percent} />
    </Pressable>
  );
}

// ── one lesson, grid form ────────────────────────────────────────────────────
function LessonCard({ lesson, width, onPress, disabled }) {
  const { subject, title, meta, percent } = lesson;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.gridCard, { width }, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityLabel={`Open lesson: ${title}`}
    >
      <Thumb subject={subject} style={s.gridThumb} radius={0} />
      <View style={s.gridBody}>
        <T w="bold" s={10} c={metaFor(subject).tint.fg} numberOfLines={1} style={s.rowSubject}>
          {(subject || 'Lesson').toUpperCase()}
        </T>
        <T w="bold" s={13} numberOfLines={2} style={{ lineHeight: 18 }}>{title}</T>
        <View style={s.gridFoot}>
          <T w="reg" s={11} c={AIT.inkMuted} numberOfLines={1} style={{ flex: 1 }}>{meta}</T>
          <Ring percent={percent} size={30} />
        </View>
      </View>
    </Pressable>
  );
}

export default function MyLessons({
  // null = still loading; [] = loaded and empty. The two look different on screen, so
  // they must stay distinguishable here rather than both arriving as [].
  lessons = null,
  subjects = [],            // filter chips, 'All' first — built by the caller from the rows
  subject = 'All',
  view = 'list',            // 'list' | 'grid'
  rangeLabel = 'All time',
  filtersActive = false,
  busy = false,
  onSelectSubject = () => {},
  onToggleView = () => {},
  onOpenRange = () => {},
  onOpenLesson = () => {},
}) {
  const { width: W } = useWindowDimensions();
  const cardW = Math.floor((W - PAD * 2 - GRID_GAP) / 2);
  const loading = lessons === null;
  const list = lessons || [];

  return (
    <View style={s.wrap}>
      <View style={s.head}>
        <SectionTitle>My Lessons</SectionTitle>

        <View style={s.toggle}>
          {[
            { k: 'grid', Icon: LayoutGrid, label: 'Grid view' },
            { k: 'list', Icon: List,       label: 'List view' },
          ].map(({ k, Icon, label }) => (
            <Pressable
              key={k}
              onPress={() => onToggleView(k)}
              style={[s.toggleBtn, view === k && s.toggleBtnOn]}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: view === k }}
            >
              <Icon size={16} color={view === k ? AIT.ink : AIT.inkMuted} strokeWidth={2} />
            </Pressable>
          ))}
        </View>
      </View>

      {/* Filters only appear once there is something to filter. On an empty library they
          would be three dead controls above an empty state. */}
      {list.length > 0 && (
        <View style={s.filters}>
          {subjects.length > 1 && (
            <View style={s.filterChips}>
              {subjects.map((sub) => {
                const on = sub === subject;
                return (
                  <Pressable
                    key={sub}
                    onPress={() => onSelectSubject(sub)}
                    style={[s.filterChip, on ? s.filterChipOn : s.filterChipOff]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`Filter: ${sub}`}
                  >
                    <T w={on ? 'bold' : 'med'} s={12} c={on ? AIT.chipOnInk : AIT.chipOffInk}>{sub}</T>
                  </Pressable>
                );
              })}
            </View>
          )}

          <Pressable
            onPress={onOpenRange}
            style={({ pressed }) => [s.rangeChip, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
            accessibilityLabel={`Date range: ${rangeLabel}`}
          >
            <Calendar size={15} color={AIT.accent} strokeWidth={2} />
            <T w="med" s={13} style={{ flex: 1 }}>{rangeLabel}</T>
            <ChevronDown size={16} color={AIT.inkMuted} strokeWidth={2} />
          </Pressable>
        </View>
      )}

      <View style={s.body}>
        {loading ? (
          [0, 1].map((i) => <View key={i} style={s.skeleton} />)
        ) : list.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Sparkles size={20} color={AIT.accent} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <T w="bold" s={14}>
                {filtersActive ? 'Nothing in this filter' : 'No lessons yet'}
              </T>
              <T w="reg" s={12.5} c={AIT.inkSoft} style={{ lineHeight: 18, marginTop: 3 }}>
                {filtersActive
                  ? 'Try another subject or widen the date range.'
                  : 'Type a topic above and Ms. Nova will build your first lesson.'}
              </T>
            </View>
          </View>
        ) : view === 'grid' ? (
          <View style={s.grid}>
            {list.map((l) => (
              <LessonCard
                key={l.id}
                lesson={l}
                width={cardW}
                disabled={busy}
                onPress={() => onOpenLesson(l)}
              />
            ))}
          </View>
        ) : (
          list.map((l) => (
            <LessonRow key={l.id} lesson={l} disabled={busy} onPress={() => onOpenLesson(l)} />
          ))
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingTop: 22, gap: 12 },
  head: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: PAD,
  },
  toggle: {
    flexDirection: 'row', gap: 4, padding: 3,
    borderRadius: 10, backgroundColor: AIT.field,
  },
  toggleBtn: { width: 30, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  toggleBtnOn: { backgroundColor: AIT.surface, borderWidth: 1, borderColor: AIT.surfaceEdge },

  filters: { paddingHorizontal: PAD, gap: 10 },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { height: 30, borderRadius: 100, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  filterChipOn: { backgroundColor: AIT.chipOnBg },
  filterChipOff: { backgroundColor: AIT.chipOffBg, borderWidth: 1, borderColor: AIT.chipEdge },
  rangeChip: {
    ...cardSurface,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, paddingHorizontal: 12, height: 40,
  },

  body: { paddingHorizontal: PAD, gap: 10 },

  row: { ...cardSurface, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  rowThumb: { width: 54, height: 54 },
  rowBody: { flex: 1, minWidth: 0, gap: 3 },
  rowSubject: { letterSpacing: 0.7 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  gridCard: { ...cardSurface, overflow: 'hidden' },
  gridThumb: { height: 78, width: '100%' },
  gridBody: { padding: 10, gap: 4 },
  gridFoot: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },

  skeleton: { height: 78, borderRadius: 16, backgroundColor: AIT.skeleton },

  empty: { ...cardSurface, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  emptyIcon: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: AIT.sparkleChip,
    alignItems: 'center', justifyContent: 'center',
  },
});
