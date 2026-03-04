import React, { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Radius } from '../constants/theme';
import { useLanguage } from '../contexts/LanguageContext';

export const WinScreen: React.FC = () => {
  const router = useRouter();
  const { time = '0', gridSize = '3', difficulty = 'easy', leftEnergy = '2', seed = '0' } = useLocalSearchParams<{
    time: string; gridSize: string; difficulty: string; leftEnergy: string; seed: string;
  }>();

  const pulse = useRef(new Animated.Value(1)).current;
  const fade  = useRef(new Animated.Value(0)).current;
  const { strings } = useLanguage();
  const { win } = strings;

  const seconds = Number(time);
  const minutes = (seconds / 60).toFixed(1);

  const getSubtitle = (stars: number) => {
    if (stars === 3) return win.subtitle[Math.floor(Math.random() * win.subtitle.length)];
    if (stars === 2) return win.subtitletwo[Math.floor(Math.random() * win.subtitletwo.length)];
    return win.subtitleone[Math.floor(Math.random() * win.subtitleone.length)];
  };

  const stars = Number(leftEnergy) === 0 ? 3
              : Number(leftEnergy) >= 3 ? 1
              : Number(leftEnergy) > 0 ? 2
              : 0;
              
  const subtitle = getSubtitle(stars);

  useEffect(() => {

    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.88, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.container, { opacity: fade }]}>
        <Animated.Text style={[styles.bolt, { transform: [{ scale: pulse }] }]}>
          <Image source={require('../../assets/logo.png')} style={styles.logo}/>
        </Animated.Text>
        <Text style={styles.title}>{win.title[Math.floor(Math.random() * win.title.length)]}</Text>
        <Text style={styles.sub}>{subtitle}</Text>

        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.statVal}>{seconds > 60 ? minutes : seconds}</Text>
              <Text style={{ fontSize: 10, color: Colors.textMuted, marginLeft: 2, marginTop: 10 }}>{seconds > 60 ? 'm' : 's'}</Text>
            </View>
            <Text style={styles.statLabel}>{win.statMoves}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Text 
                  key={i} 
                  style={[styles.statVal, { color: i < stars ? Colors.gold : Colors.borderDark }]}
                >
                  ★
                </Text>
              ))}
            </View>
            <Text style={styles.statLabel}>{win.statGrid}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={[styles.statVal, { textTransform: 'capitalize' }]}>{difficulty}</Text>
            <Text style={styles.statLabel}>{win.statLevel} {gridSize}×{gridSize}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/')} activeOpacity={0.85}>
          <Text style={styles.primaryText}>{win.home}</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: Spacing.lg}}>
          <TouchableOpacity style={styles.backBtnStyle} onPress={() => router.replace(`/game?difficulty=${difficulty}&seedNumber=${seed}`)}>
            <Text style={styles.backText}>{win.replay}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtnStyle} onPress={() => router.replace(`/game?difficulty=${difficulty}`)}>
            <Text style={styles.backText}>{win.generate}</Text>
          </TouchableOpacity>
        </View>
        
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  
  row: {flexDirection: 'row', gap: 10, width: '90%'},
  logo:       { width: 50, height: 50, resizeMode: 'contain'},
  safe:      { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxl, gap: Spacing.xl },
  bolt:      { fontSize: 80 },
  title:     { fontSize: 30, fontFamily: 'Bold', color: Colors.gold, letterSpacing: 6, textAlign: 'center' },
  sub:       { color: Colors.textMuted, fontSize: 10, letterSpacing: 3, fontFamily: 'Light', textAlign: 'center' },
  statsCard: {
    flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.borderDark, paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xxl, gap: Spacing.xxl, alignItems: 'center',
  },
  stat:         { alignItems: 'center', gap: 4 },
  statVal:      { fontSize: 32, fontFamily: 'Regular', color: Colors.textPrimary },
  statLabel:    { fontSize: 11, color: Colors.textMuted, letterSpacing: 2, fontFamily: 'Regular' },
  divider:      { width: 1, height: 44, backgroundColor: Colors.borderDark },
  primaryBtn:   { backgroundColor: Colors.gold, paddingVertical: 14, paddingHorizontal: 40, borderRadius: Radius.lg, width: '100%', alignItems: 'center' },
  primaryText:  { color: '#060d1a', fontSize: 18, fontFamily: 'Bold', letterSpacing: 3 },
  backBtnStyle: { backgroundColor: Colors.borderDark, paddingVertical: 12, paddingHorizontal: 32, borderRadius: Radius.lg, marginTop: Spacing.md},
  retryText:    { color: '#060d1a', fontSize: 16, fontFamily: 'Bold', letterSpacing: 2 },
  backText:     {color: Colors.textPrimary, fontSize: 11, letterSpacing: 1, fontFamily: "Light"},
});