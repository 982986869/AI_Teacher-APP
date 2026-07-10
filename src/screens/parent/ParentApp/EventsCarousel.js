// src/screens/parent/ParentApp/EventsCarousel.js
// The "Offline events" experience on the Parent home. The home shows a single image
// teaser card (EventTeaser); tapping it opens EventsModal — a full-screen page with
// all 7 sections STACKED vertically (scroll down to see them all), not a slider:
//   featured event · explore-by-region · what's-in-store · AILERNOVA skills ·
//   participants grid · community · become-AILERNOVA + footer.
// List data (events/store/skills/gallery) is DB-driven via the report; marketing copy
// lives in CONTENT.event (constants.js). Rebranded AILERNOVA.
import React, { useState } from 'react';
import {
  View, ScrollView, Image, ImageBackground, Dimensions, StyleSheet,
  Linking, LayoutAnimation, Platform, UIManager, Modal, SafeAreaView,
} from 'react-native';
import { Star, Camera, Video, Plus, Minus, Play, Globe, MapPin, Smartphone, Calendar, Clock, Ticket, ExternalLink } from 'lucide-react-native';
import { C, T, CONTENT } from './constants';
import { PressableScale } from './anim';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
const { width: SCREEN_W } = Dimensions.get('window');
const STORE_W = SCREEN_W - 72;   // inner store-slider width (screen − modal pad − card pad)

const open = (u) => { if (u) Linking.openURL(u).catch(() => {}); };
const Stars = ({ n = 5, size = 12 }) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>{Array.from({ length: n }).map((_, i) => <Star key={i} size={size} color="#00B67A" fill="#00B67A" />)}</View>
);

/* 1 ── Featured event ─────────────────────────────────────────────────────── */
function EventPage({ ev, E }) {
  return (
    <View style={[s.card, { backgroundColor: '#14151B' }]}>
      <ImageBackground source={{ uri: ev.image }} style={{ height: 320 }} imageStyle={{ resizeMode: 'cover' }}>
        <View style={s.scrim} />
        <View style={{ flex: 1, padding: 16, justifyContent: 'space-between' }}>
          <View style={s.badge}><T w="bold" s={10} c={C.ink} style={{ letterSpacing: 0.5 }}>{ev.badge || 'IN-PERSON EVENTS'}</T></View>
          <View>
            <T w="semi" s={12.5} c="rgba(255,255,255,0.9)">{ev.duration}</T>
            <T w="xbold" s={22} c="#fff" style={{ lineHeight: 27, marginTop: 2 }}>{ev.title}</T>
            <T w="med" s={12.5} c="rgba(255,255,255,0.85)" style={{ marginTop: 4 }}>{ev.grades}{ev.city ? `  ·  ${ev.city}` : ''}</T>
            <PressableScale style={s.cta} onPress={() => open(ev.ctaUrl)}><T w="bold" s={14.5} c={C.ink}>{ev.ctaLabel || E.cta}</T></PressableScale>
            <PressableScale style={s.learn} onPress={() => open(ev.learnUrl)}>
              <View style={s.learnDot}><Play size={9} color="#fff" fill="#fff" /></View>
              <T w="semi" s={12} c="rgba(255,255,255,0.92)">{ev.learnLabel || E.learn}</T>
            </PressableScale>
          </View>
        </View>
      </ImageBackground>
      <View style={s.footer}>
        <View style={s.statsRow}>
          {E.stats.map((st, i) => (
            <View key={i} style={{ alignItems: 'center' }}>
              <T w="xbold" s={15} c={C.ink}>{st.value}</T><T w="med" s={10.5} c={C.muted}>{st.label}</T>
            </View>
          ))}
        </View>
        <View style={s.ratingRow}>
          <T w="xbold" s={13} c={C.ink}>{E.rating.score}</T><Stars /><T w="med" s={11} c={C.muted}>· {E.rating.count}</T>
        </View>
      </View>
    </View>
  );
}

