// src/screens/profile/EditProfileScreen.js
// "Edit Profile" — the form behind the Profile screen's Edit Profile pill. Six fields
// over a sticky "Save Changes" footer, plus the avatar with its camera badge.
//
// Five of the six save to the server through PATCH /api/auth/profile. EMAIL does not,
// and is drawn read-only on purpose: it is the login identity and is UNIQUE, so moving
// it needs re-verification and a collision path — a flow of its own, not a text field.
// The route rejects it too (see the note on profileRules in server/src/routes/auth.js),
// so a read-only field here and a refusal there agree rather than one silently winning.
//
// Date of birth uses a sheet built from three plain lists rather than a native picker.
// The app has no date-picker dependency, and adding one is a native module — every
// developer and every build would need a new dev client for one field.
//
// Values marked "Figma" are lifted verbatim from the design's property panels.
import React, { useMemo, useState } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, StatusBar, Image, TextInput, Modal,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, Camera, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import { useRuntimeConfig } from '../../context/RuntimeConfigContext';
import { P, PAD, TRACK } from './theme';
import { T, ScreenHeader, StickyFooter } from './ui';

const CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// The design shows "15 March 2015"; the column is a DATE and the route wants
// YYYY-MM-DD. These two convert between the stored form and the shown one.
const toDisplay = (iso) => {
  if (!iso) return '';
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return '';
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
const toIso = ({ day, month, year }) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

// Leap years included, so 29 February is selectable in the years it exists and not in
// the ones it does not.
const daysInMonth = (monthIdx, year) => new Date(year, monthIdx + 1, 0).getDate();

// ── field primitives ─────────────────────────────────────────────────────────
// Figma: form-group — vertical, gap 6 (label 16 + 6 + input 52 = 74).
// Label: Inter 600 13, uppercase, #666666. See TRACK in theme.js on the tracking.
function Field({ label, children }) {
  return (
    <View style={{ gap: 6 }}>
      <T w="semi" s={13} c={P.inkSoft} style={{ letterSpacing: TRACK, textTransform: 'uppercase' }}>
        {label}
      </T>
      {children}
    </View>
  );
}

// Figma: input-container — fill, h52 fixed, radius 14, padding L/R 16, space-between,
// #F5F5F5. Value text: Inter 400 15 #111111.
function TextField({ value, onChangeText, placeholder, editable = true, ...rest }) {
  return (
    <View style={s.input}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={P.inkFaint}
        editable={editable}
        style={[s.inputText, !editable && { color: P.inkFaint }]}
        {...rest}
      />
    </View>
  );
}

// The same container, but it opens a sheet instead of a keyboard — CLASS and DATE OF
// BIRTH. `space-between` in the Figma panel is what puts the chevron on the right.
function PickerField({ value, placeholder, onPress, a11yLabel }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.input, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityValue={{ text: value || 'not set' }}
    >
      <T w="reg" s={15} c={value ? P.ink : P.inkFaint} style={{ flex: 1 }}>
        {value || placeholder}
      </T>
      <ChevronDown size={18} color={P.inkSoft} strokeWidth={2.2} />
    </Pressable>
  );
}

// ── sheets ───────────────────────────────────────────────────────────────────
// No panels cover either sheet — the design only shows the closed field. Both are
// derived, built from this flow's own tokens so they read as part of the same screen.
function SheetShell({ visible, title, onClose, children }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.scrim} onPress={onClose} accessibilityLabel="Close" />
      <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={s.sheetHead}>
          <T w="bold" s={17}>{title}</T>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
            <X size={20} color={P.inkSoft} strokeWidth={2.2} />
          </Pressable>
        </View>
        {children}
      </View>
    </Modal>
  );
}

