// src/screens/admin/logs/ErrorLogDetailScreen.js
// One error log entry in full — the stack and the context bag, which are the parts
// that actually shorten a debugging session and are unreadable in a list row.
//
// The row is passed through navigation params rather than refetched by id: it is
// immutable once written, and there is no single-entry endpoint to add for it.
import React from 'react';
import { View, ScrollView, Alert, Share } from 'react-native';
import { Share2, Smartphone, Server } from 'lucide-react-native';
import { T } from '../../parent/ParentApp/constants';
import { S, StudentScreenHeader } from '../../../theme/studentUI';
import { PressableScale } from '../../parent/ParentApp/anim';
import { fmtDate } from '../ui/format';

function Field({ label, value, mono }) {
  if (value == null || value === '') return null;
  return (
    <View style={{ marginBottom: 14 }}>
      <T w="xbold" s={11} c={S.faint} style={{ letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</T>
      <T
        w="semi"
        s={mono ? 11.5 : 13}
        c={S.ink}
        style={{ marginTop: 4, ...(mono ? { fontFamily: undefined, lineHeight: 17 } : {}) }}
        selectable
      >
        {String(value)}
      </T>
    </View>
  );
}

// Stack traces are wide and must not force the page to scroll sideways.
function CodeBlock({ label, text }) {
  if (!text) return null;
  return (
    <View style={{ marginBottom: 14 }}>
      <T w="xbold" s={11} c={S.faint} style={{ letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</T>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        style={{
          marginTop: 6, backgroundColor: '#fff', borderRadius: 12,
          borderWidth: 1, borderColor: S.hair,
        }}
        contentContainerStyle={{ padding: 11 }}
      >
        <T w="semi" s={11} c={S.sub} style={{ lineHeight: 16 }} selectable>{text}</T>
      </ScrollView>
    </View>
  );
}

export default function ErrorLogDetailScreen({ route }) {
  const row = route?.params?.row || {};
  const isWarn = row.level === 'warn';
  const tone = isWarn ? S.orange : S.red;
  const SourceIcon = row.source === 'server' ? Server : Smartphone;

  // Context arrives as jsonb — an object from Postgres, but a string if it ever came
  // back unparsed. Render both rather than crashing the screen on the second case.
  let contextText = null;
  if (row.context) {
    try {
      contextText = typeof row.context === 'string'
        ? JSON.stringify(JSON.parse(row.context), null, 2)
        : JSON.stringify(row.context, null, 2);
    } catch {
      contextText = String(row.context);
    }
  }

  // Share rather than a clipboard write: expo-clipboard is not a dependency, and adding
  // a native module for one button would force an EAS rebuild. The share sheet offers
  // Copy on both platforms anyway, and also lets the entry go straight into a ticket.
  // Every text field on this screen is `selectable` for a partial copy.
  const shareAll = async () => {
    const text = [
      `${row.level} · ${row.source}`,
      row.site,
      row.message,
      row.createdAt && fmtDate(row.createdAt),
      contextText && `\ncontext:\n${contextText}`,
      row.stack && `\nstack:\n${row.stack}`,
    ].filter(Boolean).join('\n');
    try {
      await Share.share({ message: text });
    } catch (e) {
      Alert.alert('Could not share', e?.message || 'The share sheet is unavailable.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: S.canvas }}>
      <StudentScreenHeader
        title="Log entry"
        subtitle={row.site}
        right={
          <PressableScale onPress={shareAll} accessibilityLabel="Share the full entry">
            <Share2 size={18} color={S.indigo} strokeWidth={2.4} />
          </PressableScale>
        }
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <View style={{ backgroundColor: tone + '1f', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
            <T w="xbold" s={11} c={tone}>{(row.level || 'error').toUpperCase()}</T>
          </View>
          <SourceIcon size={14} color={S.faint} strokeWidth={2.4} />
          <T w="semi" s={12} c={S.muted}>{row.source}</T>
          <T w="semi" s={11.5} c={S.faint} style={{ marginLeft: 'auto' }}>{fmtDate(row.createdAt)}</T>
        </View>

        <Field label="Where" value={row.site} />
        <Field label="Message" value={row.message || '(no message)'} />
        <CodeBlock label="Context" text={contextText} />
        <CodeBlock label="Stack" text={row.stack} />

        <View style={{ height: 1, backgroundColor: S.hair, marginVertical: 6 }} />

        <Field label="User" value={row.userId} mono />
        <Field label="Role" value={row.userRole} />
        <Field label="App version" value={row.appVersion} />
        <Field label="Platform" value={[row.platform, row.osVersion].filter(Boolean).join(' ')} />
        {/* Same fingerprint = the same fault recurring, with ids and numbers flattened
            out. Worth showing so two entries can be told apart at a glance. */}
        <Field label="Fingerprint" value={row.fingerprint} mono />
      </ScrollView>
    </View>
  );
}