/* 2 ── Explore events by region ───────────────────────────────────────────── */
function RegionPage({ events, E }) {
  const [region, setRegion] = useState(null);
  const [openList, setOpenList] = useState(false);
  const matches = region ? events.filter((e) => e.city === region) : [];
  return (
    <View style={[s.card, s.pad, s.light]}>
      <T w="xbold" s={19} c={C.ink} style={{ textAlign: 'center', marginTop: 2 }}>{E.exploreTitle}</T>
      <PressableScale style={s.regionPill} onPress={() => { LayoutAnimation.easeInEaseOut(); setOpenList((o) => !o); }}>
        <Globe size={15} color={C.ink} />
        <T w="semi" s={13} c={C.ink} style={{ flex: 1, textAlign: 'center' }}>{region || E.regionCta}</T>
        <T w="bold" s={12} c={C.muted}>{openList ? '▲' : '▼'}</T>
      </PressableScale>
      {openList && (
        <View style={s.regionList}>
          {E.regions.map((c) => (
            <PressableScale key={c} style={s.regionItem} onPress={() => { LayoutAnimation.easeInEaseOut(); setRegion(c); setOpenList(false); }}>
              <MapPin size={13} color={C.blue} /><T w="med" s={13} c={C.ink}>{c}</T>
            </PressableScale>
          ))}
        </View>
      )}
      {!region ? (
        <View style={{ alignItems: 'center', gap: 12, paddingVertical: 28 }}>
          <View style={s.globe}><Globe size={34} color={C.blue} /></View>
          <T w="med" s={13} c={C.muted} style={{ textAlign: 'center', maxWidth: 220, lineHeight: 20 }}>{E.exploreHint}</T>
        </View>
      ) : (
        <View style={{ marginTop: 16, gap: 12 }}>
          {matches.map((e, idx) => (
            <PressableScale key={e.id} onPress={() => open(e.ctaUrl)}
              style={[s.regCard, { backgroundColor: idx % 2 ? '#FBE3D2' : '#FCEFC7', borderLeftColor: idx % 2 ? C.orange : C.gold }]}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <T w="xbold" s={10.5} c="#8A5A2B" style={{ letterSpacing: 0.5 }}>AILERNOVA · {e.city}</T>
                <T w="bold" s={14} c={C.ink} numberOfLines={2} style={{ marginTop: 3, lineHeight: 18 }}>{e.title}</T>
              </View>
              <View style={{ gap: 6 }}>
                <View style={s.regMeta}><Ticket size={12} color={C.ink} /><T w="semi" s={11} c={C.ink}>{e.free ? 'Free' : 'Paid'}</T></View>
                {!!e.date && <View style={s.regMeta}><Calendar size={12} color={C.ink} /><T w="med" s={11} c={C.ink}>{e.date}</T></View>}
                {!!e.time && <View style={s.regMeta}><Clock size={12} color={C.ink} /><T w="med" s={11} c={C.ink}>{e.time}</T></View>}
              </View>
              <View style={s.regLink}><ExternalLink size={13} color={C.ink} /></View>
            </PressableScale>
          ))}
          {!matches.length && <T w="med" s={13} c={C.muted} style={{ textAlign: 'center', marginTop: 12 }}>No events in {region} yet.</T>}
        </View>
      )}
    </View>
  );
}

/* 3 ── What's in store — inner image slider ──────────────────────────────── */
function StorePage({ slides, E }) {
  const [i, setI] = useState(0);
  return (
    <View style={[s.card, s.pad, s.light]}>
      <T w="xbold" s={19} c={C.ink} style={{ textAlign: 'center' }}>{E.storeTitle}</T>
      <T w="med" s={12.5} c={C.muted} style={{ textAlign: 'center', marginTop: 8, lineHeight: 19 }}>{E.storeBody}</T>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }}
        onMomentumScrollEnd={(e) => setI(Math.round(e.nativeEvent.contentOffset.x / STORE_W))}>
        {slides.map((sl) => (
          <View key={sl.id} style={{ width: STORE_W }}>
            <Image source={{ uri: sl.image }} style={s.storeImg} />
            <T w="xbold" s={13} c={C.ink} style={{ letterSpacing: 1, textAlign: 'center', marginTop: 12 }}>{sl.label}</T>
            <T w="med" s={12.5} c={C.muted} style={{ textAlign: 'center', marginTop: 6, lineHeight: 19, paddingHorizontal: 8 }}>{sl.body}</T>
          </View>
        ))}
      </ScrollView>
      <View style={s.dots}>{slides.map((_, k) => <View key={k} style={[s.dot, k === i && s.dotOn]} />)}</View>
    </View>
  );
}

/* 4 ── AILERNOVA Skills You'll Discover ───────────────────────────────────── */
function SkillsPage({ skills, E }) {
  return (
    <View style={[s.card, s.pad, s.light]}>
      <T w="xbold" s={19} c={C.ink}>{E.skillsTitle}</T>
      <T w="med" s={12} c={C.muted} style={{ marginTop: 6, lineHeight: 18 }}>{E.skillsIntro}</T>
      <View style={{ marginTop: 12, gap: 10 }}>
        {skills.map((sk) => (
          <View key={sk.id} style={s.skillRow}>
            <View style={{ flex: 1 }}>
              <T w="xbold" s={12.5} c={C.ink} style={{ letterSpacing: 0.6 }}>{sk.title}</T>
              <T w="med" s={12} c={C.muted} style={{ marginTop: 4, lineHeight: 17 }}>{sk.body}</T>
            </View>
            <View style={[s.skillIcon, { backgroundColor: sk.color || C.blueSoft }]}><T s={22}>{sk.emoji || '✦'}</T></View>
          </View>
        ))}
      </View>
    </View>
  );
}

