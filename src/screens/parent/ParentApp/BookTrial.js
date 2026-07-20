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
  ArrowLeft, ChevronDown, Check, Sun, Moon, Users, CalendarDays, MapPin,
} from 'lucide-react-native';
import { C, F, T, DOWF, MONF } from './constants';
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

// Boards + grades for the lead form. IB and IGCSE are listed separately — they are
// different boards and a parent picking one shouldn't have to pick a combined label.
const BOARDS = ['CBSE', 'ICSE / ISC', 'State Board', 'IB', 'IGCSE', 'Other'];
const GRADES = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`);

// FRONTEND-ONLY OTP. The backend has the phone_otps table and MSG91 config but no
// send/verify implementation yet, so nothing is actually texted. This code is the
// stand-in; swap this block for the real /otp/send + /otp/verify calls when the
// service lands, and delete DEV_OTP.
const DEV_OTP = '123456';
const RESEND_SECONDS = 30;

// Post-booking personalisation survey (2 steps, shown on the confirmation screen and
// dismissed once finished). Copy is subject-neutral on purpose — we teach math AND
// science across Grades 1-12, so "how's your child doing in math" would exclude half
// the catalogue.
const LEVELS = [
  { key: 'support', title: 'NEEDS SUPPORT', body: 'Finding current topics difficult to grasp', color: '#F0733F' },
  { key: 'keeping', title: 'KEEPING UP', body: 'Meeting grade-level expectations with room to grow', color: '#F5B301' },
  { key: 'excelling', title: 'EXCELLING', body: 'Seeking more rigorous and challenging material', color: '#22B573' },
];
const FOCUS = [
  'Build fundamentals and boost confidence',
  'Keep up with homework and school exams',
  'Prepare for a contest or external test',
  'Qualify for accelerated / honors / gifted programs',
  'Enhance calculation speed and accuracy',
  'Make learning relatable and enjoyable',
  'Tackle advanced concepts and problems',
];




function Field({ label, children, onPress }) {
  const Wrap = onPress ? Pressable : View;
  return (
    <Wrap onPress={onPress} style={s.field}>
      {/* The floating label only exists once the field has a value — an empty notch
          cut into the border reads as a rendering bug. */}
      {!!label && <View style={s.fieldLabelWrap}><T w="med" s={12} c={C.muted}>{label}</T></View>}
      {children}
    </Wrap>
  );
}

// A bordered text box that keeps its label after you've typed. The placeholder alone
// isn't enough here: student name and parent name sit next to each other and look
// identical the moment both are filled in.
function LabeledInput({ label, value, ...rest }) {
  return (
    <View style={s.field}>
      {!!value && <View style={s.fieldLabelWrap}><T w="med" s={12} c={C.muted}>{label}</T></View>}
      <TextInput value={value} placeholder={label} placeholderTextColor={C.faint} style={s.fieldInput} {...rest} />
    </View>
  );
}

export default function BookTrial({ visible, onClose, childName, childList, parentName, initialBooking = null, onChange }) {
  const kids = useMemo(() => {
    const list = (childList && childList.length ? childList : [{ name: childName || 'Your child' }])
      .map((k) => (typeof k === 'string' ? k : k?.name)).filter(Boolean);
    return list.length ? list : ['Your child'];
  }, [childList, childName]);

  // `initialBooking` set → reschedule: skip the form, prefill, keep the calendar link.
  const [step, setStep] = useState(initialBooking ? 'schedule' : 'form'); // form | otp | loading | schedule | confirming | confirmed
  const [child, setChild] = useState(initialBooking?.student?.name || kids[0]);
  const [name, setName] = useState(initialBooking?.parent?.name || parentName || '');
  const [board, setBoard] = useState(initialBooking?.student?.board || '');
  const [grade, setGrade] = useState(initialBooking?.student?.className || '');
  const [country, setCountry] = useState(defaultCountry);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpErr, setOtpErr] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [pickBoard, setPickBoard] = useState(false);
  const [pickGrade, setPickGrade] = useState(false);
  // Survey: step 0 = level, 1 = focus areas, 2 = finished (card hidden).
  const [surveyStep, setSurveyStep] = useState(0);
  const [level, setLevel] = useState(null);
  const [focus, setFocus] = useState([]);
  const [day, setDay] = useState(null);
  const [period, setPeriod] = useState('Afternoon');
  const [slot, setSlot] = useState(null);
  const [pickChild, setPickChild] = useState(false);
  const [pickCountry, setPickCountry] = useState(false);
  const submittedRef = useRef(false);
  const otpInputRef = useRef(null);
  // Real calendar sync state.
  const [addingCal, setAddingCal] = useState(false);
  const [calEventId, setCalEventId] = useState(initialBooking?.calendarEventId || null);
  const bookingIdRef = useRef(initialBooking?.id || `demo_${Date.now().toString(36)}`);
  const mountedRef = useRef(true);
  // Re-arm on mount — an effect cleanup also runs on Fast Refresh (and under
  // StrictMode's double-invoke) and refs survive it, so a setup that only clears the
  // flag leaves it false forever and every guarded setState below is silently
  // dropped (the booking succeeds but the sheet never leaves "scheduling…").
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  // Reset / hydrate each time the sheet opens (fresh booking vs. reschedule).
  useEffect(() => {
    if (!visible) return;
    setStep(initialBooking ? 'schedule' : 'form');
    setCalEventId(initialBooking?.calendarEventId || null);
    bookingIdRef.current = initialBooking?.id || `demo_${Date.now().toString(36)}`;
    submittedRef.current = false;
    setSlot(null);
    setOtp(''); setOtpErr(''); setResendIn(0);
    setSurveyStep(0); setLevel(null); setFocus([]);
    if (!initialBooking) { setDay(null); setMobile(''); }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resend cooldown — ticks down while the OTP step is open.
  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const digits = mobile.replace(/\D/g, '');
  const canSubmit = !!child && child.trim().length > 1 && name.trim().length > 1
    && !!board && !!grade && digits.length >= 8;

  // Build the booking. Date = chosen day + the 1-hour slot's start (afternoon 12–4 PM,
  // evening 5–8 PM → 24h). Duration is 1 hour to match the "1-hour time slot" copy.
  const buildBooking = () => {
    const startHr = slot ? parseInt(slot.t.split('-')[0].trim(), 10) : 1;
    const h24 = startHr === 12 ? 12 : startHr + 12;
    const start = day ? new Date(day.date) : new Date();
    start.setHours(h24, 0, 0, 0);
    return {
      id: bookingIdRef.current,
      student: { name: child.trim(), className: grade, board, subject: '' },
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
    setStep('form'); setMobile(''); setDay(null); setSlot(null);
    setOtp(''); setOtpErr(''); setResendIn(0); submittedRef.current = false;
    onClose && onClose();
  };
  const back = () => {
    if (step === 'form' || step === 'confirmed') close();
    else if (step === 'otp') { setOtp(''); setOtpErr(''); setStep('form'); }
    else if (step === 'confirming') setStep('schedule');
    // The survey sits after the booking is already made — backing out of it returns
    // to the confirmation, never to the form.
    else if (step === 'survey1') setStep('confirmed');
    else if (step === 'survey2') { setSurveyStep(0); setStep('survey1'); }
    else setStep('form');
  };

  // Form → OTP. Nothing is texted yet (see DEV_OTP): this only arms the cooldown.
  const submitForm = () => {
    if (!canSubmit) return;
    setOtp(''); setOtpErr(''); setResendIn(RESEND_SECONDS);
    setStep('otp');
  };
  const verifyOtp = () => {
    if (otp.length !== 6) return;
    if (otp !== DEV_OTP) { setOtpErr('That code doesn’t match. Try again.'); return; }
    setOtpErr(''); setStep('loading');
  };
  const resendOtp = () => { if (resendIn <= 0) { setOtp(''); setOtpErr(''); setResendIn(RESEND_SECONDS); } };
  const continueSchedule = () => { if (day && slot) setStep('confirming'); };

  const headerTitle = step === 'form' ? 'Book a free class'
    : step === 'otp' ? 'Verify your number'
      : (step === 'survey1' || step === 'survey2') ? 'About your child'
        : 'For the trial class';

  // Derived date/time strings for the confirmation banner. AM/PM is derived from the
  // real 24h slot (afternoon 12–4 PM, evening 5–8 PM) rather than hardcoded.
  const startHr = slot ? parseInt(slot.t.split('-')[0].trim(), 10) : 1;
  const h24 = startHr === 12 ? 12 : startHr + 12;
  const timeStr = `${(h24 % 12) || 12}:00 ${h24 < 12 ? 'AM' : 'PM'}`;
  const dateStr = day ? `${MONF[day.date.getMonth()]} ${day.date.getDate()}` : '';
  // Confirmation card wants the long form ("Wednesday, Jul 22") and the full hour range.
  const DOWL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const longDateStr = day ? `${DOWL[day.date.getDay()]}, ${MONF[day.date.getMonth()]} ${day.date.getDate()}` : '';
  const endH24 = h24 + 1;
  const fmtHr = (h) => `${(h % 12) || 12}:00 ${h < 12 ? 'AM' : 'PM'}`;
  const rangeStr = slot ? `${fmtHr(h24)} - ${fmtHr(endH24)}` : '';

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
              {/* A parent with more than one linked child picks; everyone else (including
                  a brand-new lead with no linked children) types the name. */}
              {kids.length > 1 ? (
                <Field label="Student" onPress={() => setPickChild(true)}>
                  <View style={s.rowBetween}>
                    <T w="med" s={17} c={C.ink}>{child}</T>
                    <ChevronDown size={22} color={C.muted} />
                  </View>
                </Field>
              ) : (
                <LabeledInput label="Student's full name" value={child} onChangeText={setChild} returnKeyType="next" />
              )}
              <LabeledInput label="Parent's full name" value={name} onChangeText={setName} returnKeyType="next" />
              <Field label={board ? 'Board' : undefined} onPress={() => setPickBoard(true)}>
                <View style={s.rowBetween}>
                  <T w="med" s={17} c={board ? C.ink : C.faint}>{board || 'Select board'}</T>
                  <ChevronDown size={22} color={C.muted} />
                </View>
              </Field>
              <Field label={grade ? 'Class' : undefined} onPress={() => setPickGrade(true)}>
                <View style={s.rowBetween}>
                  <T w="med" s={17} c={grade ? C.ink : C.faint}>{grade || 'Select class'}</T>
                  <ChevronDown size={22} color={C.muted} />
                </View>
              </Field>
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

        {/* ── STEP 2: verify phone ─────────────────────────────────────── */}
        {step === 'otp' && (
          <>
            <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <T w="med" s={15.5} c={C.muted} style={{ lineHeight: 23 }}>
                We’ve sent a 6-digit code to{'\n'}
                <T w="bold" s={15.5} c={C.ink}>{country.dial} {digits}</T>
                <T w="med" s={15.5} c={C.muted}>  ·  </T>
                <T w="bold" s={15.5} c={C.ink} style={s.underline} onPress={() => setStep('form')}>Change</T>
              </T>

              {/* One real input holds the value; the six boxes are just its painted face. */}
              <Pressable style={s.otpRow} onPress={() => otpInputRef.current && otpInputRef.current.focus()}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <View key={i} style={[s.otpBox, otp.length === i && s.otpBoxActive, !!otpErr && s.otpBoxErr]}>
                    <T w="bold" s={22} c={C.ink}>{otp[i] || ''}</T>
                  </View>
                ))}
                <TextInput
                  ref={otpInputRef}
                  value={otp}
                  onChangeText={(v) => { setOtp(v.replace(/\D/g, '').slice(0, 6)); setOtpErr(''); }}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  style={s.otpHidden}
                  onSubmitEditing={verifyOtp}
                />
              </Pressable>

              {!!otpErr && <T w="med" s={14} c={C.red} style={{ marginTop: 12 }}>{otpErr}</T>}

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 22 }}>
                <T w="med" s={14.5} c={C.muted}>Didn’t get it? </T>
                <Pressable onPress={resendOtp} disabled={resendIn > 0}>
                  <T w="bold" s={14.5} c={resendIn > 0 ? C.faint : C.ink} style={resendIn > 0 ? null : s.underline}>
                    {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                  </T>
                </Pressable>
              </View>

              {/* Remove together with DEV_OTP once the real OTP service is wired up. */}
              <View style={s.otpHint}>
                <T w="med" s={13} c={C.muted} style={{ lineHeight: 19 }}>
                  Phone verification isn’t connected yet — no SMS is sent. Enter <T w="bold" s={13} c={C.ink}>{DEV_OTP}</T> to continue.
                </T>
              </View>
            </ScrollView>
            <View style={s.footer}>
              <PressableScale style={[s.submit, otp.length !== 6 && s.submitOff]} disabled={otp.length !== 6} onPress={verifyOtp}>
                <T w="bold" s={16} c={otp.length === 6 ? '#fff' : C.faint}>Verify</T>
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

        {/* ── Survey step 1 (full screen): where the child is right now ──── */}
        {step === 'survey1' && (
          <>
            <View style={s.surveyBarFull}>
              <View style={[s.surveySeg, { backgroundColor: C.gold }]} />
              <View style={[s.surveySeg, { backgroundColor: '#FBDDCB' }]} />
            </View>
            <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
              <T w="bold" s={25} c={C.ink} style={{ lineHeight: 34 }}>How’s your child doing?</T>
              <T w="med" s={15.5} c={C.muted} style={{ marginTop: 10, lineHeight: 23 }}>
                To help us personalize the trial, take a minute to tell us more about {child.trim() || 'your child'}
              </T>
              <View style={{ marginTop: 24, gap: 12 }}>
                {LEVELS.map((l) => {
                  const on = level === l.key;
                  return (
                    <PressableScale key={l.key} style={[s.optCard, on && s.optCardOn]} onPress={() => setLevel(l.key)}>
                      <MascotFace size={44} color={l.color} />
                      <View style={{ flex: 1 }}>
                        <T w="bold" s={15} c={on ? '#fff' : C.ink}>{l.title}</T>
                        <T w="med" s={14.5} c={on ? 'rgba(255,255,255,0.85)' : C.muted} style={{ marginTop: 4, lineHeight: 21 }}>{l.body}</T>
                      </View>
                    </PressableScale>
                  );
                })}
              </View>
            </ScrollView>
            <View style={s.footer}>
              <PressableScale style={[s.submit, !level && s.submitOff]} disabled={!level} onPress={() => { setSurveyStep(1); setStep('survey2'); }}>
                <T w="bold" s={16} c={level ? '#fff' : C.faint}>Next</T>
              </PressableScale>
            </View>
          </>
        )}

        {/* ── Survey step 2 (full screen): what they want out of it ──────── */}
        {step === 'survey2' && (
          <>
            <View style={s.surveyBarFull}>
              <View style={[s.surveySeg, { backgroundColor: C.gold }]} />
              <View style={[s.surveySeg, { backgroundColor: '#F97316' }]} />
            </View>
            <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
              <T w="bold" s={25} c={C.ink} style={{ lineHeight: 34 }}>What would you like your child to focus on?</T>
              <T w="med" s={14.5} c={C.muted} style={{ marginTop: 8 }}>Pick as many as you like.</T>
              <View style={{ marginTop: 18 }}>
                {FOCUS.map((f) => {
                  const on = focus.includes(f);
                  return (
                    <Pressable
                      key={f}
                      style={s.checkRow}
                      onPress={() => setFocus((cur) => (on ? cur.filter((x) => x !== f) : [...cur, f]))}
                    >
                      <View style={[s.checkBox, on && s.checkBoxOn]}>{on && <Check size={15} color="#fff" />}</View>
                      <T w="med" s={15.5} c={C.ink} style={{ flex: 1, lineHeight: 23 }}>{f}</T>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
            <View style={s.footer}>
              <PressableScale
                style={[s.submit, !focus.length && s.submitOff]}
                disabled={!focus.length}
                onPress={() => {
                  setSurveyStep(2);
                  onChange && onChange({ ...buildBooking(), survey: { level, focus } });
                  setStep('confirmed');
                }}
              >
                <T w="bold" s={16} c={focus.length ? '#fff' : C.faint}>Done</T>
              </PressableScale>
            </View>
          </>
        )}

        {/* ── STEP 5: confirmed ────────────────────────────────────────── */}
        {step === 'confirmed' && (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Request-received header. Deliberately "requested", not "confirmed": a
                tutor still has to be matched, and the slot isn't guaranteed until then. */}
            <FadeIn y={12}>
              <View style={s.doneHead}>
                <View style={s.doneIcon}><Users size={30} color="#1B7F4B" /></View>
                <T w="bold" s={25} c={C.ink} style={{ textAlign: 'center', marginTop: 18, lineHeight: 34 }}>
                  🎉  Trial Request Received!
                </T>
                <T w="med" s={15.5} c={C.muted} style={{ textAlign: 'center', marginTop: 8, lineHeight: 23 }}>
                  Hi {name.trim() || 'Parent'}! We’ve received your request for a trial class.
                </T>
              </View>

              <View style={s.detailCard}>
                <T w="bold" s={18} c="#9A5B00" style={{ marginBottom: 14 }}>Trial Class Details</T>
                <View style={s.detailRow}>
                  <CalendarDays size={20} color={C.gold} />
                  <View style={{ flex: 1 }}>
                    <T w="med" s={16} c={C.ink}>{longDateStr}</T>
                    <T w="med" s={15} c={C.muted} style={{ marginTop: 2 }}>{rangeStr}</T>
                  </View>
                </View>
                <View style={[s.detailRow, { marginTop: 14 }]}>
                  <MapPin size={20} color={C.gold} />
                  <View style={{ flex: 1 }}>
                    <T w="med" s={16} c={C.ink}>
                      Online via <T w="bold" s={16} c={C.ink} style={s.underline} onPress={() => Linking.openURL('https://ailernova.in').catch(() => {})}>ailernova.in</T>
                    </T>
                    <T w="med" s={15} c={C.muted} style={{ marginTop: 2 }}>Login credentials will be shared soon</T>
                  </View>
                </View>
              </View>

              <View style={s.nextCard}>
                <T w="bold" s={18} c="#12693D" style={{ marginBottom: 10 }}>What’s Next?</T>
                {[`We’re shortlisting the best tutors for ${child.trim() || 'your child'}’s needs`,
                  'You’ll receive a confirmation request soon'].map((line) => (
                    <View key={line} style={s.bulletRow}>
                      <T w="med" s={15.5} c="#177A48">•</T>
                      <T w="med" s={15.5} c="#177A48" style={{ flex: 1, lineHeight: 23 }}>{line}</T>
                    </View>
                ))}
              </View>

              <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
                <PressableScale style={[s.calBtn, calEventId && s.calBtnDone]} disabled={addingCal || !!calEventId} onPress={handleAddToCalendar}>
                  {addingCal
                    ? <ActivityIndicator color={C.ink} size="small" />
                    : <T w="bold" s={15} c={calEventId ? C.green : C.ink}>{calEventId ? '✓  Added to Calendar' : 'Add to Calendar'}</T>}
                </PressableScale>
              </View>
            </FadeIn>

            {/* Survey invite. The two steps themselves are full screens (step ===
                'survey1' / 'survey2'); this card is only the door in, and it
                disappears for good once the survey is done. */}
            {surveyStep < 2 && (
              <FadeIn y={12} style={s.surveyCard}>
                <View style={s.surveyBar}>
                  <View style={[s.surveySeg, { backgroundColor: C.gold }]} />
                  <View style={[s.surveySeg, { backgroundColor: '#FBDDCB' }]} />
                </View>
                <View style={{ padding: 22 }}>
                  <T w="bold" s={22} c={C.ink} style={{ lineHeight: 30 }}>How’s your child doing?</T>
                  <T w="med" s={15.5} c={C.muted} style={{ marginTop: 10, lineHeight: 23 }}>
                    To help us personalize the trial, take a minute to tell us more about {child.trim() || 'your child'}
                  </T>
                  <PressableScale style={s.nextBtn} onPress={() => setStep('survey1')}>
                    <T w="bold" s={16} c="#fff">{surveyStep === 0 ? 'Get started' : 'Continue'}</T>
                  </PressableScale>
                </View>
              </FadeIn>
            )}

            {/* Reschedule / Cancel */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, marginTop: 18 }}>
              <T w="med" s={14.5} c={C.muted}>Change of plans? </T>
              <Pressable onPress={() => { setSlot(null); setStep('schedule'); }}><T w="bold" s={14.5} c={C.ink} style={s.underline}>Reschedule</T></Pressable>
              <T w="med" s={14.5} c={C.muted}> or </T>
              <Pressable onPress={handleCancel}><T w="bold" s={14.5} c={C.ink} style={s.underline}>Cancel</T></Pressable>
            </View>

          </ScrollView>

        </>
        )}

        <PickerSheet visible={pickChild} title="Select child" options={kids} selected={child} onPick={(v) => { setChild(v); setPickChild(false); }} onClose={() => setPickChild(false)} />
        <PickerSheet visible={pickBoard} title="Select board" options={BOARDS} selected={board} onPick={(v) => { setBoard(v); setPickBoard(false); }} onClose={() => setPickBoard(false)} />
        <PickerSheet visible={pickGrade} title="Select class" options={GRADES} selected={grade} onPick={(v) => { setGrade(v); setPickGrade(false); }} onClose={() => setPickGrade(false)} />
        <CountryPicker visible={pickCountry} selected={country.iso2} onPick={(c) => { setCountry(c); setPickCountry(false); }} onClose={() => setPickCountry(false)} />
      </View>
    </Modal>
  );
}

// Scales off `size` so the same face works as the 78px scheduling mascot and the 44px
// survey option glyph — every feature is a ratio of the circle, not a fixed px.
function MascotFace({ size = 78, color = '#E24BE2' }) {
  const eye = Math.round(size * 0.22);
  const pupil = Math.round(size * 0.09);
  const smileW = Math.round(size * 0.28);
  return (
    <View style={[s.mascot, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <View style={{ flexDirection: 'row', gap: Math.round(size * 0.10) }}>
        {[0, 1].map((i) => (
          <View key={i} style={[s.eye, { width: eye, height: eye, borderRadius: eye / 2 }]}>
            <View style={[s.pupil, { width: pupil, height: pupil, borderRadius: pupil / 2 }]} />
          </View>
        ))}
      </View>
      <View style={[s.smile, {
        width: smileW,
        height: Math.round(smileW * 0.5),
        borderBottomLeftRadius: smileW,
        borderBottomRightRadius: smileW,
        borderWidth: Math.max(2, size * 0.031),
        borderTopWidth: 0,
        marginTop: Math.round(size * 0.06),
      }]}
      />
    </View>
  );
}

function PickerSheet({ visible, title, options, selected, onPick, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          <T w="bold" s={15} c={C.ink} style={{ marginBottom: 6 }}>{title}</T>
          {/* Bounded + scrollable: the class list is 12 rows and would otherwise run
              past the bottom of the screen with the last options unreachable. */}
          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
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

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === 'android' ? 28 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },

  field: { borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingHorizontal: 16, height: 60, justifyContent: 'center', marginTop: 22 },
  fieldLabelWrap: { position: 'absolute', top: -9, left: 12, backgroundColor: C.bg, paddingHorizontal: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: { borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingHorizontal: 16, height: 60, color: C.ink, fontSize: 17, fontFamily: F.med, marginTop: 22 },
  // Bare input — the surrounding `field` already draws the border and height.
  fieldInput: { color: C.ink, fontSize: 17, fontFamily: F.med, padding: 0 },
  mobileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22 },
  dialBox: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingHorizontal: 12, height: 60 },

  footer: { padding: 20, paddingBottom: 28 },
  submit: { backgroundColor: C.ink, borderRadius: 30, paddingVertical: 17, alignItems: 'center' },
  submitOff: { backgroundColor: '#EDEDEF' },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  bubbleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 20, paddingTop: 16 },
  // Base face — dimensions/colour come from MascotFace's size prop.
  mascot: { alignItems: 'center', justifyContent: 'center' },
  eye: { backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  pupil: { backgroundColor: '#1A1A1A' },
  smile: { borderColor: '#1A1A1A' },
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

  // OTP step
  otpRow: { flexDirection: 'row', gap: 10, marginTop: 26 },
  otpBox: { flex: 1, height: 60, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  otpBoxActive: { borderColor: C.ink },
  otpBoxErr: { borderColor: C.red },
  // The real input is invisible but must stay mounted and hit-testable for the
  // keyboard to open — opacity 0 over the boxes, not display:none.
  otpHidden: { position: 'absolute', left: 0, right: 0, top: 0, height: 60, opacity: 0, color: 'transparent' },
  otpHint: { backgroundColor: '#F4F4F5', borderRadius: 12, padding: 14, marginTop: 28 },

  // Confirmation
  doneHead: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 20 },
  doneIcon: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#BFEBCF', alignItems: 'center', justifyContent: 'center' },
  detailCard: { backgroundColor: '#FDF1D6', borderWidth: 1, borderColor: '#F2D48A', borderRadius: 12, padding: 18, marginHorizontal: 20, marginTop: 24 },
  detailRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  nextCard: { backgroundColor: '#D6F2E0', borderRadius: 12, padding: 18, marginHorizontal: 20, marginTop: 16 },

  // Survey
  surveyCard: { borderWidth: 1, borderColor: C.border, borderRadius: 14, marginHorizontal: 20, marginTop: 22, overflow: 'hidden', backgroundColor: '#fff' },
  surveyBar: { flexDirection: 'row', height: 12 },
  surveyBarFull: { flexDirection: 'row', height: 10 },
  surveySeg: { flex: 1 },
  optCard: { flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderColor: C.border, padding: 16 },
  optCardOn: { backgroundColor: C.ink, borderColor: C.ink },
  nextBtn: { backgroundColor: C.ink, borderRadius: 26, paddingVertical: 15, alignItems: 'center', marginTop: 24, alignSelf: 'flex-start', paddingHorizontal: 48 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 11 },
  checkBox: { width: 24, height: 24, borderWidth: 1.5, borderColor: '#C9C9CE', borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checkBoxOn: { backgroundColor: C.ink, borderColor: C.ink },
  bulletRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 4 },

  calBtn: { backgroundColor: C.gold, borderRadius: 6, paddingVertical: 14, alignItems: 'center', marginTop: 12, marginBottom: 6 },


  underline: { textDecorationLine: 'underline' },

  calBtnDone: { backgroundColor: C.greenSoft },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30 },
  optRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
});
