// src/screens/parent/ParentApp/BookDemo.js
// ── Book a FREE demo class — premium, in-app flow ─────────────────────────────
// A calm, Apple/Linear-grade booking experience (NOT the old yellow/rocket sheet):
//   intro → details → schedule (date + time) → scheduling… → success
// Reuses the parent design system (C · F · T · PressableScale · FadeIn) + the shared
// demoConfig helpers, so the flow and the dashboard card stay perfectly in sync.
// Booking runs on in-memory state (onBooked lifts the finished booking to the
// dashboard); persistence/backend land later. "Add to Calendar" is REAL — it writes a
// device-calendar event via ./calendar and stores the returned id on the booking.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, ScrollView, TextInput, Modal, Pressable, StyleSheet, Platform,
  ActivityIndicator, KeyboardAvoidingView, Animated, Easing, Alert, Linking,
} from 'react-native';
import {
  ArrowLeft, ChevronDown, ChevronRight, Check, Clock, Video, ShieldCheck,
  Sparkles, CalendarPlus, PartyPopper, GraduationCap,
} from 'lucide-react-native';
import { C, F, T } from './constants';
import { PressableScale, FadeIn } from './anim';
import CountryPicker from './CountryPicker';
import { findCountry, flagOf } from './countries';
import {
  CLASSES, BOARDS, SUBJECTS, GOALS, DEMO_DURATION_MIN,
  buildDays, buildSlots, PERIODS, fmtDateLong, fmtTime,
} from './demoConfig';
import { addDemoToCalendar } from './calendar';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------- tiny building blocks (local, no duplication) ---------- */

// Floating-label field wrapper with an optional inline error.
function Field({ label, error, children, onPress, focused }) {
  const Wrap = onPress ? Pressable : View;
  return (
    <View style={{ marginBottom: 16 }}>
      <Wrap onPress={onPress} style={[s.field, focused && s.fieldOn, !!error && s.fieldErr]}>
        <T w="semi" s={11} c={error ? C.red : C.muted} style={s.fieldLabel}>{label}</T>
        {children}
      </Wrap>
      {!!error && <T w="med" s={12} c={C.red} style={{ marginTop: 5, marginLeft: 4 }}>{error}</T>}
    </View>
  );
}

function SelectField({ label, value, placeholder, error, onPress }) {
  return (
    <Field label={label} error={error} onPress={onPress}>
      <View style={s.rowBetween}>
        <T w="semi" s={16} c={value ? C.ink : C.faint}>{value || placeholder}</T>
        <ChevronDown size={20} color={C.muted} />
      </View>
    </Field>
  );
}

