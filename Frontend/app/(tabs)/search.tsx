import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import * as Location from 'expo-location';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { usePermissions } from '../../hooks/use-permissions';
import { compressImageWithExif, scanFaceImage, ScanResult } from '../../utils/api';
import { router } from 'expo-router';
import { getCurrentUser, saveScanReport } from '../../utils/firebase-service';
import { Typography } from '@/constants/theme';

const { height } = Dimensions.get('window');
const CAMERA_HEIGHT = height * 0.45; // Slightly less than half screen

export default function SearchScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [imageCount, setImageCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [responseStatus, setResponseStatus] = useState<'idle' | 'success' | 'error' | 'server_error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const cameraRef = useRef<CameraView>(null);
  const scanIntervalRef = useRef<any>(null);
  const { permissions, requestPermissions } = usePermissions();

  useEffect(() => {
    // Preload location in background
    if (permissions.location) {
      getCurrentLocation();
    }
  }, [permissions.location]);

  useEffect(() => {
    // Initialize camera after permissions are granted
    if (permissions.camera && permissions.location && !cameraReady) {
      // Small delay to ensure smooth transition
      setTimeout(() => setCameraReady(true), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissions.camera, permissions.location]);

  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  // Auto-stop camera when tab loses focus
  useFocusEffect(
    React.useCallback(() => {
      // When tab gains focus, do nothing (camera will work normally)
      return () => {
        // When tab loses focus, stop scanning
        if (isScanning) {
          handleStopScanning();
        }
      };
    }, [isScanning])
  );

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, // Use balanced for faster response
        });
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleStartScanning = async () => {
    // Prevent multiple clicks
    if (isScanning || scanIntervalRef.current) {
      return;
    }

    if (!permissions.camera || !permissions.location) {
      const result = await requestPermissions();
      if (!result.camera || !result.location) {
        Alert.alert(
          'Permissions Required',
          'Camera and location permissions are required for face scanning.'
        );
        return;
      }
    }

    // Get location async without blocking UI
    if (!currentLocation) {
      getCurrentLocation();
    }
    
    setIsScanning(true);
    setImageCount(0);
    setIsProcessing(false);

    // Start capturing images every 1.5 seconds
    scanIntervalRef.current = setInterval(() => {
      captureAndScanImage();
    }, 1500);
  };

  const handleStopScanning = () => {
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const captureAndScanImage = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      setLoading(true);
      setResponseStatus('idle');
      setStatusMessage('Capturing image...');
      
      // Take picture
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });

      if (!photo) {
        setStatusMessage('Failed to capture image');
        setResponseStatus('error');
        return;
      }

      setImageCount((prev) => prev + 1);
      setStatusMessage('Processing image...');

      // Compress image with EXIF
      const compressedImage = await compressImageWithExif(photo.uri, currentLocation);
      setStatusMessage('Sending to server...');

      // Send to backend with comprehensive error handling
      try {
        const results = await scanFaceImage(compressedImage);

        if (results && results.length > 0) {
          setResponseStatus('success');
          setStatusMessage(`✓ Found ${results.length} match(es)`);
          console.log('📊 Scan Results:', results.length, 'matches found');
          console.log('📋 First result:', results[0]?.name, '- Accuracy:', results[0]?.accuracy);

          // Update results and save to Firebase
          setScanResults((prev) => {
            const newResults = [...prev];
            let addedCount = 0;
            results.forEach((result) => {
              if (!newResults.find((r) => r.id === result.id)) {
                newResults.unshift(result);
                addedCount++;
                
                // Save to Firebase in background
                const currentUser = getCurrentUser();
                if (currentUser) {
                  console.log('💾 Attempting to save report for:', result.name);
                  saveScanReport(currentUser.uid, result)
                    .then((reportId) => {
                      if (reportId) {
                        console.log('✅ Report saved with ID:', reportId);
                      } else {
                        console.log('⚠️ Report skipped (duplicate):', result.name);
                      }
                    })
                    .catch((error) => {
                      console.error('❌ Error saving report to Firebase:', error);
                    });
                } else {
                  console.log('⚠️ No user logged in, cannot save report');
                }
              }
            });
            
            const finalResults = newResults.slice(0, 20);
            console.log(`✅ Updated scan results: ${addedCount} new, ${finalResults.length} total`);
            return finalResults; // Keep only latest 20 results
          });
        } else {
          // Empty results (400 error was handled in API)
          setResponseStatus('server_error');
          setStatusMessage('⚠ Server processing (continuing scan)');
          console.log('📊 Server returned empty results, continuing scan...');
        }
      } catch (apiError: any) {
        // Handle different error types
        
        if (apiError.message?.includes('400')) {
          // Server validation error - not critical, continue scanning
          setResponseStatus('server_error');
          setStatusMessage('⚠ Server issue (continuing)');
          console.warn('⚠️ 400 Error - Server validation issue, continuing scan...');
        } else if (apiError.message?.includes('Network')) {
          // Network error
          setResponseStatus('error');
          setStatusMessage('✗ Network error');
          console.error('❌ Network Error:', apiError.message);
        } else {
          // Other API errors
          setResponseStatus('error');
          setStatusMessage('✗ API error');
          console.error('❌ API Error:', apiError.message || apiError);
        }
      }
    } catch (error: any) {
      console.error('❌ Error capturing/scanning image:', error);
      setResponseStatus('error');
      setStatusMessage(`✗ ${error.message || 'Capture failed'}`);
    } finally {
      // Keep status visible for 2 seconds
      setTimeout(() => {
        setLoading(false);
        setIsProcessing(false);
      }, 1000);
    }
  };

  const captureSinglePhoto = async () => {
    if (!cameraRef.current || isProcessing || loading) {
      return;
    }

    if (!permissions.camera || !permissions.location) {
      const result = await requestPermissions();
      if (!result.camera || !result.location) {
        Alert.alert(
          'Permissions Required',
          'Camera and location permissions are required for face scanning.'
        );
        return;
      }
    }

    try {
      setLoading(true);
      setIsProcessing(true);
      setResponseStatus('idle');
      setStatusMessage('📸 Capturing single photo...');

      // Get location if not already available
      if (!currentLocation) {
        await getCurrentLocation();
      }

      // Take picture
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });

      if (!photo) {
        setStatusMessage('Failed to capture photo');
        setResponseStatus('error');
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
        return;
      }

      setStatusMessage('🔄 Processing image...');

      // Compress image with EXIF
      const compressedImage = await compressImageWithExif(photo.uri, currentLocation);
      setStatusMessage('📤 Sending to server...');

      // Send to backend
      try {
        const results = await scanFaceImage(compressedImage);

        if (results && results.length > 0) {
          setResponseStatus('success');
          setStatusMessage(`✅ Found ${results.length} match(es)!`);
          
          // Update results and save to Firebase
          setScanResults((prev) => {
            const newResults = [...prev];
            results.forEach((result) => {
              if (!newResults.find((r) => r.id === result.id)) {
                newResults.unshift(result);
                
                // Save to Firebase
                const currentUser = getCurrentUser();
                if (currentUser) {
                  saveScanReport(currentUser.uid, result)
                    .then((reportId) => {
                      if (reportId) {
                        console.log('✅ Report saved with ID:', reportId);
                      }
                    })
                    .catch((error) => {
                      console.error('❌ Error saving report:', error);
                    });
                }
              }
            });
            
            return newResults.slice(0, 20);
          });

          Alert.alert(
            '✅ Scan Complete',
            `Found ${results.length} matching profile${results.length > 1 ? 's' : ''}!\\n\\nResults are displayed below.`,
            [{ text: 'OK' }]
          );
        } else {
          setResponseStatus('server_error');
          setStatusMessage('⚠️ No matches found');
          Alert.alert(
            'No Matches',
            'No matching profiles were found in the database.',
            [{ text: 'OK' }]
          );
        }
      } catch (apiError: any) {
        setResponseStatus('error');
        const errorMsg = apiError.message?.includes('Network') 
          ? 'Network error. Please check your connection.' 
          : 'Server error. Please try again.';
        setStatusMessage(`❌ ${errorMsg}`);
        Alert.alert('Scan Failed', errorMsg, [{ text: 'OK' }]);
      }
    } catch (error: any) {
      console.error('❌ Error in single photo capture:', error);
      setResponseStatus('error');
      setStatusMessage(`❌ ${error.message || 'Capture failed'}`);
      Alert.alert(
        'Error',
        error.message || 'Failed to capture and process photo. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return '#34C759';
    if (accuracy >= 70) return '#FF9500';
    return '#FF3B30';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (!permissions.camera || !permissions.location) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
        <View style={styles.permissionContainer}>
          <Animated.View entering={FadeIn.duration(600)} style={styles.permissionCard}>
            <View style={styles.permissionIcon}>
              <Ionicons name="lock-closed" size={48} color="#007AFF" />
            </View>
            <Text style={styles.permissionTitle}>Permissions Required</Text>
            <Text style={styles.permissionText}>
              This feature requires camera and location access to scan and identify faces.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
              <LinearGradient
                colors={['#007AFF', '#5856D6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.permissionButtonGradient}
              >
                <Text style={styles.permissionButtonText}>Grant Permissions</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
          <Text style={styles.title}>Face Recognition</Text>
          <Text style={styles.subtitle}>Scan and identify faces in real-time</Text>
        </Animated.View>

        {/* Camera Section */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          style={styles.cameraContainer}
        >
          <View style={styles.cameraWrapper}>
            {cameraReady ? (
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="back"
              />
            ) : (
              <View style={[styles.camera, styles.cameraLoading]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.cameraLoadingText}>Initializing camera...</Text>
              </View>
            )}
            
            {/* Scanning Overlay */}
            {isScanning && (
              <View style={styles.scanningOverlay}>
                <View style={styles.scanLine} />
                <Text style={styles.scanningText}>Scanning...</Text>
              </View>
            )}

            {/* Camera Controls */}
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={[styles.controlButton, isScanning && styles.controlButtonActive]}
                onPress={isScanning ? handleStopScanning : handleStartScanning}
              >
                <Ionicons
                  name={isScanning ? 'stop-circle' : 'play-circle'}
                  size={28}
                  color="#FFFFFF"
                />
                <Text style={styles.controlButtonText}>
                  {isScanning ? 'Stop' : 'Start'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.controlButton, styles.singlePhotoButton]} 
                onPress={captureSinglePhoto}
                disabled={isScanning || loading || isProcessing}
              >
                <Ionicons
                  name="camera"
                  size={24}
                  color="#FFFFFF"
                />
                <Text style={styles.controlButtonText}>
                  Single
                </Text>
              </TouchableOpacity>
            </View>

            {/* Status Info */}
            <View style={styles.statusBar}>
              <View style={styles.statusItem}>
                <Ionicons name="camera" size={16} color="#FFFFFF" />
                <Text style={styles.statusText}>Images: {imageCount}</Text>
              </View>
              {loading && (
                <View style={styles.statusItem}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.statusText}>{statusMessage || 'Processing...'}</Text>
                </View>
              )}
              {!loading && responseStatus !== 'idle' && (
                <View style={[
                  styles.statusItem,
                  responseStatus === 'success' && styles.statusSuccess,
                  responseStatus === 'error' && styles.statusError,
                  responseStatus === 'server_error' && styles.statusWarning,
                ]}>
                  <Ionicons 
                    name={
                      responseStatus === 'success' ? 'checkmark-circle' :
                      responseStatus === 'server_error' ? 'alert-circle' : 'close-circle'
                    } 
                    size={16} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.statusText}>{statusMessage}</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Results Section */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(600)}
          style={styles.resultsSection}
        >
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              Scan Results ({scanResults.length})
            </Text>
            {scanResults.length > 0 && (
              <TouchableOpacity onPress={() => setScanResults([])}>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {scanResults.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyText}>No results yet</Text>
              <Text style={styles.emptySubtext}>
                {isScanning 
                  ? 'Scanning in progress...' 
                  : 'Start scanning to identify faces'}
              </Text>
            </View>
          ) : (
            <View style={styles.resultsList}>
              {scanResults.map((result, index) => (
                <Animated.View
                  key={result.id}
                  entering={FadeInDown.delay(index * 100).duration(400)}
                  style={styles.resultCard}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      router.push({
                        pathname: '/profile-details' as any,
                        params: {
                          data: JSON.stringify(result.fullData),
                          profileImage: result.profileImage,
                          accuracy: result.accuracy,
                        },
                      });
                    }}
                  >
                    <LinearGradient
                      colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
                      style={styles.resultCardGradient}
                    >
                    <View style={styles.resultHeader}>
                      <Image
                        source={{ uri: result.profileImage }}
                        style={styles.profileImage}
                      />
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultName}>{result.name}</Text>
                        <View style={styles.accuracyContainer}>
                          <View
                            style={[
                              styles.accuracyBadge,
                              { backgroundColor: getAccuracyColor(result.accuracy) },
                            ]}
                          >
                            <Text style={styles.accuracyText}>
                              {result.accuracy.toFixed(1)}% Match
                            </Text>
                          </View>
                        </View>
                      </View>
                      <TouchableOpacity style={styles.moreButton}>
                        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.resultDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="location" size={16} color="#007AFF" />
                        <Text style={styles.detailText}>{result.location.address}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="time" size={16} color="#007AFF" />
                        <Text style={styles.detailText}>
                          {formatTimestamp(result.timestamp)}
                        </Text>
                      </View>
                      {result.additionalInfo.age && (
                        <View style={styles.detailRow}>
                          <Ionicons name="person" size={16} color="#007AFF" />
                          <Text style={styles.detailText}>
                            Age: {result.additionalInfo.age} • {result.additionalInfo.gender}
                          </Text>
                        </View>
                      )}
                      {result.additionalInfo.lastSeen && (
                        <View style={styles.detailRow}>
                          <Ionicons name="eye" size={16} color="#007AFF" />
                          <Text style={styles.detailText}>
                            Last seen: {result.additionalInfo.lastSeen}
                          </Text>
                        </View>
                      )}
                      {result.additionalInfo.matchCount && (
                        <View style={styles.detailRow}>
                          <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
                          <Text style={styles.detailText}>
                            {result.additionalInfo.matchCount} previous matches
                          </Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: Typography.large,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Typography.medium,
    color: 'rgba(255,255,255,0.6)',
  },
  cameraContainer: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  cameraWrapper: {
    height: CAMERA_HEIGHT,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraLoading: {
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraLoadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: Typography.small,
    marginTop: 12,
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scanLine: {
    width: '80%',
    height: 2,
    backgroundColor: '#007AFF',
    marginBottom: 12,
  },
  scanningText: {
    color: '#FFFFFF',
    fontSize: Typography.medium,
    fontWeight: '600',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  controlButtonActive: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  singlePhotoButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.8)',
    borderColor: '#007AFF',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.small,
    fontWeight: '600',
  },
  statusBar: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: Typography.small,
    fontWeight: '500',
  },
  statusSuccess: {
    backgroundColor: 'rgba(52, 199, 89, 0.8)',
  },
  statusError: {
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
  },
  statusWarning: {
    backgroundColor: 'rgba(255, 149, 0, 0.8)',
  },
  resultsSection: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: Typography.large,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  clearText: {
    color: '#FF3B30',
    fontSize: Typography.small,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: Typography.medium,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: Typography.small,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 8,
  },
  resultsList: {
    gap: 12,
  },
  resultCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  resultCardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: Typography.medium,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  accuracyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accuracyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  accuracyText: {
    color: '#FFFFFF',
    fontSize: Typography.small,
    fontWeight: '600',
  },
  moreButton: {
    padding: 8,
  },
  resultDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: Typography.small,
    color: 'rgba(255,255,255,0.7)',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    maxWidth: 400,
  },
  permissionIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0,122,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: Typography.large,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: Typography.medium,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  permissionButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.medium,
    fontWeight: '600',
  },
});
