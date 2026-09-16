// src/screens/ActivitiesScreen.js
// Chapter activities: pick a subject → a chapter → play it one of two ways.
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
// Opens full-screen from Home the way the AI Teacher does — inside the tab, no route —
// and navigates internally with state like PracticeScreen, so it inherits the dock's
// paid gate without any wiring of its own.
//
// Colours are the app's day theme (white ground, gold CTA, violet accent), not the
// dark projector palette of the reference mock-ups: a classroom screen is bright, and
// the app should not switch identity for one feature.
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, StatusBar, ScrollView, Modal,
  ActivityIndicator, Dimensions, Animated, Easing, Keyboard, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Users, Rocket, Trophy, Eye, Check, X, RotateCcw, Play, Star } from 'lucide-react-native';

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

// ─── Chrome ──────────────────────────────────────────────────────────────────

function Header({ onBack, kicker, title, sub, emoji }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[st.header, { paddingTop: insets.top + 8 }]}>
      <Pressable onPress={onBack} hitSlop={12} style={st.backBtn} accessibilityRole="button" accessibilityLabel="Back">
        <ChevronLeft size={22} color={DAY.inkSoft} />
      </Pressable>
      <View style={st.headerText}>
        {!!kicker && <T w="bold" s={10} c={DAY.inkSoft} style={st.kicker}>{kicker.toUpperCase()}</T>}
        <T w="xbold" s={20} c={DAY.ink} style={{ marginTop: 2 }} numberOfLines={2}>{emoji ? `${emoji} ` : ''}{title}</T>
        {!!sub && <T w="reg" s={13} c={DAY.inkSoft} style={{ marginTop: 3 }}>{sub}</T>}
      </View>
    </View>
  );
}

function Card({ style, children }) {
  return <View style={[st.card, style]}>{children}</View>;
}

