import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// Your Web Client ID from Firebase Console
// Go to: Firebase Console -> Project Settings -> General -> Your apps -> Web app
const WEB_CLIENT_ID = '527632750781-obeh0eal2jev4co7l1cfpc92ac64d7aj.apps.googleusercontent.com';

// Configure Google Sign-In
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID, // From Firebase Console
    offlineAccess: true,
    hostedDomain: '', // Optional: restrict to a specific domain
    forceCodeForRefreshToken: true,
  });
};

// Sign in with Google
export const googleSignIn = async (): Promise<string> => {
  try {
    console.log('🔐 Starting Google Sign-In...');
    
    // Check if device supports Google Play Services
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    
    // Sign in
    const userInfo = await GoogleSignin.signIn();
    console.log('✅ Google Sign-In successful:', userInfo.data?.user.email);
    
    // Get ID token for Firebase authentication
    const { idToken } = userInfo.data || {};
    
    if (!idToken) {
      throw new Error('No ID token received from Google Sign-In');
    }
    
    return idToken;
  } catch (error: any) {
    console.error('❌ Google Sign-In error:', error);
    
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Google Sign-In was cancelled');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Google Sign-In is already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services is not available or outdated');
    } else {
      throw new Error('Google Sign-In failed. Please try again.');
    }
  }
};

// Sign out from Google
export const googleSignOut = async (): Promise<void> => {
  try {
    await GoogleSignin.signOut();
    console.log('✅ Google Sign-Out successful');
  } catch (error) {
    console.error('❌ Google Sign-Out error:', error);
  }
};

// Check if user is signed in to Google
export const isGoogleSignedIn = async (): Promise<boolean> => {
  try {
    const userInfo = await GoogleSignin.getCurrentUser();
    return userInfo !== null;
  } catch (error) {
    console.error('❌ Error checking Google Sign-In status:', error);
    return false;
  }
};
