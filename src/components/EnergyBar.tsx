import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { Colors, Spacing, Radius } from '../constants/theme';

export type EnergyFlash = 'gain' | 'loss' | 'mul' | null;

const FLASH_COLOR: Record<string, string> = {
  gain: Colors.green,
  loss: Colors.red,
  mul:  Colors.gold,
};

interface EnergyBarProps {
  energy: number;
  movesMade: number;
  tilesUnlocked: boolean;
  movesUntilUnlock: number;
  flash: EnergyFlash;
  playUnlockAnim: boolean;
  isPlaying: boolean;
}

export const EnergyBar: React.FC<EnergyBarProps> = ({
  energy, movesMade, tilesUnlocked, movesUntilUnlock,
  flash, playUnlockAnim, isPlaying,
}) => {
  const { strings } = useLanguage();
  const borderColor = useRef(new Animated.Value(0)).current;
  const lockScale   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!flash) return;
    borderColor.setValue(1);
    Animated.timing(borderColor, { toValue: 0, duration: 500, useNativeDriver: false }).start();
  }, [flash]);

  useEffect(() => {
    if (!playUnlockAnim) return;
    Animated.sequence([
      Animated.timing(lockScale, { toValue: 1.5, duration: 220, useNativeDriver: true }),
      Animated.timing(lockScale, { toValue: 0.9, duration: 140, useNativeDriver: true }),
      Animated.timing(lockScale, { toValue: 1.0, duration: 140, useNativeDriver: true }),
    ]).start();
  }, [playUnlockAnim]);

  const animatedBorder = borderColor.interpolate({
    inputRange:  [0, 1],
    outputRange: [Colors.borderMid, flash ? FLASH_COLOR[flash] : Colors.borderMid],
  });

  const energyIsLow    = energy <= 3 && isPlaying;
  const showLockStatus = movesUntilUnlock > 0 || tilesUnlocked;

  return (
    <Animated.View style={[styles.bar, { borderColor: animatedBorder }]}>
      <Text style={styles.label}>{strings.energyBar.label}</Text>

      <Text style={[styles.energy, { color: energyIsLow ? Colors.red : Colors.textPrimary }]}>
        {energy}{energyIsLow ? ' ' + strings.energyBar.lowEnergyAlert : ''}
      </Text>

      <Text style={styles.moves}>{strings.energyBar.movesLabel} {movesMade}</Text>

      {showLockStatus && (
        <Animated.Text style={[
          styles.lockStatus,
          { color: tilesUnlocked ? Colors.green : '#94a3b8' },
          { transform: [{ scale: lockScale }] },
        ]}>
          {tilesUnlocked ? strings.energyBar.unlocked : strings.energyBar.locked(movesUntilUnlock)}
        </Animated.Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Spacing.md,
    backgroundColor: Colors.bgCard,
    borderWidth:     2,
    borderRadius:    Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    width:           '90%',   // matches the scroll content alignment
  },
  label: {
    fontSize:   11,
    letterSpacing: 1.5,
    color:      Colors.textMuted,
    fontFamily: 'Regular',
  },
  energy: {
    fontSize:   26,
    fontFamily: 'Regular',
    flex:       1,
    textAlign:  'center',
  },
  moves: {
    fontSize:   11,
    color:      Colors.textDim,
    fontFamily: 'Regular',
  },
  lockStatus: {
    fontSize:   10,
    fontFamily: 'Regular',
    marginLeft: 4,
  },
});