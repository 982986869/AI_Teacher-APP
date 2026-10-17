import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';
import { ChalkStroke, ChalkLine, Box, Circle, Arrow, Highlight } from './WhiteboardCanvas';
import { BOARD } from './theme';
import { visibleElements, pathLength, boardColor, BOARD_W, BOARD_H } from './doubtBoardLayout';

// ── The board the teacher draws on while answering a doubt ───────────────────
// `elements` is the list of validated board elements the server streamed so far
// (server/src/utils/boardElements.js), in drawing order. Each one is rendered with the
// same chalk primitives as the lesson boards and animates itself on mount, so a new
// element "draws" while the ones before it stay still — their React key is their index
// in the full list (see visibleElements), which is what keeps them from re-animating.
// A `clear` element wipes everything before it.

const STROKE = 2.5;

function renderElement(el, key) {
  const color = boardColor(el.color, BOARD);
  switch (el.op) {
    case 'rect':
      return <Box key={key} x={el.x} y={el.y} w={el.w} h={el.h} color={color} width={STROKE} />;
    case 'circle':
      return <Circle key={key} cx={el.cx} cy={el.cy} r={el.r} color={color} width={STROKE} />;
    case 'line':
      return <ChalkLine key={key} x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} color={color} width={STROKE} />;
    case 'arrow':
      return <Arrow key={key} x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} color={color} width={STROKE} />;
    case 'highlight':
      return <Highlight key={key} x={el.x} y={el.y} width={el.w} height={el.h} color={el.color ? color : BOARD.yellow} />;
    case 'path':
      return <ChalkStroke key={key} d={el.d} length={pathLength(el.d)} color={color} width={STROKE} />;
    case 'text':
      return (
        <SvgText key={key} x={el.x} y={el.y} fontSize={el.size} fontWeight="700" fill={color}>
          {el.text}
        </SvgText>
      );
    default:
      return null;
  }
}

export default function DoubtBoard({ elements = [], height = 200, style }) {
  const visible = visibleElements(elements);
  return (
    <View style={[styles.frame, { height }, style]} accessibilityLabel="Teacher's drawing">
      <Svg width="100%" height="100%" viewBox={`0 0 ${BOARD_W} ${BOARD_H}`} preserveAspectRatio="xMidYMid meet">
        {visible.map(({ key, el }) => renderElement(el, key))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    backgroundColor: BOARD.bg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BOARD.frame,
    overflow: 'hidden',
  },
});
