import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import * as Notifications from 'expo-notifications';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { onAuthStateChanged } from '../utils/firebase-service';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const unstable_settings = {
  initialRouteName: 'login',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Request notification permissions on app start
    const requestNotificationPermissions = async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          console.log('✅ Notification permissions granted');
        } else {
          console.log('⚠️ Notification permissions denied');
        }
      } catch (error) {
        console.error('Error requesting notification permissions:', error);
      }
    };
    requestNotificationPermissions();
  }, []);

  useEffect(() => {
    // Listen to authentication state changes with error handling
    try {
      const unsubscribe = onAuthStateChanged((user) => {
        try {
          // Only set authenticated if user exists AND email is verified
          if (user) {
            console.log('🔐 Auth state changed - User:', user.email, 'Verified:', user.emailVerified);
            // User must have verified email to be considered authenticated
            setIsAuthenticated(user.emailVerified);
            
            // If user is logged in but email not verified, sign them out
            if (!user.emailVerified) {
              console.log('⚠️ User email not verified, keeping on auth screens');
            }
          } else {
            console.log('🔐 Auth state changed - No user');
            setIsAuthenticated(false);
          }
        } catch (err) {
          console.error('Auth state change error:', err);
          setIsAuthenticated(false);
        }
      });

      return () => {
        try {
          unsubscribe();
        } catch (err) {
          console.error('Unsubscribe error:', err);
        }
      };
    } catch (err) {
      console.error('Auth listener error:', err);
      setIsAuthenticated(false);
      return () => {};
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated === null) return; // Still loading

    try {
      const inAuthGroup = segments[0] === '(tabs)';
      const inProtectedRoute = segments[0] === 'profile-details' || segments[0] === 'about' || segments[0] === 'help-support' || segments[0] === 'chat' || segments[0] === 'chat-conversation' || segments[0] === 'edit-profile';
      const inAuthScreen = segments[0] === 'login' || segments[0] === 'register';

      if (!isAuthenticated && (inAuthGroup || inProtectedRoute)) {
        // User is not authenticated but trying to access protected routes
        setTimeout(() => {
          try {
            router.replace('/login' as any);
          } catch (navError) {
            console.error('Navigation error:', navError);
          }
        }, 100);
      } else if (isAuthenticated && inAuthScreen) {
        // User is authenticated but on auth screens (login/register)
        setTimeout(() => {
          try {
            router.replace('/(tabs)' as any);
          } catch (navError) {
            console.error('Navigation error:', navError);
          }
        }, 100);
      }
      // Note: verify-email screen is not redirected - users can stay there until verification is complete
    } catch (err) {
      console.error('Navigation logic error:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, segments]);

  // Show loading screen while checking authentication
  if (isAuthenticated === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="verify-email" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="profile-details" options={{ headerShown: false }} />
        <Stack.Screen name="about" options={{ headerShown: false }} />
        <Stack.Screen name="help-support" options={{ headerShown: false }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="chat-conversation" options={{ headerShown: false }} />
        <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
});
