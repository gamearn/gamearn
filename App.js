import React, { useEffect } from 'react';
import { Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { captureInviteCode } from './src/utils/inviteLink';

function MainApp() {
  const { isDark } = useTheme();

  useEffect(() => {
    Linking.getInitialURL()
      .then(captureInviteCode)
      .catch(() => {});
    const sub = Linking.addEventListener('url', ({ url }) => captureInviteCode(url));
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
