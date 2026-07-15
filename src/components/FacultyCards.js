// src/components/FacultyCards.js
// "Our Faculty" — the shared roster shown on both the Parent home and the Teacher
// workspace. Built on the studentTheme tokens + the Nunito `T` atom + the shared
// PressableScale, so it inherits the app-wide design system on either surface.
//
// Presentation: an AUTO-ADVANCING CARD DECK. Cards are stacked one over another; on a
// timer the front card slides off (over the ones beneath) and the next rises to the top.
// Every card is the SAME fixed size and the description area is always reserved, so a
// member without a bio yet still gets an equally-sized card. `dark` flips the surface
// for the near-black Teacher workspace.
import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { T } from '../screens/parent/ParentApp/constants';
import { PressableScale, Float } from '../screens/parent/ParentApp/anim';
import { S, shadow, ACCENTS } from '../theme/studentTheme';
import { FACULTY, initialsOf } from '../data/faculty';

const SCREEN_W = Dimensions.get('window').width;
const CARD_W = Math.min(300, SCREEN_W - 84);
const PHOTO_H = 250;             // portrait box, so cover fills it while keeping faces
const CARD_H = 436;              // fixed → every card is identical in size
const PEEK_TY = 16;              // each card behind sits this much lower…
const PEEK_SCALE = 0.06;         // …and this much smaller, for the stacked look
const DECK_H = CARD_H + PEEK_TY * 2 + 8;
const INTERVAL = 3200;           // ms each card stays in front
const SLIDE = 540;               // ms of the slide-over transition
const EASE = Easing.bezier(0.22, 1, 0.36, 1);

// One fixed-size face. Purely presentational — the deck positions and animates it.
function CardFace({ person, accent, dark }) {
  const surface = dark ? '#17171B' : S.card;
  const border = dark ? '#26262C' : S.border;   // single hairline, not a hard black outline
  const ink = dark ? '#FFFFFF' : S.ink;
  const muted = dark ? '#9A9AA0' : S.muted;

  return (
    <View style={[fc.card, { backgroundColor: surface, borderColor: border }, !dark && shadow]}>
      <View style={[fc.photoWrap, { backgroundColor: dark ? '#141419' : S.canvas }]}>
        {person.photo ? (
          // cover fills the box edge-to-edge (no side gaps). The box is portrait-shaped,
          // so cover trims the sides — not the top/bottom where faces are.
          <Image source={person.photo} style={fc.photo} resizeMode="cover" />
        ) : (
          <View style={[fc.monogram, { backgroundColor: accent + '22' }]}>
            <T w="black" s={40} c={accent}>{initialsOf(person.name)}</T>
          </View>
        )}
      </View>

      {/* Fixed-height detail area — always present, so cards stay equal even when a
          member hasn't sent their description yet (the space is simply left blank). */}
      <View style={fc.meta}>
        {!!person.name && (
          <T w="xbold" s={15.5} c={ink} numberOfLines={1} style={{ letterSpacing: -0.2 }}>{person.name}</T>
        )}
        {!!person.subject && (
          <View style={[fc.pill, { backgroundColor: accent + (dark ? '2E' : '1A') }]}>
            <T w="bold" s={10.5} c={accent} style={{ letterSpacing: 0.3 }}>{person.subject.toUpperCase()}</T>
          </View>
        )}
        {!!person.qualification && (
          <T w="semi" s={11} c={muted} numberOfLines={2} style={{ lineHeight: 15 }}>{person.qualification}</T>
        )}
        {!!person.experience && (
          <T w="bold" s={11} c={accent}>{person.experience}</T>
        )}
        {!!person.bio && (
          <T w="med" s={12} c={muted} numberOfLines={3} style={{ lineHeight: 16.5 }}>{person.bio}</T>
        )}
      </View>
    </View>
  );
}

