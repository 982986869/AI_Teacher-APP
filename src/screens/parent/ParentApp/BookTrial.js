// src/screens/parent/ParentApp/BookTrial.js
// In-app "Book a free class" flow (replaces the old redirect to an external app).
// Steps: form → loading → schedule (day + time slot) → confirming → confirmed.
// "Add to Calendar" is REAL (creates a device event via ./calendar); reschedule
// updates the same event, cancel deletes it. `onChange(booking|null)` lifts every
// change to the dashboard. `initialBooking` re-opens the flow to reschedule. No
// backend/persistence yet — the booking lives in the parent's state.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, ScrollView, TextInput, Modal, Pressable, StyleSheet, Platform, ActivityIndicator, Dimensions, Alert, Linking,
} from 'react-native';
import {
  ArrowLeft, ChevronDown, Check, Sun, Moon, Plus, X, Target, BookOpen, MessageCircle, Star, User,
} from 'lucide-react-native';
import { C, F, T, DOWF, MONF, Wordmark } from './constants';
import { PressableScale, FadeIn } from './anim';
import CountryPicker from './CountryPicker';
import { findCountry, flagOf } from './countries';
import { addDemoToCalendar, updateDemoInCalendar, removeDemoFromCalendar } from './calendar';

// Best-effort default dial code from the device locale (falls back to India) — so
// parents outside India don't have to change +91 every time.
function defaultCountry() {
  try {
    const loc = Intl.DateTimeFormat().resolvedOptions().locale || '';
    const region = (loc.split('-')[1] || '').toUpperCase();
    if (region) { const c = findCountry(region); if (c) return c; }
  } catch (_) { /* Intl may be unavailable */ }
  return findCountry('IN') || { name: 'India', iso2: 'IN', dial: '+91' };
}

// Two clean columns for the day/slot pills (explicit px width → never squished).
const SCREEN_W = Dimensions.get('window').width;
const COL2_W = Math.floor((SCREEN_W - 40 - 14) / 2);  // screen − 20px side padding ×2 − 14px gap
const COL3_W = Math.floor((SCREEN_W - 40 - 24) / 3);  // three across for time slots

// 1-hour slots. A few afternoon slots are shown as unavailable (matches the reference).
const AFTERNOON = [
  { t: '12 - 1', off: true }, { t: '1 - 2' }, { t: '2 - 3' },
  { t: '3 - 4' }, { t: '4 - 5' },
];
const EVENING = [{ t: '5 - 6' }, { t: '6 - 7', off: true }, { t: '7 - 8', off: true }];

const HAPPENS = [
  { bg: '#FBD9C8', Icon: Target, title: 'Introduction & Goals', body: (n) => `The mentor gets to know ${n}'s current level and learning goals to personalize the session.` },
  { bg: '#FCE8B8', Icon: BookOpen, title: 'Learning Session', body: (n) => `The mentor works through concepts and problems with ${n}, showing our tools and teaching approach.` },
  { bg: '#D8EBD8', Icon: MessageCircle, title: 'Q&A + Next Steps', body: () => 'Ask anything, and we\'ll suggest a personalized learning plan for the year ahead.' },
];

const FAQS = [
  { q: 'A tutor hasn\'t been assigned yet. How long does it take?', a: 'We typically assign the tutor about 2 days before the trial. We\'ll ask you to confirm your attendance before that.' },
  { q: 'Will the trial tutor be my child\'s regular tutor if we continue?', a: 'Usually yes — if it\'s a great fit, the same tutor continues. If not, we\'ll happily match you with someone else.' },
  { q: 'What happens after the trial class?', a: 'The tutor shares a short report on your child\'s level and a suggested learning plan. You can then choose a plan that fits — no pressure.' },
  { q: 'What if the trial doesn\'t go well?', a: 'No worries at all. Tell us what didn\'t work and we\'ll either rematch you with a different tutor or help you however you\'d like.' },
  { q: 'I have more questions — how can I reach you?', a: 'Reach us anytime in the Chat tab, or email support@ailernova.com. We usually reply within a few hours.' },
];

