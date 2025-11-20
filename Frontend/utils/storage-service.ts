import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_REGISTRATION_KEY = '@pending_registration';

export interface PendingRegistrationLocal {
  email: string;
  name: string;
  photoURL?: string | null;
  timestamp: number;
}

/**
 * Store pending registration data locally
 */
export const storePendingRegistration = async (
  email: string,
  name: string,
  photoURL?: string | null
): Promise<void> => {
  try {
    const data: PendingRegistrationLocal = {
      email: email.toLowerCase().trim(),
      name,
      photoURL,
      timestamp: Date.now(),
    };
    
    await AsyncStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify(data));
    console.log('💾 Pending registration stored locally');
  } catch (error) {
    console.error('❌ Error storing pending registration:', error);
  }
};

/**
 * Get pending registration data from local storage
 */
export const getPendingRegistration = async (): Promise<PendingRegistrationLocal | null> => {
  try {
    const data = await AsyncStorage.getItem(PENDING_REGISTRATION_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting pending registration:', error);
    return null;
  }
};

/**
 * Clear pending registration data
 */
export const clearPendingRegistration = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PENDING_REGISTRATION_KEY);
    console.log('🗑️ Pending registration cleared');
  } catch (error) {
    console.error('❌ Error clearing pending registration:', error);
  }
};

/**
 * Check if there's a pending registration
 */
export const hasPendingRegistration = async (): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(PENDING_REGISTRATION_KEY);
    return data !== null;
  } catch (error) {
    console.error('❌ Error checking pending registration:', error);
    return false;
  }
};