function OptionSheet({ visible, title, options, selected, onPick, onClose }) {
  return (
    <SheetShell visible={visible} title={title} onClose={onClose}>
      <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
        {options.map((o) => {
          const on = o.key === selected;
          return (
            <Pressable
              key={o.key}
              onPress={() => { onPick(o.key); onClose(); }}
              style={({ pressed }) => [s.option, on && s.optionOn, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <T w={on ? 'semi' : 'reg'} s={15} c={P.ink}>{o.label}</T>
            </Pressable>
          );
        })}
      </ScrollView>
    </SheetShell>
  );
}

// Hoisted out of DateSheet on purpose: declared inline it would be a new component type
// on every keystroke of state, so all three columns would remount and lose their scroll
// position the moment you picked anything.
function DateColumn({ items, current, onSelect, render, label }) {
  return (
    <ScrollView style={s.dateCol} showsVerticalScrollIndicator={false} accessibilityLabel={label}>
      {items.map((it) => {
        const on = it === current;
        return (
          <Pressable
            key={String(it)}
            onPress={() => onSelect(it)}
            style={({ pressed }) => [s.dateCell, on && s.dateCellOn, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <T w={on ? 'semi' : 'reg'} s={15} c={on ? P.ink : P.inkSoft}>{render ? render(it) : it}</T>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// Three lists side by side. Day is rebuilt whenever month or year changes, and a day
// that no longer exists (31 → February) is pulled back to the last valid one, so the
// sheet can never hand back a date like 2015-02-31.
function DateSheet({ visible, value, onPick, onClose }) {
  const thisYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 40 }, (_, i) => thisYear - i),
    [thisYear],
  );

  const seed = (() => {
    const [y, m, d] = String(value || '').split('-').map(Number);
    return (y && m && d)
      ? { year: y, month: m - 1, day: d }
      // No DOB yet: open on a year a school student plausibly has, not on today —
      // scrolling back a decade from "today" every time is the worse default.
      : { year: thisYear - 12, month: 0, day: 1 };
  })();

  const [year, setYear]   = useState(seed.year);
  const [month, setMonth] = useState(seed.month);
  const [day, setDay]     = useState(seed.day);

  const maxDay = daysInMonth(month, year);
  const safeDay = Math.min(day, maxDay);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  return (
    <SheetShell visible={visible} title="Date of birth" onClose={onClose}>
      <View style={s.dateCols}>
        <DateColumn items={days} current={safeDay} onSelect={setDay} label="Day" />
        <DateColumn items={MONTHS.map((_, i) => i)} current={month} onSelect={setMonth} render={(i) => MONTHS[i]} label="Month" />
        <DateColumn items={years} current={year} onSelect={setYear} label="Year" />
      </View>
      <Pressable
        onPress={() => { onPick(toIso({ day: safeDay, month, year })); onClose(); }}
        style={({ pressed }) => [s.sheetCta, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
      >
        <T w="bold" s={15} c="#FFFFFF">Done</T>
      </Pressable>
    </SheetShell>
  );
}

// ── the screen ───────────────────────────────────────────────────────────────
export default function EditProfileScreen({ user, scope, onBack, onSave, onPickPhoto }) {
  const insets = useSafeAreaInsets();
  const { supportedClasses } = useRuntimeConfig();

  const [name, setName]           = useState(user?.name || '');
  const [klass, setKlass]         = useState(() => String(scope?.classNum || '') || '');
  const [school, setSchool]       = useState(user?.school || '');
  const [dob, setDob]             = useState(user?.dateOfBirth || '');
  const [parentEmail, setParentEmail] = useState(user?.parentEmail || '');
  const [sheet, setSheet]         = useState(null);   // 'class' | 'dob' | null
  const [saving, setSaving]       = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  // Same rule the CompleteProfile form uses: show only the classes an admin has turned
  // on, fail open when config has not loaded, and never hide the student's own class.
  const classOptions = useMemo(() => {
    const allowed = (supportedClasses && supportedClasses.length) ? supportedClasses : null;
    const list = allowed
      ? CLASSES.filter((c) => allowed.includes(parseInt(c, 10)) || c === klass)
      : CLASSES;
    return list.map((c) => ({ key: c, label: `Class ${c}` }));
  }, [supportedClasses, klass]);

  const dirty = (name.trim() !== (user?.name || '').trim())
    || (klass !== (String(scope?.classNum || '') || ''))
    || (school.trim() !== (user?.school || ''))
    || (dob !== (user?.dateOfBirth || ''))
    || (parentEmail.trim() !== (user?.parentEmail || ''));

  const changePhoto = async () => {
    if (photoBusy) return;
    setPhotoBusy(true);
    try {
      await onPickPhoto();
    } finally {
      setPhotoBusy(false);
    }
  };

  const save = async () => {
    if (saving) return;
    if (!name.trim()) { Alert.alert('Name required', 'Please enter your full name.'); return; }
    setSaving(true);
    try {
      // Only what changed. `grade` in particular must not be sent unchanged: the server
      // re-validates class against stream for 11–12, and a no-op resend would make an
      // unrelated edit (say, the school) fail for a Class 11 student with no stream set.
      const patch = {};
      if (name.trim() !== (user?.name || '').trim()) patch.name = name.trim();
      if (klass && klass !== (String(scope?.classNum || '') || '')) patch.grade = `Class ${klass}`;
      if (school.trim() !== (user?.school || '')) patch.school = school.trim();
      if (dob !== (user?.dateOfBirth || '')) patch.dateOfBirth = dob;
      if (parentEmail.trim() !== (user?.parentEmail || '')) patch.parentEmail = parentEmail.trim();

      await onSave(patch);
      onBack();
    } catch (e) {
      Alert.alert(
        'Couldn’t save changes',
        e?.response?.data?.error || e?.response?.data?.message || e?.message
          || 'Please check your connection and try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={P.page} />
      <View style={{ paddingTop: insets.top }} />

      <ScreenHeader
        title="Edit Profile"
        subtitle="Update your personal details."
        onBack={onBack}
      />

      {/* The footer rides INSIDE this, not below it: with the CTA outside, an open
          keyboard on iOS sits over "Save Changes" and the only way to reach it is to
          dismiss the keyboard first. */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Figma: avatar-edit-container — hug 106, the 106x106 ring centred in a
              full-width row. The camera badge has no panel; it is derived. */}
          <View style={s.avatarRow}>
            <Pressable onPress={changePhoto} accessibilityRole="button" accessibilityLabel="Change profile photo">
              <View style={s.ring}>
                {user?.photoUrl
                  ? <Image source={{ uri: user.photoUrl }} style={s.avatarImg} />
                  : <T w="bold" s={34} c={P.inkSoft}>{(user?.name || '?').trim().charAt(0).toUpperCase()}</T>}
                {photoBusy && (
                  <View style={s.avatarBusy}><ActivityIndicator color="#FFFFFF" size="small" /></View>
                )}
              </View>
              <View style={s.cameraBadge}>
                <Camera size={14} color="#FFFFFF" strokeWidth={2.2} />
              </View>
            </Pressable>
          </View>

          {/* Figma: edit-profile-body — padding L/R 24, gap 16. */}
          <View style={s.form}>
            <Field label="Full Name">
              <TextField
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                autoCapitalize="words"
                maxLength={80}
              />
            </Field>

            <Field label="Email">
              {/* Read-only — see the note at the top of this file. */}
              <TextField value={user?.email || user?.phone || ''} editable={false} placeholder="—" />
            </Field>

            <Field label="Class">
              <PickerField
                value={klass ? `Class ${klass}` : ''}
                placeholder="Select your class"
                onPress={() => setSheet('class')}
                a11yLabel="Class"
              />
            </Field>

            <Field label="School">
              <TextField
                value={school}
                onChangeText={setSchool}
                placeholder="Your school"
                autoCapitalize="words"
                maxLength={120}
              />
            </Field>

            <Field label="Date of Birth">
              <PickerField
                value={toDisplay(dob)}
                placeholder="Select your date of birth"
                onPress={() => setSheet('dob')}
                a11yLabel="Date of birth"
              />
            </Field>

            <Field label="Parent Email">
              <TextField
                value={parentEmail}
                onChangeText={setParentEmail}
                placeholder="parent@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                maxLength={160}
              />
            </Field>
          </View>
        </ScrollView>

        <StickyFooter
          label="Save Changes"
          onPress={save}
          busy={saving}
          disabled={!dirty}
          bottomInset={insets.bottom}
        />
      </KeyboardAvoidingView>

      <OptionSheet
        visible={sheet === 'class'}
        title="Select your class"
        options={classOptions}
        selected={klass}
        onPick={setKlass}
        onClose={() => setSheet(null)}
      />
      {/* Keyed on the current value so re-opening the sheet after a change starts from
          the saved date rather than from whatever the last mount seeded. */}
      <DateSheet
        key={dob || 'empty'}
        visible={sheet === 'dob'}
        value={dob}
        onPick={setDob}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: P.page },
  body: { paddingBottom: 28 },

  // Figma: avatar-holder — 106x106, radius 53, 3px #FFC629.
  avatarRow: { height: 106, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 16 },
  ring: {
    width: 106, height: 106, borderRadius: 53,
    borderWidth: 3, borderColor: P.ring, backgroundColor: P.fieldBg,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarBusy: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
  },
  // derived — no panel. A dark disc on the ring's lower-right, as drawn.
  cameraBadge: {
    position: 'absolute', right: 2, bottom: 2,
    width: 30, height: 30, borderRadius: 15, backgroundColor: P.camera,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: P.page,
  },

  form: { paddingHorizontal: PAD, gap: 16 },
  input: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 52, borderRadius: 14, paddingHorizontal: 16, backgroundColor: P.fieldBg,
  },
  inputText: {
    flex: 1, padding: 0,
    fontFamily: 'Inter_400Regular', fontSize: 15, color: P.ink,
  },

  // sheets — all derived
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: P.page, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: PAD, paddingTop: 18,
  },
  sheetHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10,
  },
  option: {
    height: 48, justifyContent: 'center', paddingHorizontal: 14,
    borderRadius: 12, marginBottom: 6, backgroundColor: P.fieldBg,
  },
  optionOn: { backgroundColor: P.chipOnBg, borderWidth: 1, borderColor: P.ring },

  dateCols: { flexDirection: 'row', gap: 8, height: 260 },
  dateCol: { flex: 1, backgroundColor: P.fieldBg, borderRadius: 12 },
  dateCell: { height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 10, margin: 4 },
  dateCellOn: { backgroundColor: P.chipOnBg, borderWidth: 1, borderColor: P.ring },
  sheetCta: {
    height: 52, borderRadius: 26, backgroundColor: P.ink,
    alignItems: 'center', justifyContent: 'center', marginTop: 14,
  },
});