// Placeholder social-proof data (swap for real content/photos later).
const ACHIEVERS = [
  { name: 'Sofia, Grade 4', award: 'National finalist — Olympiad', bg: '#F6E7C8' },
  { name: 'Aarav, Grade 5', award: 'Top of class — Science', bg: '#F6D7E7' },
  { name: 'Mia, Grade 7', award: 'School topper — 2 years', bg: '#DCEBF6' },
];
const COMMUNITY = [
  { name: 'YUNEKE GONZALEZ', title: 'A Homeschooler\'s Journey', body: 'Ailernova empowers this homeschooler to thrive — balancing creativity and problem-solving every day.', bg: '#F6E7C8' },
  { name: 'RAHUL S.', title: 'Thriving & Accelerating', body: 'A Grade 8 student turning curiosity into school wins and academic medals.', bg: '#DCEEDC' },
  { name: 'AISHA K.', title: 'From Fear to Fluency', body: 'Went from dreading the subject to leading her class — one confident step at a time.', bg: '#F6D7E7' },
];

function Field({ label, children, onPress }) {
  const Wrap = onPress ? Pressable : View;
  return (
    <Wrap onPress={onPress} style={s.field}>
      <View style={s.fieldLabelWrap}><T w="med" s={12} c={C.muted}>{label}</T></View>
      {children}
    </Wrap>
  );
}

