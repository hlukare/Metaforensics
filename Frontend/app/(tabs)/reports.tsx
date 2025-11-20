import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Platform,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getCurrentUser, getUserReports, deleteReport } from '../../utils/firebase-service';
import { ScanResult } from '../../utils/api';
import { Typography } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface Report extends ScanResult {
  reportId: string;
  scannedAt: number;
}

export default function ReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      console.log('📱 Starting report load...');
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.log('⚠️ No user logged in');
        setLoading(false);
        return;
      }

      console.log('📱 Loading reports for user:', currentUser.uid);
      const fetchedReports = await getUserReports(currentUser.uid);
      console.log('📊 Fetched reports count:', fetchedReports.length);
      
      if (fetchedReports.length > 0) {
        console.log('📋 First report sample:', {
          name: fetchedReports[0]?.name,
          accuracy: fetchedReports[0]?.accuracy,
          hasLocation: !!fetchedReports[0]?.location,
          scannedAt: fetchedReports[0]?.scannedAt,
        });
      }
      
      setReports(fetchedReports);
      console.log('✅ Reports loaded successfully');
    } catch (error: any) {
      console.error('❌ Error loading reports:', error);
      console.error('   Error details:', error?.message || 'Unknown error');
      console.error('   Stack:', error?.stack);
      // Set empty array on error to prevent crash
      setReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const getFilteredReports = () => {
    try {
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;

      switch (selectedFilter) {
        case 'today':
          return reports.filter((r) => r?.scannedAt && (now - r.scannedAt < dayMs));
        case 'week':
          return reports.filter((r) => r?.scannedAt && (now - r.scannedAt < 7 * dayMs));
        case 'month':
          return reports.filter((r) => r?.scannedAt && (now - r.scannedAt < 30 * dayMs));
        default:
          return reports;
      }
    } catch (error) {
      console.error('Error filtering reports:', error);
      return reports;
    }
  };

  const formatDate = (timestamp: number) => {
    try {
      if (!timestamp || isNaN(timestamp)) {
        return 'Unknown date';
      }
      
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} mins ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };

  const handleDeleteReport = (reportId: string, reportName: string) => {
    try {
      Alert.alert(
        'Delete Report',
        `Are you sure you want to delete the report for "${reportName}"? This action cannot be undone.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                setDeletingReportId(reportId);
                const currentUser = getCurrentUser();
                
                if (!currentUser) {
                  Alert.alert('Error', 'You must be logged in to delete reports');
                  setDeletingReportId(null);
                  return;
                }

                console.log('🗑️ Deleting report:', reportId);
                await deleteReport(currentUser.uid, reportId);
                
                // Remove from local state
                setReports(prevReports => prevReports.filter(r => r.reportId !== reportId));
                
                console.log('✅ Report deleted successfully');
                Alert.alert('Success', 'Report deleted successfully');
              } catch (error: any) {
                console.error('❌ Error deleting report:', error);
                Alert.alert(
                  'Delete Failed',
                  error.message || 'Failed to delete report. Please try again.'
                );
              } finally {
                setDeletingReportId(null);
              }
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error showing delete dialog:', error);
    }
  };

  const filteredReports = getFilteredReports();

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
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
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Forensic Reports</Text>
            <Text style={styles.headerSubtitle}>
              {reports.length} {reports.length === 1 ? 'report' : 'reports'} generated
            </Text>
          </View>
          <TouchableOpacity style={styles.exportButton} onPress={() => {}}>
            <Ionicons name="share-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {(['all', 'today', 'week', 'month'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterTab, selectedFilter === filter && styles.filterTabActive]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedFilter === filter && styles.filterTabTextActive,
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
              {selectedFilter === filter && (
                <View style={styles.filterIndicator}>
                  <View style={styles.filterDot} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />}
      >
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Ionicons name="document-text" size={24} color="#007AFF" />
            <Text style={styles.statValue}>{reports.length}</Text>
            <Text style={styles.statLabel}>Total Reports</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
            <Text style={styles.statValue}>{reports.length}</Text>
            <Text style={styles.statLabel}>Verified</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="trending-up" size={24} color="#5856D6" />
            <Text style={styles.statValue}>
              {reports.length > 0
                ? Math.round(
                    reports.reduce((sum, r) => {
                      const acc = parseFloat(r.accuracy?.toString() || '0');
                      return sum + (isNaN(acc) ? 0 : acc);
                    }, 0) / reports.length
                  )
                : 0}
              %
            </Text>
            <Text style={styles.statLabel}>Avg Accuracy</Text>
          </View>
        </View>

        {/* Reports List */}
        {filteredReports.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(600)} style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="document-text-outline" size={60} color="rgba(255,255,255,0.3)" />
            </View>
            <Text style={styles.emptyTitle}>No Reports Found</Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter !== 'all'
                ? `No reports in the selected time period`
                : `Start scanning to generate reports`}
            </Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => router.push('/search' as any)}
            >
              <LinearGradient
                colors={['#007AFF', '#0051D5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.scanButtonGradient}
              >
                <Ionicons name="scan" size={20} color="#FFFFFF" />
                <Text style={styles.scanButtonText}>Start Scanning</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.reportsContainer}>
            {filteredReports.map((report, index) => {
              try {
                // Validate report data
                if (!report || !report.reportId) {
                  console.warn('Invalid report data:', report);
                  return null;
                }
                
                return (
                  <Animated.View
                    key={report.reportId}
                    entering={FadeInDown.delay(index * 100).duration(600)}
                  >
                    <View style={styles.reportCard}>
                      <TouchableOpacity
                        style={styles.reportContent}
                        onPress={() => {
                          try {
                            console.log('🔍 Navigating to profile-details with report:', {
                              name: report.name,
                              reportId: report.reportId,
                              hasFullData: !!report.fullData,
                            });
                            router.push({
                              pathname: '/profile-details',
                              params: { data: JSON.stringify(report) },
                            } as any);
                          } catch (navError) {
                            console.error('❌ Navigation error:', navError);
                          }
                        }}
                        activeOpacity={0.7}
                        disabled={deletingReportId === report.reportId}
                      >
                      <View style={styles.reportHeader}>
                        {report.profileImage ? (
                          <Image 
                            source={{ uri: report.profileImage }} 
                            style={styles.profileImage}
                            onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                          />
                        ) : (
                          <View style={styles.profileImagePlaceholder}>
                            <Ionicons name="person" size={32} color="#007AFF" />
                          </View>
                        )}
                        <View style={styles.reportInfo}>
                          <Text style={styles.reportName}>{report.name || 'Unknown'}</Text>
                          <Text style={styles.reportDate}>{formatDate(report.scannedAt)}</Text>
                          {report.location && (report.location.address || report.location.latitude) && (
                            <View style={styles.locationContainer}>
                              <Ionicons name="location" size={12} color="rgba(255,255,255,0.6)" />
                              <Text style={styles.locationText} numberOfLines={1}>
                                {report.location.address || 
                                 `${(report.location.latitude || 0).toFixed(4)}, ${(report.location.longitude || 0).toFixed(4)}`}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.reportRight}>
                          <View style={styles.accuracyBadge}>
                            <Text style={styles.accuracyText}>
                              {Math.round(Number(report.accuracy) || 0)}%
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
                        </View>
                      </View>

                      {/* Additional Info Preview */}
                      {report.additionalInfo && (report.additionalInfo.age || report.additionalInfo.gender || report.additionalInfo.lastSeen) && (
                        <View style={styles.additionalInfoPreview}>
                          {report.additionalInfo.age && (
                            <View style={styles.infoChip}>
                              <Ionicons name="calendar-outline" size={12} color="#007AFF" />
                              <Text style={styles.infoChipText}>{report.additionalInfo.age} years</Text>
                            </View>
                          )}
                          {report.additionalInfo.gender && (
                            <View style={styles.infoChip}>
                              <Ionicons
                                name={
                                  report.additionalInfo.gender.toLowerCase() === 'male'
                                    ? 'male'
                                    : 'female'
                                }
                                size={12}
                                color="#5856D6"
                              />
                              <Text style={styles.infoChipText}>{report.additionalInfo.gender}</Text>
                            </View>
                          )}
                          {report.additionalInfo.lastSeen && (
                            <View style={styles.infoChip}>
                              <Ionicons name="time-outline" size={12} color="#34C759" />
                              <Text style={styles.infoChipText} numberOfLines={1}>
                                {report.additionalInfo.lastSeen}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                      </TouchableOpacity>
                      
                      {/* Delete Button */}
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteReport(report.reportId, report.name || 'Unknown')}
                        disabled={deletingReportId === report.reportId}
                        activeOpacity={0.7}
                      >
                        {deletingReportId === report.reportId ? (
                          <ActivityIndicator size="small" color="#FF3B30" />
                        ) : (
                          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                );
              } catch (renderError) {
                console.error('Error rendering report:', report?.reportId, renderError);
                return null;
              }
            })}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: Typography.large,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
  },
  filterTabText: {
    fontSize: Typography.small,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterIndicator: {
    position: 'absolute',
    bottom: -6,
  },
  filterDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#007AFF',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: Typography.medium,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    fontSize: Typography.large,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  emptyState: {
    paddingHorizontal: 20,
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyTitle: {
    fontSize: Typography.large,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 32,
  },
  scanButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  scanButtonText: {
    fontSize: Typography.medium,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reportsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  reportCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  reportContent: {
    flex: 1,
    padding: 16,
  },
  deleteButton: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 59, 48, 0.2)',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 122, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  reportInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reportName: {
    fontSize: Typography.medium,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  reportDate: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.6)',
    flex: 1,
  },
  reportRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  accuracyBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  accuracyText: {
    fontSize: Typography.small,
    fontWeight: '700',
    color: '#34C759',
  },
  additionalInfoPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    maxWidth: width * 0.4,
  },
  infoChipText: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
});
