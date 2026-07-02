// src/screens/parent/ParentApp/SessionsTab.js
// Teammate's exact Sessions flow (tutor strip · upcoming · book sheet · past notes ·
// live call). This is a DESIGN PREVIEW — there is no tutor/session backend yet, so the
// data here is mock/config (TUTOR, DAYS, SLOTS) by product decision. The child's name
// is real (from the linked child); everything else stays as the approved UI.
import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import {
  Star, Clock, Video, Calendar, ChevronRight, Check, X, ArrowLeft, Mic, MicOff, VideoOff, PhoneOff,
} from 'lucide-react-native';
import { C, st, T, Label, Wordmark, TUTOR, REASONS, SLOTS, BLOCKED, DAYS } from './constants';
import Header from './Header';

export default function SessionsTab({ meta, childName, onAvatar, flash }) {
  const [view, setView] = useState('main');
  const [notesFor, setNotesFor] = useState(null);
  const [upcoming, setUpcoming] = useState({ topic: 'Monthly progress review', day: DAYS.find((d) => d.date === 5) || DAYS[3], time: '6:00 PM', duration: 20 });
  const past = [
    {
      id: 1, topic: 'Progress review', day: 'Fri, 13 Jun', time: '6:00 PM',
      summary: `${childName} is confident with multiplication and place value. We're building up to word problems.`,
      strengths: ['Multiplication tables', 'Place value', 'Mental math speed'],
      focus: ['Reading word problems slowly', 'Showing working clearly'],
      actions: ['Practice 5 word problems this week in AI Gym', `Encourage ${childName} to explain the steps aloud`],
    },
    {
      id: 2, topic: 'Homework help', day: 'Tue, 27 May', time: '5:30 PM',
      summary: `Cleared up confusion around carrying in addition. ${childName} got the last 3 right on their own.`,
      strengths: ['Sticks with a problem', 'Asks good questions'], focus: ['Lining up digits neatly'],
      actions: ['Use grid paper for addition this week'],
    },
  ];
  return (
    <View style={st.screen}>
      <Header meta={meta} childName={childName} onAvatar={onAvatar} />
      <ScrollView style={st.body} contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <View style={{ marginTop: 6 }}><Wordmark size={16} /></View>
        <TutorStrip childName={childName} />
        <Label>Upcoming session</Label>
        {upcoming
          ? <Upcoming s={upcoming} onJoin={() => setView('call')} onResched={() => setView('book')} onCancel={() => { setUpcoming(null); flash('Session cancelled'); }} />
          : <Empty />}
        <Label>Book a session</Label>
        <BookCta onPress={() => setView('book')} />
        <Label>Past sessions</Label>
        <View style={{ gap: 10 }}>{past.map((p) => <PastRow key={p.id} p={p} onPress={() => { setNotesFor(p); setView('notes'); }} />)}</View>
      </ScrollView>

      <Modal visible={view === 'book'} transparent animationType="slide" onRequestClose={() => setView('main')}>
        <BookSheet onClose={() => setView('main')} onConfirm={(s) => { setUpcoming(s); setView('main'); flash("Session booked · you'll get a reminder"); }} />
      </Modal>
      <Modal visible={view === 'notes'} transparent animationType="slide" onRequestClose={() => setView('main')}>
        {notesFor && <NotesSheet p={notesFor} onClose={() => setView('main')} />}
      </Modal>
      <Modal visible={view === 'call'} animationType="slide" onRequestClose={() => setView('main')}>
        <CallScreen topic={upcoming ? upcoming.topic : 'Session'} onLeave={() => { setView('main'); flash('Call ended · recap will appear soon'); }} />
      </Modal>
    </View>
  );
}

