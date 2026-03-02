import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/theme';
import { Strings } from '../constants/strings';

const TILE_COLORS = [
  { color: Colors.green,  bg: '#1a3a2a' },
  { color: Colors.red,    bg: '#3a1a1a' },
  { color: Colors.gold,   bg: '#2e2a10' },
  { color: '#4a5568',   bg: '#1e2433' },
  { color: Colors.blue,   bg: '#1a2a3a' },
  { color: Colors.purple, bg: '#2a1a3a' },
  { color: Colors.orange, bg: '#2e2010' },
];

export const HowToScreen: React.FC = () => {
  const router = useRouter();
  const { nav, howTo } = Strings;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>{nav.back}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{howTo.title}</Text>

        <View style={styles.rulesCard}>
          {howTo.rules.map(({ icon, text, highlight, suffix }) => (
            <Text key={highlight} style={styles.rule}>
              {icon}{'  '}{text}<Text style={styles.hl}>{highlight}</Text>{suffix}
            </Text>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{howTo.tilesSection}</Text>

        {howTo.tiles.map((tile, i) => {
          const { color, bg } = TILE_COLORS[i];
          return (
            <View key={tile.name} style={styles.tileRow}>
              <View style={[styles.tileIcon, { backgroundColor: bg, borderColor: color }]}>
                <Text style={[styles.tileIconText, { color }]}>{tile.icon}</Text>
              </View>
              <View style={styles.tileTextCol}>
                <Text style={[styles.tileName, { color }]}>{tile.name}</Text>
                <Text style={styles.tileDesc}>{tile.desc}</Text>
              </View>
            </View>
          );
        })}

        <TouchableOpacity style={styles.playBtn} onPress={() => router.push('/')} activeOpacity={0.85}>
          <Text style={styles.playText}>{howTo.letsPlay}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  content:     { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl, gap: Spacing.lg },
  backBtn:     { alignSelf: 'flex-start' },
  backText:    { color: Colors.textMuted, fontSize: 14, letterSpacing: 1, fontFamily: 'Regular' },
  title:       { fontSize: 26, fontFamily: 'Bold', color: Colors.green, letterSpacing: 4, textAlign: 'center' },
  rulesCard:   { backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderDark, padding: Spacing.lg, gap: 10 },
  rule:        { fontSize: 13, color: '#94a3b8', fontFamily: 'Light', lineHeight: 22 },
  hl:          { color: Colors.gold, fontFamily: 'Regular' },
  sectionTitle:{ fontSize: 12, color: Colors.textMuted, letterSpacing: 3, fontFamily: 'Regular', textAlign: 'center', textTransform: 'uppercase' },
  tileRow:     { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.bgCard, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.borderDark, padding: Spacing.md },
  tileIcon:    { width: 50, height: 50, borderRadius: Radius.md, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tileIconText:{ fontSize: 13, fontFamily: 'Regular' },
  tileTextCol: { flex: 1, gap: 3 },
  tileName:    { fontSize: 15, fontFamily: 'Bold', letterSpacing: 1 },
  tileDesc:    { fontSize: 13, color: Colors.textMuted, fontFamily: 'Regular' },
  playBtn:     { backgroundColor: Colors.green, paddingVertical: 14, borderRadius: Radius.lg, alignItems: 'center', marginTop: 4 },
  playText:    { color: '#060d1a', fontSize: 18, fontFamily: 'Bold', letterSpacing: 3 },
});