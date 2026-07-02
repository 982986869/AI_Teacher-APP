// src/screens/parent/ParentApp/LinkChild.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { linkChild } from '../../../api/parentApi';
import { C, s, Wordmark } from './constants';
import { LinkFamilyArt } from './illustrations';

export default function LinkChild({ parentName, onLinked, onLogout }) {
  const [email, setEmail] = useState('');
  const [linking, setLinking] = useState(false);
  const mnt = useRef(true);
  useEffect(() => () => { mnt.current = false; }, []);
  const doLink = async () => {
    const e = email.trim();
    if (!e || linking) return;
    setLinking(true);
    try { await linkChild({ email: e }); if (mnt.current) onLinked(); }
    catch (err) { if (mnt.current) Alert.alert('Could not link', err?.response?.data?.error || 'Check the email your child logs in with and try again.'); }
    finally { if (mnt.current) setLinking(false); }
  };
  return (
    <View style={s.flexFill}>
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={s.avatar}><Text style={s.avatarTxt}>{(parentName || 'P').charAt(0).toUpperCase()}</Text></View>
          <View><Text style={s.hTitle}>Welcome</Text><Text style={s.hSub}>Parent account</Text></View>
        </View>
        <TouchableOpacity style={s.logoutBtn} activeOpacity={0.85} onPress={onLogout}><Text style={s.logoutTxt}>Log out</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 8 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 8 }}><Wordmark size={20} /></View>
        <View style={s.linkArt}><LinkFamilyArt /></View>
        <Text style={s.linkTitle}>Link your child</Text>
        <Text style={s.linkSub}>Enter the email your child uses to log in. You'll then see their real progress, streaks and areas to focus — here.</Text>
        <Text style={s.q}>Child's login email</Text>
        <TextInput
          value={email} onChangeText={setEmail} placeholder="child@email.com" placeholderTextColor={C.faint}
          autoCapitalize="none" autoCorrect={false} keyboardType="email-address" returnKeyType="go" onSubmitEditing={doLink} style={s.input}
        />
        <TouchableOpacity style={[s.primaryBtn, (!email.trim() || linking) && s.primaryBtnOff]} disabled={!email.trim() || linking} activeOpacity={0.9} onPress={doLink}>
          {linking ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnTxt}>Link child</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
