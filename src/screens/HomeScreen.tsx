import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useLanguage, Language } from '../contexts/LanguageContext';
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
  const { strings, language, setLanguage } = useLanguage();
  const { home } = strings;

  const languages = [
    { code: 'en' as Language, name: 'English' },
    { code: 'es' as Language, name: 'Español' },
    { code: 'fr' as Language, name: 'Français' },
    { code: 'ru' as Language, name: 'Русский' },
  ];

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

        {/* Language Selector */}
        <View style={styles.languageSelector}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langBtn, language === lang.code && styles.langBtnActive]}
              onPress={() => setLanguage(lang.code)}
              activeOpacity={0.7}
            >
              <Text style={[styles.langText, language === lang.code && styles.langTextActive]}>
                {lang.name}
              </Text>
            </TouchableOpacity>
          ))}
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
            style={[styles.howtoBtn, styles.row]}
            onPress={() => router.push('/howto')}
            activeOpacity={0.7}
          >
            <Image source={require('../../assets/manual.png')} style={styles.hatlogo}/>
            <Text style={styles.howtoText}>{home.howToPlay}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.howtoBtn, styles.row]}
            onPress={() => router.push('/tutorial')}
            activeOpacity={0.7}
          >
            <Image source={require('../../assets/education.png')} style={styles.hatlogo}/>
            <Text style={styles.howtoText}>{home.tutorial}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.howtoBtn, styles.row]}
            onPress={() => router.push('https://github.com/dealense7/energia')}
            activeOpacity={0.7}
          >
            <Image source={require('../../assets/git.png')} style={styles.hatlogo}/>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  hatlogo:    { width: 20, height: 20, padding:0, resizeMode: 'contain'},
  logo:       { width: 50, height: 50, resizeMode: 'contain'},
  safe:       { flex: 1, backgroundColor: Colors.bg },
  row:        { flexDirection: 'row', gap: Spacing.lg, justifyContent: 'center', flexWrap: 'wrap' },
  content:    { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg, paddingTop: 48, paddingBottom: 40, gap: Spacing.xxl },
  logTextCol: { margin: 0, flexShrink: 0, maxWidth: '100%' },
  logoRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, flexWrap: 'wrap' },
  bolt:       { fontSize: 60 },
  logoText:   { fontSize: 46, lineHeight: 46*1.3, fontFamily: 'Bold', color: Colors.green, letterSpacing: 2, flexShrink: 1, flexWrap: 'wrap', textAlign: 'center' },
  logoSub:    { fontSize: 11, lineHeight: 11*1.3, fontFamily: 'Light', color: '#94a3b8', textAlign: 'center' },
  tagline:    { fontSize: 13, color: Colors.textMuted, letterSpacing: 2, textAlign: 'center', fontFamily: 'Regular' },
  btnGroup:   { width: '100%', gap: 12 },
  diffBtn:    { padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 2, gap: 4 },
  diffLabel:  { fontSize: 20, lineHeight: 20*1.5, fontFamily: 'Bold', letterSpacing: 2 },
  diffSub:    { fontSize: 13, lineHeight: 13*1.3, fontFamily: 'Light', opacity: 0.65, },
  tutorialBtn: { padding: Spacing.lg, borderRadius: Radius.lg, borderWidth: 2, gap: 4,width: '100%',marginVertical: Spacing.md },
  tutorialLabel: { fontSize: 18, lineHeight: 18*1.5, fontFamily: 'Bold', },
  tutorialSub: { fontSize: 13, lineHeight: 13*1.3, fontFamily: 'Light', opacity: 0.65,},
  howtoBtn:   { paddingVertical: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, borderWidth: 1, borderColor: '#334155', borderRadius: Radius.md },
  howtoText:  { color: Colors.textMuted, fontSize: 9, fontFamily: 'Regular', textAlign: 'center' },
  howtoTextSub:  { color: Colors.textMuted, fontSize: 9, letterSpacing: 0.7, fontFamily: 'Light' },
  languageSelector: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  langBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: '#334155' },
  langBtnActive: { backgroundColor: Colors.green, borderColor: Colors.green },
  langText: { color: Colors.textMuted, fontSize: 14, fontFamily: 'Light' },
  langTextActive: { color: Colors.bg },
});