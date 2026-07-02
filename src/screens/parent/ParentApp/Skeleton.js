// src/screens/parent/ParentApp/Skeleton.js
import React, { memo, useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { C, s } from './constants';

function Skeleton() {
  const p = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(p, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(p, { toValue: 0.4, duration: 700, useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, [p]);
  const B = ({ w, h, r = 12, mt = 0, mb = 0 }) => (
    <Animated.View style={{ width: w, height: h, borderRadius: r, backgroundColor: C.skeleton, opacity: p, marginTop: mt, marginBottom: mb }} />
  );
  return (
    <View style={s.flexFill}>
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <B w={46} h={46} r={23} />
          <View><B w={90} h={18} /><B w={120} h={12} mt={6} /></View>
        </View>
        <B w={78} h={34} r={17} />
      </View>
      <View style={{ paddingHorizontal: 18 }}>
        <B w={140} h={12} mt={22} mb={12} />
        <View style={{ flexDirection: 'row', gap: 10 }}><B w={220} h={70} r={16} /><B w={140} h={70} r={16} /></View>
        <B w={120} h={12} mt={24} mb={12} />
        <B w={'100%'} h={230} r={20} />
        <B w={120} h={12} mt={24} mb={12} />
        <B w={'100%'} h={150} r={20} />
      </View>
    </View>
  );
}

export default memo(Skeleton);
