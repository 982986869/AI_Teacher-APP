// src/screens/parent/ParentApp/CountryPicker.js
// "Select your country" bottom-sheet: search + popular countries pinned on top,
// then the full alphabetical list. Flag · name · dial code per row.
import React, { useEffect, useMemo, useState } from 'react';
import { View, TextInput, Modal, Pressable, FlatList, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { C, F, T } from './constants';
import { COUNTRIES, POPULAR_COUNTRIES, flagOf } from './countries';

function Row({ item, selected, onPick }) {
  const on = selected && item.iso2 === selected;
  return (
    <Pressable style={[s.row, on && s.rowOn]} onPress={() => onPick(item)}
      accessibilityRole="button" accessibilityLabel={`${item.name}, ${item.dial}`} accessibilityState={{ selected: !!on }}>
      <T s={22} style={{ width: 30 }} accessibilityElementsHidden importantForAccessibility="no">{flagOf(item.iso2)}</T>
      <T w={on ? 'bold' : 'med'} s={16} c={C.ink} style={{ flex: 1 }} numberOfLines={1}>{item.name}</T>
      <T w={on ? 'bold' : 'med'} s={16} c={C.ink}>{item.dial}</T>
    </Pressable>
  );
}

export default function CountryPicker({ visible, selected, onPick, onClose }) {
  const [q, setQ] = useState('');
  useEffect(() => { if (!visible) setQ(''); }, [visible]); // don't reopen with a stale search

  // When searching, show a single flat filtered list; otherwise popular + divider + all.
  // Match name (substring), ISO code (exact), or dial by typed digits (prefix).
  const data = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term) {
      const digits = term.replace(/[^0-9]/g, '');
      return COUNTRIES.filter((c) =>
        c.name.toLowerCase().includes(term)
        || c.iso2.toLowerCase() === term
        || (digits && c.dial.replace(/[^0-9]/g, '').startsWith(digits)))
        .map((c) => ({ ...c, _k: c.iso2 }));
    }
    const pop = POPULAR_COUNTRIES.map((c) => ({ ...c, _k: `p_${c.iso2}` }));
    const all = COUNTRIES.map((c) => ({ ...c, _k: c.iso2 }));
    return [...pop, { _k: '__divider__', divider: true }, ...all];
  }, [q]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.backdrop}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
        <View style={s.sheet}>
          <View style={s.handle} />
          <T w="bold" s={24} c={C.ink} style={{ marginBottom: 16 }}>Select your country</T>

          <View style={s.search}>
            <Search size={20} color={C.faint} />
            <TextInput
              value={q} onChangeText={setQ} placeholder="Search" placeholderTextColor={C.faint}
              autoCapitalize="none" autoCorrect={false} style={s.searchInput} accessibilityLabel="Search countries"
            />
          </View>

          <FlatList
            data={data}
            keyExtractor={(it) => it._k}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
            ListEmptyComponent={<View style={{ paddingVertical: 28, alignItems: 'center' }}><T w="med" s={14} c={C.muted}>No countries found</T></View>}
            renderItem={({ item }) =>
              item.divider ? <View style={s.divider} /> : <Row item={item} selected={selected} onPick={onPick} />
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 10, height: '82%' },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#D9D9DD', marginBottom: 16 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, height: 52, marginBottom: 6 },
  searchInput: { flex: 1, color: C.ink, fontSize: 16, fontFamily: F.med, padding: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: 6, borderRadius: 10 },
  rowOn: { backgroundColor: C.blueSoft },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 4 },
});