/* 5 ── Hear From Our Participants — photo grid ────────────────────────────── */
function ParticipantsPage({ gallery, E }) {
  const col = (arr) => (
    <View style={{ flex: 1, gap: 8 }}>
      {arr.map((g, i) => <Image key={g.id} source={{ uri: g.image }} style={[s.gPhoto, { height: i % 2 ? 150 : 110 }]} />)}
    </View>
  );
  return (
    <View style={[s.card, s.pad, s.light]}>
      <T w="xbold" s={19} c={C.ink} style={{ textAlign: 'center', marginBottom: 12 }}>{E.participantsTitle}</T>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {col(gallery.filter((_, i) => i % 2 === 0))}
        {col(gallery.filter((_, i) => i % 2 === 1))}
      </View>
    </View>
  );
}

/* 6 ── Join our community ─────────────────────────────────────────────────── */
function CommunityPage({ gallery, E }) {
  const cm = E.community;
  const strip = gallery.slice(0, 3);
  return (
    <View style={[s.card, { backgroundColor: '#14151B', overflow: 'hidden' }]}>
      <View style={{ padding: 22 }}>
        <T w="xbold" s={22} c="#fff" style={{ lineHeight: 28 }}>{cm.title}</T>
        <T w="med" s={13} c="rgba(255,255,255,0.7)" style={{ marginTop: 10, lineHeight: 19 }}>{cm.body}</T>
        <PressableScale style={[s.social, { backgroundColor: '#E1306C' }]} onPress={() => open(cm.instagram)}>
          <Camera size={17} color="#fff" /><T w="bold" s={14} c="#fff">Follow us on Instagram</T>
        </PressableScale>
        <PressableScale style={[s.social, { backgroundColor: '#FF0000' }]} onPress={() => open(cm.youtube)}>
          <Video size={18} color="#fff" /><T w="bold" s={14} c="#fff">Subscribe on YouTube</T>
        </PressableScale>
      </View>
      {!!strip.length && (
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {strip.map((g) => <Image key={g.id} source={{ uri: g.image }} style={{ flex: 1, height: 140 }} />)}
        </View>
      )}
    </View>
  );
}

