import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
  User,
  Auth,
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  remove,
  push,
  onValue,
  Database,
} from 'firebase/database';
import { firebaseConfig } from './firebase-config';

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let database: Database;

const initializeFirebase = () => {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    database = getDatabase(app);
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
};

// Initialize on import
initializeFirebase();

// Types
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  photoURL?: string | null;
  role?: string;
  createdAt: number;
}

export interface ScanReport {
  reportId: string;
  userId: string;
  name: string;
  accuracy: string;
  imageUrl?: string;
  scannedAt: number;
  location?: string;
  notes?: string;
}

/**
 * Authentication Services
 */

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Send email verification
export const sendVerificationEmail = async (): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user logged in');
    }
    
    if (user.emailVerified) {
      throw new Error('Email is already verified');
    }
    
    await sendEmailVerification(user);
    console.log('✅ Verification email sent to:', user.email);
  } catch (error: any) {
    console.error('❌ Error sending verification email:', error);
    throw error;
  }
};

// Check if user's email is verified
export const isEmailVerified = (): boolean => {
  const user = auth.currentUser;
  return user?.emailVerified || false;
};

// Reload user to get latest verification status
export const reloadUser = async (): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (user) {
      await user.reload();
    }
  } catch (error) {
    console.error('Error reloading user:', error);
  }
};

