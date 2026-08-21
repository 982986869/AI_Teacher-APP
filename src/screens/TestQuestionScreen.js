// TestQuestionScreen.js
// The timed online-test runner for the offline-bank classes (Class 10–12): the
// screen PracticeScreen opens once a test is picked from OnlineTestsScreen.
//
// All the pixels live in components/timedTestDark (the `timed-test-dark` frame),
// which OnlineTestScreen's DB-backed runner renders too — the two paths grade and
// submit differently, but a student must not be able to tell them apart. What stays
// here is this bank's own shape: sections A/B/C, letter answers, a single duration.

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, StatusBar, SafeAreaView, Platform } from 'react-native';
import { TT, TTF, TimedTestFrame, TTConfirmDialog, TTPalette } from '../components/timedTestDark';

const SECTION_ORDER = ['A', 'B', 'C'];
const SECTION_RULE = {
  A: 'Attempt any 20 questions',
  B: 'Attempt any 20 questions',
  C: 'Attempt any 5 questions',
};

const DEFAULT_QUESTIONS = [
  { id: 'q1', section: 'A', text: 'According to IUPAC nomenclature for elements with Z greater than 100, the root ‘sept’ corresponds to the digit:', options: [ { key: 'A', label: '7' }, { key: 'B', label: '8' }, { key: 'C', label: '4' }, { key: 'D', label: '3' } ] },
  { id: 'q2', section: 'A', text: 'Which of the following is the basic unit of life?', options: [ { key: 'A', label: 'Tissue' }, { key: 'B', label: 'Organ' }, { key: 'C', label: 'Cell' }, { key: 'D', label: 'Organism' } ] },
  { id: 'q3', section: 'B', text: 'The process by which plants make their own food is called:', options: [ { key: 'A', label: 'Respiration' }, { key: 'B', label: 'Photosynthesis' }, { key: 'C', label: 'Digestion' }, { key: 'D', label: 'Transpiration' } ] },
  { id: 'q4', section: 'C', text: 'Which gas do humans primarily exhale during respiration?', options: [ { key: 'A', label: 'Oxygen' }, { key: 'B', label: 'Nitrogen' }, { key: 'C', label: 'Hydrogen' }, { key: 'D', label: 'Carbon dioxide' } ] },
];

