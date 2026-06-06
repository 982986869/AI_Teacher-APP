import React, { useEffect, useRef } from 'react';
import {
  View, Text, Animated, StyleSheet, StatusBar
} from 'react-native';

const APP_NAME = 'AiLernova';
const LETTER_DELAY = 120;

export default function SplashScreen({ navigation }) {
  const letterAnims = useRef(
    APP_NAME.split('').map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(10),
    }))
  ).current;

  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animations = letterAnims.map((anim, i) =>
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 180,
          delay: i * LETTER_DELAY,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: 0,
          duration: 180,
          delay: i * LETTER_DELAY,
          useNativeDriver: true,
        }),
      ])
    );

    const taglineAnim = Animated.timing(taglineOpacity, {
      toValue: 1,
      duration: 600,
      delay: APP_NAME.length * LETTER_DELAY + 300,
      useNativeDriver: true,
    });

    Animated.parallel([...animations, taglineAnim]).start(() => {
      setTimeout(() => {
        navigation.replace('Landing');
      }, 800);
    });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.nameRow}>
        {APP_NAME.split('').map((letter, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.letter,
              {
                opacity: letterAnims[i].opacity,
                transform: [{ translateY: letterAnims[i].translateY }],
              },
            ]}
          >
            {letter}
          </Animated.Text>
        ))}
      </View>
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Make your Learning Smarter, Faster
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  letter: {
    fontSize: 36,
    fontWeight: '900',
    color: '#111111',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize: 14,
    fontWeight: '400',
    color: '#222222',
    letterSpacing: 0.5,
  },
});