// Google Sign-In (using credential from Google Sign-In native module)
export const signInWithGoogle = async (idToken: string): Promise<void> => {
  try {
    console.log('🔐 Starting Google Sign-In with Firebase...');
    
    // Create a Google credential with the token
    const googleCredential = GoogleAuthProvider.credential(idToken);
    
    // Sign in with the credential
    const userCredential = await signInWithCredential(auth, googleCredential);
    console.log('✅ Google Sign-In successful:', userCredential.user.email);
    
    // Reload user to get latest status
    await userCredential.user.reload();
    
    // Check if user exists in database
    const userRef = ref(database, `users/${userCredential.user.uid}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      // New Google user - send verification email
      try {
        await sendEmailVerification(userCredential.user);
        console.log('✅ Verification email sent to Google user:', userCredential.user.email);
      } catch (verificationError) {
        console.error('⚠️ Failed to send verification email to Google user:', verificationError);
      }
      
      // Create user profile in database for new Google users
      await set(userRef, {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || 'User',
        photoURL: userCredential.user.photoURL,
        role: 'user',
        createdAt: Date.now(),
        lastLogin: Date.now(),
        emailVerified: userCredential.user.emailVerified,
        provider: 'google',
      });
      console.log('✅ New Google user profile created');
      
      // Check email verification for new Google users
      if (!userCredential.user.emailVerified) {
        await firebaseSignOut(auth);
        const verificationError: any = new Error('Please verify your email address before accessing the app. Check your inbox for the verification link.');
        verificationError.code = 'EMAIL_NOT_VERIFIED';
        throw verificationError;
      }
    } else {
      // Existing user - check email verification
      await userCredential.user.reload();
      
      if (!userCredential.user.emailVerified) {
        await firebaseSignOut(auth);
        const verificationError: any = new Error('Please verify your email address before accessing the app. Check your inbox for the verification link.');
        verificationError.code = 'EMAIL_NOT_VERIFIED';
        throw verificationError;
      }
      
      // Update last login time
      await update(userRef, {
        lastLogin: Date.now(),
        emailVerified: userCredential.user.emailVerified,
      });
      console.log('✅ Existing Google user logged in');
    }
  } catch (error: any) {
    console.error('❌ Google Sign-In error:', error);
    throw error;
  }
};

// Check if email exists in database
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const users = snapshot.val();
      const userEmails = Object.values(users).map((user: any) => user.email.toLowerCase());
      return userEmails.includes(email.toLowerCase());
    }
    return false;
  } catch (error: any) {
    console.error('Error checking email:', error);
    return false;
  }
};

// Sign up with email and password - Step 1: Create auth account and send verification
export const signUpWithEmail = async (
  email: string,
  password: string,
  name: string,
  photoURL?: string | null
): Promise<User> => {
  let userCredential: any = null;
  
  try {
    console.log('🔐 Starting registration for:', email);
    
    // Create Firebase Auth user
    userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ Auth user created:', userCredential.user.uid);
    
    // Update display name and photo immediately
    try {
      await updateProfile(userCredential.user, {
        displayName: name,
        photoURL: photoURL || null,
      });
      console.log('✅ Profile updated with name and photo');
    } catch (profileError) {
      console.error('⚠️ Profile update error:', profileError);
    }
    
    // Send email verification
    try {
      await sendEmailVerification(userCredential.user);
      console.log('✅ Verification email sent to:', email);
    } catch (verificationError) {
      console.error('⚠️ Failed to send verification email:', verificationError);
      // Delete the user if verification email fails
      if (userCredential?.user) {
        try {
          await userCredential.user.delete();
          console.log('🔄 Rolled back auth user creation');
        } catch (deleteError) {
          console.error('Failed to rollback user:', deleteError);
        }
      }
      throw new Error('Failed to send verification email. Please try again.');
    }
    
    console.log('✅ Auth account created, waiting for email verification...');
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Sign up error:', error);
    
    // Enhanced error handling
    if (error.code === 'auth/email-already-in-use') {
      throw error;
    }
    
    throw error;
  }
};

// Complete registration - Step 2: Create database profile after email verification
export const completeRegistration = async (
  user: User,
  name: string,
  photoURL?: string | null
): Promise<void> => {
  try {
    console.log('🔐 Completing registration for:', user.email);
    
    // Verify email is actually verified
    await user.reload();
    if (!user.emailVerified) {
      throw new Error('Email not verified yet');
    }
    
    // Check if profile already exists
    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      console.log('⚠️ User profile already exists, updating...');
      await update(userRef, {
        emailVerified: true,
        lastLogin: Date.now(),
      });
      return;
    }
    
    // Create user profile in Realtime Database
    await set(userRef, {
      uid: user.uid,
      email: user.email?.toLowerCase().trim(),
      name: name.trim(),
      photoURL: photoURL || null,
      role: 'user',
      createdAt: Date.now(),
      lastLogin: Date.now(),
      emailVerified: true,
      provider: 'email',
    });
    
    console.log('✅ User profile created in database');
  } catch (error: any) {
    console.error('❌ Complete registration error:', error);
    throw error;
  }
};

// Alias for registration (kept for backwards compatibility, but signUpWithEmail is preferred)
// Note: This now returns the User object instead of void
export const registerUser = signUpWithEmail;

// Sign in with email and password
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<void> => {
  try {
    console.log('🔐 Attempting to sign in:', email);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Authentication successful');
    
    // Force reload to get the absolute latest verification status from Firebase servers
    await userCredential.user.reload();
    
    // Get fresh user object after reload
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not found after authentication');
    }
    
    console.log('📧 Email verified status:', currentUser.emailVerified);
    
    // Check if email is verified
    if (!currentUser.emailVerified) {
      console.log('❌ Email not verified');
      // Sign out the user immediately
      await firebaseSignOut(auth);
      
      // Throw custom error with code for proper handling
      const verificationError: any = new Error('Please verify your email address before logging in. Check your inbox for the verification link.');
      verificationError.code = 'EMAIL_NOT_VERIFIED';
      throw verificationError;
    }
    
    console.log('✅ Email verified, checking database profile...');
    
    // Check if user profile exists in database
    const userRef = ref(database, `users/${currentUser.uid}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      console.log('⚠️ User profile not found in database, creating...');
      // Create profile if it doesn't exist (for verified users)
      await set(userRef, {
        uid: currentUser.uid,
        email: currentUser.email?.toLowerCase().trim(),
        name: currentUser.displayName || 'User',
        photoURL: currentUser.photoURL || null,
        role: 'user',
        createdAt: Date.now(),
        lastLogin: Date.now(),
        emailVerified: true,
        provider: 'email',
      });
    } else {
      // Update last login time and email verification status
      await update(userRef, {
        lastLogin: Date.now(),
        emailVerified: true,
      });
    }
    
    console.log('✅ Login successful');
  } catch (error: any) {
    console.error('❌ Sign in error:', error);
    throw error;
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw error;
  }
};

/**
 * Cloudinary Image Upload
 */
