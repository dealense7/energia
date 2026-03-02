import React, { useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar, Animated, Image } from "react-native";
import { Colors, Spacing } from "../constants/theme";
import { Strings } from "../constants/strings";

export const LoadingScreen: React.FC<{
  difficulty: string;
  onBack: () => void;
}> = ({ difficulty, onBack }) => {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const randomFact = Strings.funFacts[Math.floor(Math.random() * Strings.funFacts.length)];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backText}>{Strings.nav.back}</Text>
        </TouchableOpacity>
        <View style={styles.titleCol}>
          <Text style={styles.diffTag}>{difficulty.toUpperCase()}</Text>
        </View>
        <View style={{ minWidth: 60 }} />
      </View>

      <View style={styles.loadingContainer}>
        {/* Pulsing bolt in the center */}
        <Animated.View style={{ opacity: pulse }}>
          <Image source={require("../../assets/logo.png")} style={styles.logo}/>
        </Animated.View>

        <Text style={styles.loadingTitle}>{Strings.generating}</Text>
        <Text style={styles.loadingSubtitle}>{Strings.funFuctTitle}</Text>
        <Text style={[styles.loadingSubtitle, styles.funFact]}> {randomFact} </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:             {flex: 1, backgroundColor: Colors.bg, paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0},
  logo:             {width: 70, height: 70, resizeMode: "contain"},
  header:           {flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.bg, borderBottomWidth: 1, borderBottomColor: Colors.borderDark},
  backBtn:          {minWidth: 60},
  backText:         {color: Colors.textPrimary, fontSize: 11, letterSpacing: 1, fontFamily: "Light"},
  titleCol:         {alignItems: "center", gap: 2, flex: 1, marginHorizontal: Spacing.sm},
  diffTag:          {fontSize: 12, letterSpacing: 3, color: Colors.gold, fontFamily: "Regular"},
  loadingContainer: {flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.lg, paddingHorizontal: Spacing.xxl},
  loadingTitle:     {fontSize: 18, fontFamily: "Bold", color: Colors.gold, letterSpacing: 4},
  loadingSubtitle:  {fontSize: 12, fontFamily: "Light", color: Colors.textMuted, letterSpacing: 1},
  funFact:          {fontStyle: "italic", marginTop: Spacing.sm, fontFamily: "Regular"},
});
