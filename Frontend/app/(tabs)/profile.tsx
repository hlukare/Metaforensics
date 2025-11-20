import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { getCurrentUser, getUserProfile, signOut, isCurrentUserAdmin, getAllPendingRegistrations, approveRegistration, rejectRegistration, PendingRegistration } from '../../utils/firebase-service';

interface WeatherData {
  temperature: number;
  humidity: number;
  rain: number;
  time: string;
}

export default function ProfileScreen() {
  const [userName, setUserName] = useState('Officer Name');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('Forensic Investigator');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // Admin states
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserProfile();
    fetchWeatherData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserProfile();
    await fetchWeatherData();
    setRefreshing(false);
  };

  const loadPendingRegistrations = async () => {
    try {
      setAdminLoading(true);
      const registrations = await getAllPendingRegistrations();
      setPendingRegistrations(registrations);
      console.log(`📋 Loaded ${registrations.length} pending registrations`);
    } catch (error) {
      console.error('❌ Error loading pending registrations:', error);
    } finally {
      setAdminLoading(false);
    }
  };

  const fetchWeatherData = async () => {
    try {
      setWeatherLoading(true);
      setWeatherError(null);

      // Get location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setWeatherError('Location permission required');
        setWeatherLoading(false);
        return;
      }

      // Get current location
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = currentLocation.coords;
      setLocation({ latitude, longitude });

      // Fetch weather data from Open-Meteo API
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,rain&timezone=auto`
      );

      if (!response.ok) {
        throw new Error('Weather service unavailable');
      }

      const data = await response.json();

      if (!data.hourly || !data.hourly.time) {
        throw new Error('Invalid weather data');
      }

      // Get current hour index
      const now = new Date();
      const currentHourIndex = data.hourly.time.findIndex((time: string) => {
        const weatherTime = new Date(time);
        return weatherTime.getHours() === now.getHours() && 
               weatherTime.getDate() === now.getDate();
      });

      if (currentHourIndex === -1) {
        throw new Error('Current weather data not found');
      }

      // Get current, +1 hour, +2 hour data
      const weatherPoints: WeatherData[] = [];
      for (let i = 0; i < 3 && (currentHourIndex + i) < data.hourly.time.length; i++) {
        const index = currentHourIndex + i;
        weatherPoints.push({
          temperature: Math.round(data.hourly.temperature_2m[index]),
          humidity: Math.round(data.hourly.relative_humidity_2m[index]),
          rain: data.hourly.rain[index] || 0,
          time: data.hourly.time[index],
        });
      }

      setWeatherData(weatherPoints);
    } catch (error: any) {
      console.error('Weather fetch error:', error);
      setWeatherError(error.message || 'Failed to load weather');
    } finally {
      setWeatherLoading(false);
    }
  };

  const getTimeLabel = (index: number): string => {
    if (index === 0) return 'Now';
    if (index === 1) return '+1hr';
    if (index === 2) return '+2hr';
    return '';
  };

  const getWeatherIcon = (rain: number, temperature: number): string => {
    if (rain > 0.5) return 'rainy';
    if (temperature > 30) return 'sunny';
    if (temperature < 15) return 'snow';
    return 'partly-sunny';
  };

  const loadUserProfile = async () => {
    try {
      const user = getCurrentUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      const profile = await getUserProfile(user.uid);
      if (profile) {
        setUserName(profile.name || 'Officer Name');
        setUserEmail(profile.email || '');
        setUserRole(profile.role === 'admin' ? 'Admin Officer' : 'Forensic Investigator');
        setUserPhoto(profile.photoURL || null);
      }
      
      // Check if user is admin
      const adminStatus = await isCurrentUserAdmin();
      setIsAdmin(adminStatus);
      
      // Load pending registrations if admin
      if (adminStatus) {
        await loadPendingRegistrations();
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (request: PendingRegistration) => {
    if (!request.id) return;
    
    Alert.alert(
      'Approve Registration',
      `Approve registration for ${request.name} (${request.email})?\n\n⚠️ Note: You will be temporarily signed out and need to log back in. This is a Firebase limitation when creating new user accounts.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              setProcessingRequest(request.id!);
              
              await approveRegistration(request.id!, userEmail);
              
              Alert.alert(
                '✅ Approved',
                `${request.name}'s registration has been approved. They can now log in after verifying their email.\n\nYou have been signed out (Firebase limitation). Please log back in.`,
                [{ 
                  text: 'OK',
                  onPress: () => {
                    // Navigate to login
                    router.replace('/login');
                  }
                }]
              );
              
            } catch (error: any) {
              console.error('❌ Approval error:', error);
              Alert.alert(
                'Error',
                error.message || 'Failed to approve registration. Please try again.',
                [{ text: 'OK' }]
              );
              setProcessingRequest(null);
            }
          },
        },
      ]
    );
  };

  const handleRejectRequest = async (request: PendingRegistration) => {
    if (!request.id) return;
    
    Alert.prompt(
      'Reject Registration',
      `Provide a reason for rejecting ${request.name}'s registration:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason?: string) => {
            try {
              setProcessingRequest(request.id!);
              await rejectRegistration(
                request.id!, 
                userEmail, 
                reason || 'Registration rejected by administrator'
              );
              
              Alert.alert(
                '❌ Rejected',
                `${request.name}'s registration has been rejected.`,
                [{ text: 'OK' }]
              );
              
              // Reload pending registrations
              await loadPendingRegistrations();
            } catch (error: any) {
              console.error('❌ Rejection error:', error);
              Alert.alert(
                'Error',
                error.message || 'Failed to reject registration. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setProcessingRequest(null);
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
          }
        >
          {/* Profile Header */}
          <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f3460']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.avatarContainer}>
              {userPhoto ? (
                <Image source={{ uri: userPhoto }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Ionicons name="person" size={50} color="#007AFF" />
                </View>
              )}
            </View>
            <Text style={styles.name}>{userName}</Text>
            <Text style={styles.role}>{userRole}</Text>
            {userEmail ? <Text style={styles.email}>{userEmail}</Text> : null}
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#FFD700" />
                <Text style={styles.adminBadgeText}>ADMIN</Text>
              </View>
            )}
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            {/* Admin Panel */}
            {isAdmin && (
              <View style={styles.adminPanel}>
                <View style={styles.adminPanelHeader}>
                  <View style={styles.adminPanelTitleRow}>
                    <Ionicons name="shield-checkmark" size={24} color="#FFD700" />
                    <Text style={styles.adminPanelTitle}>Admin Panel</Text>
                  </View>
                  <TouchableOpacity onPress={loadPendingRegistrations}>
                    <Ionicons name="refresh" size={20} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                </View>

                {adminLoading ? (
                  <View style={styles.adminLoading}>
                    <ActivityIndicator size="small" color="#FFD700" />
                    <Text style={styles.adminLoadingText}>Loading requests...</Text>
                  </View>
                ) : pendingRegistrations.length > 0 ? (
                  <View style={styles.pendingList}>
                    <Text style={styles.pendingCount}>
                      {pendingRegistrations.length} Pending Registration{pendingRegistrations.length !== 1 ? 's' : ''}
                    </Text>
                    {pendingRegistrations.map((request) => (
                      <View key={request.id} style={styles.requestCard}>
                        <View style={styles.requestHeader}>
                          <View style={styles.requestAvatar}>
                            {request.photoURL ? (
                              <Image source={{ uri: request.photoURL }} style={styles.requestAvatarImage} />
                            ) : (
                              <Ionicons name="person" size={24} color="#007AFF" />
                            )}
                          </View>
                          <View style={styles.requestInfo}>
                            <Text style={styles.requestName}>{request.name}</Text>
                            <Text style={styles.requestEmail}>{request.email}</Text>
                            <View style={styles.requestMeta}>
                              <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.5)" />
                              <Text style={styles.requestTime}>{formatDate(request.createdAt)}</Text>
                              {request.emailVerified && (
                                <>
                                  <Ionicons name="checkmark-circle" size={12} color="#34C759" style={{ marginLeft: 8 }} />
                                  <Text style={styles.requestVerified}>Verified</Text>
                                </>
                              )}
                            </View>
                          </View>
                        </View>
                        
                        <View style={styles.requestActions}>
                          <TouchableOpacity
                            style={[
                              styles.approveButton,
                              processingRequest === request.id && styles.buttonDisabled
                            ]}
                            onPress={() => handleApproveRequest(request)}
                            disabled={processingRequest === request.id}
                          >
                            {processingRequest === request.id ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <>
                                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                <Text style={styles.approveButtonText}>Approve</Text>
                              </>
                            )}
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[
                              styles.rejectButton,
                              processingRequest === request.id && styles.buttonDisabled
                            ]}
                            onPress={() => handleRejectRequest(request)}
                            disabled={processingRequest === request.id}
                          >
                            <Ionicons name="close-circle" size={18} color="#FF3B30" />
                            <Text style={styles.rejectButtonText}>Reject</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.adminEmpty}>
                    <Ionicons name="checkmark-done-circle-outline" size={48} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.adminEmptyText}>No pending registrations</Text>
                    <Text style={styles.adminEmptySubtext}>All requests have been processed</Text>
                  </View>
                )}
              </View>
            )}
            {/* Weather Widget */}
            <View style={styles.weatherContainer}>
              <View style={styles.weatherHeader}>
                <View style={styles.weatherTitleRow}>
                  <Ionicons name="cloud-outline" size={20} color="#007AFF" />
                  <Text style={styles.weatherTitle}>Weather Forecast</Text>
                </View>
                {location && (
                  <Text style={styles.locationText}>
                    📍 {location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°
                  </Text>
                )}
              </View>

              {weatherLoading ? (
                <View style={styles.weatherLoading}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.weatherLoadingText}>Loading weather...</Text>
                </View>
              ) : weatherError ? (
                <View style={styles.weatherError}>
                  <Ionicons name="alert-circle" size={24} color="#FF3B30" />
                  <Text style={styles.weatherErrorText}>{weatherError}</Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={fetchWeatherData}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : weatherData.length > 0 ? (
                <View style={styles.weatherCards}>
                  {weatherData.map((weather, index) => (
                    <View key={index} style={styles.weatherCard}>
                      <Text style={styles.weatherTime}>{getTimeLabel(index)}</Text>
                      <Ionicons 
                        name={getWeatherIcon(weather.rain, weather.temperature) as any}
                        size={32} 
                        color="#007AFF" 
                      />
                      <Text style={styles.weatherTemp}>{weather.temperature}°C</Text>
                      <View style={styles.weatherDetails}>
                        <View style={styles.weatherDetailItem}>
                          <Ionicons name="water-outline" size={14} color="rgba(255,255,255,0.7)" />
                          <Text style={styles.weatherDetailText}>{weather.humidity}%</Text>
                        </View>
                        {weather.rain > 0 && (
                          <View style={styles.weatherDetailItem}>
                            <Ionicons name="rainy-outline" size={14} color="rgba(255,255,255,0.7)" />
                            <Text style={styles.weatherDetailText}>{weather.rain.toFixed(1)}mm</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.weatherEmpty}>
                  <Ionicons name="cloud-offline-outline" size={32} color="rgba(255,255,255,0.5)" />
                  <Text style={styles.weatherEmptyText}>Weather data unavailable</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Settings</Text>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  try {
                    router.push('/edit-profile');
                  } catch (error) {
                    console.error('Navigation error:', error);
                  }
                }}
              >
                <View style={styles.menuIcon}>
                  <Ionicons name="person-outline" size={22} color="#007AFF" />
                </View>
                <Text style={styles.menuText}>Edit Profile</Text>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <View style={styles.menuIcon}>
                  <Ionicons name="shield-checkmark-outline" size={22} color="#007AFF" />
                </View>
                <Text style={styles.menuText}>Security</Text>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>App Settings</Text>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  try {
                    router.push('/help-support');
                  } catch (error) {
                    console.error('Navigation error:', error);
                  }
                }}
              >
                <View style={styles.menuIcon}>
                  <Ionicons name="help-circle-outline" size={22} color="#007AFF" />
                </View>
                <Text style={styles.menuText}>Help & Support</Text>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  try {
                    router.push('/about');
                  } catch (error) {
                    console.error('Navigation error:', error);
                  }
                }}
              >
                <View style={styles.menuIcon}>
                  <Ionicons name="information-circle-outline" size={22} color="#007AFF" />
                </View>
                <Text style={styles.menuText}>About</Text>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <Text style={styles.version}>Version 1.0.0</Text>
          </View>
        </ScrollView>
      )}
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
  },
  weatherContainer: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
  },
  weatherHeader: {
    marginBottom: 16,
  },
  weatherTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  weatherTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  locationText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 28,
  },
  weatherLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  weatherLoadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  weatherError: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  weatherErrorText: {
    fontSize: 13,
    color: '#FF3B30',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  weatherCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  weatherCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  weatherTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  weatherTemp: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 8,
  },
  weatherDetails: {
    width: '100%',
    gap: 4,
  },
  weatherDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  weatherDetailText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  weatherEmpty: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  weatherEmptyText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginTop: 20,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginVertical: 24,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 1,
  },
  adminPanel: {
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  adminPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  adminPanelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminPanelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
  },
  adminLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 12,
  },
  adminLoadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  adminEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  adminEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 12,
  },
  adminEmptySubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  pendingList: {
    gap: 12,
  },
  pendingCount: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  requestCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  requestHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  requestAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  requestAvatarImage: {
    width: '100%',
    height: '100%',
  },
  requestInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  requestEmail: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  requestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requestTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  requestVerified: {
    fontSize: 11,
    color: '#34C759',
    fontWeight: '500',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
