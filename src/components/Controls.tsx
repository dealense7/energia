import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Strings } from '../constants/strings';
import { Colors, Spacing, Radius } from '../constants/theme';

interface ControlsProps {
  onUndo: () => void;
  onReset: () => void;
  canUndo: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ onUndo, onReset, canUndo }) => (
  <View style={styles.row}>
    <TouchableOpacity
      style={[styles.btn, !canUndo && styles.disabled]}
      onPress={onUndo}
      disabled={!canUndo}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, !canUndo && { opacity: 0.35 }]}>↩ {Strings.controls.undo}</Text>
    </TouchableOpacity>
    <TouchableOpacity style={[styles.btn, styles.resetBtn]} onPress={onReset} activeOpacity={0.7}>
      <Text style={[styles.text, styles.resetText]}>↺ {Strings.controls.reset}</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap:           10,
    width:         '90%',
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    backgroundColor: Colors.bgCard,
    borderWidth: 2,
    borderColor: Colors.borderDark,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  disabled: { opacity: 0.4 },
  resetBtn: { borderColor: '#f8717133' },
  text: {
    color: '#94a3b8',
    fontSize: 15,
    letterSpacing: 1.5,
    fontFamily: 'RajdhaniBold',
  },
  resetText: { color: Colors.red },
});