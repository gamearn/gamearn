import React, { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { captureInviteCode } from './src/utils/inviteLink';
import {
  setNavigationRef,
  queueNotificationTarget,
  consumeNotificationTarget,
} from './src/utils/notificationNavigation';
import {
  setupPushHandlers,
  onNotificationOpen,
  isPushAvailable,
} from './src/services/pushNotifications';
import { ErrorBoundary } from './src/components/ErrorBoundary';

function MainApp() {
  const { isDark } = useTheme();
  const { user, userProfile } = useAuth();
  const navigationRef = useRef(null);
  const authed = !!(user || userProfile);

  // Give the notification-navigation helper access to the navigator.
  useEffect(() => {
    setNavigationRef(navigationRef);
    return () => setNavigationRef(null);
  }, []);

  // Once signed in, dispatch any notification tap that arrived on the login
  // screen (deferred because the target screens require authentication).
  useEffect(() => {
    if (authed) {
      const id = setTimeout(() => consumeNotificationTarget(), 400);
      return () => clearTimeout(id);
    }
  }, [authed]);

  // Deep-link invite codes.
  useEffect(() => {
    Linking.getInitialURL()
      .then(captureInviteCode)
      .catch(() => {});
    const sub = Linking.addEventListener('url', ({ url }) => captureInviteCode(url));
    return () => sub.remove();
  }, []);

  // Set up FCM handlers once. Foreground pushes refresh nothing here directly;
  // the in-app notification socket listener in HomeScreen handles that. Taps
  // are queued for navigation once authenticated.
  useEffect(() => {
    if (!isPushAvailable()) return undefined;
    const cleanup = setupPushHandlers({
      onForegroundMessage: () => {
        // A foreground push is also persisted in-app by the backend; the
        // HomeScreen socket listener picks it up in real time.
      },
    });
    const unsubOpen = onNotificationOpen((info) => {
      queueNotificationTarget(info, authed);
    });
    return () => {
      unsubOpen?.();
      cleanup?.();
    };
  }, [authed]);

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ErrorBoundary>
        <NavigationContainer ref={navigationRef}>
          <RootNavigator />
        </NavigationContainer>
      </ErrorBoundary>
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