export default function TestQuestionScreen({
  title = 'Mock Test - 01',
  bannerText,                 // if given, overrides the per-section rule
  questions = DEFAULT_QUESTIONS,
  durationSeconds = 90 * 60,
  onExit = () => {},
  onSubmit = () => {},
}) {
  // Group questions by section (A/B/C). Questions with no section -> 'A'.
  const sections = useMemo(() => {
    const map = {};
    questions.forEach((q, i) => {
      const sec = (q.section && SECTION_ORDER.includes(q.section)) ? q.section : 'A';
      (map[sec] = map[sec] || []).push({ ...q, id: q.id ?? `q${i}`, _section: sec });
    });
    return SECTION_ORDER.filter((s) => map[s] && map[s].length).map((s) => ({
      id: s, rule: SECTION_RULE[s], questions: map[s],
    }));
  }, [questions]);

  const [activeSec, setActiveSec] = useState(sections[0]?.id || 'A');
  const [index, setIndex] = useState(0); // index within active section
  const [answers, setAnswers] = useState({});
  const [paletteVisible, setPaletteVisible] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [remaining, setRemaining] = useState(durationSeconds);
  const timerRef = useRef(null);

  const section = sections.find((s) => s.id === activeSec) || sections[0];
  const secQuestions = section ? section.questions : [];
  const total = secQuestions.length;
  const current = secQuestions[index] || secQuestions[0];
  const selected = current ? answers[current.id] : undefined;
  const isLastInSection = index === total - 1;
  const answeredCount = Object.keys(answers).length;
  const grandTotal = questions.length;

  // The countdown is started once, at mount. Calling handleSubmit directly from it
  // would close over the FIRST render's `answers` (always {}), so a time-up submit
  // graded an empty sheet and threw away everything the student answered. submitRef
  // always points at the latest handleSubmit, so the timeout grades real answers.
  const submitRef = useRef(null);
  useEffect(() => { submitRef.current = handleSubmit; });

  useEffect(() => {
    // The remaining count lives in a local owned by this interval, so the tick is a
    // plain value set — no setState call inside a state updater (updaters must stay
    // pure; React may invoke them twice).
    let left = durationSeconds;
    timerRef.current = setInterval(() => {
      left -= 1;
      setRemaining(left > 0 ? left : 0);
      if (left <= 0) {
        clearInterval(timerRef.current);
        if (submitRef.current) submitRef.current(true);
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = (key) => current && setAnswers((a) => ({ ...a, [current.id]: key }));
  const clearAnswer = () => current && setAnswers((a) => { const n = { ...a }; delete n[current.id]; return n; });

  const switchSection = (secId) => { setActiveSec(secId); setIndex(0); };
  const goPrev = () => index > 0 && setIndex((i) => i - 1);
  const goNext = () => {
    if (!isLastInSection) { setIndex((i) => i + 1); return; }
    // move to next section if any, else submit
    const pos = sections.findIndex((s) => s.id === activeSec);
    if (pos < sections.length - 1) { switchSection(sections[pos + 1].id); }
    else setConfirmFinish(true);
  };
  const jumpTo = (i) => { setIndex(i); setPaletteVisible(false); };

  const handleSubmit = (auto) => {
    clearInterval(timerRef.current);
    onSubmit({ answers, answeredCount, total: grandTotal, questions, autoSubmitted: !!auto });
  };

  // Palette groups. The label a student sees is the paper-wide number (A 1–7, B 8–14,
  // C 15–18), so `offset` accumulates across sections; `required` is the count out of
  // the section rule ("Attempt any 20 questions" → "20 required"), read from the rule
  // rather than duplicated, so the two can never disagree.
  const paletteGroups = useMemo(() => {
    let offset = 0;
    return sections.map((sec) => {
      const req = String(sec.rule || '').match(/\d+/);
      const group = {
        id: sec.id,
        title: `SECTION ${sec.id}`,
        note: req ? `${req[0]} required` : null,
        items: sec.questions.map((q, i) => ({
          key: q.id,
          label: offset + i + 1,
          answered: answers[q.id] != null,
          current: sec.id === activeSec && i === index,
        })),
      };
      offset += sec.questions.length;
      return group;
    });
  }, [sections, answers, activeSec, index]);

  const isVeryLast = (() => {
    const pos = sections.findIndex((s) => s.id === activeSec);
    return pos === sections.length - 1 && isLastInSection;
  })();

  if (!current) {
    return (
      <Page>
        <View style={st.center}>
          <Text style={st.emptyTitle}>{title}</Text>
          <Text style={st.emptySub}>No questions available.</Text>
        </View>
      </Page>
    );
  }

  return (
    <Page>
      <TimedTestFrame
        onClose={onExit}
        secondsLeft={remaining}
        progressText={`${index + 1} / ${total}`}
        // Section switching is back in the frame as a tab row, so the sheet no longer
        // has to carry it.
        sections={sections.map((sec) => ({ id: sec.id, label: `Section ${sec.id}` }))}
        activeSection={activeSec}
        onSectionChange={switchSection}
        bannerText={bannerText || section.rule}
        questionHtml={current.text}
        options={(current.options || []).map((o) => ({ id: o.key, key: o.key, label: o.label }))}
        selectedId={selected}
        onSelect={select}
        onClear={selected != null ? clearAnswer : null}
        onPrev={goPrev}
        prevDisabled={index === 0}
        onMenu={() => setPaletteVisible(true)}
        onNext={goNext}
        nextLabel={isVeryLast ? 'Submit' : 'Next'}
      >
        {/* `finish-test-dialog-dark` */}
        <TTConfirmDialog
          visible={confirmFinish}
          title="Finish Test?"
          body={`You've answered ${answeredCount} of ${grandTotal} questions.${answeredCount < grandTotal ? ' Unanswered questions will be marked as skipped.' : ''}`}
          confirmLabel="Finish Test"
          onConfirm={() => { setConfirmFinish(false); handleSubmit(false); }}
          onCancel={() => setConfirmFinish(false)}
        />

        {/* Question palette — a full screen, and where Submit lives now that the
            header is Exit · progress · timer only. Numbers run paper-wide (A 1–7,
            B 8–14, …) so they match how a printed paper numbers its sections, while
            jumpTo still navigates by section + local index. */}
        <TTPalette
          visible={paletteVisible}
          onClose={onExit}
          secondsLeft={remaining}
          progressText={`${index + 1} / ${total}`}
          groups={paletteGroups}
          activeGroupId={activeSec}
          onPick={(secId, i) => { if (secId !== activeSec) setActiveSec(secId); jumpTo(i); }}
          onFinish={() => { setPaletteVisible(false); setConfirmFinish(true); }}
          onBack={() => setPaletteVisible(false)}
        />
      </TimedTestFrame>
    </Page>
  );
}

// The frame's page shell: a flat #0C0936 behind the status bar and the content.
function Page({ children }) {
  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={TT.canvas} />
      {Platform.OS === 'android' && <View style={st.androidStatusPad} />}
      {children}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TT.canvas },
  androidStatusPad: { height: 24, backgroundColor: TT.canvas },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 6 },
  emptyTitle: { fontSize: 15, lineHeight: 22, fontFamily: TTF.head, color: TT.ink },
  emptySub: { fontSize: 13, fontFamily: TTF.reg, color: TT.sub, textAlign: 'center' },
});
