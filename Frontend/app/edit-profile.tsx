import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  getCurrentUser,
  getUserProfile,
  updateUserProfile,
  updateUserPassword,
  uploadImageToCloudinary,
} from '../utils/firebase-service';

export default function EditProfileScreen() {
  const [userName, setUserName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const user = getCurrentUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      const profile = await getUserProfile(user.uid);
      if (profile) {
        setUserName(profile.name || '');
        setUserPhoto(profile.photoURL || null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload a photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadPhoto = async (imageUri: string) => {
    try {
      setUploadingPhoto(true);
      const photoURL = await uploadImageToCloudinary(imageUri);
      
      if (photoURL) {
        const user = getCurrentUser();
        if (user) {
          await updateUserProfile(user.uid, { photoURL });
          setUserPhoto(photoURL);
          Alert.alert('Success', 'Profile picture updated successfully');
        }
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoOptions = () => {
    Alert.alert(
      'Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const validateInputs = (): boolean => {
    if (!userName.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty');
      return false;
    }

    // If user wants to change password
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword) {
        Alert.alert('Validation Error', 'Please enter your current password');
        return false;
      }
      if (!newPassword) {
        Alert.alert('Validation Error', 'Please enter a new password');
        return false;
      }
      if (newPassword.length < 6) {
        Alert.alert('Validation Error', 'New password must be at least 6 characters');
        return false;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert('Validation Error', 'New passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateInputs()) return;

    try {
      setSaving(true);
      const user = getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'No user logged in');
        return;
      }

      // Update name
      await updateUserProfile(user.uid, { name: userName.trim() });

      // Update password if provided
      if (currentPassword && newPassword) {
        const passwordUpdated = await updateUserPassword(currentPassword, newPassword);
        if (!passwordUpdated) {
          Alert.alert('Error', 'Failed to update password. Please check your current password.');
          setSaving(false);
          return;
        }
      }

      Alert.alert(
        'Success',
        'Profile updated successfully',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Picture Section */}
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            {userPhoto ? (
              <Image source={{ uri: userPhoto }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={50} color="#007AFF" />
              </View>
            )}
            {uploadingPhoto && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={handlePhotoOptions}
            disabled={uploadingPhoto}
          >
            <Ionicons name="camera" size={20} color="#007AFF" />
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Name Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="person-outline" size={20} color="#007AFF" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#8E8E93"
              value={userName}
              onChangeText={setUserName}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Password Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <Text style={styles.sectionSubtitle}>
            Leave blank if you dont want to change your password
          </Text>

          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="lock-closed-outline" size={20} color="#007AFF" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              placeholderTextColor="#8E8E93"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              <Ionicons
                name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#8E8E93"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="lock-closed-outline" size={20} color="#007AFF" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="New Password"
              placeholderTextColor="#8E8E93"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <Ionicons
                name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#8E8E93"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIcon}>
              <Ionicons name="lock-closed-outline" size={20} color="#007AFF" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              placeholderTextColor="#8E8E93"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#8E8E93"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <LinearGradient
            colors={saving ? ['#8E8E93', '#636366'] : ['#007AFF', '#0051D5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveGradient}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  changePhotoText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  eyeIcon: {
    padding: 8,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
