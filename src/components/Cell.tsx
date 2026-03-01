import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Animated } from 'react-native';
import { Tile } from '../engine/types';
import { tileIsLocked, tileLabel, tileStyle } from '../engine/tileHelpers';

interface CellProps {
  tile: Tile;
  row: number;
  col: number;
  isVisited: boolean;
  isCurrent: boolean;
  isNextHint: boolean;
  tilesUnlocked: boolean;
  stepNumber: number | null;
  onPress: (row: number, col: number) => void;
  isShaking: boolean;
  size: number;
}

export const Cell: React.FC<CellProps> = ({
  tile, row, col,
  isVisited, isCurrent, isNextHint,
  tilesUnlocked, stepNumber,
  onPress, isShaking, size,
}) => {
  const shakeX   = useRef(new Animated.Value(0)).current;
  const dotOpacity = useRef(new Animated.Value(1)).current;

  // Pulse the position dot while standing on this cell
  useEffect(() => {
    if (isCurrent) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotOpacity, { toValue: 0.15, duration: 600, useNativeDriver: true }),
          Animated.timing(dotOpacity, { toValue: 1,    duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      dotOpacity.stopAnimation();
      dotOpacity.setValue(1);
    }
  }, [isCurrent]);

  // Shake on invalid tap
  useEffect(() => {
    if (!isShaking) return;
    Animated.sequence([
      Animated.timing(shakeX, { toValue: -7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue:  7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -5, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue:  5, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue:  0, duration: 55, useNativeDriver: true }),
    ]).start();
  }, [isShaking]);

  // ── Derived display values ────────────────────────────────────────────────

  const isDisplayedAsLocked = tileIsLocked(tile) && !tilesUnlocked;
  const { bg, accent }      = tileStyle(tile);
  const label               = tileLabel(tile, isDisplayedAsLocked);
  const labelFontSize       = label.length > 5 ? 10 : label.length > 3 ? 12 : 15;

  const backgroundColor = isVisited && !isCurrent ? '#0a1120' : bg;

  const borderColor = isCurrent   ? accent
                    : isNextHint  ? '#fbbf24'
                    : isVisited   ? '#1e293b'
                    : `${accent}33`;

  return (
    <Animated.View style={{ transform: [{ translateX: shakeX }] }}>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => onPress(row, col)}
        style={[
          styles.cell,
          {
            width:  size,
            height: size,
            backgroundColor,
            borderColor,
            opacity:   isVisited && !isCurrent ? 0.45 : 1,
            elevation: isCurrent ? 8 : isNextHint ? 5 : 0,
          },
        ]}
      >
        {/* Step number shown on already-visited cells */}
        {isVisited && !isCurrent && stepNumber !== null && (
          <Text style={[styles.stepNumber, { color: accent }]}>{stepNumber}</Text>
        )}

        {/* Pulsing dot showing the player's current position */}
        {isCurrent && (
          <Animated.View style={[styles.positionDot, { backgroundColor: accent, opacity: dotOpacity }]} />
        )}

        {/* Main tile label */}
        <Text style={[styles.label, { color: isVisited && !isCurrent ? '#475569' : accent, fontSize: labelFontSize }]}>
          {label}
        </Text>

        {/* Subtle glow overlay on the hint cell */}
        {isNextHint && !isVisited && (
          <View style={styles.hintGlow} pointerEvents="none" />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cell: {
    borderWidth:    2,
    borderRadius:   6,
    alignItems:     'center',
    justifyContent: 'center',
  },
  stepNumber: {
    position:   'absolute',
    top:        3,
    left:       5,
    fontSize:   10,
    fontFamily: 'SpaceMono',
    opacity:    0.7,
  },
  positionDot: {
    position:     'absolute',
    top:          5,
    right:        5,
    width:        7,
    height:       7,
    borderRadius: 4,
  },
  label: {
    fontFamily: 'SpaceMono',
    textAlign:  'center',
  },
  hintGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius:    4,
    backgroundColor: '#fbbf2418',
  },
});