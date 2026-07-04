// src/screens/parent/ParentApp/Skeleton.js — loading placeholder. Identical block
// layout to before; the only change is a sweeping shimmer highlight (via the shared
// Shimmer primitive) instead of a plain opacity pulse.
import React, { memo } from 'react';
import { View } from 'react-native';
import { st } from './constants';
import { Shimmer } from './anim';

function Skeleton() {
  return (
    <View style={st.screen}>
      <View style={st.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Shimmer w={46} h={46} r={23} />
          <View><Shimmer w={90} h={18} /><Shimmer w={120} h={12} mt={6} /></View>
        </View>
        <Shimmer w={78} h={34} r={17} />
      </View>
      <View style={{ paddingHorizontal: 18 }}>
        <Shimmer w={140} h={12} mt={22} mb={12} />
        <View style={{ flexDirection: 'row', gap: 10 }}><Shimmer w={220} h={70} r={16} /><Shimmer w={140} h={70} r={16} /></View>
        <Shimmer w={120} h={12} mt={24} mb={12} />
        <Shimmer w={'100%'} h={230} r={20} />
        <Shimmer w={120} h={12} mt={24} mb={12} />
        <Shimmer w={'100%'} h={150} r={20} />
      </View>
    </View>
  );
}

export default memo(Skeleton);