export default function FacultyCards({ title = 'Our Faculty', dark = false, people = FACULTY, onSelect }) {
  const N = people?.length || 0;
  const [top, setTop] = useState(0);
  const [restart, setRestart] = useState(0);   // bump to reset the auto-advance timer
  const anim = useRef(new Animated.Value(0)).current;

  // Auto-advance: slide the front card off, then promote the deck.
  useEffect(() => {
    if (N <= 1) return undefined;
    let alive = true;
    const id = setInterval(() => {
      Animated.timing(anim, { toValue: 1, duration: SLIDE, easing: EASE, useNativeDriver: true })
        .start(({ finished }) => {
          if (!finished || !alive) return;
          setTop((t) => (t + 1) % N);
          anim.setValue(0);
        });
    }, INTERVAL);
    return () => { alive = false; clearInterval(id); anim.stopAnimation(); };
  }, [N, restart, anim]);

  if (!N) return null;

  const jump = (i) => {
    if (i === top) return;
    anim.setValue(0);
    setTop(i);
    setRestart((r) => r + 1);
  };

  // Render up to three layers, back-to-front, so the front card paints on top.
  const layers = [];
  for (let d = Math.min(2, N - 1); d >= 0; d--) {
    const person = people[(top + d) % N];
    const accent = ACCENTS[((top + d) % N) % ACCENTS.length];

    let transform;
    let opacity;
    if (d === 0) {
      // Front card slides off to the left (over the ones beneath), tilting and fading.
      transform = [
        { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -(CARD_W + 80)] }) },
        { rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-8deg'] }) },
      ];
      opacity = anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.2, 0] });
    } else {
      // Cards behind rise one slot forward (bigger + higher) as the front leaves.
      const sFrom = 1 - PEEK_SCALE * d, sTo = 1 - PEEK_SCALE * (d - 1);
      const yFrom = PEEK_TY * d, yTo = PEEK_TY * (d - 1);
      transform = [
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [yFrom, yTo] }) },
        { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [sFrom, sTo] }) },
      ];
      opacity = d >= 2 ? anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) : 1;
    }

    const face = <CardFace person={person} accent={accent} dark={dark} />;
    layers.push(
      <Animated.View key={d} style={[fc.layer, { width: CARD_W, opacity, transform }]}>
        {d === 0 ? (
          <Float distance={5} duration={2600}>
            <PressableScale
              scaleTo={0.96}
              onPress={onSelect ? () => onSelect(person) : undefined}
              accessibilityRole={onSelect ? 'button' : 'image'}
              accessibilityLabel={person.name ? `${person.name}${person.subject ? `, ${person.subject}` : ''}` : 'Faculty member'}
            >
              {face}
            </PressableScale>
          </Float>
        ) : face}
      </Animated.View>
    );
  }

  return (
    <View style={fc.section}>
      <View style={fc.head}>
        <View style={[fc.dot, { backgroundColor: S.indigo }]} />
        <T w="black" s={16} c={dark ? '#FFFFFF' : S.ink} style={{ letterSpacing: -0.3 }}>{title}</T>
        <T w="bold" s={11.5} c={dark ? '#7A7A82' : S.faint} style={{ marginLeft: 'auto' }}>
          {N} {N === 1 ? 'teacher' : 'teachers'}
        </T>
      </View>

      <View style={[fc.deck, { height: DECK_H }]}>{layers}</View>

      {N > 1 && (
        <View style={fc.dots}>
          {people.map((p, i) => (
            <PressableScale key={p.id || i} onPress={() => jump(i)} hitSlop={8}>
              <View style={[fc.dotTick, i === top ? { backgroundColor: S.indigo, width: 18 } : { backgroundColor: dark ? '#3A3A42' : S.border }]} />
            </PressableScale>
          ))}
        </View>
      )}
    </View>
  );
}

const fc = StyleSheet.create({
  section: { marginTop: 4 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },

  deck: { alignItems: 'center', justifyContent: 'flex-start' },
  layer: { position: 'absolute', top: 0 },

  card: { width: CARD_W, height: CARD_H, borderRadius: 22, borderWidth: 1, padding: 12, gap: 12 },
  photoWrap: { height: PHOTO_H, borderRadius: 16, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  monogram: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // flex:1 keeps the card height fixed regardless of how much text a member provided,
  // so the block below the photo is always the same size (blank when no bio).
  meta: { flex: 1, gap: 6, paddingHorizontal: 2 },
  pill: { alignSelf: 'flex-start', borderRadius: 7, paddingHorizontal: 9, paddingVertical: 3 },

  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 16, flexWrap: 'wrap' },
  dotTick: { width: 7, height: 7, borderRadius: 4 },
});