// Bottom-sheet single-select (Class / Board / Subject).
function SelectSheet({ visible, title, options, selected, onPick, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.pickerSheet} onPress={(e) => e.stopPropagation()}>
          <View style={s.grab} />
          <T w="bold" s={17} c={C.ink} style={{ marginBottom: 8 }}>{title}</T>
          <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
            {options.map((opt) => {
              const on = opt === selected;
              return (
                <PressableScale key={opt} style={s.optRow} onPress={() => onPick(opt)}>
                  <T w={on ? 'bold' : 'med'} s={16} c={on ? C.blue : C.ink}>{opt}</T>
                  {on && <Check size={18} color={C.blue} />}
                </PressableScale>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Chip({ label, on, disabled, onPress }) {
  return (
    <PressableScale
      disabled={disabled}
      onPress={onPress}
      style={[s.chip, on && s.chipOn, disabled && s.chipOff]}
    >
      <T w={on ? 'bold' : 'semi'} s={13.5} c={on ? '#fff' : disabled ? C.faint : C.ink}>{label}</T>
    </PressableScale>
  );
}

function Benefit({ Icon, title, body, tint }) {
  return (
    <View style={s.benefitRow}>
      <View style={[s.benefitIcon, { backgroundColor: tint }]}><Icon size={19} color={C.ink} strokeWidth={2.2} /></View>
      <View style={{ flex: 1 }}>
        <T w="bold" s={15} c={C.ink}>{title}</T>
        <T w="med" s={13} c={C.muted} style={{ marginTop: 1, lineHeight: 18 }}>{body}</T>
      </View>
    </View>
  );
}

// A slim progress rail across the top of the multi-step body.
function StepRail({ index, total }) {
  return (
    <View style={s.rail}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[s.railSeg, i <= index && s.railSegOn]} />
      ))}
    </View>
  );
}

/* ---------- the flow ---------- */

export default function BookDemo({
  visible, onClose, mode = 'new', initialBooking = null, defaults = {}, onBooked,
}) {
  const rescheduling = mode === 'reschedule' && !!initialBooking;

  // Step machine. Reschedule jumps straight to picking a new slot.
  const [step, setStep] = useState(rescheduling ? 'schedule' : 'intro');

  // Student + parent details (prefilled from a reschedule or the linked profile).
  const src = initialBooking || {};
  const [studentName, setStudentName] = useState(src.student?.name || defaults.studentName || '');
  const [className, setClassName] = useState(src.student?.className || defaults.className || '');
  const [board, setBoard] = useState(src.student?.board || '');
  const [subject, setSubject] = useState(src.student?.subject || '');
  const [goal, setGoal] = useState(src.student?.goal || '');
  const [parentName, setParentName] = useState(src.parent?.name || defaults.parentName || '');
  const [country, setCountry] = useState(findCountry('IN') || { name: 'India', iso2: 'IN', dial: '+91' });
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState(src.parent?.email || defaults.email || '');

  // Scheduling
  const [day, setDay] = useState(null);
  const [period, setPeriod] = useState('Afternoon');
  const [slot, setSlot] = useState(null);

  const [errors, setErrors] = useState({});
  const [focus, setFocus] = useState('');
  const [pick, setPick] = useState('');          // '', 'class', 'board', 'subject', 'country'
  const [addingCal, setAddingCal] = useState(false);
  const [confirmed, setConfirmed] = useState(null); // the finished booking (success screen)
  const mountedRef = useRef(true);
  // Re-arm on mount — an effect cleanup also runs on Fast Refresh (and under
  // StrictMode's double-invoke) and refs survive it, so a setup that only clears the
  // flag leaves it false forever and every guarded setState below is silently
  // dropped (the booking succeeds but the sheet never leaves "scheduling…").
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  // Rebuild the pickable days each time the sheet opens (so "today" is always right).
  const days = useMemo(() => buildDays(14), [visible]);
  const slots = useMemo(() => (day ? buildSlots(day, period) : []), [day, period]);
  const periodHasSlots = useMemo(
    () => (day ? PERIODS.map((p) => ({ key: p.key, any: buildSlots(day, p.key).some((sl) => sl.available) })) : []),
    [day],
  );

  useEffect(() => {
    if (!visible) return;
    // Hydrate the form from the booking being rescheduled (or the linked profile),
    // so the flow is always correct regardless of when the component first mounted.
    const s0 = initialBooking || {};
    setStudentName(s0.student?.name || defaults.studentName || '');
    setClassName(s0.student?.className || defaults.className || '');
    setBoard(s0.student?.board || '');
    setSubject(s0.student?.subject || '');
    setGoal(s0.student?.goal || '');
    setParentName(s0.parent?.name || defaults.parentName || '');
    setEmail(s0.parent?.email || defaults.email || '');
    // reset transient bits on each open
    setStep(rescheduling ? 'schedule' : 'intro');
    setDay(null); setSlot(null); setPeriod('Afternoon'); setErrors({}); setConfirmed(null); setAddingCal(false);
    if (!rescheduling) setMobile('');
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const digits = mobile.replace(/\D/g, '');

  const validateDetails = () => {
    const e = {};
    if (studentName.trim().length < 2) e.studentName = 'Please enter your child’s name';
    if (!className) e.className = 'Select a class';
    if (!board) e.board = 'Select a board';
    if (!subject) e.subject = 'Choose a subject';
    if (parentName.trim().length < 2) e.parentName = 'Please enter your name';
    if (digits.length < 8) e.mobile = 'Enter a valid phone number';
    if (!EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goDetailsNext = () => { if (validateDetails()) setStep('schedule'); };

  // Build the final booking object (new or an update that keeps id + calendar link).
  // On a reschedule the details step is skipped, so fall back to the saved phone.
  const buildBooking = () => ({
    id: src.id || `demo_${Date.now().toString(36)}`,
    student: { name: studentName.trim(), className, board, subject, goal: goal || null },
    parent: { name: parentName.trim(), phone: digits ? `${country.dial}${digits}` : (src.parent?.phone || ''), email: email.trim() },
    date: slot.iso,
    durationMin: DEMO_DURATION_MIN,
    status: src.status && src.status !== 'cancelled' ? src.status : 'scheduled',
    tutor: src.tutor || null,
    meetingUrl: src.meetingUrl || null,
    calendarEventId: src.calendarEventId || null,
    createdAt: src.createdAt || Date.now(),
    updatedAt: Date.now(),
  });

  const confirmSchedule = () => {
    if (!day || !slot) return;
    const booking = buildBooking();
    setConfirmed(booking);
    setStep('scheduling');
  };

  // Fake the network beat, persist, then reveal the success screen.
  useEffect(() => {
    if (step !== 'scheduling' || !confirmed) return undefined;
    const t = setTimeout(async () => {
      try { onBooked && (await onBooked(confirmed)); } catch (_) { /* persistence is best-effort */ }
      setStep('success');
    }, 1500);
    return () => clearTimeout(t);
  }, [step, confirmed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Real device-calendar sync. Guarded so multiple taps can't create duplicate events
  // (button is also disabled + hidden once synced). Stores the returned event id on the
  // booking and lifts it to the dashboard. Permission / failure handled gracefully.
  const addToCalendar = async () => {
    if (!confirmed || confirmed.calendarEventId || addingCal) return;
    setAddingCal(true);
    try {
      const res = await addDemoToCalendar(confirmed);
      if (!mountedRef.current) return;
      if (res.ok) {
        const synced = { ...confirmed, calendarEventId: res.eventId };
        setConfirmed(synced);
        onBooked && onBooked(synced);
      } else if (res.reason === 'denied') {
        Alert.alert(
          'Calendar access needed',
          'Allow calendar access so we can add your demo and remind you 30 minutes before it starts.',
          [{ text: 'Not now', style: 'cancel' }, { text: 'Open Settings', onPress: () => Linking.openSettings() }],
        );
      } else {
        Alert.alert('Couldn’t add to calendar', 'We couldn’t reach a calendar on this device. Your demo is still booked.');
      }
    } catch (_) {
      if (mountedRef.current) Alert.alert('Couldn’t add to calendar', 'Something went wrong. Your demo is still booked.');
    } finally {
      if (mountedRef.current) setAddingCal(false);
    }
  };

  const back = () => {
    if (step === 'schedule' && !rescheduling) return setStep('details');
    if (step === 'details') return setStep('intro');
    // intro, success, or a reschedule's schedule step → leave the flow
    return onClose && onClose();
  };

  const stepIndex = { details: 0, schedule: 1 }[step];
  const showRail = step === 'details' || step === 'schedule';
  const title = step === 'success' ? '' : rescheduling ? 'Reschedule demo' : 'Free demo class';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={back} statusBarTranslucent>
      <View style={s.screen}>
        {/* Header */}
        {step !== 'scheduling' && (
          <View style={s.header}>
            <PressableScale style={s.iconBtn} onPress={back}>
              <ArrowLeft size={22} color={C.ink} />
            </PressableScale>
            <T w="bold" s={17} c={C.ink}>{title}</T>
            <View style={{ width: 40 }} />
          </View>
        )}
        {showRail && <StepRail index={stepIndex} total={2} />}

        {/* ── STEP 1 · INTRO ─────────────────────────────────────────── */}
        {step === 'intro' && (
          <FadeIn style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
              <View style={s.hero}>
                <View style={s.heroBadge}><T w="bold" s={11.5} c={C.blue}>100% FREE · NO CARD NEEDED</T></View>
                <T w="xbold" s={27} c={C.ink} style={{ lineHeight: 33, marginTop: 14 }}>A live 1:1 demo,{'\n'}built around your child.</T>
                <T w="med" s={14.5} c={C.muted} style={{ marginTop: 10, lineHeight: 21 }}>
                  Meet a certified Ailernova mentor, see how we teach, and get a personalised plan — in 45 focused minutes.
                </T>
                <View style={s.heroStats}>
                  <View style={s.heroStat}><T w="xbold" s={18} c={C.ink}>4.9★</T><T w="med" s={11.5} c={C.muted}>11K+ ratings</T></View>
                  <View style={s.heroDivide} />
                  <View style={s.heroStat}><T w="xbold" s={18} c={C.ink}>50K+</T><T w="med" s={11.5} c={C.muted}>demos taught</T></View>
                  <View style={s.heroDivide} />
                  <View style={s.heroStat}><T w="xbold" s={18} c={C.ink}>80+</T><T w="med" s={11.5} c={C.muted}>countries</T></View>
                </View>
              </View>

              <View style={s.benefitCard}>
                <Benefit Icon={Clock} tint="#EAEFFF" title="45 minutes, 1:1" body="Undivided attention — just your child and the mentor." />
                <View style={s.hair} />
                <Benefit Icon={GraduationCap} tint="#E4F4EA" title="A certified mentor" body="Hand-picked for your child’s class, board and subject." />
                <View style={s.hair} />
                <Benefit Icon={Video} tint="#FDEBE2" title="Live & online" body="Join from home. A link arrives before the class." />
                <View style={s.hair} />
                <Benefit Icon={ShieldCheck} tint="#F2EAFE" title="Zero pressure" body="No payment now. Continue only if you love it." />
              </View>
            </ScrollView>
            <View style={s.footer}>
              <PressableScale style={s.primary} onPress={() => setStep('details')}>
                <T w="bold" s={16} c="#fff">Book my free demo</T>
                <ChevronRight size={19} color="#fff" />
              </PressableScale>
              <T w="med" s={12.5} c={C.faint} style={{ textAlign: 'center', marginTop: 10 }}>Takes under a minute · cancel anytime</T>
            </View>
          </FadeIn>
        )}

        {/* ── STEP 2 · DETAILS ───────────────────────────────────────── */}
        {step === 'details' && (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
            <FadeIn style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <T w="bold" s={13} c={C.faint} style={s.section}>ABOUT THE STUDENT</T>
                <Field label="Student's name" error={errors.studentName} focused={focus === 'sn'}>
                  <TextInput value={studentName} onChangeText={setStudentName} onFocus={() => setFocus('sn')} onBlur={() => setFocus('')}
                    placeholder="e.g. Ananya" placeholderTextColor={C.faint} style={s.input} returnKeyType="next" />
                </Field>
                <View style={s.two}>
                  <View style={{ flex: 1 }}><SelectField label="Class" value={className} placeholder="Select" error={errors.className} onPress={() => setPick('class')} /></View>
                  <View style={{ flex: 1 }}><SelectField label="Board" value={board} placeholder="Select" error={errors.board} onPress={() => setPick('board')} /></View>
                </View>
                <SelectField label="Preferred subject" value={subject} placeholder="Choose a subject" error={errors.subject} onPress={() => setPick('subject')} />
                <T w="semi" s={12.5} c={C.muted} style={{ marginTop: 2, marginBottom: 10 }}>Learning goal <T w="med" s={12.5} c={C.faint}>(optional)</T></T>
                <View style={s.chipsWrap}>
                  {GOALS.map((g) => <Chip key={g} label={g} on={goal === g} onPress={() => setGoal(goal === g ? '' : g)} />)}
                </View>

                <T w="bold" s={13} c={C.faint} style={s.section}>PARENT CONTACT</T>
                <Field label="Your name" error={errors.parentName} focused={focus === 'pn'}>
                  <TextInput value={parentName} onChangeText={setParentName} onFocus={() => setFocus('pn')} onBlur={() => setFocus('')}
                    placeholder="Parent / guardian name" placeholderTextColor={C.faint} style={s.input} returnKeyType="next" />
                </Field>
                <Field label="Phone number" error={errors.mobile} focused={focus === 'ph'}>
                  <View style={s.phoneRow}>
                    <Pressable style={s.dial} onPress={() => setPick('country')}>
                      <T s={16}>{flagOf(country.iso2)}</T>
                      <T w="semi" s={15} c={C.ink}>{country.dial}</T>
                      <ChevronDown size={16} color={C.muted} />
                    </Pressable>
                    <TextInput value={mobile} onChangeText={setMobile} onFocus={() => setFocus('ph')} onBlur={() => setFocus('')}
                      placeholder="Mobile number" placeholderTextColor={C.faint} keyboardType="phone-pad" maxLength={15}
                      style={[s.input, { flex: 1 }]} returnKeyType="next" />
                  </View>
                </Field>
                <Field label="Email" error={errors.email} focused={focus === 'em'}>
                  <TextInput value={email} onChangeText={setEmail} onFocus={() => setFocus('em')} onBlur={() => setFocus('')}
                    placeholder="you@email.com" placeholderTextColor={C.faint} keyboardType="email-address" autoCapitalize="none"
                    autoCorrect={false} style={s.input} returnKeyType="done" onSubmitEditing={goDetailsNext} />
                </Field>
              </ScrollView>
              <View style={s.footer}>
                <PressableScale style={s.primary} onPress={goDetailsNext}>
                  <T w="bold" s={16} c="#fff">Continue</T>
                  <ChevronRight size={19} color="#fff" />
                </PressableScale>
              </View>
            </FadeIn>
          </KeyboardAvoidingView>
        )}

        {/* ── STEP 3+4 · SCHEDULE (date + time) ──────────────────────── */}
        {step === 'schedule' && (
          <FadeIn style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 10, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
              <T w="bold" s={19} c={C.ink}>Pick a day</T>
              <T w="med" s={13.5} c={C.muted} style={{ marginTop: 3, marginBottom: 14 }}>Next 2 weeks · all times shown in your local timezone.</T>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
                {days.map((d) => {
                  const on = day && day.key === d.key;
                  return (
                    <PressableScale key={d.key} disabled={!d.available}
                      onPress={() => { setDay(d); setSlot(null); }}
                      style={[s.dayCard, on && s.dayCardOn, !d.available && s.dayCardOff]}>
                      <T w="bold" s={12} c={on ? 'rgba(255,255,255,0.8)' : d.available ? C.muted : C.faint}>{d.dow}</T>
                      <T w="xbold" s={22} c={on ? '#fff' : d.available ? C.ink : C.faint} style={{ marginVertical: 2 }}>{d.dayNum}</T>
                      <T w="semi" s={11.5} c={on ? 'rgba(255,255,255,0.8)' : d.available ? C.muted : C.faint}>{d.month}</T>
                    </PressableScale>
                  );
                })}
              </ScrollView>

              {day ? (
                <FadeIn key={day.key} y={8} duration={280} style={{ marginTop: 26 }}>
                  <T w="bold" s={19} c={C.ink}>Pick a time</T>
                  <View style={s.periodTabs}>
                    {periodHasSlots.map((p) => {
                      const on = period === p.key;
                      return (
                        <Pressable key={p.key} onPress={() => p.any && setPeriod(p.key)} style={s.periodTab}>
                          <T w={on ? 'bold' : 'semi'} s={14.5} c={!p.any ? C.faint : on ? C.ink : C.muted}>{p.key}</T>
                          {on && <View style={s.periodBar} />}
                        </Pressable>
                      );
                    })}
                  </View>
                  <View style={s.slotWrap}>
                    {slots.map((sl) => {
                      const on = slot && slot.iso === sl.iso;
                      return (
                        <PressableScale key={sl.iso} disabled={!sl.available}
                          onPress={() => setSlot(sl)}
                          style={[s.slot, on && s.slotOn, !sl.available && s.slotOff]}>
                          <T w={on ? 'bold' : 'semi'} s={13.5} c={on ? '#fff' : sl.available ? C.ink : C.faint}>{sl.label}</T>
                          {on && <FadeIn duration={220} y={0}><Check size={15} color="#fff" strokeWidth={3} /></FadeIn>}
                        </PressableScale>
                      );
                    })}
                    {slots.every((sl) => !sl.available) && (
                      <View style={s.slotEmpty}>
                        <T w="semi" s={13.5} c={C.muted}>No {period.toLowerCase()} slots left — try another period or day.</T>
                      </View>
                    )}
                  </View>
                </FadeIn>
              ) : (
                <View style={s.pickHint}>
                  <T w="med" s={13.5} c={C.faint}>Select a day to see open times.</T>
                </View>
              )}
            </ScrollView>
            <View style={s.footer}>
              {slot && (
                <T w="semi" s={13.5} c={C.muted} style={{ textAlign: 'center', marginBottom: 10 }}>
                  {fmtDateLong(slot.iso)} · <T w="bold" s={13.5} c={C.ink}>{fmtTime(slot.iso)}</T> · {DEMO_DURATION_MIN} min
                </T>
              )}
              <PressableScale style={[s.primary, !(day && slot) && s.primaryOff]} disabled={!(day && slot)} onPress={confirmSchedule}>
                <T w="bold" s={16} c={day && slot ? '#fff' : C.faint}>{rescheduling ? 'Confirm new time' : 'Confirm booking'}</T>
              </PressableScale>
            </View>
          </FadeIn>
        )}

        {/* ── SCHEDULING (loading) ───────────────────────────────────── */}
        {step === 'scheduling' && (
          <View style={s.loadingWrap}>
            <PulseRing />
            <T w="bold" s={19} c={C.ink} style={{ marginTop: 30 }}>{rescheduling ? 'Updating your demo…' : 'Scheduling your demo…'}</T>
            <T w="med" s={14} c={C.muted} style={{ marginTop: 6, textAlign: 'center', paddingHorizontal: 40 }}>
              Reserving your slot and preparing a mentor match.
            </T>
          </View>
        )}

        {/* ── STEP 5 · SUCCESS ───────────────────────────────────────── */}
        {step === 'success' && confirmed && (
          <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 6, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
            <SuccessCheck />
            <T w="xbold" s={25} c={C.ink} style={{ textAlign: 'center', marginTop: 18 }}>You’re all set! 🎉</T>
            <T w="med" s={14.5} c={C.muted} style={{ textAlign: 'center', marginTop: 6, lineHeight: 21 }}>
              {studentName.trim() || 'Your child'}’s free demo class is booked.
            </T>

            {/* Confirmation card */}
            <View style={s.confirmCard}>
              <View style={s.confirmHeadRow}>
                <View style={s.confirmDateBadge}>
                  <T w="bold" s={11} c="#fff">{fmtDateLong(confirmed.date).split(',')[0].toUpperCase()}</T>
                  <T w="xbold" s={22} c="#fff">{new Date(confirmed.date).getDate()}</T>
                </View>
                <View style={{ flex: 1 }}>
                  <T w="xbold" s={17} c={C.ink}>{fmtTime(confirmed.date)}</T>
                  <T w="med" s={13} c={C.muted}>{fmtDateLong(confirmed.date)}</T>
                </View>
                <View style={s.freePill}><T w="bold" s={11} c={C.green}>FREE</T></View>
              </View>
              <View style={s.hair} />
              <Row label="Class type" value="Online · 1:1 live" />
              <Row label="Subject" value={confirmed.student.subject} />
              <Row label="Duration" value={`${confirmed.durationMin} minutes`} />
              <Row label="Mentor" value={confirmed.tutor?.name || 'Assigning your mentor'} pending={!confirmed.tutor} />
            </View>

            {/* Timeline */}
            <View style={s.timeline}>
              <TL done first title="Demo scheduled" body={`${fmtDateLong(confirmed.date)} at ${fmtTime(confirmed.date)}`} />
              <TL pending title="Tutor assignment" body="We’ll match a mentor a day before your class." />
              <TL done={!!confirmed.calendarEventId} last
                title={confirmed.calendarEventId ? 'Reminder set' : 'Add a reminder'}
                body={confirmed.calendarEventId ? '30 minutes before the class' : 'Sync to your calendar below'} />
            </View>

            {/* Primary + secondary */}
            {confirmed.calendarEventId ? (
              <View style={[s.primary, s.calDone]}>
                <Check size={18} color={C.green} strokeWidth={3} />
                <T w="bold" s={16} c={C.green}>Added to your calendar</T>
              </View>
            ) : (
              <PressableScale style={s.primary} onPress={addToCalendar} disabled={addingCal}>
                {addingCal ? <ActivityIndicator color="#fff" size="small" /> : <CalendarPlus size={19} color="#fff" />}
                <T w="bold" s={16} c="#fff">{addingCal ? 'Syncing…' : 'Add to Calendar'}</T>
              </PressableScale>
            )}
            <PressableScale style={s.secondary} onPress={onClose}>
              <T w="bold" s={16} c={C.ink}>Done</T>
            </PressableScale>
          </ScrollView>
        )}

        {/* Pickers */}
        <SelectSheet visible={pick === 'class'} title="Select class" options={CLASSES} selected={className} onClose={() => setPick('')}
          onPick={(v) => { setClassName(v); setErrors((e) => ({ ...e, className: undefined })); setPick(''); }} />
        <SelectSheet visible={pick === 'board'} title="Select board" options={BOARDS} selected={board} onClose={() => setPick('')}
          onPick={(v) => { setBoard(v); setErrors((e) => ({ ...e, board: undefined })); setPick(''); }} />
        <SelectSheet visible={pick === 'subject'} title="Preferred subject" options={SUBJECTS} selected={subject} onClose={() => setPick('')}
          onPick={(v) => { setSubject(v); setErrors((e) => ({ ...e, subject: undefined })); setPick(''); }} />
        <CountryPicker visible={pick === 'country'} selected={country.iso2} onClose={() => setPick('')}
          onPick={(c) => { setCountry(c); setPick(''); }} />
      </View>
    </Modal>
  );
}

/* ---------- success-screen atoms + animations ---------- */

function Row({ label, value, pending }) {
  return (
    <View style={s.kv}>
      <T w="med" s={13.5} c={C.muted}>{label}</T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        {pending && <View style={s.pendingDot} />}
        <T w="bold" s={13.5} c={pending ? C.peachInk : C.ink}>{value}</T>
      </View>
    </View>
  );
}

function TL({ done, pending, first, last, title, body }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      <View style={{ width: 30, alignItems: 'center' }}>
        <View style={[s.tlNode, done && s.tlDone, pending && s.tlPending]}>
          {done && <Check size={12} color="#fff" strokeWidth={3} />}
        </View>
        {!last && <View style={s.tlLine} />}
      </View>
      <View style={{ flex: 1, paddingBottom: last ? 0 : 16 }}>
        <T w="bold" s={14.5} c={C.ink}>{title}</T>
        <T w="med" s={13} c={C.muted} style={{ marginTop: 1, lineHeight: 18 }}>{body}</T>
      </View>
    </View>
  );
}

// A soft pulsing ring for the scheduling state (native-driven scale + fade loop).
function PulseRing() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(a, { toValue: 1, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [a]);
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.6] });
  const opacity = a.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });
  return (
    <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[s.pulse, { transform: [{ scale }], opacity }]} />
      <View style={s.pulseCore}><Sparkles size={30} color="#fff" /></View>
    </View>
  );
}

