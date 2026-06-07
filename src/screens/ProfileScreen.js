import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import COLORS from '../constants/colors';

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.emoji}>👤</Text>
        <Text style={styles.title}>{user?.name || 'Profile'}</Text>
        <Text style={styles.sub}>{user?.email || user?.phone || ''}</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: COLORS.white },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emoji:      { fontSize: 48, marginBottom: 12 },
  title:      { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  sub:        { fontSize: 14, color: COLORS.textSecondary, marginBottom: 32 },
  logoutBtn:  { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 40 },
  logoutText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '500' },
});

export default ProfileScreen;