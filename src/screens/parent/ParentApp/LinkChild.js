// src/screens/parent/ParentApp/LinkChild.js — real child linking (parentApi.linkChild).
import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { linkChild } from '../../../api/parentApi';
import { C, st, T, Wordmark } from './constants';
import { LinkFamilyArt } from './illustrations';
import { PressableScale } from './anim';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LinkChild({ parentName, onLinked, onLogout }) {
  const [email, setEmail] = useState('');
  const [linking, setLinking] = useState(false);
  const mnt = useRef(true);
  useEffect(() => () => { mnt.current = false; }, []);
  const valid = EMAIL_RE.test(email.trim());
  const doLink = async () => {
    if (!valid || linking) return;
    setLinking(true);
    try { await linkChild({ email: email.trim() }); if (mnt.current) onLinked(); }
    catch (err) {
      if (!mnt.current) return;
      const msg = err?.response?.data?.error
        || (err?.response ? 'Check the email your child logs in with and try again.' : 'No connection — please check your internet and try again.');
      Alert.alert('Could not link', msg);
    }
    finally { if (mnt.current) setLinking(false); }
  };
  return (
    <View style={st.screen}>
      <View style={st.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={st.avatar}><T w="xbold" s={22} c="#fff">{(Array.from((parentName || 'P').trim())[0] || 'P').toUpperCase()}</T></View>
          <View><T w="bold" s={23} c={C.ink}>Welcome</T><T w="med" s={13} c={C.muted}>Parent account</T></View>
        </View>
        <PressableScale style={st.logoutBtn} onPress={onLogout} accessibilityLabel="Log out"><T w="xbold" s={12.5} c={C.muted}>Log out</T></PressableScale>
      </View>
      <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 8 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 8 }}><Wordmark size={20} /></View>
        <View style={st.linkArt}><LinkFamilyArt /></View>
        <T w="xbold" s={24} c={C.ink} style={{ textAlign: 'center' }}>Link your child</T>
        <T w="med" s={14} c={C.muted} style={{ textAlign: 'center', lineHeight: 21, marginTop: 10, marginBottom: 22, paddingHorizontal: 6 }}>
          Enter the email your child uses to log in. You'll then see their real progress, streaks and areas to focus — here.
        </T>
        <T w="bold" s={14} c={C.ink} style={{ marginBottom: 8 }}>Child's login email</T>
        <TextInput
          value={email} onChangeText={setEmail} placeholder="child@email.com" placeholderTextColor={C.faint}
          autoCapitalize="none" autoCorrect={false} keyboardType="email-address" returnKeyType="go" onSubmitEditing={doLink} style={st.input}
          accessibilityLabel="Child's login email"
        />
        <PressableScale
          style={[st.primaryBtn, !valid && st.primaryBtnOff]} disabled={!valid || linking} onPress={doLink}
          accessibilityLabel="Link child" accessibilityState={{ disabled: !valid, busy: linking }}
        >
          {linking ? <ActivityIndicator color="#fff" /> : <T w="xbold" s={15} c="#fff">Link child</T>}
        </PressableScale>
      </ScrollView>
    </View>
  );
}