export const uploadImageToCloudinary = async (imageUri: string): Promise<string> => {
  try {
    const CLOUDINARY_CLOUD_NAME = 'ddkblq1nk';
    const cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

    // Create form data
    const formData = new FormData();
    
    // Extract filename from URI
    const filename = imageUri.split('/').pop() || 'photo.jpg';
    const match = /\.([\w]+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri: imageUri,
      type: type,
      name: filename,
    } as any);
    
    // Using unsigned upload preset
    // You need to enable unsigned uploading in Cloudinary dashboard:
    // Settings -> Upload -> Add upload preset -> Set to "Unsigned"
    formData.append('upload_preset', 'ml_default');
    formData.append('folder', 'profile_pictures');

    console.log('📤 Uploading to Cloudinary...', cloudinaryUploadUrl);

    // Upload to Cloudinary
    const response = await fetch(cloudinaryUploadUrl, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Cloudinary error response:', data);
      throw new Error(`Cloudinary upload failed: ${response.status} - ${data.error?.message || 'Unknown error'}`);
    }

    console.log('✅ Cloudinary upload success:', data.secure_url);
    return data.secure_url;
  } catch (error: any) {
    console.error('❌ Cloudinary upload error:', error);
    throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw error;
  }
};

// Update user password with reauthentication
export const updateUserPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('No user logged in');
    }

    // Reauthenticate user before password update
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password
    await updatePassword(user, newPassword);
    console.log('Password updated successfully');
    return true;
  } catch (error: any) {
    console.error('Password update error:', error);
    if (error.code === 'auth/wrong-password') {
      throw new Error('Current password is incorrect');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('New password is too weak');
    }
    throw error;
  }
};

// Auth state listener
export const onAuthStateChanged = (
  callback: (user: User | null) => void
): (() => void) => {
  return firebaseOnAuthStateChanged(auth, callback);
};

// Get Firebase error message
export const getFirebaseErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'EMAIL_NOT_VERIFIED':
      return 'Please verify your email address before logging in. Check your inbox (and spam folder) for the verification link.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please login instead or use "Forgot Password" if you need to reset your password.';
    case 'auth/invalid-email':
      return 'Invalid email address. Please check and try again.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled. Please contact support.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 8 characters with uppercase, lowercase, and numbers.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please check your email or register first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again or use "Forgot Password".';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please wait a few minutes and try again.';
    case 'auth/requires-recent-login':
      return 'For security, please login again to complete this action.';
    default:
      return 'An error occurred. Please try again later.';
  }
};

/**
 * Realtime Database Services - User Profile
 */

