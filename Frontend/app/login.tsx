import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AnimatedInput } from '@/components/ui/animated-input';
import { GradientButton } from '@/components/ui/gradient-button';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmail, signInWithGoogle, sendVerificationEmail, getFirebaseErrorMessage, signOut, checkRegistrationStatus } from '../utils/firebase-service';
import { googleSignIn, configureGoogleSignIn } from '../utils/google-signin';
import { Typography } from '@/constants/theme';
import { getPendingRegistration, clearPendingRegistration } from '../utils/storage-service';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  
  // Status modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusData, setStatusData] = useState<{
    email: string;
    name: string;
    emailVerified: boolean;
    adminApproved: 'pending' | 'approved' | 'rejected' | 'none';
    rejectionReason?: string;
  } | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Floating animation for background elements
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const float3 = useSharedValue(0);

  useEffect(() => {
    // Configure Google Sign-In
    configureGoogleSignIn();
    
    // Add a small delay before checking status to avoid race conditions
    // This prevents showing incorrect status right after registration redirect
    const timer = setTimeout(() => {
      checkPendingRegistrationStatus();
    }, 500);
    
    float1.value = withRepeat(
      withTiming(1, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    float2.value = withRepeat(
      withTiming(1, { duration: 4500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    float3.value = withRepeat(
      withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkPendingRegistrationStatus = async () => {
    try {
      const pendingData = await getPendingRegistration();
      if (!pendingData) {
        console.log('📊 No pending registration in local storage');
        return;
      }
      
      console.log('📊 Found pending registration in local storage:', pendingData.email);
      
      // Check status from Firebase
      const registrationStatus = await checkRegistrationStatus(pendingData.email);
      
      console.log('📊 Firebase registration status:', registrationStatus.status);
      
      // Only proceed if we got a valid status from Firebase
      if (!registrationStatus || registrationStatus.status === 'none') {
        console.log('⚠️ Registration not found in Firebase yet, skipping status check');
        return;
      }
      
      // Only show approved alert if actually approved in Firebase
      if (registrationStatus.status === 'approved') {
        console.log('✅ Registration approved, clearing local data');
        // Account was approved! Clear local data and show success
        await clearPendingRegistration();
        Alert.alert(
          '🎉 Account Approved!',
          'Your account has been approved by an administrator. You can now log in!',
          [{ text: 'OK' }]
        );
        return;
      }
      
      if (registrationStatus.status === 'rejected') {
        console.log('❌ Registration rejected');
        // Show rejection status
        setStatusData({
          email: pendingData.email,
          name: pendingData.name,
          emailVerified: true,
          adminApproved: 'rejected',
          rejectionReason: registrationStatus.data?.rejectionReason || 'No reason provided',
        });
        setShowStatusModal(true);
        return;
      }
      
      if (registrationStatus.status === 'pending') {
        console.log('⏳ Registration still pending');
        // Still pending approval - show status modal
        setStatusData({
          email: pendingData.email,
          name: pendingData.name,
          emailVerified: registrationStatus.data?.emailVerified || false,
          adminApproved: 'pending',
        });
        setShowStatusModal(true);
        return;
      }
    } catch (error) {
      console.error('❌ Error checking pending registration:', error);
    }
  };

  const handleRefreshStatus = async () => {
    if (!statusData) return;
    
    setCheckingStatus(true);
    try {
      const registrationStatus = await checkRegistrationStatus(statusData.email);
      
      if (registrationStatus.status === 'approved') {
        await clearPendingRegistration();
        setShowStatusModal(false);
        Alert.alert(
          '🎉 Account Approved!',
          'Your account has been approved! You can now log in.',
          [{ text: 'OK' }]
        );
      } else if (registrationStatus.status === 'rejected') {
        setStatusData({
          ...statusData,
          adminApproved: 'rejected',
          rejectionReason: registrationStatus.data?.rejectionReason || 'No reason provided',
        });
      } else {
        Alert.alert('Still Pending', 'Your registration is still pending admin approval.');
      }
    } catch (error) {
      console.error('Error refreshing status:', error);
      Alert.alert('Error', 'Failed to check status. Please try again.');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleCloseStatusModal = async () => {
    if (statusData?.adminApproved === 'rejected') {
      await clearPendingRegistration();
    }
    setShowStatusModal(false);
  };

  const animatedCircle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: float1.value * 30 }],
  }));

  const animatedCircle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: float2.value * -40 }],
  }));

  const animatedCircle3 = useAnimatedStyle(() => ({
    transform: [{ translateX: float3.value * 20 }],
  }));

  const validateForm = () => {
    const newErrors: {
      email?: string;
      password?: string;
    } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      console.log('🔐 Starting login process...');
      
      // First check if user has a pending registration
      const registrationStatus = await checkRegistrationStatus(email.trim().toLowerCase());
      
      if (registrationStatus.status === 'pending') {
        setLoading(false);
        
        // Show status modal for pending users
        setStatusData({
          email: email.trim().toLowerCase(),
          name: registrationStatus.data?.name || 'User',
          emailVerified: registrationStatus.data?.emailVerified || false,
          adminApproved: 'pending',
        });
        setShowStatusModal(true);
        
        return;
      }
      
      if (registrationStatus.status === 'rejected') {
        setLoading(false);
        
        // Show rejection status
        setStatusData({
          email: email.trim().toLowerCase(),
          name: registrationStatus.data?.name || 'User',
          emailVerified: false,
          adminApproved: 'rejected',
          rejectionReason: registrationStatus.data?.rejectionReason || 'No reason provided',
        });
        setShowStatusModal(true);
        
        return;
      }
      
      // Sign in user with Firebase (this will check email verification)
      await signInWithEmail(email.trim().toLowerCase(), password);
      
      console.log('✅ Login successful, navigating to home...');
      
      // Wait for auth state to fully update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate to home with proper cleanup
      setLoading(false);
      
      // Use replace to prevent back navigation to login
      router.replace('/(tabs)');
      
    } catch (error: any) {
      console.error('❌ Login error:', error);
      setLoading(false);
      
      // Check if error is due to unverified email
      if (error.code === 'EMAIL_NOT_VERIFIED') {
        Alert.alert(
          '📧 Email Not Verified',
          error.message || 'Please verify your email address before logging in. Check your inbox for the verification link.',
          [
            {
              text: 'Resend Verification Email',
              onPress: () => handleResendVerification(email.trim().toLowerCase(), password),
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ]
        );
      } else if (error.code === 'auth/user-not-found') {
        // Check if they have a pending registration
        const registrationStatus = await checkRegistrationStatus(email.trim().toLowerCase());
        
        if (registrationStatus.status === 'pending') {
          setStatusData({
            email: email.trim().toLowerCase(),
            name: registrationStatus.data?.name || 'User',
            emailVerified: registrationStatus.data?.emailVerified || false,
            adminApproved: 'pending',
          });
          setShowStatusModal(true);
        } else {
          Alert.alert(
            'Login Failed',
            'No account found with this email. Please check your email or register for a new account.',
            [{ text: 'OK' }]
          );
        }
      } else if (error.code === 'auth/wrong-password') {
        Alert.alert(
          'Login Failed',
          'Incorrect password. Please try again or use "Forgot Password" to reset it.',
          [{ text: 'OK' }]
        );
      } else {
        // Show user-friendly error message
        const errorMessage = getFirebaseErrorMessage(error.code || 'auth/unknown');
        
        Alert.alert('Login Failed', errorMessage);
      }
    }
  };

  const handleResendVerification = async (userEmail: string, userPassword: string) => {
    try {
      console.log('📧 Attempting to resend verification email...');
      
      // Re-authenticate to get current user
      await signInWithEmail(userEmail, userPassword).catch(async (authError) => {
        // If email not verified error, that's expected - we need to send verification
        if (authError.code === 'EMAIL_NOT_VERIFIED') {
          // Sign in without verification check to send email
          const { signInWithEmailAndPassword } = await import('firebase/auth');
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
          return signInWithEmailAndPassword(auth, userEmail, userPassword);
        }
        throw authError;
      });
      
      // Send verification email
      await sendVerificationEmail();
      
      // Sign out after sending email
      await signOut();
      
      Alert.alert(
        '✅ Verification Email Sent',
        'A new verification email has been sent to your inbox. Please check your email (and spam folder) and click the verification link.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('❌ Resend verification error:', error);
      Alert.alert(
        'Error',
        'Failed to send verification email. Please try again later or contact support.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      console.log('🔐 Initiating Google Sign-In...');
      
      // Get Google ID token
      const idToken = await googleSignIn();
      
      // Sign in to Firebase with Google credential (this will check email verification)
      await signInWithGoogle(idToken);
      
      console.log('✅ Google Sign-In successful, navigating...');
      
      // Wait for auth state to fully update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setLoading(false);
      
      // Navigate to home with replace to prevent back navigation
      router.replace('/(tabs)');
      
    } catch (error: any) {
      console.error('❌ Google Sign-In error:', error);
      setLoading(false);
      
      // Check if error is due to unverified email
      if (error.code === 'EMAIL_NOT_VERIFIED') {
        Alert.alert(
          '📧 Email Verification Required',
          error.message || 'Please verify your email address before accessing the app. Check your inbox for the verification link.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Google Sign-In Failed',
          error.message || 'Failed to sign in with Google. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Reset Password',
      'Password reset functionality will be implemented soon.',
      [{ text: 'OK' }]
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

      <Animated.View style={[styles.circle1, animatedCircle1]} />
      <Animated.View style={[styles.circle2, animatedCircle2]} />
      <Animated.View style={[styles.circle3, animatedCircle3]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo Section */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(1000).springify()}
            style={styles.logoContainer}
          >
            <View style={styles.logoCircle}>
              <Image 
                source={require('@/assets/images/logo.png')} 
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.title}>Meta Forensics</Text>
            <Text style={styles.subtitle}>Facial Recognition System</Text>
          </Animated.View>

          {/* Form Section */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(1000).springify()}
            style={styles.formContainer}
          >
            <View style={styles.blurContainer}>
              <Text style={styles.formTitle}>Welcome Back</Text>
              <Text style={styles.formSubtitle}>Sign in to continue</Text>

              <View style={styles.form}>
                <AnimatedInput
                  label="Email"
                  icon="mail-outline"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email}
                />

                <AnimatedInput
                  label="Password"
                  icon="lock-closed-outline"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  secureTextEntry
                  error={errors.password}
                />

                <TouchableOpacity
                  style={styles.forgotButton}
                  onPress={handleForgotPassword}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                <GradientButton
                  title="Sign In"
                  onPress={handleLogin}
                  loading={loading}
                />

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleSignIn}
                  disabled={loading}
                >
                  <Ionicons name="logo-google" size={20} color="#DB4437" />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={() => router.push('/register' as any)}
                >
                  <Text style={styles.registerText}>
                    Don&apos;t have an account?{' '}
                    <Text style={styles.registerTextBold}>Sign Up</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Registration Status Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseStatusModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            entering={FadeInDown.duration(400).springify()}
            style={styles.modalContainer}
          >
            <LinearGradient
              colors={['#1a1a2e', '#16213e']}
              style={styles.modalGradient}
            >
              {/* Status Icon */}
              <View style={styles.modalIconContainer}>
                {statusData?.adminApproved === 'pending' ? (
                  <View style={styles.pendingIconCircle}>
                    <Ionicons name="hourglass-outline" size={48} color="#FF9500" />
                  </View>
                ) : statusData?.adminApproved === 'rejected' ? (
                  <View style={styles.rejectedIconCircle}>
                    <Ionicons name="close-circle" size={48} color="#FF3B30" />
                  </View>
                ) : (
                  <View style={styles.approvedIconCircle}>
                    <Ionicons name="checkmark-circle" size={48} color="#34C759" />
                  </View>
                )}
              </View>

              {/* Title */}
              <Text style={styles.modalTitle}>
                {statusData?.adminApproved === 'pending'
                  ? 'Registration Pending'
                  : statusData?.adminApproved === 'rejected'
                  ? 'Registration Rejected'
                  : 'Registration Status'}
              </Text>

              {/* User Info */}
              <View style={styles.statusInfoCard}>
                <View style={styles.statusInfoRow}>
                  <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.statusInfoLabel}>Name:</Text>
                  <Text style={styles.statusInfoValue}>{statusData?.name}</Text>
                </View>
                <View style={styles.statusInfoRow}>
                  <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.statusInfoLabel}>Email:</Text>
                  <Text style={styles.statusInfoValue}>{statusData?.email}</Text>
                </View>
              </View>

              {/* Status Cards */}
              <View style={styles.statusCards}>
                {/* Email Verification Status */}
                <View style={[
                  styles.statusCard,
                  statusData?.emailVerified ? styles.statusCardSuccess : styles.statusCardPending
                ]}>
                  <View style={styles.statusCardHeader}>
                    <Ionicons 
                      name={statusData?.emailVerified ? "checkmark-circle" : "time-outline"} 
                      size={20} 
                      color={statusData?.emailVerified ? "#34C759" : "#FF9500"} 
                    />
                    <Text style={styles.statusCardTitle}>Email Verification</Text>
                  </View>
                  <Text style={styles.statusCardValue}>
                    {statusData?.emailVerified ? '✅ Verified' : '⏳ Pending'}
                  </Text>
                </View>

                {/* Admin Approval Status */}
                <View style={[
                  styles.statusCard,
                  statusData?.adminApproved === 'approved' ? styles.statusCardSuccess :
                  statusData?.adminApproved === 'rejected' ? styles.statusCardError :
                  styles.statusCardPending
                ]}>
                  <View style={styles.statusCardHeader}>
                    <Ionicons 
                      name={
                        statusData?.adminApproved === 'approved' ? "checkmark-circle" :
                        statusData?.adminApproved === 'rejected' ? "close-circle" :
                        "shield-outline"
                      } 
                      size={20} 
                      color={
                        statusData?.adminApproved === 'approved' ? "#34C759" :
                        statusData?.adminApproved === 'rejected' ? "#FF3B30" :
                        "#FF9500"
                      } 
                    />
                    <Text style={styles.statusCardTitle}>Admin Approval</Text>
                  </View>
                  <Text style={styles.statusCardValue}>
                    {statusData?.adminApproved === 'approved' ? '✅ Approved' :
                     statusData?.adminApproved === 'rejected' ? '❌ Rejected' :
                     '⏳ Pending Review'}
                  </Text>
                </View>
              </View>

              {/* Message */}
              {statusData?.adminApproved === 'pending' && (
                <View style={styles.pendingMessage}>
                  <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
                  <Text style={styles.pendingMessageText}>
                    Your registration is awaiting admin approval. Once approved, you&apos;ll receive a verification email. After verifying your email, you can login.{'\n\n'}
                    ⏳ Expected time: 24-48 hours{'\n'}
                    📧 You&apos;ll be notified via email
                  </Text>
                </View>
              )}

              {statusData?.adminApproved === 'rejected' && statusData.rejectionReason && (
                <View style={styles.rejectionMessage}>
                  <Ionicons name="alert-circle-outline" size={20} color="#FF3B30" />
                  <View style={styles.rejectionContent}>
                    <Text style={styles.rejectionTitle}>Reason:</Text>
                    <Text style={styles.rejectionText}>{statusData.rejectionReason}</Text>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                {statusData?.adminApproved === 'pending' && (
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={handleRefreshStatus}
                    disabled={checkingStatus}
                  >
                    {checkingStatus ? (
                      <ActivityIndicator size="small" color="#007AFF" />
                    ) : (
                      <>
                        <Ionicons name="refresh" size={18} color="#007AFF" />
                        <Text style={styles.refreshButtonText}>Check Status</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    statusData?.adminApproved === 'rejected' && styles.closeButtonRed
                  ]}
                  onPress={handleCloseStatusModal}
                >
                  <Text style={[
                    styles.closeButtonText,
                    statusData?.adminApproved === 'rejected' && styles.closeButtonTextRed
                  ]}>
                    {statusData?.adminApproved === 'rejected' ? 'Close' : 'OK'}
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  circle1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
    top: -80,
    right: -90,
  },
  circle2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(88, 86, 214, 0.15)',
    bottom: -30,
    left: -70,
  },
  circle3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 45, 85, 0.1)',
    top: '40%',
    right: -60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
  },
  title: {
    fontSize: Typography.large,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
  },
  formContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  blurContainer: {
    padding: 24,
  },
  formTitle: {
    fontSize: Typography.large,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
  },
  form: {
    width: '100%',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -8,
  },
  forgotText: {
    color: '#007AFF',
    fontSize: Typography.small,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 16,
    fontSize: Typography.small,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  googleButtonText: {
    color: '#000000',
    fontSize: Typography.medium,
    fontWeight: '600',
  },
  registerButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  registerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: Typography.medium,
  },
  registerTextBold: {
    color: '#007AFF',
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalGradient: {
    padding: 24,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pendingIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  rejectedIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  approvedIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusInfoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  statusInfoLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    minWidth: 50,
  },
  statusInfoValue: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statusCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  statusCardSuccess: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  statusCardPending: {
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
    borderColor: 'rgba(255, 149, 0, 0.3)',
  },
  statusCardError: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  statusCardTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusCardValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  pendingMessage: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  pendingMessageText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 19,
  },
  rejectionMessage: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  rejectionContent: {
    flex: 1,
  },
  rejectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF3B30',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 19,
  },
  modalActions: {
    gap: 10,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  closeButtonRed: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  closeButtonTextRed: {
    color: '#FF3B30',
  },
});
