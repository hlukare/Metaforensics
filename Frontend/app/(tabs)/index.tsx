import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BarChart } from 'react-native-gifted-charts';
import * as Location from 'expo-location';
import { getCurrentUser, getUserReports, getUserProfile, signOut, saveScanReport } from '../../utils/firebase-service';
import { Typography } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface NewsArticle {
  title: string;
  source: {
    name: string;
  };
  publishedAt: string;
  url: string;
  urlToImage?: string;
}

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly'>('weekly');
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('Officer');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        await loadDashboardData();
        await fetchNews();
      } catch (err) {
        console.error('Dashboard initialization error:', err);
        setError('Failed to load dashboard');
        setLoading(false);
      }
    };
    initializeDashboard();
  }, []);

  const fetchNews = async () => {
    try {
      setNewsLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=indian%20cybercrime&apiKey=f2ae81bc0cba481294c1cbbe61418409&pageSize=10`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.status === 'ok' && Array.isArray(data.articles) && data.articles.length > 0) {
        setNewsArticles(data.articles);
      } else {
        setNewsArticles([]);
      }
    } catch (error: any) {
      console.error('Error fetching news:', error.message || error);
      setNewsArticles([]);
    } finally {
      setNewsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setError(null);
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        console.log('No user logged in');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Load user profile with error handling
      try {
        const profile = await getUserProfile(currentUser.uid);
        if (profile && profile.name && typeof profile.name === 'string') {
          const firstName = profile.name.split(' ')[0] || 'Officer';
          setUserName(firstName);
        } else {
          setUserName('Officer');
        }
        // Load user photo
        if (profile && profile.photoURL) {
          setUserPhoto(profile.photoURL);
        }
      } catch (profileError) {
        console.error('Error loading user profile:', profileError);
        setUserName('Officer');
      }

      // Load reports with error handling
      try {
        const fetchedReports = await getUserReports(currentUser.uid);
        if (Array.isArray(fetchedReports)) {
          const sortedReports = fetchedReports
            .filter(r => r && r.scannedAt)
            .sort((a, b) => (b.scannedAt || 0) - (a.scannedAt || 0));
          setReports(sortedReports);
        } else {
          setReports([]);
        }
      } catch (reportsError) {
        console.error('Error loading reports:', reportsError);
        setReports([]);
      }
    } catch (error: any) {
      console.error('Error loading dashboard data:', error.message || error);
      setError('Failed to load dashboard data');
      setReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([loadDashboardData(), fetchNews()]);
    } catch (error) {
      console.error('Error refreshing:', error);
      setRefreshing(false);
    }
  };

  // Generate dynamic chart data from reports
  const generateChartData = () => {
    try {
      if (!Array.isArray(reports) || reports.length === 0) {
      // Default empty data
      return selectedPeriod === 'weekly'
        ? [
            { value: 0, label: 'Mon', frontColor: '#007AFF', gradientColor: '#4DA6FF' },
            { value: 0, label: 'Tue', frontColor: '#007AFF', gradientColor: '#4DA6FF' },
            { value: 0, label: 'Wed', frontColor: '#007AFF', gradientColor: '#4DA6FF' },
            { value: 0, label: 'Thu', frontColor: '#007AFF', gradientColor: '#4DA6FF' },
            { value: 0, label: 'Fri', frontColor: '#007AFF', gradientColor: '#4DA6FF' },
            { value: 0, label: 'Sat', frontColor: '#007AFF', gradientColor: '#4DA6FF' },
            { value: 0, label: 'Sun', frontColor: '#007AFF', gradientColor: '#4DA6FF' },
          ]
        : [
            { value: 0, label: '00:00', frontColor: '#007AFF', gradientColor: '#4DA6FF' },
            { value: 0, label: '04:00', frontColor: '#007AFF', gradientColor: '#4DA6FF' },
            { value: 0, label: '08:00', frontColor: '#007AFF', gradientColor: '#4DA6FF' },
            { value: 0, label: '12:00', frontColor: '#007AFF', gradientColor: '#4DA6FF' },
            { value: 0, label: '16:00', frontColor: '#007AFF', gradientColor: '#4DA6FF' },
            { value: 0, label: '20:00', frontColor: '#007AFF', gradientColor: '#4DA6FF' },
            { value: 0, label: '23:59', frontColor: '#007AFF', gradientColor: '#4DA6FF' },
          ];
    }

      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;

      if (selectedPeriod === 'weekly') {
      // Count reports per day of week (last 7 days)
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const counts = new Array(7).fill(0);

      reports.forEach((report) => {
        const diff = now - report.scannedAt;
        if (diff < 7 * dayMs) {
          const dayIndex = new Date(report.scannedAt).getDay();
          counts[dayIndex]++;
        }
      });

      // Rotate array to start from Monday
      const rotated = [...counts.slice(1), counts[0]];
      const labels = [...days.slice(1), days[0]];

      return rotated.map((value, i) => ({
        value,
        label: labels[i],
        frontColor: '#007AFF',
        gradientColor: '#4DA6FF',
        spacing: 4,
      }));
    } else {
      // Count reports per 4-hour period today
      const labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'];
      const counts = new Array(7).fill(0);
      const todayStart = new Date().setHours(0, 0, 0, 0);

      reports.forEach((report) => {
        if (report.scannedAt >= todayStart) {
          const hour = new Date(report.scannedAt).getHours();
          const index = Math.min(Math.floor(hour / 4), 6);
          counts[index]++;
        }
      });

      return counts.map((value, i) => ({
        value,
        label: labels[i],
        frontColor: '#007AFF',
        gradientColor: '#4DA6FF',
        spacing: 4,
      }));
    }
    } catch (error) {
      console.error('Error generating chart data:', error);
      return [
        { value: 0, label: 'Mon', frontColor: '#007AFF', gradientColor: '#4DA6FF' },
        { value: 0, label: 'Tue', frontColor: '#007AFF', gradientColor: '#4DA6FF' },
        { value: 0, label: 'Wed', frontColor: '#007AFF', gradientColor: '#4DA6FF' },
        { value: 0, label: 'Thu', frontColor: '#007AFF', gradientColor: '#4DA6FF' },
        { value: 0, label: 'Fri', frontColor: '#007AFF', gradientColor: '#4DA6FF' },
        { value: 0, label: 'Sat', frontColor: '#007AFF', gradientColor: '#4DA6FF' },
        { value: 0, label: 'Sun', frontColor: '#007AFF', gradientColor: '#4DA6FF' },
      ];
    }
  };

  const chartData = generateChartData();
  const maxChartValue = Math.max(...chartData.map((d) => d?.value || 0), 10);

  // Calculate quick stats from real data with safety checks
  const totalScans = Array.isArray(reports) ? reports.length : 0;
  const matchesFound = totalScans; // All saved reports are matches
  const avgAccuracy = totalScans > 0
    ? Math.round(reports.reduce((sum, r) => {
        try {
          return sum + (parseFloat(r?.accuracy?.toString() || '0') || 0);
        } catch {
          return sum;
        }
      }, 0) / totalScans)
    : 0;
  
  // Count scans in last 7 days with safety
  const last7Days = Array.isArray(reports) 
    ? reports.filter(r => r && r.scannedAt && (Date.now() - r.scannedAt < 7 * 24 * 60 * 60 * 1000)).length 
    : 0;

  const quickStats = [
    { id: 1, title: 'Total Scans', value: totalScans.toString(), icon: 'scan', color: '#007AFF' },
    { id: 2, title: 'Matches Found', value: matchesFound.toString(), icon: 'checkmark-circle', color: '#34C759' },
    { id: 3, title: 'This Week', value: last7Days.toString(), icon: 'calendar', color: '#FF9500' },
    { id: 4, title: 'Avg Accuracy', value: `${avgAccuracy}%`, icon: 'trending-up', color: '#5856D6' },
  ];

  // Recent activity from real reports (last 5) with safety
  const recentActivity = (Array.isArray(reports) ? reports : [])
    .filter(r => r && r.name && r.scannedAt)
    .slice(0, 5)
    .map((report) => {
    const date = new Date(report.scannedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let timeStr;
    if (diffMins < 60) timeStr = `${diffMins} mins ago`;
    else if (diffHours < 24) timeStr = `${diffHours} hours ago`;
    else if (diffDays < 7) timeStr = `${diffDays} days ago`;
    else timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return {
      id: report.reportId,
      name: report.name,
      time: timeStr,
      status: 'match',
      confidence: `${report.accuracy}%`,
    };
  });

  // Format news articles
  const getTimeAgo = (publishedAt: string) => {
    const now = new Date();
    const published = new Date(publishedAt);
    const diffMs = now.getTime() - published.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return published.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const newsItems = newsArticles.map((article, index) => ({
    id: index + 1,
    title: article.title,
    source: article.source.name,
    time: getTimeAgo(article.publishedAt),
    url: article.url,
  }));

  const handleLogout = async () => {
    try {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              try {
                await signOut();
                setTimeout(() => {
                  router.replace('/login' as any);
                }, 100);
              } catch (error: any) {
                console.error('Logout error:', error.message || error);
                Alert.alert('Error', 'Failed to logout. Please try again.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Alert error:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Search Required', 'Please enter a name to search');
      return;
    }

    try {
      setSearching(true);
      console.log('🔍 Starting search for:', searchQuery);

      // Get live location from device
      let location = ''; // Empty default
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          console.log('📍 Getting live location...');
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          
          // Reverse geocode to get city/location name
          const geocode = await Location.reverseGeocodeAsync({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          
          if (geocode && geocode.length > 0) {
            location = geocode[0].city || geocode[0].region || geocode[0].district || '';
            console.log('✅ Live location:', location);
          }
        } else {
          console.log('⚠️ Location permission denied, using empty');
        }
      } catch (locationError) {
        console.log('⚠️ Location error, using empty:', locationError);
      }

      const searchUrl = `http://13.51.172.220:3000/api/search?name=${encodeURIComponent(searchQuery.trim())}&location=${encodeURIComponent(location)}`;
      
      console.log('📡 API URL:', searchUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          // 'Accept': 'application/json',
          'x-api-key': '92ae2ffd0bd050a21d59be1766cdf7411666b36850fa1bc5057fa314f1471dc3',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('📥 Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Search data received:', data);

      // Navigate to profile-details with the search result and save to Firebase
      if (data && typeof data === 'object') {
        console.log('📊 Navigating to profile-details with search result');
        
        // Save report to Firebase
        try {
          const currentUser = getCurrentUser();
          if (currentUser) {
            console.log('💾 Saving search result to Firebase...');
            
            // Extract name from search result
            const personName = data.personal_info?.name || data.name || searchQuery;
            
            // Calculate accuracy
            const summary = data.summary || {};
            let accuracy = 50;
            if (summary.identity_verified) accuracy += 30;
            if (summary.digital_presence) accuracy += 20;
            
            // Get profile image
            const profileImage = data.profileImage || 
              `https://ui-avatars.com/api/?name=${encodeURIComponent(personName)}&size=300&background=007AFF&color=fff`;
            
            const reportData = {
              name: personName,
              accuracy: accuracy.toString(),
              profileImage: profileImage,
              location: {
                address: data.personal_info?.location || location,
                latitude: 0,
                longitude: 0,
              },
              additionalInfo: {
                age: data.personal_info?.age,
                gender: data.personal_info?.gender,
                lastSeen: new Date().toLocaleString(),
              },
              fullData: data,
            };
            
            await saveScanReport(currentUser.uid, reportData);
            console.log('✅ Search result saved to Firebase');
            
            // Refresh reports list
            await loadDashboardData();
          }
        } catch (saveError) {
          console.error('⚠️ Error saving to Firebase:', saveError);
          // Continue to show results even if save fails
        }
        
        router.push({
          pathname: '/profile-details',
          params: { data: JSON.stringify(data) },
        } as any);
      } else {
        Alert.alert(
          'No Results',
          `No information found for "${searchQuery}". Please try a different name.`
        );
      }
    } catch (error: any) {
      console.error('❌ Search error:', error);
      
      if (error.name === 'AbortError') {
        Alert.alert(
          'Request Timeout',
          'The search request took too long. Please check your internet connection and try again.'
        );
      } else if (error.message?.includes('Network request failed')) {
        Alert.alert(
          'Network Error',
          'Unable to connect to the server. Please check your internet connection.'
        );
      } else {
        Alert.alert(
          'Search Failed',
          error.message || 'An error occurred while searching. Please try again.'
        );
      }
    } finally {
      setSearching(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.profileSection}>
            <TouchableOpacity
              onPress={() => router.push('/profile' as any)}
              activeOpacity={0.8}
              style={{ marginRight: 8 }}
            >
              {userPhoto ? (
                <Image source={{ uri: userPhoto }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Ionicons name="person" size={20} color="#007AFF" />
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.chatButton}
              onPress={() => router.push('/chat' as any)}
            >
              <Ionicons name="chatbubbles-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => router.push('/notifications' as any)}
            >
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
              {reports.length > 0 && <View style={styles.notificationBadge} />}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(800)}
          style={styles.searchContainer}
        >
          <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search person by name..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            editable={!searching}
          />
          {searching ? (
            <ActivityIndicator size="small" color="#007AFF" style={{ marginRight: 8 }} />
          ) : searchQuery.length > 0 ? (
            <View style={styles.searchActions}>
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ marginRight: 8 }}>
                <Ionicons name="close-circle" size={20} color="#8E8E93" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSearch}
                style={styles.searchButton}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : null}
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Main Action Buttons */}
            <Animated.View
              entering={FadeInUp.delay(300).duration(800)}
              style={styles.actionButtons}
            >
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/search' as any)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#007AFF', '#0051D5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionGradient}
                >
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="scan" size={26} color="#FFFFFF" />
                  </View>
                  <Text style={styles.actionTitle}>Search Person</Text>
                  <Text style={styles.actionSubtitle}>Scan face & identify</Text>
                  <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.9)" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/reports' as any)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#5856D6', '#3634A3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionGradient}
                >
                  <View style={styles.actionIconContainer}>
                    <Ionicons name="document-text" size={26} color="#FFFFFF" />
                  </View>
                  <Text style={styles.actionTitle}>View Reports</Text>
                  <Text style={styles.actionSubtitle}>{reports.length} reports</Text>
                  <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.9)" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Quick Stats */}
            <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Stats</Text>
              <View style={styles.statsGrid}>
                {quickStats.map((stat) => (
                  <View key={stat.id} style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                      <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                    </View>
                    <View style={styles.statTextContainer}>
                      <Text style={styles.statValue}>{stat.value}</Text>
                      <Text style={styles.statTitle}>{stat.title}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Analytics Chart */}
            <Animated.View entering={FadeInUp.delay(500).duration(800)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Scan Analytics</Text>
                <View style={styles.periodToggle}>
                  <TouchableOpacity
                    style={[
                      styles.periodButton,
                      selectedPeriod === 'daily' && styles.periodButtonActive,
                    ]}
                    onPress={() => setSelectedPeriod('daily')}
                  >
                    <Text
                      style={[
                        styles.periodButtonText,
                        selectedPeriod === 'daily' && styles.periodButtonTextActive,
                      ]}
                    >
                      Daily
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.periodButton,
                      selectedPeriod === 'weekly' && styles.periodButtonActive,
                    ]}
                    onPress={() => setSelectedPeriod('weekly')}
                  >
                    <Text
                      style={[
                        styles.periodButtonText,
                        selectedPeriod === 'weekly' && styles.periodButtonTextActive,
                      ]}
                    >
                      Weekly
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.chartCard}>
                <BarChart
                  key={`chart-${selectedPeriod}-${chartData.length}`}
                  data={chartData}
                  width={width - 100}
                  height={220}
                  barWidth={32}
                  spacing={18}
                  roundedTop
                  roundedBottom
                  hideRules
                  xAxisThickness={0}
                  yAxisThickness={0}
                  yAxisTextStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: Typography.small }}
                  xAxisLabelTextStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: Typography.small, marginTop: 5 }}
                  noOfSections={4}
                  maxValue={maxChartValue}
                  isAnimated
                  animationDuration={800}
                  showGradient
                  gradientColor="#4DA6FF"
                  frontColor="#007AFF"
                />
                <Text style={styles.chartLabel}>
                  {selectedPeriod === 'weekly' ? 'Weekly Scans (Last 7 Days)' : 'Today\'s Scans (Hourly)'}
                </Text>
              </View>
            </Animated.View>

            {/* Recent Activity */}
            <Animated.View entering={FadeInUp.delay(600).duration(800)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <TouchableOpacity onPress={() => router.push('/reports' as any)}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.activityCard}>
                {recentActivity.length === 0 ? (
                  <View style={styles.emptyActivity}>
                    <Ionicons name="time-outline" size={40} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.emptyActivityText}>No recent activity</Text>
                    <Text style={styles.emptyActivitySubtext}>Start scanning to see results here</Text>
                  </View>
                ) : (
                  recentActivity.map((activity, index) => (
                    <TouchableOpacity
                      key={activity.id}
                      style={[
                        styles.activityItem,
                        index !== recentActivity.length - 1 && styles.activityItemBorder,
                      ]}
                      onPress={() => router.push('/reports' as any)}
                    >
                      <View style={styles.activityIcon}>
                        <Ionicons name="person" size={20} color="#007AFF" />
                      </View>
                      <View style={styles.activityDetails}>
                        <Text style={styles.activityName}>{activity.name}</Text>
                        <Text style={styles.activityTime}>{activity.time}</Text>
                      </View>
                      <View style={styles.activityRight}>
                        <View
                          style={[
                            styles.statusBadge,
                            activity.status === 'match' ? styles.statusMatch : styles.statusNoMatch,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              activity.status === 'match'
                                ? styles.statusTextMatch
                                : styles.statusTextNoMatch,
                            ]}
                          >
                            {activity.status === 'match' ? 'Match' : 'No Match'}
                          </Text>
                        </View>
                        {activity.status === 'match' && (
                          <Text style={styles.confidenceText}>{activity.confidence}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </Animated.View>

            {/* Latest News */}
            <Animated.View entering={FadeInUp.delay(700).duration(800)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Latest News</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>Cybercrime Updates</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.newsContainer}>
                {newsLoading ? (
                  <View style={styles.newsLoadingContainer}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <Text style={styles.newsLoadingText}>Loading news...</Text>
                  </View>
                ) : newsItems.length === 0 ? (
                  <View style={styles.emptyNews}>
                    <Ionicons name="newspaper-outline" size={40} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.emptyNewsText}>No news available</Text>
                  </View>
                ) : (
                  newsItems.map((news, index) => (
                    <TouchableOpacity
                      key={news.id}
                      style={[
                        styles.newsCard,
                        index !== newsItems.length - 1 && { marginBottom: 12 },
                      ]}
                      onPress={() => news.url && Linking.openURL(news.url)}
                    >
                      <View style={styles.newsIconContainer}>
                        <Ionicons name="newspaper-outline" size={24} color="#007AFF" />
                      </View>
                      <View style={styles.newsContent}>
                        <Text style={styles.newsTitle} numberOfLines={2}>
                          {news.title}
                        </Text>
                        <View style={styles.newsFooter}>
                          <Text style={styles.newsSource}>{news.source}</Text>
                          <Text style={styles.newsTime}>• {news.time}</Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </Animated.View>

            <View style={{ height: 20 }} />
          </>
        )}
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
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  greetingContainer: {
    flexDirection: 'column',
  },
  greeting: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  userName: {
    fontSize: Typography.large,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(88, 86, 214, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 59, 48, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.medium,
    color: '#1C1C1E',
  },
  searchActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  actionGradient: {
    padding: 16,
    minHeight: 150,
    justifyContent: 'space-between',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: Typography.medium,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actionSubtitle: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: Typography.medium,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  seeAllText: {
    fontSize: Typography.small,
    fontWeight: '600',
    color: '#007AFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: Typography.medium,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 2,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
  },
  periodButtonText: {
    fontSize: Typography.small,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    paddingTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chart: {
    marginVertical: 12,
    borderRadius: 16,
  },
  chartLabel: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 8,
  },
  activityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityName: {
    fontSize: Typography.medium,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusMatch: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  statusNoMatch: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
  },
  statusText: {
    fontSize: Typography.small,
    fontWeight: '600',
  },
  statusTextMatch: {
    color: '#34C759',
  },
  statusTextNoMatch: {
    color: '#FF3B30',
  },
  confidenceText: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: Typography.medium,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: Typography.medium,
    color: '#FF3B30',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: Typography.medium,
    fontWeight: '600',
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyActivityText: {
    fontSize: Typography.medium,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 12,
  },
  emptyActivitySubtext: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
  newsContainer: {
    gap: 12,
  },
  newsCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  newsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    fontSize: Typography.small,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 20,
  },
  newsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newsSource: {
    fontSize: Typography.small,
    color: '#007AFF',
    fontWeight: '500',
  },
  newsTime: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 4,
  },
  newsLoadingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  newsLoadingText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: Typography.small,
    marginTop: 12,
  },
  emptyNews: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyNewsText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: Typography.small,
    marginTop: 12,
  },
});
