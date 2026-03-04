import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar, Animated, Image } from "react-native";
import { Colors, Spacing, Radius } from "../constants/theme";
import { useLanguage } from '../contexts/LanguageContext';

export const ErrorScreen: React.FC<{ onRetry: () => void; onBack: () => void }> = ({ onRetry, onBack }) => {
  const { strings } = useLanguage();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingTitle}>Happens rarely..</Text>
        <Text style={styles.loadingSubtitle}>Try generating again, it might work this time.</Text>
        <View style={{ flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.lg }}>
          <TouchableOpacity style={styles.backBtnStyle}onPress={onBack}>
            <Text style={styles.backText}>{strings.nav.home}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
            <Text style={styles.retryText}>{strings.nav.retry}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe:             {flex: 1, backgroundColor: Colors.bg, paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0},
  backText:         {color: Colors.textPrimary, fontSize: 11, letterSpacing: 1, fontFamily: "Light"},
  loadingContainer: {flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.lg, paddingHorizontal: Spacing.xxl},
  loadingTitle:     {fontSize: 18, fontFamily: "Bold", color: Colors.gold, letterSpacing: 4},
  loadingSubtitle:  {fontSize: 12, fontFamily: "Light", color: Colors.textMuted, letterSpacing: 1},
  errorIcon:        {fontSize: 48 },
  retryBtn:         {backgroundColor: Colors.gold, paddingVertical: 12, paddingHorizontal: 32, borderRadius: Radius.lg, marginTop: Spacing.md, },
  backBtnStyle:     { backgroundColor: Colors.borderDark, paddingVertical: 12, paddingHorizontal: 32, borderRadius: Radius.lg, marginTop: Spacing.md},
  retryText:        { color: '#060d1a', fontSize: 16, fontFamily: 'Bold', letterSpacing: 2 },
});
