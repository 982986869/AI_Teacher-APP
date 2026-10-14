import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';
import { PAPER, GRID } from './theme';

// The board's light graph-paper ground: one tiled 32px cell, drawn once by SVG.
function GridPaper() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: PAPER }]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <Path d="M 32 0 L 0 0 0 32" fill="none" stroke={GRID} strokeWidth="1" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grid)" />
      </Svg>
    </View>
  );
}

export default React.memo(GridPaper);