function TutorStrip({ childName }) {
  return (
    <View style={st.tutorStrip}>
      <View style={st.tutorAv}><T w="xbold" s={16} c="#fff">AR</T></View>
      <View style={{ flex: 1 }}><T w="bold" s={15.5} c={C.ink}>{TUTOR.name}</T><T w="med" s={13} c={C.muted}>{childName}'s {TUTOR.subject} tutor</T></View>
      <View style={st.ratingPill}><Star size={12} fill={C.gold} color={C.gold} /><T w="bold" s={13} c={C.ink}>{TUTOR.rating}</T></View>
    </View>
  );
}
function Upcoming({ s, onJoin, onResched, onCancel }) {
  return (
    <View style={st.upcoming}>
      <View style={{ flexDirection: 'row', gap: 14, marginBottom: 14 }}>
        <View style={st.dateBadge}>
          <T w="bold" s={11} c="#fff" style={{ letterSpacing: 0.5 }}>{s.day.mon.toUpperCase()}</T>
          <T w="xbold" s={22} c="#fff">{s.day.date}</T>
          <T w="semi" s={11} c="#fff" style={{ opacity: 0.85 }}>{s.day.dow}</T>
        </View>
        <View style={{ flex: 1 }}>
          <T w="bold" s={15.5} c={C.ink}>{s.topic}</T>
          <View style={st.meta}><Clock size={14} color={C.muted} /><T w="med" s={13} c={C.muted}>{s.time} · {s.duration} min</T></View>
          <View style={st.meta}><Video size={14} color={C.muted} /><T w="med" s={13} c={C.muted}>Video call with {TUTOR.name}</T></View>
        </View>
      </View>
      <TouchableOpacity style={st.joinBtn} onPress={onJoin}><View style={st.liveDot} /><T w="bold" s={16} c="#fff">Join call</T></TouchableOpacity>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <TouchableOpacity style={st.ghost} onPress={onResched}><T w="bold" s={14} c={C.ink}>Reschedule</T></TouchableOpacity>
        <TouchableOpacity style={st.ghost} onPress={onCancel}><T w="bold" s={14} c={C.ink}>Cancel</T></TouchableOpacity>
      </View>
    </View>
  );
}
function Empty() { return <View style={st.emptyCard}><Calendar size={22} color={C.faint} /><View><T w="bold" s={14} c={C.ink}>No session yet</T><T w="med" s={13} c={C.muted}>Book a time to talk with {TUTOR.name}.</T></View></View>; }
function BookCta({ onPress }) {
  return (
    <TouchableOpacity style={st.bookCta} onPress={onPress}>
      <View style={st.bookIcon}><Video size={20} color="#fff" strokeWidth={2.4} /></View>
      <View style={{ flex: 1 }}><T w="bold" s={15} c={C.ink}>Talk to {TUTOR.name}</T><T w="med" s={13} c={C.muted}>Pick a topic and time that works for you</T></View>
      <ChevronRight size={20} color={C.faint} />
    </TouchableOpacity>
  );
}
function PastRow({ p, onPress }) {
  return (
    <TouchableOpacity style={st.pastRow} onPress={onPress}>
      <View style={st.pastCheck}><Check size={16} color={C.green} strokeWidth={3} /></View>
      <View style={{ flex: 1 }}><T w="bold" s={15} c={C.ink}>{p.topic}</T><T w="med" s={13} c={C.muted}>{p.day} · {p.time}</T></View>
      <View style={st.notesTag}><T w="bold" s={12} c={C.blue}>View notes</T></View>
    </TouchableOpacity>
  );
}

function BookSheet({ onClose, onConfirm }) {
  const [reason, setReason] = useState(''); const [day, setDay] = useState(null); const [slot, setSlot] = useState('');
  const ready = reason && day && slot;
  return (
    <View style={st.overlay}>
      <View style={st.sheet}>
        <View style={st.sheetHead}><T w="xbold" s={17} c={C.ink}>Book a session</T><TouchableOpacity style={st.iconBtn} onPress={onClose}><X size={20} color={C.ink} /></TouchableOpacity></View>
        <ScrollView style={st.sheetBody} contentContainerStyle={{ paddingBottom: 8 }}>
          <T w="bold" s={15} c={C.ink} style={{ marginBottom: 12 }}>What would you like to talk about?</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
            {REASONS.map((r) => { const on = reason === r; return <TouchableOpacity key={r} onPress={() => setReason(r)} style={[st.chip, on && st.chipOn]}><T w={on ? 'semi' : 'med'} s={14} c={on ? '#fff' : C.ink}>{r}</T></TouchableOpacity>; })}
          </View>
          <T w="bold" s={15} c={C.ink} style={{ marginBottom: 12 }}>Pick a day</T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 18 }}>
            {DAYS.map((d) => { const on = day && day.key === d.key; return <TouchableOpacity key={d.key} onPress={() => setDay(d)} style={[st.dayCell, on && st.dayCellOn]}><T w="semi" s={11} c={on ? '#fff' : C.ink} style={{ opacity: on ? 1 : 0.8 }}>{d.dow}</T><T w="xbold" s={17} c={on ? '#fff' : C.ink}>{d.date}</T></TouchableOpacity>; })}
          </ScrollView>
          <T w="bold" s={15} c={C.ink} style={{ marginBottom: 12 }}>Pick a time</T>
          <View style={st.slotGrid}>
            {SLOTS.map((t) => { const b = BLOCKED.has(t), on = slot === t; return <TouchableOpacity key={t} disabled={b} onPress={() => setSlot(t)} style={[st.slot, on && st.slotOn, b && st.slotOff]}><T w="semi" s={14} c={on ? '#fff' : b ? '#C7C7C7' : C.ink} style={b && { textDecorationLine: 'line-through' }}>{t}</T></TouchableOpacity>; })}
          </View>
        </ScrollView>
        <View style={st.sheetFoot}>
          <TouchableOpacity disabled={!ready} onPress={() => onConfirm({ topic: reason, day, time: slot, duration: 20 })} style={[st.confirm, !ready && st.confirmOff]}>
            <T w="bold" s={15} c={ready ? '#fff' : '#A9A9AC'}>{ready ? `Confirm · ${day.label}, ${slot}` : 'Confirm booking'}</T>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
