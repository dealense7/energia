import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/theme';
import { Strings } from '../constants/strings';
import { Image } from 'react-native';
import { Level } from '@/engine/types';

const DIFFICULTY_COLORS = {
  easy:   Colors.green,
  medium: Colors.blue,
  hard:   Colors.gold,
  brutal: Colors.red,
};

const DIFFICULTIES = {
  easy:   Level.Easy,
  medium: Level.Medium,
  hard:   Level.Hard,
  brutal: Level.Brutal,
};

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const { home } = Strings;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.logoRow}>
          <Image source={require('../../assets/logo.png')} style={styles.logo}/>
          <View style={styles.logTextCol}>
            <Text style={styles.logoText}>{home.logoTitle}</Text>
            <Text style={styles.logoSub}>{home.logoSub}</Text>
          </View>
        </View>

        <View style={styles.btnGroup}>
          {(Object.keys(home.difficulties) as Array<keyof typeof DIFFICULTIES>).map((key) => {
            const { label, sub } = home.difficulties[key];
            const color = DIFFICULTY_COLORS[key];
            return (
              <TouchableOpacity
                key={key}
                style={[styles.diffBtn, { borderColor: color }]}
                onPress={() => router.push(`/game?difficulty=${key}`)}
                activeOpacity={0.8}
              >
                <Text style={[styles.diffLabel, { color }]}>{label}</Text>
                <Text style={[styles.diffSub,   { color }]}>{sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={styles.howtoBtn}
            onPress={() => router.push('/howto')}
            activeOpacity={0.7}
          >
            <Text style={styles.howtoText}>{home.howToPlay}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.howtoBtn, styles.row]}
            onPress={() => router.push('/howto')}
            activeOpacity={0.7}
          >
            <Text style={styles.howtoText}>{home.support}</Text>
            <Text style={styles.howtoTextSub}>{home.supportSub}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  logo:       { width: 50, height: 50, resizeMode: 'contain'},
  safe:       { flex: 1, backgroundColor: Colors.bg },
  row:        { flexDirection: 'row', gap: Spacing.lg },
  content:    { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg, paddingTop: 48, paddingBottom: 40, gap: Spacing.xxl },
  logTextCol: { margin: 0},
  logoRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  bolt:       { fontSize: 60 },
  logoText:   { fontSize: 46, lineHeight: 46*1.3, fontFamily: 'Bold', color: Colors.green, letterSpacing: 4 },
  logoSub:    { fontSize: 11, lineHeight: 11*1.3,fontFamily: 'Light', color: '#94a3b8'},
  tagline:    { fontSize: 13, color: Colors.textMuted, letterSpacing: 2, textAlign: 'center', fontFamily: 'Regular' },
  btnGroup:   { width: '100%', gap: 12 },
  diffBtn:    { padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 2, gap: 4 },
  diffLabel:  { fontSize: 20, lineHeight: 20*1.5, fontFamily: 'Bold', letterSpacing: 2 },
  diffSub:    { fontSize: 13, lineHeight: 13*1.3, fontFamily: 'Light', opacity: 0.65, letterSpacing: 1 },
  howtoBtn:   { paddingVertical: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, borderWidth: 1, borderColor: '#334155', borderRadius: Radius.md },
  howtoText:  { color: Colors.textMuted, fontSize: 14, letterSpacing: 1, fontFamily: 'Regular' },
  howtoTextSub:  { color: Colors.textMuted, fontSize: 9, letterSpacing: 0.7, fontFamily: 'Light' },
});