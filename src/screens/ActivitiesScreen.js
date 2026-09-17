// src/screens/ActivitiesScreen.js
// Chapter activities: pick a subject → a chapter → play it one of three ways.
//
//   Class Game     A team board game the teacher runs from one device, projected on
//                  the classroom screen. 2–4 teams, a 4×4 board of point tiles under
//                  four categories, a 30-second timer, the teacher reveals the answer
//                  and marks the team right or wrong. Nothing is saved — it is the
//                  whole class's event, not anyone's score.
//
//   Solo Missions  A student plays alone: quick-fire MCQ, true/false, type the answer,
//                  connections, and (when curated) a real-world task. Auto-graded,
//                  the best score is kept per chapter.
//
//   Sort It Lab    Rounds of items to drop into one of two bins. Tap an item, tap a
//                  bin; a wrong bin bounces it back, a right one keeps it. Every item
//                  ends up placed; the score is how many went in first time.
//
// Opens full-screen from Home the way the AI Teacher does — inside the tab, no route —
// and navigates internally with state like PracticeScreen, so it inherits the dock's
// paid gate without any wiring of its own.
//
// MOTION: New Architecture is on, so LayoutAnimation is a no-op — every transition
// here is an Animated value. Entrances are staggered Appear()s, presses are springs
// (Squeeze), wrong answers shake, right answers pop, and progress bars ease. All of
// it runs on the native driver except bar widths, which cannot.
//
// Colours are the app's day theme (white ground, gold CTA, violet accent), not the
// dark projector palette of the reference mock-ups.
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, StatusBar, ScrollView, Modal,
  ActivityIndicator, Dimensions, Animated, Easing, Keyboard, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Users, Rocket, FlaskConical, Trophy, Eye, Check, X, RotateCcw, Play, Star } from 'lucide-react-native';

import { useAuth } from '../context/AuthContext';
import { DAY, DFONT as F } from '../theme/dayTheme';
import { getActivitySubjects, getActivityChapters, getActivity, submitActivityResult } from '../api/activitiesApi';
import { reportWarn } from '../utils/errorLog';
import { API_BASE_URL } from '../constants/config';

const { width: W } = Dimensions.get('window');
const PAD = 16;
const TIMER_SEC = 30;

// Team accents — one per team, chosen to stay apart from the gold turn ring and from
// each other on a white ground.
const TEAM_COLORS = ['#DB2777', DAY.blue, DAY.green, DAY.amber];
const TEAM_NAMES = ['Team Rockets', 'Team Stars', 'Team Comets', 'Team Blazers'];

const errMsg = (e, fallback) => {
  const status = e?.response?.status;
  // Naming the host is what tells a 404 from production apart from one from a dev server.
  if (status === 404) return 'The server does not have Activities yet — it needs the latest backend deployed. (' + API_BASE_URL + ')';
  if (status === 403) return 'Activities need full access.';
  if (!status) return 'Cannot reach the server at ' + API_BASE_URL + '. Check the connection and try again.';
  return (e?.response?.data?.message || fallback) + ' (' + status + ')';
};

const T = ({ w = 'reg', s = 14, c = DAY.ink, style, children, ...rest }) => (
  <Text {...rest} style={[{ fontFamily: F[w] || F.reg, fontSize: s, color: c }, style]}>{children}</Text>
);

// ─── Motion primitives ───────────────────────────────────────────────────────