/* 7 ── Become AILERNOVA + functional footer accordion ─────────────────────── */
function BecomePage({ E }) {
  const bc = E.become;
  const ft = E.footer;
  const [openIdx, setOpenIdx] = useState(-1);
  const toggle = (i) => { LayoutAnimation.easeInEaseOut(); setOpenIdx((o) => (o === i ? -1 : i)); };
  return (
    <View style={[s.card, s.light, { overflow: 'hidden' }]}>
      <View style={{ backgroundColor: '#14151B', padding: 20 }}>
        <T w="xbold" s={13} c="#fff" style={{ letterSpacing: 0.6 }}>{bc.title}</T>
        <T w="med" s={12.5} c="rgba(255,255,255,0.72)" style={{ marginTop: 6, lineHeight: 18 }}>{bc.body}</T>
        <PressableScale style={s.appBtn} onPress={() => open(bc.appUrl)}>
          <Smartphone size={16} color="#fff" /><T w="bold" s={13.5} c="#fff">{bc.appCta}</T>
        </PressableScale>
        <View style={s.catRow}>
          {bc.categories.map((c) => (
            <View key={c.label} style={{ alignItems: 'center', gap: 7, flex: 1 }}>
              <View style={s.catCircle}><T s={22} c="#fff">{c.emoji}</T></View>
              <T w="bold" s={9.5} c="rgba(255,255,255,0.8)" style={{ textAlign: 'center', letterSpacing: 0.3 }}>{c.label}</T>
            </View>
          ))}
        </View>
      </View>
      <View style={{ padding: 18 }}>
        {ft.links.map((l, i) => (
          <View key={l.q} style={s.accItem}>
            <PressableScale style={s.accHead} onPress={() => toggle(i)}>
              <T w="bold" s={13} c={C.ink} style={{ flex: 1, letterSpacing: 0.3 }}>{l.q.toUpperCase()}</T>
              {openIdx === i ? <Minus size={17} color={C.muted} /> : <Plus size={17} color={C.muted} />}
            </PressableScale>
            {openIdx === i && <T w="med" s={12.5} c={C.muted} style={{ lineHeight: 19, paddingBottom: 12 }}>{l.a}</T>}
          </View>
        ))}
        <View style={s.offices}>
          {ft.offices.map((o) => (
            <View key={o.label} style={{ flex: 1 }}>
              <T w="bold" s={11} c={C.ink} style={{ letterSpacing: 0.5 }}>{o.label}</T>
              <T w="med" s={11.5} c={C.muted} style={{ marginTop: 6, lineHeight: 17 }}>{o.lines}</T>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/* ── All sections stacked vertically (default export) ─────────────────────── */
export default function EventsStack({ events = [], store = [], skills = [], gallery = [] }) {
  const E = CONTENT.event;
  return (
    <View style={{ gap: 14 }}>
      {/* Register Now lands here: the region selector (default "Select Region" state)
          shows first, exactly like the reference. The featured event + the rest follow. */}
      <RegionPage events={events} E={E} />
      {!!events.length && <EventPage ev={events[0]} E={E} />}
      {!!store.length && <StorePage slides={store} E={E} />}
      {!!skills.length && <SkillsPage skills={skills} E={E} />}
      {!!gallery.length && <ParticipantsPage gallery={gallery} E={E} />}
      <CommunityPage gallery={gallery} E={E} />
      <BecomePage E={E} />
    </View>
  );
}

/* ── Home teaser: a single image event card that opens the full page ───────── */
export function EventTeaser({ event, onOpen }) {
  const E = CONTENT.event;
  const ev = event || {};
  return (
    <PressableScale onPress={onOpen} style={[s.card, { backgroundColor: '#14151B' }]}>
      <ImageBackground source={{ uri: ev.image }} style={s.teaser} imageStyle={{ resizeMode: 'cover' }}>
        <View style={s.scrim} />
        <View>
          <T w="semi" s={12} c="rgba(255,255,255,0.9)" style={{ letterSpacing: 0.3 }}>{ev.badge || 'IN-PERSON EVENTS'}</T>
          <T w="xbold" s={27} c="#fff" style={{ lineHeight: 31, marginTop: 5 }}>{ev.title}</T>
          <T w="med" s={12.5} c="rgba(255,255,255,0.85)" style={{ marginTop: 4 }}>{ev.grades}{ev.city ? `  ·  ${ev.city}` : ''}</T>
        </View>
        <View style={s.teaserBtn}><T w="bold" s={15} c={C.ink}>{ev.ctaLabel || E.cta}</T></View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Stars /><T w="semi" s={11} c="rgba(255,255,255,0.85)">{E.rating.score} · {E.rating.count}</T>
        </View>
      </ImageBackground>
    </PressableScale>
  );
}

/* ── Full-screen modal — the whole stacked page ───────────────────────────── */
export function EventsModal({ visible, onClose, events, store, skills, gallery }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F6F7' }}>
        <View style={s.mHead}>
          <PressableScale onPress={onClose} style={s.mBack}><T s={26} c={C.ink}>‹</T></PressableScale>
          <T w="bold" s={16} c={C.ink}>Events</T><View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 8, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          <EventsStack events={events} store={store} skills={skills} gallery={gallery} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 20, overflow: 'hidden', shadowColor: '#141420', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  light: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border },
  pad: { padding: 18 },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(12,12,18,0.42)' },
  badge: { alignSelf: 'center', backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  cta: { backgroundColor: C.gold, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 16 },
  learn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', marginTop: 12 },
  learnDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
  footer: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderTopWidth: 1, borderTopColor: C.border, marginTop: 10, paddingTop: 10 },

  regionPill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: C.border, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 11, marginTop: 16 },
  regionList: { borderWidth: 1, borderColor: C.border, borderRadius: 14, marginTop: 8, overflow: 'hidden' },
  regionItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  globe: { width: 68, height: 68, borderRadius: 34, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  regionEvt: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 10 },
  regionThumb: { width: 54, height: 54, borderRadius: 10, backgroundColor: C.border },
  regCard: { flexDirection: 'row', borderRadius: 14, borderLeftWidth: 4, paddingVertical: 14, paddingLeft: 14, paddingRight: 12 },
  regMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'flex-end' },
  regLink: { position: 'absolute', top: 8, right: 8, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },

  storeImg: { width: '100%', height: 190, borderRadius: 14, backgroundColor: C.border },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.border },
  dotOn: { backgroundColor: C.ink, width: 18 },

  skillRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 12 },
  skillIcon: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  gPhoto: { width: '100%', borderRadius: 12, backgroundColor: C.border },

  social: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 12, paddingVertical: 13, marginTop: 14 },

  appBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 10, paddingVertical: 12, marginTop: 14 },
  catRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  catCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  accItem: { borderBottomWidth: 1, borderBottomColor: C.border },
  accHead: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  offices: { flexDirection: 'row', gap: 16, marginTop: 20 },

  teaser: { height: 330, padding: 18, justifyContent: 'space-between' },
  teaserBtn: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 13, alignItems: 'center', alignSelf: 'stretch' },
  mHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  mBack: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
