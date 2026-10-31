// src/screens/parent/ParentApp/TrialBookingFlow.js
// "Book a free class" — slot → details → done, booked on our own server.
//
// Replaces the Calendly embed. What Calendly gave us (a calendar, a Meet link, a
// confirmation email) the server now gives us: the slot list is generated here from
// demoConfig, the Meet link is a standing room the server knows, and the email goes
// out through Brevo (the parent's confirmation, plus a copy to kids@ailernova.com).
// What we gain is the booking itself — a row we can see, a card on the dashboard, a
// cancel that means something.
import React, { useEffect, useMemo, useState } from 'react';
import { View, Modal, ScrollView, TextInput, ActivityIndicator, Platform, StyleSheet, Linking } from 'react-native';
import { ArrowLeft, Video, Check, Mail, Copy } from 'lucide-react-native';
import { C, T } from './constants';
import { PressableScale, FadeIn } from './anim';
import { useAuth } from '../../../context/AuthContext';
import { createTrialBooking } from '../../../api/parentApi';
import { buildDays, buildSlots, PERIODS, CLASSES, BOARDS, SUBJECTS, DEMO_DURATION_MIN, fmtDateLong, fmtTime } from './demoConfig';

const DAYS_SHOWN = 7;

function Chip({ label, on, disabled, onPress, small }) {
  return (
    <PressableScale disabled={disabled} onPress={onPress}
      style={[s.chip, small && s.chipSmall, on && s.chipOn, disabled && s.chipOff]}>
      <T w="bold" s={small ? 13 : 14} c={on ? '#fff' : disabled ? C.faint : C.ink}>{label}</T>
    </PressableScale>
  );
}

