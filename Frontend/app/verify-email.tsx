import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from '@/components/ui/gradient-button';
import { 
  getCurrentUser, 
  reloadUser, 
  sendVerificationEmail, 
  signOut,
  completeRegistration,
  uploadImageToCloudinary,
} from '../utils/firebase-service';
import { Typography } from '@/constants/theme';

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get user data from params
  const userName = params.name as string || 'User';
  const photoUri = params.photoUri as string || null;

  // Pulse animation for the icon
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkVerificationStatus = async () => {
    setChecking(true);
    setError(null);
    
    try {
      console.log('🔍 Checking email verification status...');
      
      // Reload user to get latest status from Firebase servers
      await reloadUser();
      
      const user = getCurrentUser();
      if (!user) {
        throw new Error('No user found. Please try registering again.');
      }
      
      console.log('📧 Email verified:', user.emailVerified);
      
      if (user.emailVerified) {
        setVerified(true);
        
        // Upload photo if provided
        let photoURL: string | null = null;
        if (photoUri) {
          try {
            console.log('📸 Uploading profile photo...');
            photoURL = await uploadImageToCloudinary(photoUri);
            console.log('✅ Photo uploaded:', photoURL);
          } catch (uploadError) {
            console.error('⚠️ Photo upload failed:', uploadError);
            // Continue without photo
          }
        }
        
        // Complete registration by creating database profile
        await completeRegistration(user, userName, photoURL);
        
        console.log('✅ Registration completed successfully!');
        
        // Sign out the user
        await signOut();
        
        // Show success message
        Alert.alert(
          '✅ Registration Complete!',
          'Your account has been successfully created and verified. You can now login with your credentials.',
          [
            {
              text: 'Go to Login',
              onPress: () => {
                router.replace('/login');
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert(
          '⏳ Email Not Verified Yet',
          'Please check your email inbox (and spam folder) and click the verification link. Then come back and check again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('❌ Verification check error:', error);
      setError(error.message || 'Failed to check verification status');
      Alert.alert(
        'Error',
        error.message || 'Failed to check verification status. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setChecking(false);
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    setError(null);
    
    try {
      console.log('📧 Resending verification email...');
      await sendVerificationEmail();
      
      Alert.alert(
        '✅ Email Sent',
        'A new verification email has been sent to your inbox. Please check your email (and spam folder).',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('❌ Resend email error:', error);
      const errorMessage = error.message || 'Failed to send email. Please try again.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setResending(false);
    }
  };

  const handleCancel = async () => {
    Alert.alert(
      'Cancel Registration?',
      'Are you sure you want to cancel? Your account will be deleted and you will need to register again.',
      [
        {
          text: 'No, Continue',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = getCurrentUser();
              if (user) {
                await user.delete();
                console.log('🗑️ User account deleted');
              }
              await signOut();
              router.replace('/register');
            } catch (error) {
              console.error('❌ Cancel error:', error);
              await signOut();
              router.replace('/register');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Animated Background */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Icon */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(1000).springify()}
          style={[styles.iconContainer, animatedIconStyle]}
        >
          <View style={styles.iconCircle}>
            {verified ? (
              <Ionicons name="checkmark-circle" size={80} color="#34C759" />
            ) : (
              <Ionicons name="mail-unread" size={80} color="#007AFF" />
            )}
          </View>
        </Animated.View>

        {/* Title and Instructions */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(1000).springify()}
          style={styles.textContainer}
        >
          <Text style={styles.title}>
            {verified ? '🎉 Email Verified!' : '📧 Verify Your Email'}
          </Text>
          <Text style={styles.subtitle}>
            {verified
              ? 'Your registration is complete! You can now login to your account.'
              : `We've sent a verification email to your inbox.\n\nPlease check your email and click the verification link to complete your registration.`}
          </Text>
          
          {!verified && (
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsTitle}>Next Steps:</Text>
              <Text style={styles.instructionItem}>1. Open your email app</Text>
              <Text style={styles.instructionItem}>2. Look for email from Meta Forensics</Text>
              <Text style={styles.instructionItem}>3. Check spam folder if not in inbox</Text>
              <Text style={styles.instructionItem}>4. Click the verification link</Text>
              <Text style={styles.instructionItem}>5. Come back here and check status</Text>
            </View>
          )}
        </Animated.View>

        {/* Error Message */}
        {error && (
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={styles.errorContainer}
          >
            <Ionicons name="alert-circle" size={20} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}

        {/* Buttons */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(1000).springify()}
          style={styles.buttonContainer}
        >
          {!verified && (
            <>
              <GradientButton
                title={checking ? "Checking..." : "✅ I've Verified - Check Status"}
                onPress={checkVerificationStatus}
                loading={checking}
              />

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendEmail}
                disabled={resending}
              >
                {resending ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={20} color="#007AFF" />
                    <Text style={styles.resendText}>Resend Verification Email</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelText}>Cancel Registration</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>

        {/* Info Box */}
        {!verified && (
          <Animated.View
            entering={FadeInDown.delay(800).duration(1000).springify()}
            style={styles.infoBox}
          >
            <Ionicons name="information-circle" size={20} color="#007AFF" />
            <Text style={styles.infoText}>
              Your account will only be created after you verify your email address.
            </Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
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
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  instructionsContainer: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
    width: '100%',
  },
  instructionsTitle: {
    fontSize: Typography.medium,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  instructionItem: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    paddingLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    gap: 12,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.small,
    color: '#FF3B30',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
    gap: 8,
  },
  resendText: {
    color: '#007AFF',
    fontSize: Typography.medium,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: Typography.small,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
});