// Fade + rise on mount. `delay` staggers siblings so a list arrives as a cascade
// rather than a slab.
function Appear({ delay = 0, y = 14, style, children }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 380, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [v, delay]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [y, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

// A press that gives a little: springs to 0.96 on press-in, back on release.
function Squeeze({ onPress, disabled, style, children, to = 0.96, ...rest }) {
  const s = useRef(new Animated.Value(1)).current;
  const go = (v) => Animated.spring(s, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  return (
    <Pressable onPress={onPress} disabled={disabled} onPressIn={() => !disabled && go(to)} onPressOut={() => go(1)} {...rest}>
      <Animated.View style={[style, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

// Horizontal shake for a wrong answer. Returns the transform style and a trigger.
function useShake() {
  const v = useRef(new Animated.Value(0)).current;
  const shake = useCallback(() => {
    v.setValue(0);
    Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 55, useNativeDriver: true }),
      Animated.timing(v, { toValue: -1, duration: 55, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0.6, duration: 55, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  }, [v]);
  const style = { transform: [{ translateX: v.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }] };
  return [style, shake];
}

// Scale-pop whenever `value` changes — the score ticking up, a tile being claimed.
function Pop({ value, children, style, amount = 1.25 }) {
  const s = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    s.setValue(amount);
    Animated.spring(s, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 12 }).start();
  }, [value, s, amount]);
  return <Animated.View style={[style, { transform: [{ scale: s }] }]}>{children}</Animated.View>;
}

// Progress bar whose width eases to the new value. Width cannot use the native
// driver, which is fine — one bar, one property.
function Bar({ pct, color = DAY.heroA, track = DAY.track, height = 10, style }) {
  const v = useRef(new Animated.Value(pct)).current;
  useEffect(() => { Animated.timing(v, { toValue: pct, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(); }, [pct, v]);
  return (
    <View style={[{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }, style]}>
      <Animated.View style={{ height: '100%', borderRadius: height / 2, backgroundColor: color, width: v.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'], extrapolate: 'clamp' }) }} />
    </View>
  );
}

// A gentle breathing loop — the team whose turn it is.
function Breathe({ active, children, style }) {
  const s = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!active) { s.setValue(1); return undefined; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(s, { toValue: 1.05, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(s, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [active, s]);
  return <Animated.View style={[style, { transform: [{ scale: s }] }]}>{children}</Animated.View>;
}

// A burst of emoji rising and fading — for a finished game. Purely decorative, so it
// never blocks touches and runs entirely on the native driver.
const CONFETTI = ['🎉', '⭐', '✨', '🎊', '🏅', '💫', '🌟', '🎈'];
function Confetti({ show }) {
  const pieces = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    e: CONFETTI[i % CONFETTI.length], x: Math.random() * (W - 40), d: Math.random() * 400, r: (Math.random() - 0.5) * 60, v: new Animated.Value(0),
  })), []);
  useEffect(() => {
    if (!show) return;
    pieces.forEach((p) => { p.v.setValue(0); Animated.timing(p.v, { toValue: 1, duration: 1600, delay: p.d, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(); });
  }, [show, pieces]);
  if (!show) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <Animated.Text key={i} style={{
          position: 'absolute', left: p.x, bottom: 40, fontSize: 24,
          opacity: p.v.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, -380 - p.d / 2] }) },
            { rotate: p.v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.r}deg`] }) },
          ],
        }}>{p.e}</Animated.Text>
      ))}
    </View>
  );
}

// ─── Chrome ──────────────────────────────────────────────────────────────────

function Header({ onBack, kicker, title, sub, emoji }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[st.header, { paddingTop: insets.top + 8 }]}>
      <Squeeze onPress={onBack} hitSlop={12} style={st.backBtn} accessibilityRole="button" accessibilityLabel="Back">
        <ChevronLeft size={22} color={DAY.inkSoft} />
      </Squeeze>
      <Appear delay={40} y={6} style={st.headerText}>
        {!!kicker && <T w="bold" s={10} c={DAY.inkSoft} style={st.kicker}>{kicker.toUpperCase()}</T>}
        <T w="xbold" s={20} c={DAY.ink} style={{ marginTop: 2 }} numberOfLines={2}>{emoji ? `${emoji} ` : ''}{title}</T>
        {!!sub && <T w="reg" s={13} c={DAY.inkSoft} style={{ marginTop: 3 }}>{sub}</T>}
      </Appear>
    </View>
  );
}

function Card({ style, children }) {
  return <View style={[st.card, style]}>{children}</View>;
}

function GoldBtn({ label, icon, onPress, disabled, style }) {
  return (
    <Squeeze onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} style={[st.gold, disabled && st.dim, style]}>
      {icon}
      <T w="bold" s={16} c={DAY.ctaFg}>{label}</T>
    </Squeeze>
  );
}

function Centered({ children }) {
  return <View style={st.centered}>{children}</View>;
}

// ─── Subjects ────────────────────────────────────────────────────────────────

function SubjectsView({ classLevel, onPick, onBack }) {
  const [state, setState] = useState({ loading: true, list: [], error: '' });
  useEffect(() => {
    let alive = true;
    getActivitySubjects(classLevel)
      .then((list) => alive && setState({ loading: false, list: list || [], error: '' }))
      .catch((e) => alive && setState({ loading: false, list: [], error: errMsg(e, 'Could not load subjects.') }));
    return () => { alive = false; };
  }, [classLevel]);

  return (
    <View style={st.root}>
      <Header onBack={onBack} kicker={classLevel || 'Activities'} title="Activities" sub="Play a chapter as a class, or on your own" />
      {state.loading ? <Centered><ActivityIndicator color={DAY.violet} /></Centered>
        : state.error ? <Centered><T c={DAY.red} style={{ textAlign: 'center' }}>{state.error}</T></Centered>
        : !state.list.length ? <Centered><T c={DAY.inkSoft} style={{ textAlign: 'center' }}>No activities for this class yet.</T></Centered>
        : (
          <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
            <View style={st.grid}>
              {state.list.map((s, i) => (
                <Appear key={s.slug} delay={60 + i * 45} style={st.subjectCell}>
                  <Squeeze onPress={() => onPick(s)} accessibilityRole="button" accessibilityLabel={s.name} style={[st.card, st.subjectCard]}>
                    <T s={28}>{s.emoji}</T>
                    <T w="bold" s={14} c={DAY.ink} numberOfLines={2} style={{ marginTop: 8 }}>{s.name}</T>
                    <T w="reg" s={11} c={DAY.inkSoft} style={{ marginTop: 4 }}>
                      {s.done ? `${s.done} of ${s.chapters} played` : `${s.chapters} chapter${s.chapters === 1 ? '' : 's'}`}
                    </T>
                  </Squeeze>
                </Appear>
              ))}
            </View>
          </ScrollView>
        )}
    </View>
  );
}

// ─── Chapters ────────────────────────────────────────────────────────────────

const MODES = [
  { key: 'board',    Icon: Users,        tint: DAY.violetSoft, color: DAY.violet, title: 'Class Game',    sub: 'Teams, a board of points and a timer — project it on the screen' },
  { key: 'missions', Icon: Rocket,       tint: DAY.amberSoft,  color: DAY.amber,  title: 'Solo Missions', sub: 'Five missions on your own — earn stars and a rank' },
  { key: 'sort',     Icon: FlaskConical, tint: DAY.greenSoft,  color: DAY.green,  title: 'Sort It Lab',   sub: 'Drop every item into the right bin — no mistakes allowed' },
];

function ChaptersView({ subject, classLevel, onPlay, onBack, refreshKey }) {
  const [state, setState] = useState({ loading: true, list: [], error: '' });
  const [choosing, setChoosing] = useState(null);   // chapter awaiting a mode
  useEffect(() => {
    let alive = true;
    getActivityChapters(subject.slug, classLevel)
      .then((list) => alive && setState({ loading: false, list: list || [], error: '' }))
      .catch((e) => alive && setState({ loading: false, list: [], error: errMsg(e, 'Could not load chapters.') }));
    return () => { alive = false; };
  }, [subject.slug, classLevel, refreshKey]);

  return (
    <View style={st.root}>
      <Header onBack={onBack} kicker={classLevel} title={subject.name} emoji={subject.emoji} sub="Choose a chapter" />
      {state.loading ? <Centered><ActivityIndicator color={DAY.violet} /></Centered>
        : state.error ? <Centered><T c={DAY.red} style={{ textAlign: 'center' }}>{state.error}</T></Centered>
        : (
          <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
            {state.list.map((c, i) => {
              const pct = c.best && c.best.total ? Math.round((c.best.score / c.best.total) * 100) : null;
              return (
                <Appear key={c.id} delay={Math.min(i, 12) * 35} y={10}>
                  <Squeeze disabled={!c.available} onPress={() => setChoosing(c)} accessibilityRole="button"
                    accessibilityLabel={`${c.name}${c.available ? '' : ', not available yet'}`}
                    style={[st.card, st.chapterRow, !c.available && st.dim]}>
                    <View style={st.chapterNum}><T w="bold" s={13} c={DAY.violet}>{c.position || '·'}</T></View>
                    <View style={{ flex: 1 }}>
                      <T w="semi" s={14} c={DAY.ink} numberOfLines={2}>{c.name}</T>
                      <T w="reg" s={11} c={DAY.inkSoft} style={{ marginTop: 2 }}>
                        {!c.available ? 'Coming soon' : pct == null ? 'Not played yet' : `Best ${c.best.score}/${c.best.total} · ${c.attempts} ${c.attempts === 1 ? 'try' : 'tries'}`}
                      </T>
                    </View>
                    {pct != null ? <Stars pct={pct} /> : c.available ? <Play size={18} color={DAY.violet} strokeWidth={2} /> : null}
                  </Squeeze>
                </Appear>
              );
            })}
          </ScrollView>
        )}

      {/* Mode chooser — a sheet over the list rather than another screen: one tap from
          the chapter to playing, and the list stays visible behind it. */}
      <Modal visible={!!choosing} transparent animationType="fade" onRequestClose={() => setChoosing(null)}>
        <Pressable style={st.overlay} onPress={() => setChoosing(null)}>
          <Pressable style={st.sheet} onPress={() => {}}>
            <Appear y={18}>
              <T w="bold" s={11} c={DAY.inkSoft} style={st.kicker}>{(choosing?.name || '').toUpperCase()}</T>
              <T w="xbold" s={18} c={DAY.ink} style={{ marginTop: 4, marginBottom: 14 }}>How do you want to play?</T>
            </Appear>
            {MODES.map((m, i) => (
              <Appear key={m.key} delay={80 + i * 70} y={12}>
                <Squeeze onPress={() => { const c = choosing; setChoosing(null); onPlay(c, m.key); }} accessibilityRole="button" style={st.modeCard}>
                  <View style={[st.modeIcon, { backgroundColor: m.tint }]}><m.Icon size={22} color={m.color} strokeWidth={2} /></View>
                  <View style={{ flex: 1 }}>
                    <T w="bold" s={15} c={DAY.ink}>{m.title}</T>
                    <T w="reg" s={12} c={DAY.inkSoft} style={{ marginTop: 2 }}>{m.sub}</T>
                  </View>
                </Squeeze>
              </Appear>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Stars({ pct }) {
  const n = pct >= 85 ? 3 : pct >= 60 ? 2 : pct >= 35 ? 1 : 0;
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[0, 1, 2].map((i) => <Star key={i} size={14} color={i < n ? DAY.heroA : DAY.cardEdge} fill={i < n ? DAY.heroA : 'transparent'} strokeWidth={2} />)}
    </View>
  );
}

// ─── Loader for a chosen chapter + mode ──────────────────────────────────────

function PlayView({ chapter, mode, onExit, onFinished }) {
  const [state, setState] = useState({ loading: true, activity: null, error: '' });
  const [run, setRun] = useState(0);   // bumping remounts the game with a fresh draw
  const load = useCallback(() => {
    setState({ loading: true, activity: null, error: '' });
    getActivity(chapter.id, mode)
      .then((a) => { setState({ loading: false, activity: a, error: '' }); setRun((r) => r + 1); })
      .catch((e) => setState({ loading: false, activity: null, error: errMsg(e, 'Could not load this activity.') }));
  }, [chapter.id, mode]);
  useEffect(load, [load]);

  if (state.loading) return <View style={st.root}><Header onBack={onExit} title={chapter.name} /><Centered><ActivityIndicator color={DAY.violet} /></Centered></View>;
  if (state.error || !state.activity || state.activity.unavailable) {
    return (
      <View style={st.root}>
        <Header onBack={onExit} title={chapter.name} />
        <Centered>
          <T c={DAY.inkSoft} style={{ textAlign: 'center', marginBottom: 14 }}>{state.error || 'This chapter does not have enough questions for this game yet.'}</T>
          <GoldBtn label="Try again" onPress={load} />
        </Centered>
      </View>
    );
  }
  const props = { key: run, activity: state.activity, onExit, onReplay: load, onFinished };
  if (mode === 'board') return <BoardGame {...props} />;
  if (mode === 'sort') return <SortLab {...props} />;
  return <Missions {...props} />;
}

// ─── Class Game (board) ──────────────────────────────────────────────────────

function BoardGame({ activity, onExit, onReplay }) {
  const { board } = activity;
  const [nTeams, setNTeams] = useState(3);
  const [names, setNames] = useState(TEAM_NAMES);
  const [teams, setTeams] = useState(null);     // [{ name, pts }] once started
  const [turn, setTurn] = useState(0);
  const [done, setDone] = useState({});         // "col-row" → 'right' | 'wrong'
  const [open, setOpen] = useState(null);       // { col, row }
  const [revealed, setRevealed] = useState(false);
  const timer = useRef(new Animated.Value(1)).current;
  const modalIn = useRef(new Animated.Value(0)).current;
  const [secs, setSecs] = useState(TIMER_SEC);
  const tick = useRef(null);

  const cols = board.cats.length;
  const rows = Math.max(...board.tiles.map((c) => c.length));
  const tileW = (W - PAD * 2 - 6 * (cols - 1)) / cols;
  const totalTiles = board.tiles.reduce((n, c) => n + c.length, 0);
  const finished = teams && Object.keys(done).length >= totalTiles;

  const stopTimer = useCallback(() => { if (tick.current) { clearInterval(tick.current); tick.current = null; } timer.stopAnimation(); }, [timer]);
  const startTimer = useCallback(() => {
    stopTimer();
    setSecs(TIMER_SEC);
    timer.setValue(1);
    Animated.timing(timer, { toValue: 0, duration: TIMER_SEC * 1000, easing: Easing.linear, useNativeDriver: false }).start();
    tick.current = setInterval(() => setSecs((s) => { if (s <= 1) { clearInterval(tick.current); tick.current = null; return 0; } return s - 1; }), 1000);
  }, [timer, stopTimer]);
  useEffect(() => stopTimer, [stopTimer]);
  useEffect(() => {
    if (!open) return;
    modalIn.setValue(0);
    Animated.spring(modalIn, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 7 }).start();
  }, [open, modalIn]);

  const start = () => {
    Keyboard.dismiss();
    setTeams(Array.from({ length: nTeams }, (_, i) => ({ name: (names[i] || '').trim() || `Team ${i + 1}`, pts: 0 })));
    setTurn(0); setDone({});
  };
  const openTile = (col, row) => {
    if (done[`${col}-${row}`]) return;
    setOpen({ col, row }); setRevealed(false); startTimer();
  };
  const close = (gotIt) => {
    stopTimer();
    const t = board.tiles[open.col][open.row];
    if (gotIt) setTeams((ts) => ts.map((x, i) => (i === turn ? { ...x, pts: x.pts + t.p } : x)));
    setDone((d) => ({ ...d, [`${open.col}-${open.row}`]: gotIt ? 'right' : 'wrong' }));
    setTurn((i) => (i + 1) % teams.length);
    setOpen(null);
  };

  const tile = open ? board.tiles[open.col][open.row] : null;
  const winners = useMemo(() => {
    if (!finished) return [];
    const max = Math.max(...teams.map((t) => t.pts));
    return teams.filter((t) => t.pts === max).map((t) => t.name);
  }, [finished, teams]);

  // ── setup ──
  if (!teams) {
    return (
      <View style={st.root}>
        <Header onBack={onExit} kicker={activity.kicker} title={activity.title} emoji={activity.source === 'curated' ? '' : activity.emoji}
          sub={activity.sub || 'A team game for the whole class — project this on the screen!'} />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Appear delay={80}>
              <Card style={{ alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Users size={20} color={DAY.violet} strokeWidth={2} />
                  <T w="xbold" s={18} c={DAY.violet}>Set Up Your Teams</T>
                </View>
                <T w="med" s={14} c={DAY.ink} style={{ marginTop: 16 }}>How many teams?</T>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  {[2, 3, 4].map((n) => (
                    <Squeeze key={n} onPress={() => setNTeams(n)} accessibilityRole="button" accessibilityLabel={`${n} teams`} style={[st.pill, nTeams === n && st.pillOn]}>
                      <T w="bold" s={17} c={DAY.ink}>{n}</T>
                    </Squeeze>
                  ))}
                </View>
                <View style={{ alignSelf: 'stretch', gap: 8, marginTop: 16 }}>
                  {Array.from({ length: nTeams }, (_, i) => (
                    <Appear key={i} delay={i * 50} y={8}>
                      <TextInput value={names[i]} onChangeText={(v) => setNames((ns) => { const c = ns.slice(); c[i] = v; return c; })}
                        placeholder={`Team ${i + 1} name`} placeholderTextColor={DAY.inkDim}
                        style={[st.input, { fontFamily: F.med, borderLeftColor: TEAM_COLORS[i], borderLeftWidth: 4 }]}
                        accessibilityLabel={`Team ${i + 1} name`} returnKeyType="done" />
                    </Appear>
                  ))}
                </View>
                <GoldBtn label="Start the Challenge!" icon={<Rocket size={18} color={DAY.ctaFg} strokeWidth={2.2} />} onPress={start} style={{ marginTop: 18 }} />
                <View style={{ alignSelf: 'stretch', marginTop: 18, gap: 6 }}>
                  {[
                    '🎯 Teams take turns picking a tile from the board.',
                    `⏱️ The team gets ${TIMER_SEC} seconds to discuss and answer aloud.`,
                    '👩‍🏫 Teacher taps Reveal Answer, then marks Correct (points) or Wrong (no points).',
                    '🏆 When all tiles are done — the top team wins!',
                  ].map((r) => <T key={r} w="reg" s={13} c={DAY.inkSoft} style={{ lineHeight: 19 }}>{r}</T>)}
                </View>
              </Card>
            </Appear>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ── game ──
  return (
    <View style={st.root}>
      <Header onBack={onExit} kicker={activity.kicker} title={activity.title} emoji={activity.source === 'curated' ? '' : activity.emoji} />
      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        {/* Scoreboard — tapping a team hands it the turn, for when the teacher wants to
            skip a team or correct a mistake. */}
        <View style={st.scores}>
          {teams.map((t, i) => (
            <Appear key={i} delay={i * 60} style={st.teamCell}>
              <Breathe active={i === turn && !finished}>
                <Squeeze onPress={() => setTurn(i)} accessibilityRole="button" accessibilityLabel={`${t.name}, ${t.pts} points${i === turn ? ', choosing now' : ''}`}
                  style={[st.team, { borderColor: i === turn ? DAY.heroA : TEAM_COLORS[i] }, i === turn && st.teamTurn]}>
                  <T w="bold" s={12} c={TEAM_COLORS[i]} numberOfLines={1}>{t.name}</T>
                  <Pop value={t.pts}><T w="xbold" s={22} c={DAY.ink}>{t.pts}</T></Pop>
                </Squeeze>
              </Breathe>
            </Appear>
          ))}
        </View>
        {!finished && (
          <T w="reg" s={13} c={DAY.inkSoft} style={{ textAlign: 'center', marginBottom: 12 }}>
            Now choosing: <T w="bold" s={13} c={DAY.amber}>{teams[turn].name}</T> — tap any tile!
          </T>
        )}

        {/* Board */}
        <Appear delay={120} y={10}>
          <View style={st.boardRow}>
            {board.cats.map((c, i) => (
              <View key={i} style={[st.cat, { width: tileW }]}><T w="bold" s={10} c={DAY.violet} numberOfLines={2} style={{ textAlign: 'center' }}>{c}</T></View>
            ))}
          </View>
        </Appear>
        {Array.from({ length: rows }, (_, r) => (
          <Appear key={r} delay={180 + r * 60} y={10}>
            <View style={st.boardRow}>
              {board.tiles.map((col, c) => {
                const t = col[r];
                const state = done[`${c}-${r}`];
                if (!t) return <View key={c} style={{ width: tileW }} />;
                return (
                  <Pop key={c} value={state || ''} amount={0.85}>
                    <Squeeze onPress={() => openTile(c, r)} disabled={!!state} accessibilityRole="button" to={0.92}
                      accessibilityLabel={`${board.cats[c]}, ${t.p} points${state ? ', done' : ''}`}
                      style={[st.tile, { width: tileW }, state && st.tileDone]}>
                      {state === 'right' ? <Check size={22} color={DAY.green} strokeWidth={3} />
                        : state === 'wrong' ? <X size={22} color={DAY.inkDim} strokeWidth={3} />
                        : <T w="xbold" s={20} c={DAY.amber}>{t.p}</T>}
                    </Squeeze>
                  </Pop>
                );
              })}
            </View>
          </Appear>
        ))}

        {finished && (
          <Appear delay={100} y={20}>
            <Card style={[st.winner, { marginTop: 18 }]}>
              <Trophy size={40} color={DAY.heroA} strokeWidth={2} />
              <T s={22} style={{ marginTop: 6, letterSpacing: 4 }}>🎉 🎊 🎉</T>
              <T w="xbold" s={20} c={DAY.ink} style={{ marginTop: 8, textAlign: 'center' }}>
                {winners.length > 1 ? `It's a tie: ${winners.join(' & ')}!` : `${winners[0]} wins!`}
              </T>
              <T w="reg" s={13} c={DAY.inkSoft} style={{ marginTop: 6, textAlign: 'center' }}>
                {teams.map((t) => `${t.name} — ${t.pts}`).join('  ·  ')}
              </T>
              <GoldBtn label="Play Again" icon={<RotateCcw size={18} color={DAY.ctaFg} strokeWidth={2.2} />} onPress={onReplay} style={{ marginTop: 16 }} />
            </Card>
          </Appear>
        )}
      </ScrollView>
      <Confetti show={!!finished} />

      {/* Question */}
      <Modal visible={!!open} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={st.overlay}>
          <Animated.View style={[st.modal, { opacity: modalIn, transform: [{ scale: modalIn.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }]}>
            {tile && (
              <>
                <T w="bold" s={11} c={DAY.violet} style={st.kicker}>{board.cats[open.col].toUpperCase()}</T>
                <T w="xbold" s={16} c={DAY.amber} style={{ marginTop: 2 }}>{tile.p} points — {teams[turn].name}</T>
                <View style={st.timerTrack}>
                  <Animated.View style={[st.timerFill, { width: timer.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), backgroundColor: secs > 10 ? DAY.green : secs > 5 ? DAY.heroA : DAY.red }]} />
                </View>
                <T w="reg" s={11} c={DAY.inkDim} style={{ marginTop: 4 }}>{secs > 0 ? `${secs}s` : "Time's up!"}</T>
                <T w="bold" s={18} c={DAY.ink} style={{ marginTop: 12, textAlign: 'center', lineHeight: 26 }}>{tile.q}</T>
                {/* Assembled tiles come from MCQs, so the choices are shown as hints for
                    the team to answer aloud; curated tiles are open questions. */}
                {!!tile.o && (
                  <View style={st.hintRow}>
                    {tile.o.map((o, i) => <Appear key={i} delay={120 + i * 50} y={6}><View style={st.hint}><T w="med" s={12} c={DAY.inkSoft}>{o}</T></View></Appear>)}
                  </View>
                )}
                {revealed && (
                  <Appear y={10} style={st.answer}>
                    <T w="bold" s={15} c={DAY.green} style={{ textAlign: 'center' }}>{tile.a}</T>
                    {!!tile.x && <T w="reg" s={12} c={DAY.inkSoft} style={{ textAlign: 'center', marginTop: 4 }}>{tile.x}</T>}
                  </Appear>
                )}
                <View style={st.modalBtns}>
                  {!revealed ? (
                    <Squeeze onPress={() => { stopTimer(); setRevealed(true); }} accessibilityRole="button" style={[st.mBtn, { backgroundColor: DAY.violet }]}>
                      <Eye size={18} color="#fff" strokeWidth={2.2} /><T w="bold" s={14} c="#fff">Reveal Answer</T>
                    </Squeeze>
                  ) : (
                    <>
                      <Squeeze onPress={() => close(true)} accessibilityRole="button" style={[st.mBtn, { backgroundColor: DAY.green }]}>
                        <Check size={18} color="#fff" strokeWidth={2.5} /><T w="bold" s={14} c="#fff">Correct! (+{tile.p})</T>
                      </Squeeze>
                      <Squeeze onPress={() => close(false)} accessibilityRole="button" style={[st.mBtn, { backgroundColor: DAY.red }]}>
                        <X size={18} color="#fff" strokeWidth={2.5} /><T w="bold" s={14} c="#fff">Wrong</T>
                      </Squeeze>
                    </>
                  )}
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Solo Missions ───────────────────────────────────────────────────────────

const CHEERS = ['Stellar! 🌟', 'Brilliant! ✨', 'Nailed it! 🎯', 'You rock! 🚀', 'Cosmic! 💫'];
const OOPS = ['Not quite — keep going! 🪐', 'Close! 🌙', 'Tricky one! ☄️'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

function rankFor(score, total) {
  const pct = total ? score / total : 0;
  if (pct >= 0.85) return { emoji: '🏆', label: 'Champion', msg: 'the whole chapter salutes you!' };
  if (pct >= 0.6) return { emoji: '🚀', label: 'Captain', msg: 'excellent work!' };
  if (pct >= 0.35) return { emoji: '🛰️', label: 'Explorer', msg: "one more go and you'll ace it!" };
  return { emoji: '🌱', label: 'Beginner', msg: 're-read the chapter and try again!' };
}

function Feedback({ fb }) {
  if (!fb) return <View style={{ minHeight: 18 }} />;
  return <Appear y={4}><T w="med" s={12} c={fb.ok ? DAY.green : DAY.red} style={{ marginTop: 8, lineHeight: 17 }}>{fb.text}</T></Appear>;
}

function ChoiceItem({ item, onAnswer }) {
  const [picked, setPicked] = useState(null);
  const [fb, setFb] = useState(null);
  const [shakeStyle, shake] = useShake();
  const choose = (i) => {
    if (picked != null) return;
    setPicked(i);
    const ok = i === item.a;
    if (!ok) shake();
    setFb({ ok, text: `${ok ? pick(CHEERS) : pick(OOPS)}${item.x ? ' ' + item.x : ''}` });
    onAnswer(ok);
  };
  return (
    <View style={st.q}>
      <T w="semi" s={14} c={DAY.ink} style={{ lineHeight: 20 }}>{item.q}</T>
      <Animated.View style={[st.opts, shakeStyle]}>
        {item.o.map((o, i) => {
          const isCorrect = picked != null && i === item.a;
          const isWrong = picked === i && i !== item.a;
          return (
            <Pop key={i} value={isCorrect ? 'y' : 'n'} amount={1.12}>
              <Squeeze onPress={() => choose(i)} disabled={picked != null} accessibilityRole="button" accessibilityLabel={o}
                style={[st.opt, isCorrect && st.optRight, isWrong && st.optWrong]}>
                <T w="med" s={13} c={isCorrect ? DAY.green : isWrong ? DAY.red : DAY.ink}>{o}</T>
              </Squeeze>
            </Pop>
          );
        })}
      </Animated.View>
      <Feedback fb={fb} />
    </View>
  );
}

function TFItem({ item, onAnswer }) {
  return <ChoiceItem item={{ q: item.q, o: ['✅ True', '❌ False'], a: item.a ? 0 : 1, x: item.x }} onAnswer={onAnswer} />;
}

function TypeInItem({ item, onAnswer }) {
  const [v, setV] = useState('');
  const [fb, setFb] = useState(null);
  const [locked, setLocked] = useState(false);
  const [shakeStyle, shake] = useShake();
  const check = () => {
    const s = v.trim().toLowerCase();
    if (!s) { shake(); setFb({ ok: false, text: 'Type something first! 👩‍🚀' }); return; }
    setLocked(true);
    const ok = item.a.some((x) => s.includes(x.toLowerCase()));
    if (!ok) shake();
    setFb({ ok, text: ok ? pick(CHEERS) : `${pick(OOPS)} Answer: ${item.show || item.a[0]}` });
    onAnswer(ok);
  };
  return (
    <View style={st.q}>
      <T w="semi" s={14} c={DAY.ink} style={{ lineHeight: 20 }}>{item.q}</T>
      <Animated.View style={[{ flexDirection: 'row', gap: 8, marginTop: 10 }, shakeStyle]}>
        <TextInput value={v} onChangeText={setV} editable={!locked} placeholder="Type your answer…" placeholderTextColor={DAY.inkDim}
          style={[st.input, { flex: 1, fontFamily: F.med }, locked && (fb?.ok ? st.optRight : st.optWrong)]}
          autoCapitalize="none" autoCorrect={false} returnKeyType="done" onSubmitEditing={check} accessibilityLabel="Your answer" />
        <Squeeze onPress={check} disabled={locked} accessibilityRole="button" accessibilityLabel="Check" style={[st.checkBtn, locked && st.dim]}>
          <T w="bold" s={14} c="#fff">Check</T>
        </Squeeze>
      </Animated.View>
      <Feedback fb={fb} />
    </View>
  );
}

function Missions({ activity, onExit, onReplay, onFinished }) {
  const { missions, total } = activity;
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [saved, setSaved] = useState(null);
  const scrollRef = useRef(null);
  const finished = answered >= total && total > 0;
  const rank = rankFor(score, total);

  const onAnswer = (ok) => { if (ok) setScore((s) => s + 1); setAnswered((n) => n + 1); };

  useEffect(() => {
    if (!finished) return;
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
    submitActivityResult(activity.chapterId, { score, total })
      .then((r) => { setSaved(r); onFinished?.(); })
      .catch((e) => reportWarn('screens/ActivitiesScreen.js:Missions', e, { chapterId: activity.chapterId, fallback: 'score shown, not saved' }));
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={st.root}>
      <Header onBack={onExit} kicker={activity.kicker} title={activity.title} emoji={activity.source === 'curated' ? '' : activity.emoji}
        sub={activity.sub || `Complete all ${missions.length} missions. Every correct answer earns ⭐`} />
      {/* HUD — sticky, so the score and rank stay in view while scrolling missions. */}
      <Appear delay={60} y={-8}>
        <View style={st.hud}>
          <Pop value={score}><T w="bold" s={14} c={DAY.amber}>⭐ {score}/{total}</T></Pop>
          <Bar pct={total ? (score / total) * 100 : 0} style={{ flex: 1 }} />
          <Pop value={rankFor(score, total).emoji} amount={1.4}><T s={20}>{rankFor(score, total).emoji}</T></Pop>
        </View>
      </Appear>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {missions.map((m, mi) => (
            <Appear key={mi} delay={120 + mi * 90}>
              <Card style={{ marginBottom: 14 }}>
                <T w="xbold" s={15} c={DAY.violet}>{m.title}</T>
                {!!m.note && <T w="reg" s={12} c={DAY.inkSoft} style={{ marginTop: 2, marginBottom: 10 }}>{m.note}</T>}
                {m.type === 'task' ? (
                  <View style={st.taskBox}>
                    {m.steps.map((s, i) => <T key={i} w="reg" s={13} c={DAY.ink} style={{ lineHeight: 20, marginBottom: 4 }}>{i === 0 ? s : `${i}️⃣ ${s}`}</T>)}
                  </View>
                ) : m.items.map((it, ii) => (
                  m.type === 'tf' ? <TFItem key={ii} item={it} onAnswer={onAnswer} />
                  : m.type === 'typein' ? <TypeInItem key={ii} item={it} onAnswer={onAnswer} />
                  : <ChoiceItem key={ii} item={it} onAnswer={onAnswer} />
                ))}
              </Card>
            </Appear>
          ))}

          <Card style={[st.winner, { borderColor: DAY.heroA, borderWidth: 2 }]}>
            <T w="xbold" s={16} c={DAY.amber}>Mission Report</T>
            <Pop value={finished ? 'done' : 'wait'} amount={1.5}><T s={40} style={{ marginTop: 4 }}>{finished ? rank.emoji : '🛰️'}</T></Pop>
            {finished ? (
              <Appear y={10} style={{ alignItems: 'center', alignSelf: 'stretch' }}>
                <T w="xbold" s={18} c={DAY.ink} style={{ textAlign: 'center' }}>{rank.label.toUpperCase()}! {score}/{total}</T>
                <T w="reg" s={13} c={DAY.inkSoft} style={{ textAlign: 'center', marginTop: 4 }}>{rank.msg}</T>
                {!!saved && <T w="med" s={12} c={DAY.green} style={{ marginTop: 8 }}>Saved · best {saved.best_score}/{saved.best_total}</T>}
                <GoldBtn label="Play Again" icon={<RotateCcw size={18} color={DAY.ctaFg} strokeWidth={2.2} />} onPress={onReplay} style={{ marginTop: 16 }} />
              </Appear>
            ) : (
              <T w="reg" s={13} c={DAY.inkSoft} style={{ textAlign: 'center' }}>Answer all {total} questions to see your rank!</T>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
      <Confetti show={finished} />
    </View>
  );
}

// ─── Sort It Lab ─────────────────────────────────────────────────────────────

const BIN_STYLE = {
  A: { edge: DAY.blue, tint: DAY.blueSoft, ink: DAY.blue },
  B: { edge: DAY.amber, tint: DAY.amberSoft, ink: DAY.amber },
};

// One chip. It cannot actually be dragged (tap-tap is the phone interaction), but it
// lifts when picked and shakes when refused.
// Long labels (fact-check pairs) become full-width cards; short ones stay pills.
function Chip({ label, picked, locked, onPress, shakeKey }) {
  const wide = label.length > 48;
  const [shakeStyle, shake] = useShake();
  const lift = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(lift, { toValue: picked ? 1 : 0, useNativeDriver: true, speed: 30, bounciness: 10 }).start(); }, [picked, lift]);
  useEffect(() => { if (shakeKey) shake(); }, [shakeKey, shake]);
  return (
    <Animated.View style={[wide && st.chipWideWrap, { transform: [...shakeStyle.transform, { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }, { translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }] }]}>
      <Squeeze onPress={onPress} disabled={locked} accessibilityRole="button" accessibilityLabel={label}
        style={[st.chip, wide && st.chipWide, picked && st.chipPicked, locked && st.chipLocked]}>
        <T w="semi" s={13} c={locked ? DAY.green : DAY.ink}>{label}</T>
      </Squeeze>
    </Animated.View>
  );
}

function SortRound({ round, index, onPlace, onMistake }) {
  // Items keep their shuffled order for the life of the round.
  const items = useMemo(() => round.items.map((it, i) => ({ id: i, label: it[0], bin: it[1] })).sort(() => Math.random() - 0.5), [round]);
  const [placed, setPlaced] = useState({});     // id → 'A' | 'B'
  const [picked, setPicked] = useState(null);   // id
  const [shakes, setShakes] = useState({});     // id → counter, bumps to trigger a shake
  const [wrongTried, setWrongTried] = useState({});
  const remaining = items.filter((it) => placed[it.id] == null);
  const complete = remaining.length === 0;

  const drop = (bin) => {
    if (picked == null) return;
    const it = items.find((x) => x.id === picked);
    if (it.bin === bin) {
      setPlaced((p) => ({ ...p, [it.id]: bin }));
      setPicked(null);
      onPlace(!wrongTried[it.id]);
    } else {
      setShakes((s) => ({ ...s, [it.id]: (s[it.id] || 0) + 1 }));
      setWrongTried((w) => ({ ...w, [it.id]: true }));
      onMistake();
    }
  };

  return (
    <Appear delay={120 + index * 90}>
      <Card style={{ marginBottom: 14 }}>
        <T w="xbold" s={15} c={DAY.violet}>{round.title}</T>
        {!!round.note && <T w="reg" s={12} c={DAY.inkSoft} style={{ marginTop: 2, marginBottom: 10 }}>{round.note}</T>}

        {/* Pool */}
        <View style={[st.pool, complete && st.poolEmpty]}>
          {remaining.length === 0
            ? <T w="med" s={12} c={DAY.inkDim}>All sorted</T>
            : remaining.map((it) => (
              <Chip key={it.id} label={it.label} picked={picked === it.id} shakeKey={shakes[it.id]}
                onPress={() => setPicked((p) => (p === it.id ? null : it.id))} />
            ))}
        </View>

        {/* Bins */}
        <View style={st.bins}>
          {['A', 'B'].map((bin) => {
            const c = BIN_STYLE[bin];
            const inBin = items.filter((it) => placed[it.id] === bin);
            return (
              <Squeeze key={bin} onPress={() => drop(bin)} disabled={picked == null} to={0.97} accessibilityRole="button"
                accessibilityLabel={`${bin === 'A' ? round.binA : round.binB}${picked != null ? ', drop here' : ''}`}
                style={[st.bin, { borderColor: c.edge, backgroundColor: c.tint }, picked != null && st.binHot]}>
                <T w="bold" s={12} c={c.ink} style={{ textAlign: 'center' }} numberOfLines={2}>{bin === 'A' ? round.binA : round.binB}</T>
                <View style={st.binDrop}>
                  {inBin.map((it) => (
                    <Appear key={it.id} y={-8}><Chip label={it.label} locked /></Appear>
                  ))}
                </View>
              </Squeeze>
            );
          })}
        </View>
        {complete && <Appear y={6}><T w="bold" s={13} c={DAY.green} style={{ marginTop: 10 }}>✅ Round complete — great sorting!</T></Appear>}
      </Card>
    </Appear>
  );
}

function SortLab({ activity, onExit, onReplay, onFinished }) {
  const { sort, total } = activity;
  const [done, setDone] = useState(0);        // items placed
  const [firstTry, setFirstTry] = useState(0); // placed with no wrong attempt — the saved score
  const [mistakes, setMistakes] = useState(0);
  const [saved, setSaved] = useState(null);
  const scrollRef = useRef(null);
  const finished = done >= total && total > 0;
  const mood = finished ? '🏅' : done >= total * 0.66 ? '🔬' : done >= total * 0.33 ? '⚗️' : '🥼';

  useEffect(() => {
    if (!finished) return;
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
    submitActivityResult(activity.chapterId, { score: firstTry, total })
      .then((r) => { setSaved(r); onFinished?.(); })
      .catch((e) => reportWarn('screens/ActivitiesScreen.js:SortLab', e, { chapterId: activity.chapterId, fallback: 'score shown, not saved' }));
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={st.root}>
      <Header onBack={onExit} kicker={activity.kicker} title={activity.title} emoji={activity.source === 'curated' ? '🧪' : activity.emoji}
        sub={activity.sub || 'Every item is in the wrong place — sort them all into the correct bins!'} />
      <Appear delay={60} y={-8}>
        <View style={st.hud}>
          <Pop value={done}><T w="bold" s={14} c={DAY.amber}>Sorted {done}/{total}</T></Pop>
          <Bar pct={total ? (done / total) * 100 : 0} color={DAY.green} style={{ flex: 1 }} />
          <Pop value={mood} amount={1.4}><T s={20}>{mood}</T></Pop>
        </View>
      </Appear>
      <T w="reg" s={12} c={DAY.inkSoft} style={{ textAlign: 'center', marginBottom: 8, paddingHorizontal: PAD }}>
        💡 <T w="bold" s={12} c={DAY.ink}>Tap</T> an item, then <T w="bold" s={12} c={DAY.ink}>tap a bin</T>. Wrong bin = it bounces back!
      </T>
      <ScrollView ref={scrollRef} contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        {sort.rounds.map((r, i) => (
          <SortRound key={i} round={r} index={i}
            onPlace={(clean) => { setDone((d) => d + 1); if (clean) setFirstTry((f) => f + 1); }}
            onMistake={() => setMistakes((m) => m + 1)} />
        ))}

        <Card style={[st.winner, { borderColor: DAY.green, borderWidth: 2 }]}>
          <Pop value={finished ? 'done' : 'wait'} amount={1.5}><T s={40}>{finished ? '🧑‍🔬🏅' : '🧪'}</T></Pop>
          {finished ? (
            <Appear y={10} style={{ alignItems: 'center', alignSelf: 'stretch' }}>
              <T w="xbold" s={18} c={DAY.green} style={{ textAlign: 'center' }}>Lab Certified!</T>
              <T w="reg" s={13} c={DAY.inkSoft} style={{ textAlign: 'center', marginTop: 4 }}>
                All {total} items sorted. {firstTry} went in first time{mistakes ? ` · ${mistakes} bounce${mistakes === 1 ? '' : 's'}` : ' — flawless!'}
              </T>
              {!!saved && <T w="med" s={12} c={DAY.green} style={{ marginTop: 8 }}>Saved · best {saved.best_score}/{saved.best_total}</T>}
              <GoldBtn label="Sort Again" icon={<RotateCcw size={18} color={DAY.ctaFg} strokeWidth={2.2} />} onPress={onReplay} style={{ marginTop: 16 }} />
            </Appear>
          ) : (
            <T w="reg" s={13} c={DAY.inkSoft} style={{ textAlign: 'center' }}>Sort all {total} items to get certified!</T>
          )}
        </Card>
      </ScrollView>
      <Confetti show={finished} />
    </View>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────

const ActivitiesScreen = ({ onBack }) => {
  const { selectedClass } = useAuth();
  const [subject, setSubject] = useState(null);
  const [play, setPlay] = useState(null);     // { chapter, mode }
  const [refreshKey, setRefreshKey] = useState(0);

  // Each view is keyed so a change fades the new one in rather than swapping in place.
  let body;
  if (play) body = <Appear key={`play-${play.chapter.id}-${play.mode}`} y={16} style={{ flex: 1 }}><PlayView chapter={play.chapter} mode={play.mode} onExit={() => setPlay(null)} onFinished={() => setRefreshKey((k) => k + 1)} /></Appear>;
  else if (subject) body = <Appear key={`ch-${subject.slug}`} y={16} style={{ flex: 1 }}><ChaptersView subject={subject} classLevel={selectedClass} refreshKey={refreshKey} onPlay={(chapter, mode) => setPlay({ chapter, mode })} onBack={() => setSubject(null)} /></Appear>;
  else body = <Appear key="subjects" y={16} style={{ flex: 1 }}><SubjectsView classLevel={selectedClass} onPick={setSubject} onBack={onBack} /></Appear>;

  return (
    <View style={st.root}>
      <StatusBar barStyle="dark-content" backgroundColor={DAY.bgTop} translucent={false} />
      {body}
    </View>
  );
};

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: DAY.bg },
  scroll: { paddingHorizontal: PAD, paddingBottom: 100, paddingTop: 4 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dim: { opacity: 0.55 },

  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: PAD, paddingBottom: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: DAY.cardSoft, borderWidth: 1, borderColor: DAY.cardEdge },
  headerText: { flex: 1, paddingTop: 4 },
  kicker: { letterSpacing: 1.2 },

  card: {
    backgroundColor: DAY.card, borderRadius: 18, borderWidth: 1, borderColor: DAY.cardEdge, padding: 16,
    shadowColor: DAY.shadow, shadowOpacity: DAY.shadowOpacity, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  subjectCell: { width: (W - PAD * 2 - 12) / 2 },
  subjectCard: { minHeight: 120 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, marginBottom: 10 },
  chapterNum: { width: 34, height: 34, borderRadius: 17, backgroundColor: DAY.violetSoft, alignItems: 'center', justifyContent: 'center' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  sheet: { width: '100%', backgroundColor: DAY.card, borderRadius: 20, padding: 18 },
  modeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: DAY.cardEdge, marginBottom: 10, backgroundColor: DAY.card },
  modeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  gold: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: DAY.ctaBg, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 24, alignSelf: 'stretch' },
  pill: { minWidth: 62, paddingVertical: 12, borderRadius: 12, backgroundColor: DAY.cardSoft, borderWidth: 2, borderColor: DAY.cardEdge, alignItems: 'center' },
  pillOn: { borderColor: DAY.heroA, backgroundColor: DAY.amberSoft },
  input: { backgroundColor: DAY.cardSoft, borderWidth: 1.5, borderColor: DAY.cardEdge, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, fontSize: 15, color: DAY.ink },

  scores: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 10 },
  teamCell: { minWidth: (W - PAD * 2 - 8 * 3) / 4, flexGrow: 1 },
  team: { alignItems: 'center', backgroundColor: DAY.card, borderWidth: 2, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 8 },
  teamTurn: { shadowColor: DAY.heroA, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  boardRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  cat: { minHeight: 44, borderRadius: 10, backgroundColor: DAY.violetSoft, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, paddingVertical: 6 },
  tile: { height: 60, borderRadius: 12, backgroundColor: DAY.cardSoft, borderWidth: 1, borderColor: DAY.cardEdge, alignItems: 'center', justifyContent: 'center' },
  tileDone: { backgroundColor: DAY.bg, borderStyle: 'dashed' },
  winner: { alignItems: 'center', paddingVertical: 22 },

  modal: { width: '100%', maxWidth: 560, backgroundColor: DAY.card, borderRadius: 20, borderWidth: 2, borderColor: DAY.violet, padding: 20, alignItems: 'center' },
  timerTrack: { alignSelf: 'stretch', height: 8, borderRadius: 6, backgroundColor: DAY.track, overflow: 'hidden', marginTop: 12 },
  timerFill: { height: '100%', borderRadius: 6 },
  hintRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 12 },
  hint: { backgroundColor: DAY.cardSoft, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: DAY.cardEdge },
  answer: { alignSelf: 'stretch', backgroundColor: DAY.greenSoft, borderWidth: 1.5, borderStyle: 'dashed', borderColor: DAY.green, borderRadius: 12, padding: 12, marginTop: 14 },
  modalBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16 },
  mBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingVertical: 11, paddingHorizontal: 18 },

  hud: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: PAD, marginBottom: 10, backgroundColor: DAY.card, borderWidth: 1, borderColor: DAY.cardEdge, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 14 },
  q: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: DAY.divider },
  opts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  opt: { backgroundColor: DAY.cardSoft, borderWidth: 1.5, borderColor: DAY.cardEdge, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  optRight: { backgroundColor: DAY.greenSoft, borderColor: DAY.green },
  optWrong: { backgroundColor: DAY.redSoft, borderColor: DAY.red },
  checkBtn: { backgroundColor: DAY.violet, borderRadius: 12, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  taskBox: { backgroundColor: DAY.bannerBg, borderLeftWidth: 4, borderLeftColor: DAY.violet, borderRadius: 10, padding: 12 },

  pool: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, minHeight: 56, backgroundColor: DAY.cardSoft, borderWidth: 1.5, borderStyle: 'dashed', borderColor: DAY.cardEdge, borderRadius: 12, padding: 10, marginBottom: 12, alignItems: 'center' },
  poolEmpty: { justifyContent: 'center' },
  chip: { backgroundColor: DAY.card, borderWidth: 1.5, borderColor: DAY.cardEdge, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 13 },
  chipPicked: { borderColor: DAY.heroA, backgroundColor: DAY.amberSoft, shadowColor: DAY.heroA, shadowOpacity: 0.45, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  chipLocked: { backgroundColor: DAY.greenSoft, borderColor: DAY.green },
  chipWideWrap: { alignSelf: 'stretch', width: '100%' },
  chipWide: { borderRadius: 12, paddingVertical: 9 },
  bins: { flexDirection: 'row', gap: 10 },
  bin: { flex: 1, minHeight: 112, borderRadius: 14, borderWidth: 2, padding: 10 },
  binHot: { shadowColor: DAY.ink, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  binDrop: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, minHeight: 40 },
});

export default ActivitiesScreen;