export default function BookTrial({ visible, onClose, childName, childList, parentName, initialBooking = null, onChange }) {
  const kids = useMemo(() => {
    const list = (childList && childList.length ? childList : [{ name: childName || 'Your child' }])
      .map((k) => (typeof k === 'string' ? k : k?.name)).filter(Boolean);
    return list.length ? list : ['Your child'];
  }, [childList, childName]);

  // `initialBooking` set → reschedule: skip the form, prefill, keep the calendar link.
  const [step, setStep] = useState(initialBooking ? 'schedule' : 'form'); // form | loading | schedule | confirming | confirmed
  const [child, setChild] = useState(initialBooking?.student?.name || kids[0]);
  const [name, setName] = useState(initialBooking?.parent?.name || parentName || '');
  const [country, setCountry] = useState(defaultCountry);
  const [mobile, setMobile] = useState('');
  const [day, setDay] = useState(null);
  const [period, setPeriod] = useState('Afternoon');
  const [slot, setSlot] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);
  const [showAllFaq, setShowAllFaq] = useState(false);
  const [pickChild, setPickChild] = useState(false);
  const [pickCountry, setPickCountry] = useState(false);
  const submittedRef = useRef(false);
  // Real calendar sync state.
  const [addingCal, setAddingCal] = useState(false);
  const [calEventId, setCalEventId] = useState(initialBooking?.calendarEventId || null);
  const bookingIdRef = useRef(initialBooking?.id || `demo_${Date.now().toString(36)}`);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);
  // Reset / hydrate each time the sheet opens (fresh booking vs. reschedule).
  useEffect(() => {
    if (!visible) return;
    setStep(initialBooking ? 'schedule' : 'form');
    setCalEventId(initialBooking?.calendarEventId || null);
    bookingIdRef.current = initialBooking?.id || `demo_${Date.now().toString(36)}`;
    submittedRef.current = false;
    setSlot(null);
    if (!initialBooking) { setDay(null); setMobile(''); }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const digits = mobile.replace(/\D/g, '');
  const canSubmit = !!child && name.trim().length > 1 && digits.length >= 8;

  // Build the booking. Date = chosen day + the 1-hour slot's start (afternoon 12–4 PM,
  // evening 5–8 PM → 24h). Duration is 1 hour to match the "1-hour time slot" copy.
  const buildBooking = () => {
    const startHr = slot ? parseInt(slot.t.split('-')[0].trim(), 10) : 1;
    const h24 = startHr === 12 ? 12 : startHr + 12;
    const start = day ? new Date(day.date) : new Date();
    start.setHours(h24, 0, 0, 0);
    return {
      id: bookingIdRef.current,
      student: { name: child, className: '', subject: '' },
      parent: {
        name: name.trim(),
        phone: digits ? `${country.dial}${digits}` : (initialBooking?.parent?.phone || `${country.dial}`),
        email: initialBooking?.parent?.email || '',
      },
      date: start.toISOString(),
      durationMin: 60,
      calendarEventId: calEventId,
      meetingUrl: null,
      slotLabel: slot ? slot.t : '',
    };
  };

  // REAL "Add to Calendar" — create the device event once, store its id, guard dup taps.
  const handleAddToCalendar = async () => {
    if (addingCal || calEventId) return;
    setAddingCal(true);
    try {
      const res = await addDemoToCalendar(buildBooking());
      if (!mountedRef.current) return;
      if (res.ok) {
        setCalEventId(res.eventId);
        onChange && onChange({ ...buildBooking(), calendarEventId: res.eventId });
      } else if (res.reason === 'denied') {
        Alert.alert(
          'Calendar access needed',
          'Allow calendar access so we can add your trial class and remind you 30 minutes before it starts.',
          [{ text: 'Not now', style: 'cancel' }, { text: 'Open Settings', onPress: () => Linking.openSettings() }],
        );
      } else {
        Alert.alert("Couldn't add to calendar", "We couldn't reach a calendar on this device. Your trial is still booked.");
      }
    } catch (_) {
      if (mountedRef.current) Alert.alert("Couldn't add to calendar", 'Something went wrong. Your trial is still booked.');
    } finally {
      if (mountedRef.current) setAddingCal(false);
    }
  };

  // Cancel — confirm first (destructive), then delete the calendar event (if synced),
  // clear the booking, and close.
  const handleCancel = () => {
    Alert.alert(
      'Cancel this class?',
      'This frees up your slot. You can book another free demo anytime.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel class',
          style: 'destructive',
          onPress: async () => {
            if (calEventId) await removeDemoFromCalendar(calEventId);
            onChange && onChange(null);
            close();
          },
        },
      ],
    );
  };

  // Loading auto-advances; confirming persists the booking (and updates the calendar
  // event on a reschedule) before revealing the confirmed screen.
  useEffect(() => {
    if (step === 'loading') { const t = setTimeout(() => setStep('schedule'), 1600); return () => clearTimeout(t); }
    if (step === 'confirming') {
      const t = setTimeout(async () => {
        const booking = buildBooking();
        let eid = calEventId;
        if (calEventId) {
          const res = await updateDemoInCalendar(calEventId, booking);
          if (res && res.ok && res.eventId) eid = res.eventId; // may be recreated if it vanished
        }
        if (mountedRef.current) {
          if (eid !== calEventId) setCalEventId(eid);
          onChange && onChange({ ...booking, calendarEventId: eid });
          setStep('confirmed');
        }
      }, 1600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Next 7 days as pickable pills (rebuilt each time the sheet opens).
  const days = useMemo(() => {
    const out = [];
    const base = new Date();
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      out.push({ key: d.toDateString(), label: `${DOWF[d.getDay()]}, ${MONF[d.getMonth()]} ${d.getDate()}`, date: d });
    }
    return out;
  }, [visible]);

  const slots = period === 'Afternoon' ? AFTERNOON : EVENING;

  const close = () => {
    setStep('form'); setMobile(''); setDay(null); setSlot(null); submittedRef.current = false;
    onClose && onClose();
  };
  const back = () => {
    if (step === 'form' || step === 'confirmed') close();
    else if (step === 'confirming') setStep('schedule');
    else setStep('form');
  };

  const submitForm = () => { if (canSubmit) setStep('loading'); };
  const continueSchedule = () => { if (day && slot) setStep('confirming'); };

  const headerTitle = step === 'form' ? 'Book a free class' : 'For the trial class';

  // Derived date/time strings for the confirmation banner. AM/PM is derived from the
  // real 24h slot (afternoon 12–4 PM, evening 5–8 PM) rather than hardcoded.
  const startHr = slot ? parseInt(slot.t.split('-')[0].trim(), 10) : 1;
  const h24 = startHr === 12 ? 12 : startHr + 12;
  const timeStr = `${(h24 % 12) || 12}:00 ${h24 < 12 ? 'AM' : 'PM'}`;
  const dateStr = day ? `${MONF[day.date.getMonth()]} ${day.date.getDate()}` : '';
  const prevStr = (() => {
    if (!day) return '';
    const p = new Date(day.date); p.setDate(day.date.getDate() - 1);
    return `${MONF[p.getMonth()]} ${p.getDate()}`;
  })();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={back} statusBarTranslucent>
      <View style={s.screen}>
        <View style={s.header}>
          <PressableScale style={s.back} onPress={back} accessibilityLabel="Go back"><ArrowLeft size={24} color={C.ink} /></PressableScale>
          <T w="bold" s={20} c={C.ink}>{headerTitle}</T>
        </View>

        {/* ── STEP 1: form ─────────────────────────────────────────────── */}
        {step === 'form' && (
          <>
            <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* Single linked student → just show the name (no dropdown). Only when a
                  parent has more than one child do we offer the picker. */}
              <Field label={kids.length > 1 ? 'Select child' : 'Student'} onPress={kids.length > 1 ? () => setPickChild(true) : undefined}>
                <View style={s.rowBetween}>
                  <T w="med" s={17} c={C.ink}>{child}</T>
                  {kids.length > 1 && <ChevronDown size={22} color={C.muted} />}
                </View>
              </Field>
              <TextInput value={name} onChangeText={setName} placeholder={parentName || 'Your full name'} placeholderTextColor={C.faint} style={s.input} returnKeyType="next" />
              <View style={s.mobileRow}>
                <Pressable style={s.dialBox} onPress={() => setPickCountry(true)}>
                  <T s={18}>{flagOf(country.iso2)}</T>
                  <T w="med" s={16} c={C.ink}>{country.dial}</T>
                  <ChevronDown size={18} color={C.muted} />
                </Pressable>
                <TextInput value={mobile} onChangeText={setMobile} placeholder="Mobile number" placeholderTextColor={C.faint} keyboardType="phone-pad" style={[s.input, { flex: 1, marginTop: 0 }]} maxLength={15} returnKeyType="done" onSubmitEditing={submitForm} />
              </View>
            </ScrollView>
            <View style={s.footer}>
              <PressableScale style={[s.submit, !canSubmit && s.submitOff]} disabled={!canSubmit} onPress={submitForm}>
                <T w="bold" s={16} c={canSubmit ? '#fff' : C.faint}>Submit</T>
              </PressableScale>
            </View>
          </>
        )}

        {/* ── loading / confirming ─────────────────────────────────────── */}
        {(step === 'loading' || step === 'confirming') && (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={C.ink} />
          </View>
        )}

        {/* ── STEP 3: schedule (day + time slot) ───────────────────────── */}
        {step === 'schedule' && (
          <>
            <View style={s.bubbleRow}>
              <MascotFace />
              <View style={s.bubble}>
                <View style={s.bubbleTail} />
                <T w="med" s={16} c={C.ink} style={{ lineHeight: 23 }}>Select a 1-hour time slot for your first session!</T>
              </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              <View style={s.dayGrid}>
                {days.map((d) => {
                  const on = day && day.key === d.key;
                  return (
                    <PressableScale key={d.key} style={[s.dayPill, on && s.dayPillOn]} onPress={() => { setDay(d); setSlot(null); }}>
                      <T w={on ? 'bold' : 'med'} s={15} c={on ? '#fff' : C.ink} numberOfLines={1}>{d.label}</T>
                    </PressableScale>
                  );
                })}
              </View>

              {/* Time slots reveal once a day is chosen (re-animates on each new day) */}
              {day && (
                <FadeIn key={day.key} y={10} style={{ marginTop: 26 }}>
                  <View style={s.periodTabs}>
                    {['Afternoon', 'Evening'].map((p) => {
                      const on = period === p;
                      const Ico = p === 'Afternoon' ? Sun : Moon;
                      return (
                        <Pressable key={p} style={s.periodTab} onPress={() => { setPeriod(p); setSlot(null); }}>
                          <View style={s.periodTabInner}>
                            <Ico size={18} color={on ? C.gold : C.faint} fill={on ? C.gold : 'none'} />
                            <T w={on ? 'bold' : 'med'} s={16} c={on ? C.ink : C.muted}>{p}</T>
                          </View>
                          {on && <View style={s.periodUnderline} />}
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={s.slotGrid}>
                    {slots.map((sl) => {
                      const on = slot && slot.t === sl.t;
                      if (sl.off) return <View key={sl.t} style={[s.slot, s.slotOff]}><T w="med" s={15} c={C.faint}>{sl.t}</T></View>;
                      return (
                        <PressableScale key={sl.t} style={[s.slot, on && s.slotOn]} onPress={() => setSlot(sl)}>
                          <T w={on ? 'bold' : 'med'} s={15} c={on ? '#fff' : C.ink}>{sl.t}</T>
                        </PressableScale>
                      );
                    })}
                  </View>
                </FadeIn>
              )}
            </ScrollView>

            <View style={s.footerBar}>
              <PressableScale style={[s.continue, !(day && slot) && s.continueOff]} disabled={!(day && slot)} onPress={continueSchedule}>
                <T w="bold" s={16} c={day && slot ? '#fff' : C.faint}>Continue</T>
              </PressableScale>
            </View>
          </>
        )}

        {/* ── STEP 5: confirmed ────────────────────────────────────────── */}
        {step === 'confirmed' && (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
            {/* Status banner + timeline — reveals on confirm */}
            <FadeIn y={12}>
            <View style={s.banner}>
              <View style={{ flexDirection: 'row' }}>
                <View style={s.tlCol}>
                  <View style={s.tlDone}><Check size={14} color="#fff" /></View>
                  <View style={s.tlLine} />
                </View>
                <View style={{ flex: 1 }}>
                  <T w="med" s={15} c={C.ink} style={{ lineHeight: 22 }}>Trial class scheduled - <T w="bold" s={15} c={C.ink}>{dateStr} at {timeStr}</T></T>
                  <PressableScale style={[s.calBtn, calEventId && s.calBtnDone]} disabled={addingCal || !!calEventId} onPress={handleAddToCalendar}>
                    {addingCal
                      ? <ActivityIndicator color={C.ink} size="small" />
                      : <T w="bold" s={15} c={calEventId ? C.green : C.ink}>{calEventId ? '✓  Added to Calendar' : 'Add to Calendar'}</T>}
                  </PressableScale>
                </View>
              </View>
              <View style={{ flexDirection: 'row', marginTop: 4 }}>
                <View style={s.tlCol}><View style={s.tlPending} /></View>
                <T w="med" s={15} c={C.ink} style={{ flex: 1, lineHeight: 22 }}>Finding Your Tutor by {prevStr} at {timeStr}</T>
              </View>
            </View>
            </FadeIn>

            {/* What happens */}
            <T w="bold" s={22} c={C.ink} style={{ paddingHorizontal: 20, marginTop: 24, marginBottom: 14 }}>What happens in the trial class?</T>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
              {HAPPENS.map((h) => (
                <View key={h.title} style={s.hCard}>
                  <View style={[s.hArt, { backgroundColor: h.bg }]}><h.Icon size={44} color={C.ink} /></View>
                  <View style={{ padding: 16 }}>
                    <T w="bold" s={17} c={C.ink} style={{ marginBottom: 8 }}>{h.title}</T>
                    <T w="med" s={14} c={C.muted} style={{ lineHeight: 21 }}>{h.body(child)}</T>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Reschedule / Cancel */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginTop: 18 }}>
              <T w="med" s={14.5} c={C.muted}>Change of plans? </T>
              <Pressable onPress={() => { setSlot(null); setStep('schedule'); }}><T w="bold" s={14.5} c={C.ink} style={s.underline}>Reschedule</T></Pressable>
              <T w="med" s={14.5} c={C.muted}> or </T>
              <Pressable onPress={handleCancel}><T w="bold" s={14.5} c={C.ink} style={s.underline}>Cancel</T></Pressable>
            </View>

            {/* FAQs */}
            <T w="bold" s={22} c={C.ink} style={{ paddingHorizontal: 20, marginTop: 30, marginBottom: 6 }}>FAQs</T>
            <View style={{ paddingHorizontal: 20 }}>
              {(showAllFaq ? FAQS : FAQS.slice(0, 2)).map((f, i) => {
                const open = openFaq === i;
                return (
                  <View key={f.q} style={s.faq}>
                    <Pressable style={s.faqHead} onPress={() => setOpenFaq(open ? -1 : i)}>
                      <T w="bold" s={16} c={C.ink} style={{ flex: 1, lineHeight: 23 }}>{f.q}</T>
                      {open ? <X size={20} color={C.ink} /> : <Plus size={20} color={C.ink} />}
                    </Pressable>
                    {open && <T w="med" s={14.5} c={C.muted} style={{ lineHeight: 22, marginTop: 8 }}>{f.a}</T>}
                  </View>
                );
              })}
              <Pressable style={{ alignItems: 'center', paddingVertical: 16 }} onPress={() => { setShowAllFaq((v) => !v); setOpenFaq(-1); }}>
                <T w="bold" s={14.5} c={C.ink} style={s.underline}>{showAllFaq ? 'See Less' : 'See More'}</T>
              </Pressable>
            </View>

            {/* Achievers */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, marginTop: 20 }}>
              <T w="bold" s={22} c={C.ink}>AILERNOVA’s</T>
              <Star size={22} color="#E24BE2" fill="#E24BE2" />
              <T w="bold" s={22} c={C.ink}>Achievers</T>
            </View>
            <T w="med" s={14.5} c={C.muted} style={{ paddingHorizontal: 20, marginTop: 6, lineHeight: 21 }}>
              Students across 80+ countries are succeeding at school, competitions, and beyond!
            </T>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 14 }}>
              {ACHIEVERS.map((a) => (
                <View key={a.name} style={s.achCard}>
                  <View style={[s.achPhoto, { backgroundColor: a.bg }]}>
                    <View style={s.achAvatar}><User size={40} color="#fff" /></View>
                  </View>
                  <View style={{ backgroundColor: '#FCF1D6', padding: 14, alignItems: 'center' }}>
                    <T w="med" s={14} c={C.ink}>{a.name}</T>
                    <T w="bold" s={14.5} c={C.ink} style={{ marginTop: 3, textAlign: 'center' }}>{a.award}</T>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Community */}
            <T w="bold" s={22} c={C.ink} style={{ paddingHorizontal: 20, marginTop: 20 }}>Community of 200,000+ Ailernova learners</T>
            <T w="med" s={14.5} c={C.muted} style={{ paddingHorizontal: 20, marginTop: 6, lineHeight: 21 }}>
              Heartfelt stories of transformations, learnings, and achievements of our students!
            </T>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 14 }}>
              {COMMUNITY.map((c) => (
                <View key={c.name} style={s.comCard}>
                  <View style={[s.comPhoto, { backgroundColor: c.bg }]}>
                    <View style={s.comBadge}><T w="bold" s={11} c={C.ink}>{c.name}</T></View>
                    <User size={54} color="rgba(0,0,0,0.35)" />
                  </View>
                  <View style={{ backgroundColor: '#FCF1D6', padding: 16 }}>
                    <T w="bold" s={16} c={C.ink} style={{ marginBottom: 6 }}>{c.title}</T>
                    <T w="med" s={13.5} c={C.muted} style={{ lineHeight: 20 }}>{c.body}</T>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Footer */}
            <View style={s.footerBrand}>
              <View>
                <Wordmark size={18} />
                <T w="med" s={12} c={C.faint} style={{ marginTop: 2 }}>Making learning stick</T>
              </View>
              <View style={{ flexDirection: 'row', gap: 18 }}>
                <T w="semi" s={13} c={C.muted} style={s.underline}>Terms</T>
                <T w="semi" s={13} c={C.muted} style={s.underline}>Privacy</T>
              </View>
            </View>
          </ScrollView>

          {/* Sticky bottom bar */}
          <View style={s.stickyBar}>
            <T w="med" s={14.5} c={C.ink} style={{ marginBottom: 10 }}>Trial class scheduled – <T w="bold" s={14.5} c={C.ink}>{dateStr} at {timeStr}</T></T>
            <PressableScale style={[s.calBtnFull, calEventId && s.calBtnDone]} disabled={addingCal || !!calEventId} onPress={handleAddToCalendar}>
              {addingCal
                ? <ActivityIndicator color={C.ink} size="small" />
                : <T w="bold" s={15} c={calEventId ? C.green : C.ink}>{calEventId ? '✓  Added to Calendar' : 'Add to Calendar'}</T>}
            </PressableScale>
          </View>
        </>
        )}

        <PickerSheet visible={pickChild} title="Select child" options={kids} selected={child} onPick={(v) => { setChild(v); setPickChild(false); }} onClose={() => setPickChild(false)} />
        <CountryPicker visible={pickCountry} selected={country.iso2} onPick={(c) => { setCountry(c); setPickCountry(false); }} onClose={() => setPickCountry(false)} />
      </View>
    </Modal>
  );
}

function MascotFace() {
  return (
    <View style={s.mascot}>
      <View style={s.eyesRow}>
        <View style={s.eye}><View style={s.pupil} /></View>
        <View style={s.eye}><View style={s.pupil} /></View>
      </View>
      <View style={s.smile} />
    </View>
  );
}

function PickerSheet({ visible, title, options, selected, onPick, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          <T w="bold" s={15} c={C.ink} style={{ marginBottom: 6 }}>{title}</T>
          {options.map((opt) => {
            const on = opt === selected;
            return (
              <PressableScale key={opt} style={s.optRow} onPress={() => onPick(opt)}>
                <T w={on ? 'bold' : 'med'} s={16} c={on ? C.blue : C.ink}>{opt}</T>
                {on && <Check size={18} color={C.blue} />}
              </PressableScale>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === 'android' ? 28 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },

  field: { borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingHorizontal: 16, height: 60, justifyContent: 'center', marginTop: 22 },
  fieldLabelWrap: { position: 'absolute', top: -9, left: 12, backgroundColor: C.bg, paddingHorizontal: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: { borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingHorizontal: 16, height: 60, color: C.ink, fontSize: 17, fontFamily: F.med, marginTop: 22 },
  mobileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22 },
  dialBox: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingHorizontal: 12, height: 60 },

  footer: { padding: 20, paddingBottom: 28 },
  submit: { backgroundColor: C.ink, borderRadius: 30, paddingVertical: 17, alignItems: 'center' },
  submitOff: { backgroundColor: '#EDEDEF' },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  bubbleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 20, paddingTop: 16 },
  mascot: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#E24BE2', alignItems: 'center', justifyContent: 'center' },
  eyesRow: { flexDirection: 'row', gap: 8 },
  eye: { width: 17, height: 17, borderRadius: 9, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  pupil: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#1A1A1A' },
  smile: { width: 22, height: 11, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderWidth: 2.4, borderTopWidth: 0, borderColor: '#1A1A1A', marginTop: 5 },
  bubble: { flex: 1, backgroundColor: '#F2F2F3', borderRadius: 14, padding: 16, marginTop: 8 },
  bubbleTail: { position: 'absolute', left: -7, top: 18, width: 0, height: 0, borderTopWidth: 7, borderTopColor: 'transparent', borderBottomWidth: 7, borderBottomColor: 'transparent', borderRightWidth: 8, borderRightColor: '#F2F2F3' },

  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  dayPill: { width: COL2_W, borderWidth: 1.5, borderColor: '#D7D7DB', borderRadius: 26, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  dayPillOn: { backgroundColor: C.ink, borderColor: C.ink },

  periodTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 18 },
  periodTab: { marginRight: 28, paddingBottom: 10 },
  periodTabInner: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  periodUnderline: { position: 'absolute', left: 0, right: 0, bottom: -1, height: 2.5, backgroundColor: C.ink, borderRadius: 2 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  slot: { width: COL3_W, borderWidth: 1.5, borderColor: '#D7D7DB', borderRadius: 24, paddingVertical: 14, alignItems: 'center' },
  slotOn: { backgroundColor: C.ink, borderColor: C.ink },
  slotOff: { backgroundColor: '#EDEDEF', borderColor: '#EDEDEF' },

  footerBar: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, borderTopWidth: 1, borderTopColor: C.border },
  continue: { backgroundColor: C.ink, borderRadius: 12, paddingVertical: 17, alignItems: 'center' },
  continueOff: { backgroundColor: '#C9C9CE' },

  banner: { backgroundColor: '#FCF1D6', paddingHorizontal: 20, paddingVertical: 18 },
  tlCol: { width: 34, alignItems: 'center' },
  tlDone: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' },
  tlLine: { width: 2, flex: 1, backgroundColor: '#E4CE93', marginVertical: 3 },
  tlPending: { width: 22, height: 22, borderRadius: 11, borderWidth: 2.5, borderColor: C.gold, backgroundColor: 'transparent' },
  calBtn: { backgroundColor: C.gold, borderRadius: 6, paddingVertical: 14, alignItems: 'center', marginTop: 12, marginBottom: 6 },

  hCard: { width: 250, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  hArt: { height: 130, alignItems: 'center', justifyContent: 'center' },

  underline: { textDecorationLine: 'underline' },
  faq: { borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 18 },
  faqHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },

  achCard: { width: 210, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  achPhoto: { height: 200, alignItems: 'center', justifyContent: 'center' },
  achAvatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(0,0,0,0.18)', alignItems: 'center', justifyContent: 'center' },
  comCard: { width: 270, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  comPhoto: { height: 200, alignItems: 'center', justifyContent: 'center' },
  comBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#FCF1D6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4 },
  footerBrand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F4F4F5', paddingHorizontal: 20, paddingVertical: 20, marginTop: 24 },
  stickyBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#FCF1D6', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24, borderTopWidth: 1, borderTopColor: '#EAD9A8' },
  calBtnFull: { backgroundColor: C.gold, borderRadius: 8, paddingVertical: 15, alignItems: 'center' },
  calBtnDone: { backgroundColor: C.greenSoft },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30 },
  optRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
});
