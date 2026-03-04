import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, Image, Animated } from 'react-native';
import { LanguageProvider } from '../src/contexts/LanguageContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = new Animated.Value(1);

  const [fontsLoaded, fontError] = useFonts({
    'Regular': require('../assets/fonts/FiraGO-Regular.ttf'),
    'Bold':    require('../assets/fonts/FiraGO-Bold.ttf'),
    'Light':   require('../assets/fonts/FiraGO-Light.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      // Fade out the JS splash
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => setShowSplash(false));
    }
  }, [fontsLoaded, fontError]);

  return (
    <LanguageProvider>
      <StatusBar style="light" backgroundColor="#060d1a" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#060d1a' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="game" />
        <Stack.Screen name="tutorial" />
        <Stack.Screen name="win" />
        <Stack.Screen name="howto" />
      </Stack>

      {/* JS Splash overlay - covers the white flash */}
      {showSplash && (
        <Animated.View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#060d1a',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: fadeAnim,
        }}>
          <Image
            source={require('../assets/splash-icon.png')}
            style={{ width: 200, height: 200, resizeMode: 'contain' }}
          />
        </Animated.View>
      )}
    </LanguageProvider>
  );
}