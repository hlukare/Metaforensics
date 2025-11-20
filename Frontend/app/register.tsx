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
import { getFirebaseErrorMessage, signUpWithEmail, getCurrentUser, reloadUser, uploadImageToCloudinary, signOut, createPendingRegistration, isAdminEmail, sendVerificationEmail } from '../utils/firebase-service';
import { configureGoogleSignIn } from '../utils/google-signin';
import { Typography } from '@/constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { storePendingRegistration } from '../utils/storage-service';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [waitingForVerification, setWaitingForVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Floating animation for background elements
  const float1 = useSharedValue(0);
  const float2 = useSharedValue(0);
  const float3 = useSharedValue(0);

  useEffect(() => {
    // Configure Google Sign-In
    configureGoogleSignIn();
    
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedCircle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: float1.value * 30 }],
  }));

  const animatedCircle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: float2.value * -40 }],
  }));

  const animatedCircle3 = useAnimatedStyle(() => ({
    transform: [{ translateX: float3.value * 20 }],
  }));

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow camera access to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      'Profile Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const validateForm = () => {
    const newErrors: {
      fullName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    } else if (!email.toLowerCase().endsWith('@gmail.com')) {
      newErrors.email = 'Only Gmail addresses (@gmail.com) are allowed';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(password)) {
      newErrors.password = 'Password can only contain letters, numbers, and special characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setUploadingPhoto(false);

    try {
      console.log('🔐 Starting registration process...');
      
      const userEmail = email.trim().toLowerCase();
      
      // Check if user is admin first
      if (isAdminEmail(userEmail)) {
        console.log('🔐 Admin user detected, creating account directly...');
        
        // For admins: Create Firebase Auth account immediately
        await signUpWithEmail(
          userEmail,
          password,
          fullName.trim(),
          null // photoURL will be uploaded after verification
        );
        
        console.log('✅ Admin auth account created, verification email sent');
        
        // Store email for verification checking
        setVerificationEmail(userEmail);
        setLoading(false);
        
        // Show verification waiting UI
        setWaitingForVerification(true);
        
        // Start polling for verification
        startVerificationPolling();
      } else {
        console.log('📝 Non-admin user, storing registration for approval...');
        
        try {
          // Upload photo first if provided
          let photoURL: string | null = null;
          if (photoUri) {
            try {
              setUploadingPhoto(true);
              console.log('📸 Uploading profile photo...');
              photoURL = await uploadImageToCloudinary(photoUri);
              console.log('✅ Photo uploaded:', photoURL);
            } catch (uploadError) {
              console.error('⚠️ Photo upload failed:', uploadError);
              Alert.alert(
                'Warning',
                'Failed to upload profile photo. Your registration will be submitted without a photo.',
                [{ text: 'Continue', onPress: () => {} }]
              );
            } finally {
              setUploadingPhoto(false);
            }
          }
          
          // For non-admins: Store pending registration WITHOUT creating auth account
          await createPendingRegistration(userEmail, password, fullName.trim(), photoURL);
          
          // Store locally for status checking
          await storePendingRegistration(userEmail, fullName.trim(), photoURL);
          
          console.log('✅ Pending registration created successfully');
          
          // Clear form
          setFullName('');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setPhotoUri(null);
          
          setLoading(false);
          
          // Show pending approval message
          Alert.alert(
            '📝 Registration Submitted',
            `Thank you for registering, ${fullName.trim()}!\n\nYour registration has been submitted to administrators for review.\n\n✅ Next Steps:\n1. Wait for admin approval (usually 24-48 hours)\n2. Check the login page anytime to see your status\n3. Once approved, you'll receive a verification email\n4. Verify your email and start using the app\n\nWe'll notify you via email once your account is approved.`,
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
        } catch (pendingError: any) {
          console.error('❌ Failed to create pending registration:', pendingError);
          setLoading(false);
          setUploadingPhoto(false);
          
          Alert.alert(
            'Registration Failed',
            pendingError.message || 'Failed to submit registration. Please try again.',
            [{ text: 'OK' }]
          );
        }
      }
      
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      setLoading(false);
      setUploadingPhoto(false);
      
      // Show user-friendly error message
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.code) {
        errorMessage = getFirebaseErrorMessage(error.code);
        
        // Handle specific error cases
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'This email is already registered. Please try logging in instead.';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Password is too weak. Please use a stronger password (at least 8 characters).';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Invalid email address. Please check and try again.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        '❌ Registration Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    }
  };

  const startVerificationPolling = () => {
    // Poll every 3 seconds to check if email is verified
    const interval = setInterval(async () => {
      await checkEmailVerification(interval);
    }, 3000);
  };

  const checkEmailVerification = async (intervalId?: any) => {
    try {
      await reloadUser();
      const user = getCurrentUser();
      
      if (user?.emailVerified) {
        // Stop polling
        if (intervalId) clearInterval(intervalId);
        
        // Email verified! Complete registration
        await completeRegistrationProcess();
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    }
  };

  const completeRegistrationProcess = async () => {
    try {
      setCheckingVerification(true);
      
      const user = getCurrentUser();
      if (!user) {
        throw new Error('User not found');
      }
      
      // Upload photo if provided
      let photoURL: string | null = null;
      if (photoUri) {
        try {
          console.log('📸 Uploading profile photo...');
          photoURL = await uploadImageToCloudinary(photoUri);
          console.log('✅ Photo uploaded:', photoURL);
        } catch (uploadError) {
          console.error('⚠️ Photo upload failed:', uploadError);
        }
      }
      
      // For admin users: Complete registration in database
      console.log('🔐 Admin user email verified, creating account');
      
      // Import completeRegistration for admin
      const { completeRegistration } = await import('../utils/firebase-service');
      await completeRegistration(user, fullName.trim(), photoURL);
      
      // Sign out the user
      await signOut();
      
      setCheckingVerification(false);
      setWaitingForVerification(false);
      
      // Clear form
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setPhotoUri(null);
      setVerificationEmail('');
      
      // Show success message for admin
      Alert.alert(
        '✅ Admin Account Created!',
        'Your admin account has been successfully created and verified. You can now login with your credentials.',
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
      
    } catch (error: any) {
      console.error('❌ Complete registration error:', error);
      setCheckingVerification(false);
      Alert.alert(
        'Error',
        'Failed to complete registration. Please try logging in or contact support.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleResendVerification = async () => {
    try {
      await sendVerificationEmail();
      Alert.alert(
        '✅ Email Sent',
        'A new verification email has been sent to your inbox.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Resend error:', error);
      Alert.alert('Error', 'Failed to send email. Please try again.', [{ text: 'OK' }]);
    }
  };

  const handleCancelVerification = async () => {
    Alert.alert(
      'Cancel Registration?',
      'Are you sure? Your account will be deleted.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = getCurrentUser();
              if (user) await user.delete();
              await signOut();
            } catch (error) {
              console.error('Delete error:', error);
              await signOut();
            }
            setWaitingForVerification(false);
            setVerificationEmail('');
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
                style={styles.registerLogoImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Meta Forensics Today</Text>
          </Animated.View>

          {/* Form Section */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(1000).springify()}
            style={styles.formContainer}
          >
            <View style={styles.blurContainer}>
              <Text style={styles.formTitle}>Sign Up</Text>
              <Text style={styles.formSubtitle}>Fill in the details to get started</Text>

              {/* Photo Upload Section */}
              <TouchableOpacity 
                style={styles.photoContainer} 
                onPress={showPhotoOptions}
                disabled={uploadingPhoto}
              >
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="camera" size={32} color="rgba(255,255,255,0.6)" />
                  </View>
                )}
                {uploadingPhoto && (
                  <View style={styles.photoLoading}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                  </View>
                )}
                <View style={styles.photoEditIcon}>
                  <Ionicons name="pencil" size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <Text style={styles.photoHint}>Tap to add profile photo</Text>

              <View style={styles.form}>
                <AnimatedInput
                  label="Full Name"
                  icon="person-outline"
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                  }}
                  autoCapitalize="words"
                  error={errors.fullName}
                />

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

                <AnimatedInput
                  label="Confirm Password"
                  icon="lock-closed-outline"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword)
                      setErrors({ ...errors, confirmPassword: undefined });
                  }}
                  secureTextEntry
                  error={errors.confirmPassword}
                />

                <View style={styles.termsContainer}>
                  <Text style={styles.termsText}>
                    By signing up, you agree to our{' '}
                    <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                  </Text>
                </View>

                <GradientButton
                  title="Create Account"
                  onPress={handleRegister}
                  loading={loading}
                />

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => router.back()}
                >
                  <Text style={styles.loginText}>
                    Already have an account?{' '}
                    <Text style={styles.loginTextBold}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Verification Waiting Overlay */}
      {waitingForVerification && (
        <View style={styles.verificationOverlay}>
          <View style={styles.verificationCard}>
            <Animated.View
              entering={FadeInDown.duration(600).springify()}
              style={styles.verificationContent}
            >
              <View style={styles.verificationIconContainer}>
                {checkingVerification ? (
                  <Ionicons name="checkmark-circle" size={80} color="#34C759" />
                ) : (
                  <Ionicons name="mail-unread" size={80} color="#007AFF" />
                )}
              </View>
              
              <Text style={styles.verificationTitle}>
                {checkingVerification ? '✅ Email Verified!' : '📧 Verify Your Email'}
              </Text>
              
              <Text style={styles.verificationSubtitle}>
                {checkingVerification
                  ? 'Completing your registration...'
                  : `We've sent a verification email to:\n${verificationEmail}\n\nPlease check your inbox and spam folder, then click the verification link.`}
              </Text>
              
              {!checkingVerification && (
                <View style={styles.verificationInstructions}>
                  <Text style={styles.instructionText}>⏳ Waiting for verification...</Text>
                  <Text style={styles.instructionText}>We&apos;ll automatically detect when you verify your email.</Text>
                </View>
              )}
              
              {checkingVerification && (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
              )}
              
              {!checkingVerification && (
                <View style={styles.verificationButtons}>
                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleResendVerification}
                  >
                    <Ionicons name="refresh" size={20} color="#007AFF" />
                    <Text style={styles.resendButtonText}>Resend Email</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelVerification}
                  >
                    <Text style={styles.cancelButtonText}>Cancel Registration</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </View>
        </View>
      )}
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
    marginBottom: 32,
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
  registerLogoImage: {
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
  photoContainer: {
    alignSelf: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  photoEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  photoLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoHint: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 20,
  },
  termsContainer: {
    marginBottom: 20,
    marginTop: -8,
  },
  termsText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: Typography.small,
    lineHeight: 18,
    textAlign: 'center',
  },
  termsLink: {
    color: '#007AFF',
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
  loginButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: Typography.medium,
  },
  loginTextBold: {
    color: '#007AFF',
    fontWeight: '600',
  },
  verificationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  verificationCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  verificationContent: {
    alignItems: 'center',
  },
  verificationIconContainer: {
    marginBottom: 24,
  },
  verificationTitle: {
    fontSize: Typography.large,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  verificationSubtitle: {
    fontSize: Typography.medium,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  verificationInstructions: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
    width: '100%',
  },
  instructionText: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 8,
  },
  verificationButtons: {
    width: '100%',
    gap: 12,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.4)',
    gap: 8,
  },
  resendButtonText: {
    color: '#007AFF',
    fontSize: Typography.medium,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: Typography.small,
    fontWeight: '500',
  },
});