function GoldBtn({ label, icon, onPress, disabled, style }) {
  return (
    <Pressable
      onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => [st.gold, pressed && st.pressed, disabled && st.dim, style]}
    >
      {icon}
      <T w="bold" s={16} c={DAY.ctaFg}>{label}</T>
    </Pressable>
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
        : state.error ? <Centered><T c={DAY.red}>{state.error}</T></Centered>
        : !state.list.length ? <Centered><T c={DAY.inkSoft} style={{ textAlign: 'center' }}>No activities for this class yet.</T></Centered>
        : (
          <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
            <View style={st.grid}>
              {state.list.map((s) => (
                <Pressable key={s.slug} onPress={() => onPick(s)} accessibilityRole="button" accessibilityLabel={s.name}
                  style={({ pressed }) => [st.card, st.subjectCard, pressed && st.pressed]}>
                  <T s={28}>{s.emoji}</T>
                  <T w="bold" s={14} c={DAY.ink} numberOfLines={2} style={{ marginTop: 8 }}>{s.name}</T>
                  <T w="reg" s={11} c={DAY.inkSoft} style={{ marginTop: 4 }}>
                    {s.done ? `${s.done} of ${s.chapters} played` : `${s.chapters} chapter${s.chapters === 1 ? '' : 's'}`}
                  </T>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
    </View>
  );
}

// ─── Chapters ────────────────────────────────────────────────────────────────

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
        : state.error ? <Centered><T c={DAY.red}>{state.error}</T></Centered>
        : (
          <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
            {state.list.map((c) => {
              const pct = c.best && c.best.total ? Math.round((c.best.score / c.best.total) * 100) : null;
              return (
                <Pressable key={c.id} disabled={!c.available} onPress={() => setChoosing(c)} accessibilityRole="button"
                  accessibilityLabel={`${c.name}${c.available ? '' : ', not available yet'}`}
                  style={({ pressed }) => [st.card, st.chapterRow, pressed && st.pressed, !c.available && st.dim]}>
                  <View style={st.chapterNum}><T w="bold" s={13} c={DAY.violet}>{c.position || '·'}</T></View>
                  <View style={{ flex: 1 }}>
                    <T w="semi" s={14} c={DAY.ink} numberOfLines={2}>{c.name}</T>
                    <T w="reg" s={11} c={DAY.inkSoft} style={{ marginTop: 2 }}>
                      {!c.available ? 'Coming soon' : pct == null ? 'Not played yet' : `Best ${c.best.score}/${c.best.total} · ${c.attempts} ${c.attempts === 1 ? 'try' : 'tries'}`}
                    </T>
                  </View>
                  {pct != null ? <Stars pct={pct} /> : c.available ? <Play size={18} color={DAY.violet} strokeWidth={2} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        )}

      {/* Mode chooser — a sheet over the list rather than another screen: one tap
          from the chapter to playing, and the list stays visible behind it. */}
      <Modal visible={!!choosing} transparent animationType="fade" onRequestClose={() => setChoosing(null)}>
        <Pressable style={st.overlay} onPress={() => setChoosing(null)}>
          <Pressable style={st.sheet} onPress={() => {}}>
            <T w="bold" s={11} c={DAY.inkSoft} style={st.kicker}>{(choosing?.name || '').toUpperCase()}</T>
            <T w="xbold" s={18} c={DAY.ink} style={{ marginTop: 4, marginBottom: 14 }}>How do you want to play?</T>
            <Pressable onPress={() => { const c = choosing; setChoosing(null); onPlay(c, 'board'); }} accessibilityRole="button"
              style={({ pressed }) => [st.modeCard, pressed && st.pressed]}>
              <View style={[st.modeIcon, { backgroundColor: DAY.violetSoft }]}><Users size={22} color={DAY.violet} strokeWidth={2} /></View>
              <View style={{ flex: 1 }}>
                <T w="bold" s={15} c={DAY.ink}>Class Game</T>
                <T w="reg" s={12} c={DAY.inkSoft} style={{ marginTop: 2 }}>Teams, a board of points and a timer — project it on the screen</T>
              </View>
            </Pressable>
            <Pressable onPress={() => { const c = choosing; setChoosing(null); onPlay(c, 'missions'); }} accessibilityRole="button"
              style={({ pressed }) => [st.modeCard, pressed && st.pressed]}>
              <View style={[st.modeIcon, { backgroundColor: DAY.amberSoft }]}><Rocket size={22} color={DAY.amber} strokeWidth={2} /></View>
              <View style={{ flex: 1 }}>
                <T w="bold" s={15} c={DAY.ink}>Solo Missions</T>
                <T w="reg" s={12} c={DAY.inkSoft} style={{ marginTop: 2 }}>Five missions on your own — earn stars and a rank</T>
              </View>
            </Pressable>
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
  const load = useCallback(() => {
    setState({ loading: true, activity: null, error: '' });
    getActivity(chapter.id, mode)
      .then((a) => setState({ loading: false, activity: a, error: '' }))
      .catch((e) => setState({ loading: false, activity: null, error: errMsg(e, 'Could not load this activity.') }));
  }, [chapter.id, mode]);
  useEffect(load, [load]);

  if (state.loading) return <View style={st.root}><Header onBack={onExit} title={chapter.name} /><Centered><ActivityIndicator color={DAY.violet} /></Centered></View>;
  if (state.error || !state.activity || state.activity.unavailable) {
    return (
      <View style={st.root}>
        <Header onBack={onExit} title={chapter.name} />
        <Centered>
          <T c={DAY.inkSoft} style={{ textAlign: 'center', marginBottom: 14 }}>{state.error || 'This chapter does not have enough questions for an activity yet.'}</T>
          <GoldBtn label="Try again" onPress={load} />
        </Centered>
      </View>
    );
  }
  return mode === 'board'
    ? <BoardGame activity={state.activity} onExit={onExit} onReplay={load} />
    : <Missions activity={state.activity} onExit={onExit} onReplay={load} onFinished={onFinished} />;
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
            <Card style={{ alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Users size={20} color={DAY.violet} strokeWidth={2} />
                <T w="xbold" s={18} c={DAY.violet}>Set Up Your Teams</T>
              </View>
              <T w="med" s={14} c={DAY.ink} style={{ marginTop: 16 }}>How many teams?</T>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                {[2, 3, 4].map((n) => (
                  <Pressable key={n} onPress={() => setNTeams(n)} accessibilityRole="button" accessibilityLabel={`${n} teams`}
                    style={({ pressed }) => [st.pill, nTeams === n && st.pillOn, pressed && st.pressed]}>
                    <T w="bold" s={17} c={DAY.ink}>{n}</T>
                  </Pressable>
                ))}
              </View>
              <View style={{ alignSelf: 'stretch', gap: 8, marginTop: 16 }}>
                {Array.from({ length: nTeams }, (_, i) => (
                  <TextInput key={i} value={names[i]} onChangeText={(v) => setNames((ns) => { const c = ns.slice(); c[i] = v; return c; })}
                    placeholder={`Team ${i + 1} name`} placeholderTextColor={DAY.inkDim}
                    style={[st.input, { fontFamily: F.med, borderLeftColor: TEAM_COLORS[i], borderLeftWidth: 4 }]}
                    accessibilityLabel={`Team ${i + 1} name`} returnKeyType="done" />
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
            <Pressable key={i} onPress={() => setTurn(i)} accessibilityRole="button" accessibilityLabel={`${t.name}, ${t.pts} points${i === turn ? ', choosing now' : ''}`}
              style={({ pressed }) => [st.team, { borderColor: i === turn ? DAY.heroA : TEAM_COLORS[i] }, i === turn && st.teamTurn, pressed && st.pressed]}>
              <T w="bold" s={12} c={TEAM_COLORS[i]} numberOfLines={1}>{t.name}</T>
              <T w="xbold" s={22} c={DAY.ink}>{t.pts}</T>
            </Pressable>
          ))}
        </View>
        {!finished && (
          <T w="reg" s={13} c={DAY.inkSoft} style={{ textAlign: 'center', marginBottom: 12 }}>
            Now choosing: <T w="bold" s={13} c={DAY.amber}>{teams[turn].name}</T> — tap any tile!
          </T>
        )}

        {/* Board */}
        <View style={st.boardRow}>
          {board.cats.map((c, i) => (
            <View key={i} style={[st.cat, { width: tileW }]}><T w="bold" s={10} c={DAY.violet} numberOfLines={2} style={{ textAlign: 'center' }}>{c}</T></View>
          ))}
        </View>
        {Array.from({ length: rows }, (_, r) => (
          <View key={r} style={st.boardRow}>
            {board.tiles.map((col, c) => {
              const t = col[r];
              const state = done[`${c}-${r}`];
              if (!t) return <View key={c} style={{ width: tileW }} />;
              return (
                <Pressable key={c} onPress={() => openTile(c, r)} disabled={!!state} accessibilityRole="button"
                  accessibilityLabel={`${board.cats[c]}, ${t.p} points${state ? ', done' : ''}`}
                  style={({ pressed }) => [st.tile, { width: tileW }, state && st.tileDone, pressed && !state && st.pressed]}>
                  {state === 'right' ? <Check size={22} color={DAY.green} strokeWidth={3} />
                    : state === 'wrong' ? <X size={22} color={DAY.inkDim} strokeWidth={3} />
                    : <T w="xbold" s={20} c={DAY.amber}>{t.p}</T>}
                </Pressable>
              );
            })}
          </View>
        ))}

        {finished && (
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
        )}
      </ScrollView>

      {/* Question */}
      <Modal visible={!!open} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={st.overlay}>
          <View style={st.modal}>
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
                    {tile.o.map((o, i) => <View key={i} style={st.hint}><T w="med" s={12} c={DAY.inkSoft}>{o}</T></View>)}
                  </View>
                )}
                {revealed && (
                  <View style={st.answer}>
                    <T w="bold" s={15} c={DAY.green} style={{ textAlign: 'center' }}>{tile.a}</T>
                    {!!tile.x && <T w="reg" s={12} c={DAY.inkSoft} style={{ textAlign: 'center', marginTop: 4 }}>{tile.x}</T>}
                  </View>
                )}
                <View style={st.modalBtns}>
                  {!revealed ? (
                    <Pressable onPress={() => { stopTimer(); setRevealed(true); }} accessibilityRole="button" style={({ pressed }) => [st.mBtn, { backgroundColor: DAY.violet }, pressed && st.pressed]}>
                      <Eye size={18} color="#fff" strokeWidth={2.2} /><T w="bold" s={14} c="#fff">Reveal Answer</T>
                    </Pressable>
                  ) : (
                    <>
                      <Pressable onPress={() => close(true)} accessibilityRole="button" style={({ pressed }) => [st.mBtn, { backgroundColor: DAY.green }, pressed && st.pressed]}>
                        <Check size={18} color="#fff" strokeWidth={2.5} /><T w="bold" s={14} c="#fff">Correct! (+{tile.p})</T>
                      </Pressable>
                      <Pressable onPress={() => close(false)} accessibilityRole="button" style={({ pressed }) => [st.mBtn, { backgroundColor: DAY.red }, pressed && st.pressed]}>
                        <X size={18} color="#fff" strokeWidth={2.5} /><T w="bold" s={14} c="#fff">Wrong</T>
                      </Pressable>
                    </>
                  )}
                </View>
              </>
            )}
          </View>
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
  return <T w="med" s={12} c={fb.ok ? DAY.green : DAY.red} style={{ marginTop: 8, lineHeight: 17 }}>{fb.text}</T>;
}

function ChoiceItem({ item, onAnswer }) {
  const [picked, setPicked] = useState(null);
  const [fb, setFb] = useState(null);
  const choose = (i) => {
    if (picked != null) return;
    setPicked(i);
    const ok = i === item.a;
    setFb({ ok, text: `${ok ? pick(CHEERS) : pick(OOPS)}${item.x ? ' ' + item.x : ''}` });
    onAnswer(ok);
  };
  return (
    <View style={st.q}>
      <T w="semi" s={14} c={DAY.ink} style={{ lineHeight: 20 }}>{item.q}</T>
      <View style={st.opts}>
        {item.o.map((o, i) => {
          const isCorrect = picked != null && i === item.a;
          const isWrong = picked === i && i !== item.a;
          return (
            <Pressable key={i} onPress={() => choose(i)} disabled={picked != null} accessibilityRole="button" accessibilityLabel={o}
              style={({ pressed }) => [st.opt, isCorrect && st.optRight, isWrong && st.optWrong, pressed && picked == null && st.pressed]}>
              <T w="med" s={13} c={isCorrect ? DAY.green : isWrong ? DAY.red : DAY.ink}>{o}</T>
            </Pressable>
          );
        })}
      </View>
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
  const check = () => {
    const s = v.trim().toLowerCase();
    if (!s) { setFb({ ok: false, text: 'Type something first! 👩‍🚀' }); return; }
    setLocked(true);
    const ok = item.a.some((x) => s.includes(x.toLowerCase()));
    setFb({ ok, text: ok ? pick(CHEERS) : `${pick(OOPS)} Answer: ${item.show || item.a[0]}` });
    onAnswer(ok);
  };
  return (
    <View style={st.q}>
      <T w="semi" s={14} c={DAY.ink} style={{ lineHeight: 20 }}>{item.q}</T>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <TextInput value={v} onChangeText={setV} editable={!locked} placeholder="Type your answer…" placeholderTextColor={DAY.inkDim}
          style={[st.input, { flex: 1, fontFamily: F.med }, locked && (fb?.ok ? st.optRight : st.optWrong)]}
          autoCapitalize="none" autoCorrect={false} returnKeyType="done" onSubmitEditing={check} accessibilityLabel="Your answer" />
        <Pressable onPress={check} disabled={locked} accessibilityRole="button" accessibilityLabel="Check"
          style={({ pressed }) => [st.checkBtn, pressed && st.pressed, locked && st.dim]}>
          <T w="bold" s={14} c="#fff">Check</T>
        </Pressable>
      </View>
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
      <View style={st.hud}>
        <T w="bold" s={14} c={DAY.amber}>⭐ {score}/{total}</T>
        <View style={st.hudTrack}><View style={[st.hudFill, { width: `${total ? (score / total) * 100 : 0}%` }]} /></View>
        <T s={20}>{rankFor(score, total).emoji}</T>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {missions.map((m, mi) => (
            <Card key={mi} style={{ marginBottom: 14 }}>
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
          ))}

          <Card style={[st.winner, { borderColor: DAY.heroA, borderWidth: 2 }]}>
            <T w="xbold" s={16} c={DAY.amber}>Mission Report</T>
            <T s={40} style={{ marginTop: 4 }}>{finished ? rank.emoji : '🛰️'}</T>
            {finished ? (
              <>
                <T w="xbold" s={18} c={DAY.ink} style={{ textAlign: 'center' }}>{rank.label.toUpperCase()}! {score}/{total}</T>
                <T w="reg" s={13} c={DAY.inkSoft} style={{ textAlign: 'center', marginTop: 4 }}>{rank.msg}</T>
                {!!saved && <T w="med" s={12} c={DAY.green} style={{ marginTop: 8 }}>Saved · best {saved.best_score}/{saved.best_total}</T>}
                <GoldBtn label="Play Again" icon={<RotateCcw size={18} color={DAY.ctaFg} strokeWidth={2.2} />} onPress={onReplay} style={{ marginTop: 16 }} />
              </>
            ) : (
              <T w="reg" s={13} c={DAY.inkSoft} style={{ textAlign: 'center' }}>Answer all {total} questions to see your rank!</T>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────

const ActivitiesScreen = ({ onBack }) => {
  const { selectedClass } = useAuth();
  const [subject, setSubject] = useState(null);
  const [play, setPlay] = useState(null);     // { chapter, mode }
  const [refreshKey, setRefreshKey] = useState(0);

  let body;
  if (play) body = <PlayView chapter={play.chapter} mode={play.mode} onExit={() => setPlay(null)} onFinished={() => setRefreshKey((k) => k + 1)} />;
  else if (subject) body = <ChaptersView subject={subject} classLevel={selectedClass} refreshKey={refreshKey} onPlay={(chapter, mode) => setPlay({ chapter, mode })} onBack={() => setSubject(null)} />;
  else body = <SubjectsView classLevel={selectedClass} onPick={setSubject} onBack={onBack} />;

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
  pressed: { transform: [{ scale: 0.98 }] },
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
  subjectCard: { width: (W - PAD * 2 - 12) / 2, minHeight: 120 },
  chapterRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, marginBottom: 10 },
  chapterNum: { width: 34, height: 34, borderRadius: 17, backgroundColor: DAY.violetSoft, alignItems: 'center', justifyContent: 'center' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  sheet: { width: '100%', backgroundColor: DAY.card, borderRadius: 20, padding: 18 },
  modeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: DAY.cardEdge, marginBottom: 10 },
  modeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  gold: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: DAY.ctaBg, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 24, alignSelf: 'stretch' },
  pill: { minWidth: 62, paddingVertical: 12, borderRadius: 12, backgroundColor: DAY.cardSoft, borderWidth: 2, borderColor: DAY.cardEdge, alignItems: 'center' },
  pillOn: { borderColor: DAY.heroA, backgroundColor: DAY.amberSoft },
  input: { backgroundColor: DAY.cardSoft, borderWidth: 1.5, borderColor: DAY.cardEdge, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, fontSize: 15, color: DAY.ink },

  scores: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 10 },
  team: { minWidth: (W - PAD * 2 - 8 * 3) / 4, flexGrow: 1, alignItems: 'center', backgroundColor: DAY.card, borderWidth: 2, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 8 },
  teamTurn: { transform: [{ scale: 1.04 }], shadowColor: DAY.heroA, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
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
  hudTrack: { flex: 1, height: 10, borderRadius: 6, backgroundColor: DAY.track, overflow: 'hidden' },
  hudFill: { height: '100%', backgroundColor: DAY.heroA, borderRadius: 6 },
  q: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: DAY.divider },
  opts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  opt: { backgroundColor: DAY.cardSoft, borderWidth: 1.5, borderColor: DAY.cardEdge, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  optRight: { backgroundColor: DAY.greenSoft, borderColor: DAY.green },
  optWrong: { backgroundColor: DAY.redSoft, borderColor: DAY.red },
  checkBtn: { backgroundColor: DAY.violet, borderRadius: 12, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  taskBox: { backgroundColor: DAY.bannerBg, borderLeftWidth: 4, borderLeftColor: DAY.violet, borderRadius: 10, padding: 12 },
});

export default ActivitiesScreen;