// `error` shows under the box once the field has something wrong in it, so a parent
// sees WHY "Book" is still disabled instead of a grey button and no reason.
function Field({ label, value, onChangeText, keyboardType, placeholder, error }) {
  return (
    <View>
      <View style={[s.field, !!error && { borderColor: C.red }]}>
        <T w="bold" s={10.5} c={C.faint} style={{ letterSpacing: 0.4 }}>{label}</T>
        {/* No autoFocus: react-native-web's Modal focus trap steals it on web (see aafba62). */}
        <TextInput value={value} onChangeText={onChangeText} keyboardType={keyboardType} placeholder={placeholder}
          placeholderTextColor={C.faint} style={s.input} autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'} />
      </View>
      {!!error && <T w="semi" s={12} c={C.red} style={{ marginTop: 6, marginLeft: 4 }}>{error}</T>}
    </View>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Eyebrow({ children }) {
  return <T w="bold" s={11} c={C.faint} style={{ letterSpacing: 0.6, marginTop: 18, marginBottom: 10 }}>{children}</T>;
}

export default function TrialBookingFlow({ visible, onClose, onDone, onBooked, childName, childClass, childBoard, presetSubject }) {
  const { user } = useAuth();
  const [step, setStep] = useState(0); // 0 slot, 1 details, 2 done
  const [day, setDay] = useState(null);
  const [period, setPeriod] = useState(PERIODS[1].key);
  const [slot, setSlot] = useState(null);
  const [f, setF] = useState({ parentName: '', parentEmail: '', parentPhone: '', childName: '', childClass: null, board: null, subject: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { booking, mailSent }

  // Fresh slots on every open (yesterday's "today" is gone), prefill from the login.
  const days = useMemo(() => (visible ? buildDays(DAYS_SHOWN) : []), [visible]);
  useEffect(() => {
    if (!visible) return;
    setStep(0); setDay(null); setSlot(null); setPeriod(PERIODS[1].key); setBusy(false); setError(''); setResult(null);
    setF({
      parentName: user?.name || '', parentEmail: user?.email || '', parentPhone: user?.phone || '',
      // The linked child's class is known, so start with it picked (still changeable).
      childName: childName || '', childClass: CLASSES.includes(childClass) ? childClass : null,
      board: BOARDS.includes(childBoard) ? childBoard : BOARDS.includes(user?.board) ? user.board : null,
      subject: SUBJECTS.includes(presetSubject) ? presetSubject : null,
    });
  }, [visible, user, childName, childClass, childBoard, presetSubject]);

  const slots = useMemo(() => (day ? buildSlots(day, period) : []), [day, period]);
  const set = (patch) => setF((p) => ({ ...p, ...patch }));

  const slotOk = !!(day && slot);
  // Every reason the details are not ready, in form order. The first one is shown
  // under the disabled button; field-level ones also show under their box.
  const phoneDigits = f.parentPhone.replace(/\D/g, '');
  const emailBad = !!f.parentEmail.trim() && !EMAIL_RE.test(f.parentEmail.trim());
  const phoneBad = !!phoneDigits && phoneDigits.length < 10;
  const missing = [
    !f.parentName.trim() && 'your name',
    !EMAIL_RE.test(f.parentEmail.trim()) && 'a valid email',
    phoneDigits.length < 10 && 'a 10-digit mobile number',
    !f.childName.trim() && "your child's name",
    !f.childClass && "your child's class",
    !f.board && 'the board',
    !f.subject && 'a subject',
  ].filter(Boolean);
  const detailsOk = missing.length === 0;

  const back = () => {
    if (busy) return;
    if (step === 1) { setStep(0); setError(''); return; }
    onClose && onClose();
  };

  const submit = async () => {
    if (!detailsOk || !slotOk || busy) return;
    setBusy(true); setError('');
    try {
      const r = await createTrialBooking({
        parentName: f.parentName.trim(), parentEmail: f.parentEmail.trim(), parentPhone: f.parentPhone.trim(),
        childName: f.childName.trim(), childClass: f.childClass, board: f.board, subject: f.subject, slotAt: slot.iso,
      });
      setResult(r); setStep(2);
      onBooked && onBooked(r.booking);
    } catch (e) {
      setError(e.message || "Couldn't book the slot — please try again.");
    } finally { setBusy(false); }
  };

  const openMeet = () => { if (result?.booking?.meetingUrl) Linking.openURL(result.booking.meetingUrl); };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={back} statusBarTranslucent>
      <View style={s.screen}>
        <View style={s.header}>
          {step !== 2 && (
            <PressableScale style={s.back} onPress={back} accessibilityLabel="Go back">
              <ArrowLeft size={24} color={C.ink} />
            </PressableScale>
          )}
          <T w="bold" s={20} c={C.ink}>{step === 2 ? 'You\'re booked' : 'Book a free class'}</T>
        </View>

        <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {step === 0 && (
            <FadeIn key="slot" y={10} duration={240}>
              <T w="med" s={20} c={C.ink} style={{ lineHeight: 27 }}>
                Pick a <T w="xbold" s={20} c={C.ink}>time</T> for a live 1:1 class with an Ailernova mentor
              </T>
              <Eyebrow>SELECT A DAY</Eyebrow>
              <View style={s.wrap}>
                {days.map((d) => (
                  <Chip key={d.key} label={`${d.dow} ${d.dayNum} ${d.month}`} on={day?.key === d.key} disabled={!d.available}
                    onPress={() => { setDay(d); setSlot(null); }} />
                ))}
              </View>
              {!!day && (
                <>
                  <Eyebrow>SELECT A TIME · IST</Eyebrow>
                  <View style={s.tabRow}>
                    {PERIODS.map((p) => (
                      <PressableScale key={p.key} style={s.tab} onPress={() => { setPeriod(p.key); setSlot(null); }}>
                        <T w={period === p.key ? 'xbold' : 'semi'} s={14} c={period === p.key ? C.ink : C.faint}>{p.key}</T>
                        <View style={[s.tabRule, { backgroundColor: period === p.key ? C.gold : 'transparent' }]} />
                      </PressableScale>
                    ))}
                  </View>
                  <View style={s.wrap}>
                    {slots.map((sl) => (
                      <Chip key={sl.iso} small label={sl.label} on={slot?.iso === sl.iso} disabled={!sl.available} onPress={() => setSlot(sl)} />
                    ))}
                  </View>
                  {slots.every((sl) => !sl.available) && (
                    <T w="med" s={13} c={C.muted} style={{ marginTop: 8 }}>Nothing left in the {period.toLowerCase()} — try another period or day.</T>
                  )}
                </>
              )}
            </FadeIn>
          )}

          {step === 1 && (
            <FadeIn key="details" y={10} duration={240}>
              <T w="med" s={20} c={C.ink} style={{ lineHeight: 27 }}>
                A few <T w="xbold" s={20} c={C.ink}>details</T> so we can send the class link
              </T>
              <T w="semi" s={13} c={C.muted} style={{ marginTop: 6 }}>{fmtDateLong(slot.iso)} · {slot.label}</T>
              <Field label="YOUR NAME" value={f.parentName} onChangeText={(t) => set({ parentName: t })} />
              <Field label="EMAIL — THE MEET LINK GOES HERE" value={f.parentEmail} onChangeText={(t) => set({ parentEmail: t })} keyboardType="email-address"
                error={emailBad ? 'Enter a valid email, like name@gmail.com' : ''} />
              <Field label="MOBILE NUMBER" value={f.parentPhone} onChangeText={(t) => set({ parentPhone: t })} keyboardType="phone-pad"
                placeholder="10-digit mobile number" error={phoneBad ? 'Enter all 10 digits of your mobile number' : ''} />
              <Field label="CHILD'S NAME" value={f.childName} onChangeText={(t) => set({ childName: t })} />
              <Eyebrow>CHILD'S CLASS</Eyebrow>
              <View style={s.wrap}>
                {CLASSES.map((c) => <Chip key={c} small label={c} on={f.childClass === c} onPress={() => set({ childClass: c })} />)}
              </View>
              <Eyebrow>BOARD</Eyebrow>
              <View style={s.wrap}>
                {BOARDS.map((b) => <Chip key={b} small label={b} on={f.board === b} onPress={() => set({ board: b })} />)}
              </View>
              <Eyebrow>SUBJECT</Eyebrow>
              <View style={s.wrap}>
                {SUBJECTS.map((sub) => <Chip key={sub} small label={sub} on={f.subject === sub} onPress={() => set({ subject: sub })} />)}
              </View>
              {!!error && <T w="semi" s={13} c={C.red} style={{ marginTop: 16 }}>{error}</T>}
            </FadeIn>
          )}

          {step === 2 && !!result && (
            <FadeIn key="done" y={10} duration={240} style={{ alignItems: 'center', paddingTop: 16 }}>
              <View style={s.tick}><Check size={30} color="#fff" strokeWidth={3} /></View>
              <T w="xbold" s={22} c={C.ink} style={{ marginTop: 20, textAlign: 'center' }}>Your free class is booked</T>
              <T w="semi" s={15} c={C.ink} style={{ marginTop: 14, textAlign: 'center' }}>{fmtDateLong(result.booking.date)} · {fmtTime(result.booking.date)}</T>
              <T w="med" s={13} c={C.muted} style={{ marginTop: 4, textAlign: 'center' }}>{result.booking.subject} · {result.booking.childClass}{result.booking.board ? ` (${result.booking.board})` : ''} · {DEMO_DURATION_MIN} min · Google Meet</T>

              <PressableScale style={s.meetRow} onPress={openMeet} accessibilityLabel="Open Google Meet link">
                <Video size={18} color={C.blue} />
                <T w="bold" s={13.5} c={C.blue} style={{ flex: 1 }} numberOfLines={1}>{result.booking.meetingUrl}</T>
                <Copy size={16} color={C.faint} />
              </PressableScale>

              {result.mailSent ? (
                <View style={s.note}>
                  <Mail size={15} color={C.green} />
                  <T w="semi" s={13} c={C.green} style={{ flex: 1 }}>We've emailed this to {result.booking.parentEmail}</T>
                </View>
              ) : (
                <View style={[s.note, s.noteWarn]}>
                  <Mail size={15} color={C.peachInk} />
                  <T w="semi" s={13} c={C.peachInk} style={{ flex: 1 }}>We couldn't send the email — please save this link. It's also on your dashboard.</T>
                </View>
              )}
              <T w="med" s={12.5} c={C.muted} style={{ marginTop: 18, textAlign: 'center', lineHeight: 18 }}>Join about 10 minutes early. Questions? kids@ailernova.com</T>
            </FadeIn>
          )}
        </ScrollView>

        <View style={s.footer}>
          {step === 0 && (
            <PressableScale disabled={!slotOk} style={slotOk ? s.btnOn : s.btnOff} onPress={() => setStep(1)}>
              <T w="bold" s={15.5} c={slotOk ? C.ink : '#9AA0AA'}>Next</T>
            </PressableScale>
          )}
          {step === 1 && (
            <>
              {!detailsOk && (
                <T w="semi" s={12.5} c={C.muted} style={{ textAlign: 'center', marginBottom: 10 }}>
                  To book, add {missing.join(', ')}
                </T>
              )}
              <PressableScale disabled={!detailsOk || busy} style={detailsOk && !busy ? s.btnOn : s.btnOff} onPress={submit}>
                {busy ? <ActivityIndicator color={C.ink} /> : <T w="bold" s={15.5} c={detailsOk ? C.ink : '#9AA0AA'}>Book my free class</T>}
              </PressableScale>
            </>
          )}
          {step === 2 && (
            // onDone takes the parent to Home, where the new booking card is waiting.
            <PressableScale style={s.btnOn} onPress={onDone || onClose}><T w="bold" s={15.5} c={C.ink}>Back to dashboard</T></PressableScale>
          )}
          {step < 2 && <T w="bold" s={12.5} c={C.faint} style={{ textAlign: 'center', marginTop: 12 }}>{step + 1} of 2</T>}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === 'android' ? 28 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  body: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 24, borderWidth: 1, borderColor: '#C9CDD6', backgroundColor: '#fff' },
  chipSmall: { paddingVertical: 10, paddingHorizontal: 14 },
  chipOn: { backgroundColor: C.navy, borderColor: C.navy },
  chipOff: { backgroundColor: '#F3F4F6', borderColor: '#E6E8EC' },
  tabRow: { flexDirection: 'row', gap: 22, marginBottom: 14 },
  tab: { paddingBottom: 6 },
  tabRule: { height: 3, borderRadius: 2, marginTop: 6 },
  field: { marginTop: 18, borderWidth: 1, borderColor: '#C9CDD6', borderRadius: 10, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4, backgroundColor: '#fff' },
  input: { fontSize: 16, color: C.ink, paddingVertical: 6, paddingHorizontal: 0 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 18, borderTopWidth: 1, borderTopColor: C.hair, backgroundColor: C.bg },
  btnOn: { backgroundColor: '#F9B234', borderRadius: 30, paddingVertical: 16, alignItems: 'center' },
  btnOff: { backgroundColor: '#D7DAE0', borderRadius: 30, paddingVertical: 16, alignItems: 'center' },
  tick: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#22B573', alignItems: 'center', justifyContent: 'center' },
  meetRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 22, alignSelf: 'stretch', paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12, backgroundColor: C.blueSoft },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, alignSelf: 'stretch', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: C.greenSoft },
  noteWarn: { backgroundColor: C.peach },
});