function NotesSheet({ p, onClose }) {
  return (
    <View style={st.overlay}>
      <View style={st.sheet}>
        <View style={st.sheetHead}><TouchableOpacity style={st.iconBtn} onPress={onClose}><ArrowLeft size={20} color={C.ink} /></TouchableOpacity><T w="xbold" s={17} c={C.ink}>Session notes</T><View style={{ width: 36 }} /></View>
        <ScrollView style={st.sheetBody} contentContainerStyle={{ paddingBottom: 20 }}>
          <T w="bold" s={16} c={C.ink}>{p.topic}</T>
          <T w="med" s={13} c={C.muted} style={{ marginBottom: 12 }}>{p.day} · {p.time} · with {TUTOR.name}</T>
          <View style={st.summary}><T w="med" s={14} c="#3A3A3A" style={{ lineHeight: 21 }}>{p.summary}</T></View>
          <NoteBlock title="Going well" items={p.strengths} tint={C.greenSoft} dot={C.green} />
          <NoteBlock title="Focus areas" items={p.focus} tint={C.peach} dot={C.peachInk} />
          <NoteBlock title="This week's plan" items={p.actions} tint={C.blueSoft} dot={C.blue} />
        </ScrollView>
      </View>
    </View>
  );
}
function NoteBlock({ title, items, tint, dot }) {
  return (
    <View style={[st.noteBlock, { backgroundColor: tint }]}>
      <T w="bold" s={14} c={C.ink} style={{ marginBottom: 8 }}>{title}</T>
      <View style={{ gap: 8 }}>{items.map((it, i) => <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dot, marginTop: 7 }} /><T w="med" s={14} c="#3A3A3A" style={{ flex: 1, lineHeight: 20 }}>{it}</T></View>)}</View>
    </View>
  );
}

function CallScreen({ topic, onLeave }) {
  const [sec, setSec] = useState(0); const [muted, setMuted] = useState(false); const [camOff, setCamOff] = useState(false); const ref = useRef();
  useEffect(() => { ref.current = setInterval(() => setSec((s) => s + 1), 1000); return () => clearInterval(ref.current); }, []);
  const mm = String(Math.floor(sec / 60)).padStart(2, '0'), ss = String(sec % 60).padStart(2, '0');
  return (
    <View style={st.call}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={st.callTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={[st.liveDot, { backgroundColor: '#ff5252' }]} /><T w="bold" s={13} c="#fff">LIVE · {mm}:{ss}</T></View>
          <Wordmark size={13} />
        </View>
        <View style={st.callStage}>
          <View style={st.callAv}><T w="xbold" s={40} c="#fff">AR</T></View>
          <T w="xbold" s={20} c="#fff" style={{ marginTop: 14 }}>{TUTOR.name}</T>
          <T w="med" s={13} c="rgba(255,255,255,0.6)">{topic}</T>
          <View style={st.selfTile}><T w="semi" s={12} c="rgba(255,255,255,0.55)">{camOff ? 'Camera off' : 'You'}</T></View>
        </View>
        <View style={st.callControls}>
          <TouchableOpacity onPress={() => setMuted((m) => !m)} style={[st.callBtn, muted && { backgroundColor: '#fff' }]}>{muted ? <MicOff size={22} color="#111" /> : <Mic size={22} color="#fff" />}</TouchableOpacity>
          <TouchableOpacity onPress={() => setCamOff((c) => !c)} style={[st.callBtn, camOff && { backgroundColor: '#fff' }]}>{camOff ? <VideoOff size={22} color="#111" /> : <Video size={22} color="#fff" />}</TouchableOpacity>
          <TouchableOpacity onPress={onLeave} style={st.leave}><PhoneOff size={24} color="#fff" /></TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
