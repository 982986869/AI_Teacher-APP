// src/screens/admin/books/AutoGenerateScreen.js
// After an upload: generate all four kinds for every chapter, in the open.
//
// Run from the device rather than queued on the server because the backend has
// no job runner — a request that tried to do 60 model calls inline would time
// out long before finishing, and there is nothing to hand the work to. So the
// admin watches it happen and can stop it.
//
// Sequential, one call at a time. Four in parallel per chapter would be a spend
// burst and a rate-limit risk, and the point of this screen is that you can see
// which piece is being written right now.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, ScrollView, Alert, ActivityIndicator, BackHandler } from 'react-native';
import { CircleCheck, CircleX, Circle, Loader, Sparkles, SquareCheckBig } from 'lucide-react-native';
import { T } from '../../parent/ParentApp/constants';
import { PressableScale } from '../../parent/ParentApp/anim';
import { AdminScreen, AdminHeader, AdminCard, AdminErrorState, S, tone } from '../ui/kit';
import * as api from '../../../api/adminBooksApi';
import { SECTIONS } from './BookBits';

const KEY = (chapterId, kind) => `${chapterId}:${kind}`;

export default function AutoGenerateScreen({ route, navigation }) {
  const { bookId, title } = route.params || {};
  const [chapters, setChapters] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState({});     // key -> 'queued' | 'working' | 'done' | 'failed'
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const cancelled = useRef(false);

  // Leaving mid-run stops it rather than letting calls continue against a screen
  // nobody is watching.
  useEffect(() => () => { cancelled.current = true; }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await api.getBookChapters(bookId);
      setChapters(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.message || 'Could not load the chapters');
    }
  }, [bookId]);

  useEffect(() => { load(); }, [load]);

  const todo = (chapters || []).flatMap((ch) => {
    const have = new Set((ch.content || []).map((c) => c.kind));
    return SECTIONS.filter((s) => !have.has(s.kind)).map((s) => ({ ch, kind: s.kind }));
  });
  const doneCount = Object.values(status).filter((v) => v === 'done').length;
  const failCount = Object.values(status).filter((v) => v === 'failed').length;

  const run = async () => {
    if (!todo.length) return;
    cancelled.current = false;
    setRunning(true); setFinished(false);
    setStatus(Object.fromEntries(todo.map((t) => [KEY(t.ch.id, t.kind), 'queued'])));

    let made = 0;
    for (const t of todo) {
      if (cancelled.current) break;
      const k = KEY(t.ch.id, t.kind);
      setStatus((s) => ({ ...s, [k]: 'working' }));
      try {
        await api.generateSection(t.ch.id, t.kind);
        made += 1;
        setStatus((s) => ({ ...s, [k]: 'done' }));
      } catch {
        // One bad section must not cost the other fifty-nine.
        setStatus((s) => ({ ...s, [k]: 'failed' }));
      }
    }

    setRunning(false);
    if (cancelled.current) return;
    setFinished(true);
    await load();

    const failed = todo.length - made;
    Alert.alert(
      failed ? 'Finished with some failures' : 'All content generated',
      failed
        ? `${made} of ${todo.length} created. Open a red row to retry just that one.`
        : `${made} section${made === 1 ? '' : 's'} created. Everything is a draft — review each before publishing.`,
    );
  };

  const stop = () => { cancelled.current = true; setRunning(false); };

  if (error) {
    return (
      <AdminScreen>
        <AdminHeader title="Generate content" subtitle={title} onBack={() => navigation.goBack()} />
        <View style={{ padding: 16 }}><AdminErrorState message={error} onRetry={load} /></View>
      </AdminScreen>
    );
  }

  const total = todo.length || Object.keys(status).length;
  const pct = total ? Math.round(((doneCount + failCount) / total) * 100) : 0;

  return (
    <AdminScreen>
      <AdminHeader
        title="Generate content"
        subtitle={title}
        onBack={() => {
          if (running) {
            Alert.alert('Stop generating?', 'Anything already created is kept.', [
              { text: 'Keep going', style: 'cancel' },
              { text: 'Stop', style: 'destructive', onPress: () => { stop(); navigation.goBack(); } },
            ]);
          } else navigation.goBack();
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
        {chapters === null ? (
          <AdminCard><ActivityIndicator color={S.indigo} /></AdminCard>
        ) : !chapters.length ? (
          <AdminCard><T w="semi" s={13} c={S.muted}>No chapters were detected in this PDF.</T></AdminCard>
        ) : (
          <>
            {(running || finished) && (
              <AdminCard style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {running ? <ActivityIndicator size="small" color={S.indigo} />
                    : <SquareCheckBig size={18} color={S.emerald} strokeWidth={2.3} />}
                  <T w="xbold" s={14} c={S.ink} style={{ flex: 1 }} numberOfLines={1}>
                    {running ? 'Generating…' : 'Finished'}
                  </T>
                  <T w="xbold" s={13} c={S.muted}>{doneCount + failCount}/{total}</T>
                </View>
                <View style={{ height: 6, borderRadius: 99, backgroundColor: S.hair, overflow: 'hidden', marginTop: 10 }}>
                  <View style={{ width: `${pct}%`, height: '100%', borderRadius: 99, backgroundColor: failCount ? S.gold : S.emerald }} />
                </View>
                {failCount > 0 && (
                  <T w="semi" s={11.5} c={S.gold} style={{ marginTop: 7 }}>
                    {failCount} section{failCount === 1 ? '' : 's'} failed — the rest carried on.
                  </T>
                )}
              </AdminCard>
            )}

            {chapters.map((ch) => (
              <AdminCard key={ch.id} style={{ marginBottom: 12 }}>
                <T w="xbold" s={13.5} c={S.ink} numberOfLines={2}>{ch.position}. {ch.title}</T>
                <View style={{ marginTop: 10, gap: 7 }}>
                  {SECTIONS.map((meta) => {
                    const row = (ch.content || []).find((c) => c.kind === meta.kind);
                    const st = status[KEY(ch.id, meta.kind)];
                    const state = row ? 'exists' : st || 'idle';
                    const t = tone(meta.toneKey);
                    return (
                      <View key={meta.kind} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{
                          width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                          alignItems: 'center', justifyContent: 'center', backgroundColor: t.s,
                        }}>
                          <meta.Icon size={14} color={t.c} strokeWidth={2.3} />
                        </View>
                        <T w="semi" s={13} c={S.sub} style={{ flex: 1 }} numberOfLines={1}>{meta.label}</T>
                        <StateMark state={state} />
                      </View>
                    );
                  })}
                </View>
              </AdminCard>
            ))}
          </>
        )}
      </ScrollView>

      {/* action bar */}
      {!!chapters?.length && (
        <View style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          padding: 14, paddingBottom: 26,
          backgroundColor: S.card, borderTopWidth: 1, borderTopColor: S.hair,
        }}>
          {running ? (
            <PressableScale
              onPress={stop}
              accessibilityRole="button" accessibilityLabel="Stop generating"
              style={barStyle(S.canvas, S.border)}
            >
              <T w="xbold" s={14.5} c={S.ink}>Stop</T>
            </PressableScale>
          ) : todo.length ? (
            <PressableScale
              onPress={run}
              accessibilityRole="button" accessibilityLabel={`Generate ${todo.length} sections`}
              style={barStyle(S.indigo)}
            >
              <Sparkles size={17} color="#FFFFFF" strokeWidth={2.4} />
              <T w="xbold" s={14.5} c="#FFFFFF">
                Generate {todo.length} section{todo.length === 1 ? '' : 's'}
              </T>
            </PressableScale>
          ) : (
            <PressableScale
              onPress={() => navigation.replace('BookChapters', { bookId, title })}
              accessibilityRole="button" accessibilityLabel="Review and publish"
              style={barStyle(S.emerald)}
            >
              <SquareCheckBig size={17} color="#FFFFFF" strokeWidth={2.4} />
              <T w="xbold" s={14.5} c="#FFFFFF">Review and publish</T>
            </PressableScale>
          )}
          <T w="semi" s={10.5} c={S.faint} style={{ textAlign: 'center', marginTop: 8 }}>
            {running
              ? 'Keep this screen open — generating stops if you leave.'
              : todo.length
                ? `About ${Math.max(1, Math.round((todo.length * 15) / 60))} min. Everything lands as a draft.`
                : 'Nothing left to generate.'}
          </T>
        </View>
      )}
    </AdminScreen>
  );
}

function StateMark({ state }) {
  if (state === 'working') return <ActivityIndicator size="small" color={S.indigo} />;
  if (state === 'done' || state === 'exists') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <CircleCheck size={16} color={S.emerald} strokeWidth={2.4} />
        <T w="bold" s={11} c={S.emerald}>{state === 'exists' ? 'already there' : 'done'}</T>
      </View>
    );
  }
  if (state === 'failed') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        <CircleX size={16} color={S.red} strokeWidth={2.4} />
        <T w="bold" s={11} c={S.red}>failed</T>
      </View>
    );
  }
  if (state === 'queued') return <T w="bold" s={11} c={S.faint}>waiting</T>;
  return <Circle size={15} color={S.border} strokeWidth={2} />;
}

const barStyle = (bg, border) => ({
  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  paddingVertical: 15, borderRadius: 15, backgroundColor: bg,
  borderWidth: border ? 1 : 0, borderColor: border,
});