// Get user profile
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const snapshot = await get(ref(database, `users/${userId}`));
    return snapshot.val();
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (
  userId: string,
  data: Partial<UserProfile>
): Promise<void> => {
  try {
    await update(ref(database, `users/${userId}`), data);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Realtime Database Services - Scan Reports
 */

// Save scan report - accepts userId and ScanResult from API
export const saveScanReport = async (userId: string, scanResult: any): Promise<string | null> => {
  try {
    console.log('💾 Attempting to save scan report for user:', userId);
    
    // Check if this person already has a report (by name) to avoid duplicates
    const recentReportsSnapshot = await get(ref(database, `reports/${userId}`));
    const existingReports = recentReportsSnapshot.val() || {};
    
    // Extract name from multiple possible locations
    const newReportName = scanResult.name || 
                         scanResult.fullData?.personal_info?.name || 
                         scanResult.personalInfo?.name || 
                         scanResult.fullData?.personalInfo?.name;
    
    if (!newReportName) {
      console.log('⚠️ Cannot check for duplicates - no name found in report');
    } else {
      // Check if a report with this exact name already exists (case-insensitive)
      for (const reportId in existingReports) {
        const existingReport = existingReports[reportId];
        
        if (existingReport) {
          // Get name from existing report (multiple formats)
          const existingName = existingReport.name || 
                              existingReport.personalInfo?.name || 
                              existingReport.fullData?.personal_info?.name ||
                              existingReport.metadata?.name;
          
          if (existingName && existingName.toLowerCase().trim() === newReportName.toLowerCase().trim()) {
            console.log(`⚠️ Report already exists for "${newReportName}" (Report ID: ${reportId}), skipping duplicate...`);
            return reportId; // Return existing report ID instead of creating duplicate
          }
        }
      }
    }
    
    // Create new report with structured Firebase format
    const newReportRef = push(ref(database, `reports/${userId}`));
    const reportId = newReportRef.key!;
    
    const reportData = {
      scannedAt: Date.now(),
      name: newReportName || 'Unknown',
      location: scanResult.location?.address || scanResult.fullData?.personal_info?.location || 'Unknown',
      accuracy: scanResult.accuracy || 0,
      personalInfo: scanResult.fullData?.personal_info || {
        name: scanResult.name,
        age: scanResult.additionalInfo?.age,
        gender: scanResult.additionalInfo?.gender,
      },
      socialMedia: scanResult.fullData?.social_media || {},
      databaseRecords: scanResult.fullData?.database_records || {},
      publicRecords: scanResult.fullData?.public_records || {},
      other: scanResult.fullData?.other || [],
      summary: scanResult.fullData?.summary || {},
      metadata: {
        mainId: scanResult.fullData?.main_id || scanResult.id,
        subId: scanResult.fullData?.sub_id || '',
        generatedAt: scanResult.fullData?.generated_at || scanResult.timestamp,
        profileImage: scanResult.profileImage || '',
        gpsCoordinates: {
          latitude: scanResult.location?.latitude || 0,
          longitude: scanResult.location?.longitude || 0,
        },
      },
    };

    await set(newReportRef, reportData);
    
    console.log('✅ Report saved successfully to Firebase:', reportId);
    return reportId;
  } catch (error) {
    console.error('❌ Error saving scan report to Firebase:', error);
    throw error;
  }
};

// Get user reports
export const getUserReports = async (userId: string): Promise<any[]> => {
  try {
    console.log('📥 Fetching reports for userId:', userId);
    // Get all reports for this user from reports/{userId}
    const userReportsSnapshot = await get(ref(database, `reports/${userId}`));
    
    const reportsData = userReportsSnapshot.val() || {};
    console.log('📊 Raw reports data keys:', Object.keys(reportsData).length);
    
    if (Object.keys(reportsData).length === 0) {
      console.log('⚠️ No reports found for user');
      return [];
    }
    
    // Convert to array with proper structure mapping for UI compatibility
    const reports: any[] = Object.keys(reportsData).map(reportId => {
      try {
        const report = reportsData[reportId];
        
        // Handle both old format (with fullData) and new format (with direct properties)
        const hasFullData = report.fullData && typeof report.fullData === 'object';
        const hasDirectProperties = report.personalInfo || report.socialMedia || report.databaseRecords;
        
        let personalInfo, socialMedia, publicRecords, databaseRecords, otherData, summary, metadata;
        
        if (hasFullData) {
          // Old format: data is in fullData property
          personalInfo = report.fullData.personal_info || {};
          socialMedia = report.fullData.social_media || {};
          publicRecords = report.fullData.public_records || {};
          databaseRecords = report.fullData.database_records || {};
          otherData = report.fullData.other || [];
          summary = report.fullData.summary || {};
          metadata = {
            mainId: report.fullData.main_id,
            subId: report.fullData.sub_id,
            generatedAt: report.fullData.generated_at,
            profileImage: report.profileImage,
            gpsCoordinates: report.location,
          };
        } else if (hasDirectProperties) {
          // New format: data is at root level
          personalInfo = report.personalInfo || {};
          socialMedia = report.socialMedia || {};
          publicRecords = report.publicRecords || {};
          databaseRecords = report.databaseRecords || {};
          otherData = report.other || [];
          summary = report.summary || {};
          metadata = report.metadata || {};
        } else {
          // Fallback: minimal data
          personalInfo = { name: report.name || 'Unknown' };
          socialMedia = {};
          publicRecords = {};
          databaseRecords = {};
          otherData = [];
          summary = {};
          metadata = {};
        }
        
        // Extract name from various possible locations
        const personName = report.name || 
                          personalInfo?.name || 
                          metadata?.name || 
                          'Unknown';
        
        // Extract location data
        const locationData = report.location || {};
        const latitude = typeof locationData === 'object' ? 
                        (locationData.latitude || metadata?.gpsCoordinates?.latitude || 0) : 0;
        const longitude = typeof locationData === 'object' ? 
                         (locationData.longitude || metadata?.gpsCoordinates?.longitude || 0) : 0;
        const address = typeof locationData === 'string' ? locationData : 
                       (typeof locationData === 'object' ? locationData.address : 'Unknown');
        
        // Get profile image
        const profileImage = report.profileImage || 
                            metadata?.profileImage || 
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(personName)}&size=300&background=007AFF&color=fff`;
        
        // Map Firebase structure to UI-expected structure
        return {
          reportId,
          id: metadata?.mainId || reportId,
          name: personName,
          accuracy: Number(report.accuracy) || 0,
          profileImage,
          scannedAt: report.scannedAt || Date.now(),
          location: {
            latitude,
            longitude,
            address,
          },
          timestamp: metadata?.generatedAt || new Date(report.scannedAt || Date.now()).toISOString(),
          additionalInfo: {
            age: personalInfo?.age,
            gender: personalInfo?.gender,
            lastSeen: metadata?.generatedAt || report.additionalInfo?.lastSeen,
            matchCount: report.additionalInfo?.matchCount || Object.keys(socialMedia || {}).length,
          },
          fullData: {
            main_id: metadata?.mainId,
            sub_id: metadata?.subId,
            personal_info: personalInfo,
            social_media: socialMedia,
            public_records: publicRecords,
            database_records: databaseRecords,
            other: otherData,
            summary,
            metadata,
            generated_at: metadata?.generatedAt,
          },
        };
      } catch (mapError) {
        console.error('❌ Error mapping report:', reportId, mapError);
        // Return minimal valid report on error
        return {
          reportId,
          id: reportId,
          name: 'Unknown',
          accuracy: 0,
          profileImage: 'https://ui-avatars.com/api/?name=Unknown&size=300',
          scannedAt: Date.now(),
          location: { latitude: 0, longitude: 0, address: 'Unknown' },
          timestamp: new Date().toISOString(),
          additionalInfo: {},
          fullData: {},
        };
      }
    }).sort((a, b) => b.scannedAt - a.scannedAt);

    console.log(`✅ Mapped ${reports.length} reports for UI`);
    return reports;
  } catch (error) {
    console.error('❌ Error getting user reports:', error);
    return [];
  }
};

// Get single report
export const getReport = async (userId: string, reportId: string): Promise<any | null> => {
  try {
    const snapshot = await get(ref(database, `reports/${userId}/${reportId}`));
    return snapshot.val();
  } catch (error) {
    console.error('Error getting report:', error);
    throw error;
  }
};

// Delete report
export const deleteReport = async (userId: string, reportId: string): Promise<void> => {
  try {
    // Delete from reports/{userId}/{reportId}
    await remove(ref(database, `reports/${userId}/${reportId}`));
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
};

// Update report
export const updateReport = async (
  userId: string,
  reportId: string,
  data: Partial<any>
): Promise<void> => {
  try {
    await update(ref(database, `reports/${userId}/${reportId}`), data);
  } catch (error) {
    console.error('Error updating report:', error);
    throw error;
  }
};

/**
 * Real-time listeners
 */

// Listen to user reports in real-time
export const listenToUserReports = (
  userId: string,
  callback: (reports: any[]) => void
): (() => void) => {
  const reportsRef = ref(database, `reports/${userId}`);
  
  const unsubscribe = onValue(reportsRef, (snapshot) => {
    const reportsData = snapshot.val() || {};
    
    // Convert to array and sort by scannedAt (newest first)
    const reports: any[] = Object.keys(reportsData).map(reportId => ({
      reportId,
      ...reportsData[reportId],
    })).sort((a, b) => b.scannedAt - a.scannedAt);
    
    callback(reports);
  });

  // Return unsubscribe function
  return unsubscribe;
};

/**
 * Chat Services
 */

// Get all officers (users) for chat
export const getAllOfficers = async (): Promise<any[]> => {
  try {
    const usersSnapshot = await get(ref(database, 'users'));
    const usersData = usersSnapshot.val() || {};
    
    const officers = Object.keys(usersData).map(uid => ({
      uid,
      ...usersData[uid],
    }));
    
    return officers;
  } catch (error) {
    console.error('Error getting officers:', error);
    return [];
  }
};

// Get conversation ID (sorted user IDs)
const getConversationId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

// Send a message
export const sendMessage = async (
  fromUserId: string,
  toUserId: string,
  text: string
): Promise<void> => {
  try {
    const conversationId = getConversationId(fromUserId, toUserId);
    const messageRef = push(ref(database, `conversations/${conversationId}/messages`));
    
    const message = {
      text,
      senderId: fromUserId,
      timestamp: Date.now(),
      read: false,
    };
    
    await set(messageRef, message);
    
    // Update conversation metadata
    const conversationMetadata = {
      lastMessage: text,
      lastMessageTime: message.timestamp,
      participants: {
        [fromUserId]: true,
        [toUserId]: true,
      },
      [`unreadCount_${toUserId}`]: 0, // Will be incremented below
    };
    
    await update(ref(database, `conversations/${conversationId}`), conversationMetadata);
    
    // Increment unread count for recipient
    const unreadRef = ref(database, `conversations/${conversationId}/unreadCount_${toUserId}`);
    const unreadSnapshot = await get(unreadRef);
    const currentUnread = unreadSnapshot.val() || 0;
    await set(unreadRef, currentUnread + 1);
    
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Listen to messages in real-time
export const listenToMessages = (
  userId: string,
  otherUserId: string,
  callback: (messages: any[]) => void
): (() => void) => {
  try {
    const conversationId = getConversationId(userId, otherUserId);
    const messagesRef = ref(database, `conversations/${conversationId}/messages`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const messagesData = snapshot.val() || {};
      const messages = Object.keys(messagesData)
        .map(key => ({
          id: key,
          ...messagesData[key],
        }))
        .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
      
      callback(messages);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error listening to messages:', error);
    return () => {};
  }
};

// Mark messages as read
export const markMessagesAsRead = async (
  userId: string,
  otherUserId: string
): Promise<void> => {
  try {
    const conversationId = getConversationId(userId, otherUserId);
    const unreadRef = ref(database, `conversations/${conversationId}/unreadCount_${userId}`);
    await set(unreadRef, 0);
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

// Get all conversations for a user
export const getConversations = async (userId: string): Promise<any[]> => {
  try {
    const conversationsSnapshot = await get(ref(database, 'conversations'));
    const conversationsData = conversationsSnapshot.val() || {};
    
    const conversations: any[] = [];
    
    for (const conversationId in conversationsData) {
      const conversation = conversationsData[conversationId];
      
      // Check if user is a participant
      if (conversation.participants && conversation.participants[userId]) {
        // Get other user ID
        const participantIds = Object.keys(conversation.participants);
        const otherUserId = participantIds.find(id => id !== userId);
        
        if (otherUserId) {
          // Get other user info
          const otherUserSnapshot = await get(ref(database, `users/${otherUserId}`));
          const otherUser = otherUserSnapshot.val();
          
          if (otherUser) {
            conversations.push({
              conversationId,
              otherUser: {
                uid: otherUserId,
                name: otherUser.name,
                email: otherUser.email,
                role: otherUser.role,
              },
              lastMessage: conversation.lastMessage || 'No messages yet',
              lastMessageTime: conversation.lastMessageTime || 0,
              unreadCount: conversation[`unreadCount_${userId}`] || 0,
            });
          }
        }
      }
    }
    
    // Sort by last message time
    conversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    
    return conversations;
  } catch (error) {
    console.error('Error getting conversations:', error);
    return [];
  }
};

/**
 * Notification Services
 */

// Create a notification
export const createNotification = async (
  userId: string,
  notification: {
    type: 'pdf_shared' | 'message' | 'report' | 'system';
    title: string;
    message: string;
    metadata?: any;
  }
): Promise<string | null> => {
  try {
    const notificationsRef = ref(database, `notifications/${userId}`);
    const newNotificationRef = push(notificationsRef);
    
    const notificationData = {
      id: newNotificationRef.key,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      timestamp: Date.now(),
      read: false,
      metadata: notification.metadata || null,
    };
    
    await set(newNotificationRef, notificationData);
    console.log('✅ Notification created:', notificationData.id);
    return notificationData.id;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    return null;
  }
};

// Get user notifications
export const getUserNotifications = async (userId: string): Promise<any[]> => {
  try {
    const notificationsRef = ref(database, `notifications/${userId}`);
    const snapshot = await get(notificationsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const notificationsData = snapshot.val();
    const notifications = Object.values(notificationsData || {});
    
    // Sort by timestamp (newest first)
    notifications.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
    
    return notifications;
  } catch (error) {
    console.error('❌ Error getting notifications:', error);
    return [];
  }
};

// Mark notification as read
export const markNotificationAsRead = async (
  userId: string,
  notificationId: string
): Promise<void> => {
  try {
    const notificationRef = ref(database, `notifications/${userId}/${notificationId}`);
    await update(notificationRef, { read: true });
    console.log('✅ Notification marked as read');
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
  }
};

// Delete notification
export const deleteNotification = async (
  userId: string,
  notificationId: string
): Promise<void> => {
  try {
    const notificationRef = ref(database, `notifications/${userId}/${notificationId}`);
    await remove(notificationRef);
    console.log('✅ Notification deleted');
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    throw error;
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const notifications = await getUserNotifications(userId);
    return notifications.filter((n: any) => !n.read).length;
  } catch (error) {
    console.error('❌ Error getting unread notification count:', error);
    return 0;
  }
};

/**
 * Admin Approval System
 */

// List of admin emails
const ADMIN_EMAILS = [
  'kishan2004june@gmail.com',
  'hdlukare@gmail.com',
  'shrikrushnaj782@gmail.com',
  'aquaruhoshino@gmail.com',
];

// Check if user is admin by email
export const isAdminEmail = (email: string): boolean => {
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

// Check if current user is admin
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) return false;
    return isAdminEmail(user.email);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

export interface PendingRegistration {
  id?: string;
  email: string;
  name: string;
  photoURL?: string | null;
  password?: string; // Temporarily store password (will be removed after account creation)
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  emailVerified: boolean;
  approvedBy?: string;
  approvedAt?: number;
  rejectedBy?: string;
  rejectedAt?: number;
  rejectionReason?: string;
}

// Create pending registration request (WITHOUT creating auth account yet)
export const createPendingRegistration = async (
  email: string,
  password: string,
  name: string,
  photoURL?: string | null
): Promise<string> => {
  try {
    console.log('📝 Creating pending registration request for:', email);
    
    const pendingRef = push(ref(database, 'pendingRegistrations'));
    const requestId = pendingRef.key!;
    
    const pendingData: PendingRegistration = {
      id: requestId,
      email: email.toLowerCase().trim(),
      name: name.trim(),
      photoURL: photoURL || null,
      password: password, // Store temporarily - will be used to create account on approval
      status: 'pending',
      createdAt: Date.now(),
      emailVerified: true, // We'll verify email after approval
    };
    
    await set(pendingRef, pendingData);
    console.log('✅ Pending registration created:', requestId);
    return requestId;
  } catch (error) {
    console.error('❌ Error creating pending registration:', error);
    throw error;
  }
};

// Get all pending registrations (for admins)
export const getAllPendingRegistrations = async (): Promise<PendingRegistration[]> => {
  try {
    const pendingSnapshot = await get(ref(database, 'pendingRegistrations'));
    const pendingData = pendingSnapshot.val() || {};
    
    const registrations: PendingRegistration[] = Object.keys(pendingData)
      .map(key => ({
        id: key,
        ...pendingData[key],
      }))
      .filter((reg: PendingRegistration) => reg.status === 'pending')
      .sort((a, b) => b.createdAt - a.createdAt);
    
    console.log(`📊 Found ${registrations.length} pending registrations`);
    return registrations;
  } catch (error) {
    console.error('❌ Error getting pending registrations:', error);
    return [];
  }
};

// Get pending registration by email
export const getPendingRegistrationByEmail = async (
  email: string
): Promise<PendingRegistration | null> => {
  try {
    const pendingSnapshot = await get(ref(database, 'pendingRegistrations'));
    const pendingData = pendingSnapshot.val() || {};
    
    const normalizedEmail = email.toLowerCase().trim();
    
    for (const key in pendingData) {
      const registration = pendingData[key];
      if (registration.email === normalizedEmail) {
        return {
          id: key,
          ...registration,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting pending registration:', error);
    return null;
  }
};

// Approve registration request (NOW creates the Firebase Auth account)
export const approveRegistration = async (
  requestId: string,
  adminEmail: string
): Promise<void> => {
  // Store the original admin credentials to re-login after creating the new user
  let adminCredentials: { email: string; uid: string } | null = null;
  
  try {
    console.log('✅ Approving registration:', requestId);
    
    // Get the pending registration
    const pendingRef = ref(database, `pendingRegistrations/${requestId}`);
    const snapshot = await get(pendingRef);
    
    if (!snapshot.exists()) {
      throw new Error('Registration request not found');
    }
    
    const pendingData = snapshot.val() as PendingRegistration;
    
    // Check if admin email is actually an admin
    if (!isAdminEmail(adminEmail)) {
      throw new Error('Unauthorized: Only admins can approve registrations');
    }
    
    // Save current admin info before creating new user
    const currentAdmin = auth.currentUser;
    if (!currentAdmin) {
      throw new Error('Admin must be logged in to approve registrations');
    }
    
    adminCredentials = {
      email: currentAdmin.email!,
      uid: currentAdmin.uid,
    };
    
    console.log('💾 Saved admin credentials:', adminCredentials.email);
    
    // NOW create the Firebase Auth account
    console.log('🔐 Creating Firebase Auth account for approved user...');
    
    let newUserUid: string;
    try {
      // Create a secondary auth instance to avoid logging out the admin
      // Unfortunately, Firebase Web SDK auto-signs in new users, so we need to:
      // 1. Create the account (admin will be logged out)
      // 2. Complete the setup
      // 3. Sign out the new user
      // 4. The app's auth state listener should keep admin session
      
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        pendingData.email,
        pendingData.password!
      );
      newUserUid = userCredential.user.uid;
      console.log('✅ Auth account created for:', pendingData.email);
      
      // Update display name and photo
      await updateProfile(userCredential.user, {
        displayName: pendingData.name,
        photoURL: pendingData.photoURL || null,
      });
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
      console.log('✅ Verification email sent to:', pendingData.email);
      
    } catch (authError: any) {
      console.error('❌ Error creating auth account:', authError);
      
      // If email already exists, provide clear error
      if (authError.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. User may have created an account elsewhere.');
      }
      
      throw new Error(`Failed to create account: ${authError.message}`);
    }
    
    // Update pending registration status (remove password for security)
    await update(pendingRef, {
      status: 'approved',
      approvedBy: adminEmail,
      approvedAt: Date.now(),
      password: null, // Remove password after account creation
    });
    
    // Create user profile in database
    const userRef = ref(database, `users/${newUserUid}`);
    await set(userRef, {
      uid: newUserUid,
      email: pendingData.email,
      name: pendingData.name,
      photoURL: pendingData.photoURL || null,
      role: 'user',
      createdAt: Date.now(),
      lastLogin: Date.now(),
      emailVerified: false, // Will be true after they verify email
      provider: 'email',
      approvedBy: adminEmail,
      approvedAt: Date.now(),
    });
    
    // Create notification for the user
    await createNotification(newUserUid, {
      type: 'system',
      title: '🎉 Account Approved!',
      message: 'Your registration has been approved by an administrator! A verification email has been sent to your email address. Please verify your email before logging in.',
      metadata: {
        approvedBy: adminEmail,
        approvedAt: Date.now(),
      },
    });
    
    console.log('✅ Registration approved and account created');
    
    // Sign out the newly created user to restore admin session
    await firebaseSignOut(auth);
    console.log('✅ Signed out new user, admin session should persist');
    
  } catch (error) {
    console.error('❌ Error approving registration:', error);
    throw error;
  }
};

// Reject registration request
export const rejectRegistration = async (
  requestId: string,
  adminEmail: string,
  reason?: string
): Promise<void> => {
  try {
    console.log('❌ Rejecting registration:', requestId);
    
    // Get the pending registration
    const pendingRef = ref(database, `pendingRegistrations/${requestId}`);
    const snapshot = await get(pendingRef);
    
    if (!snapshot.exists()) {
      throw new Error('Registration request not found');
    }
    
    const pendingData = snapshot.val() as PendingRegistration;
    
    // Check if admin email is actually an admin
    if (!isAdminEmail(adminEmail)) {
      throw new Error('Unauthorized: Only admins can reject registrations');
    }
    
    // Update pending registration status (remove password for security)
    await update(pendingRef, {
      status: 'rejected',
      rejectedBy: adminEmail,
      rejectedAt: Date.now(),
      rejectionReason: reason || 'No reason provided',
      password: null, // Remove password after rejection for security
    });
    
    // Note: Since no Firebase Auth account was created for non-admin users,
    // we can't send them a notification via Firebase. They will see the
    // rejection status when they check the login page.
    
    console.log('✅ Registration rejected');
  } catch (error) {
    console.error('❌ Error rejecting registration:', error);
    throw error;
  }
};

// Delete Auth user (for cleanup of rejected requests)
export const deleteAuthUser = async (uid: string): Promise<void> => {
  try {
    // Note: Deleting auth users from client-side is not possible
    // This would need to be done via Firebase Admin SDK on the backend
    // For now, we'll just mark it in the database
    console.log('⚠️ Auth user deletion requires backend implementation');
  } catch (error) {
    console.error('❌ Error deleting auth user:', error);
    throw error;
  }
};

// Check registration status by email
export const checkRegistrationStatus = async (
  email: string
): Promise<{ status: 'none' | 'pending' | 'approved' | 'rejected'; data?: PendingRegistration }> => {
  try {
    const registration = await getPendingRegistrationByEmail(email);
    
    if (!registration) {
      return { status: 'none' };
    }
    
    return {
      status: registration.status,
      data: registration,
    };
  } catch (error) {
    console.error('❌ Error checking registration status:', error);
    return { status: 'none' };
  }
};

// Export database and auth instances for direct access if needed
export { database, auth };

export { initializeFirebase };
