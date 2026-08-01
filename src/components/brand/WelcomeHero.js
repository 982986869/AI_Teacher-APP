import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

/**
 * Backdrop for the welcome screen.
 *
 * This is the designer's single flattened export (Figma node "1", 390x844): the
 * student photograph, the four floating product cards, the AI mascot AND the dark
 * scrim are all baked into it. So there is deliberately nothing to compose here —
 * do NOT re-add a gradient or a scrim on top, or the bottom third will double up
 * and crush the text sitting over it.
 *
 * Earlier this component rebuilt those cards and the mascot in code, as a stand-in
 * while the photo was missing. That reconstruction is gone now that the real art
 * exists.
 */
const HERO_IMAGE = require('../../../assets/brand/welcome-hero.png');

export default function WelcomeHero() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.root]} pointerEvents="none">
      {/* `cover`, not `stretch`: the image is a photograph, so it has to keep its
          aspect ratio on screens that aren't 390x844. The bottom third of the art
          is flat navy, so cropping never eats into the area behind the headline. */}
      <Image source={HERO_IMAGE} style={StyleSheet.absoluteFill} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  // Matches the solid colour the hero art fades into, so no seam can show through
  // on an aspect ratio the export doesn't cover.
  root: { backgroundColor: '#030124' },
});