// The success checkmark springs in.
function SuccessCheck() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(a, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
  }, [a]);
  return (
    <View style={{ alignItems: 'center', marginTop: 8 }}>
      <Animated.View style={[s.successRing, { transform: [{ scale: a }] }]}>
        <PartyPopper size={34} color={C.green} />
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === 'android' ? 28 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  rail: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingBottom: 12 },
  railSeg: { flex: 1, height: 4, borderRadius: 3, backgroundColor: '#ECECEE' },
  railSegOn: { backgroundColor: C.blue },

  // intro
  hero: { backgroundColor: '#F7F8FB', borderRadius: 24, padding: 22, borderWidth: 1, borderColor: '#EDEEF2' },
  heroBadge: { alignSelf: 'flex-start', backgroundColor: C.blueSoft, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  heroStats: { flexDirection: 'row', alignItems: 'center', marginTop: 20, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#EDEEF2' },
  heroStat: { flex: 1, alignItems: 'center', gap: 2 },
  heroDivide: { width: 1, height: 30, backgroundColor: '#ECECEE' },
  benefitCard: { backgroundColor: '#fff', borderRadius: 22, padding: 6, marginTop: 16, borderWidth: 1, borderColor: C.border },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 12 },
  benefitIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  hair: { height: 1, backgroundColor: C.border, marginVertical: 2 },

  // fields
  section: { letterSpacing: 1, marginTop: 18, marginBottom: 14 },
  field: { borderWidth: 1.5, borderColor: C.border, borderRadius: 15, paddingHorizontal: 15, paddingTop: 20, paddingBottom: 9, backgroundColor: '#fff', minHeight: 62, justifyContent: 'center' },
  fieldOn: { borderColor: C.blue },
  fieldErr: { borderColor: C.red },
  fieldLabel: { position: 'absolute', top: 9, left: 15, letterSpacing: 0.3 },
  input: { color: C.ink, fontSize: 16, fontFamily: F.semi, padding: 0, margin: 0 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  two: { flexDirection: 'row', gap: 12 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dial: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F5F5F7', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  chip: { borderWidth: 1.5, borderColor: C.border, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#fff' },
  chipOn: { backgroundColor: C.ink, borderColor: C.ink },
  chipOff: { backgroundColor: '#F6F6F7', borderColor: '#F0F0F2' },

  // schedule
  dayCard: { width: 62, borderRadius: 18, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', paddingVertical: 13, backgroundColor: '#fff' },
  dayCardOn: { backgroundColor: C.blue, borderColor: C.blue },
  dayCardOff: { backgroundColor: '#F7F7F8', borderColor: '#F1F1F3' },
  pickHint: { marginTop: 30, alignItems: 'center' },
  periodTabs: { flexDirection: 'row', gap: 26, borderBottomWidth: 1, borderBottomColor: C.border, marginTop: 14, marginBottom: 16 },
  periodTab: { paddingBottom: 11 },
  periodBar: { position: 'absolute', left: 0, right: 0, bottom: -1, height: 2.5, borderRadius: 2, backgroundColor: C.ink },
  slotWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slot: { flexGrow: 1, minWidth: '46%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingVertical: 14, backgroundColor: '#fff' },
  slotOn: { backgroundColor: C.blue, borderColor: C.blue },
  slotOff: { backgroundColor: '#F6F6F7', borderColor: '#F0F0F2' },
  slotEmpty: { width: '100%', paddingVertical: 20, alignItems: 'center' },

  // footer / buttons
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 26, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: '#fff' },
  primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.blue, borderRadius: 16, paddingVertical: 17 },
  primaryOff: { backgroundColor: '#EDEDEF' },
  secondary: { alignItems: 'center', justifyContent: 'center', borderRadius: 16, paddingVertical: 16, marginTop: 10, borderWidth: 1.5, borderColor: C.border },
  calDone: { backgroundColor: C.greenSoft, gap: 8 },

  // loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  pulse: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: C.blue },
  pulseCore: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },

  // success
  successRing: { width: 84, height: 84, borderRadius: 42, backgroundColor: C.greenSoft, alignItems: 'center', justifyContent: 'center' },
  confirmCard: { backgroundColor: '#fff', borderRadius: 22, borderWidth: 1, borderColor: C.border, padding: 16, marginTop: 22, shadowColor: '#141420', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  confirmHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 12 },
  confirmDateBadge: { width: 58, borderRadius: 14, backgroundColor: C.blue, alignItems: 'center', paddingVertical: 9 },
  freePill: { backgroundColor: C.greenSoft, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6 },
  kv: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9 },
  pendingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.gold },

  timeline: { marginTop: 22, marginBottom: 22, paddingHorizontal: 4 },
  tlNode: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: C.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  tlDone: { backgroundColor: C.green, borderColor: C.green },
  tlPending: { borderColor: C.gold, borderStyle: 'dashed' },
  tlLine: { width: 2, flex: 1, backgroundColor: C.border, marginVertical: 2 },

  // sheets
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 30 },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#E3E3E6', marginBottom: 14 },
  optRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
});
