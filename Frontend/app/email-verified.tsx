import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GradientButton } from '@/components/ui/gradient-button';
import { getCurrentUser, reloadUser } from '../utils/firebase-service';
import { Typography } from '@/constants/theme';

export default function EmailVerifiedScreen() {
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    checkVerification();
  }, []);

  const checkVerification = async () => {
    try {
      // Wait a bit for Firebase to process the verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reload user to get latest verification status
      await reloadUser();
      
      const user = getCurrentUser();
      if (user?.emailVerified) {
        setVerified(true);
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    // Always redirect to login page after email verification
    router.replace('/login');
  };

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Verifying your email...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          <Animated.View
            entering={FadeInUp.duration(600).springify()}
            style={styles.iconContainer}
          >
            <View style={[
              styles.iconCircle,
              verified ? styles.successCircle : styles.errorCircle
            ]}>
              <Ionicons
                name={verified ? "checkmark-circle" : "close-circle"}
                size={64}
                color="#FFFFFF"
              />
            </View>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).duration(600).springify()}
            style={styles.textContainer}
          >
            <Text style={styles.title}>
              {verified ? '✅ Email Verified!' : '❌ Verification Failed'}
            </Text>
            <Text style={styles.subtitle}>
              {verified
                ? 'Your email has been successfully verified. Please sign in to your account to continue.'
                : 'Unable to verify your email. The link may have expired or is invalid. Please try signing in again.'}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(400).duration(600).springify()}
            style={styles.buttonContainer}
          >
            <GradientButton
              title="Go to Login"
              onPress={handleContinue}
            />
          </Animated.View>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: Typography.medium,
    marginTop: 16,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
  },
  errorCircle: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: Typography.large + 4,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.medium,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
  },
});
