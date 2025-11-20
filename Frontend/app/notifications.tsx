import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getCurrentUser, getUserNotifications, markNotificationAsRead, deleteNotification } from '../utils/firebase-service';
import { Typography } from '@/constants/theme';

interface Notification {
  id: string;
  type: 'pdf_shared' | 'message' | 'report' | 'system';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  metadata?: {
    reportId?: string;
    reportName?: string;
  };
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        console.log('No user logged in');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      console.log('📱 Loading notifications for user:', currentUser.uid);
      const fetchedNotifications = await getUserNotifications(currentUser.uid);
      setNotifications(fetchedNotifications);
      console.log('✅ Notifications loaded:', fetchedNotifications.length);
    } catch (error: any) {
      console.error('❌ Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleNotificationPress = async (notification: Notification) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      // Mark as read
      if (!notification.read) {
        await markNotificationAsRead(currentUser.uid, notification.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
        );
      }

      // Navigate based on type
      if (notification.type === 'pdf_shared' && notification.metadata?.reportId) {
        router.push('/reports' as any);
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      setDeletingId(notificationId);
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      await deleteNotification(currentUser.uid, notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      console.log('✅ Notification deleted');
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getIconName = (type: string) => {
    switch (type) {
      case 'pdf_shared':
        return 'cloud-upload';
      case 'message':
        return 'chatbubble';
      case 'report':
        return 'document-text';
      default:
        return 'notifications';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'pdf_shared':
        return '#34C759';
      case 'message':
        return '#007AFF';
      case 'report':
        return '#5856D6';
      default:
        return '#FF9500';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>
              {notifications.filter(n => !n.read).length} unread
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
      >
        {notifications.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(600)} style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="notifications-off-outline" size={60} color="rgba(255,255,255,0.3)" />
            </View>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>
              You will see notifications here when you share reports or receive messages
            </Text>
          </Animated.View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification, index) => (
              <Animated.View
                key={notification.id}
                entering={FadeInDown.delay(index * 50).duration(400)}
              >
                <TouchableOpacity
                  style={[
                    styles.notificationCard,
                    !notification.read && styles.notificationUnread,
                  ]}
                  onPress={() => handleNotificationPress(notification)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.notificationIcon,
                      { backgroundColor: `${getIconColor(notification.type)}20` },
                    ]}
                  >
                    <Ionicons
                      name={getIconName(notification.type) as any}
                      size={24}
                      color={getIconColor(notification.type)}
                    />
                  </View>

                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      {!notification.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notificationMessage} numberOfLines={2}>
                      {notification.message}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatTime(notification.timestamp)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(notification.id)}
                    disabled={deletingId === notification.id}
                  >
                    {deletingId === notification.id ? (
                      <ActivityIndicator size="small" color="#FF3B30" />
                    ) : (
                      <Ionicons name="close-circle" size={24} color="rgba(255,255,255,0.4)" />
                    )}
                  </TouchableOpacity>
                </TouchableOpacity>
              </Animated.View>
            ))}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
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
    paddingHorizontal: 20,
  },
  notificationsList: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'flex-start',
  },
  notificationUnread: {
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: Typography.medium,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
});
