import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Typography } from '@/constants/theme';
import { getCurrentUser, getAllOfficers, getConversations } from '../utils/firebase-service';

interface Officer {
  uid: string;
  name: string;
  email: string;
  role: string;
  lastSeen?: number;
}

interface Conversation {
  conversationId: string;
  otherUser: Officer;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
}

export default function ChatScreen() {
  const [activeTab, setActiveTab] = useState<'messages' | 'officers'>('messages');
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = getCurrentUser();
      if (!user) {
        router.replace('/login');
        return;
      }

      // Load officers list
      const officersList = await getAllOfficers();
      const filteredOfficers = officersList.filter(o => o.uid !== user.uid);
      setOfficers(filteredOfficers);

      // Load conversations
      const convos = await getConversations(user.uid);
      setConversations(convos);

      setLoading(false);
    } catch (error) {
      console.error('Error loading chat data:', error);
      setLoading(false);
    }
  };

  const handleStartChat = (officer: Officer) => {
    router.push({
      pathname: '/chat-conversation',
      params: {
        otherUserId: officer.uid,
        otherUserName: officer.name,
      },
    });
  };

  const handleOpenConversation = (conversation: Conversation) => {
    router.push({
      pathname: '/chat-conversation',
      params: {
        otherUserId: conversation.otherUser.uid,
        otherUserName: conversation.otherUser.name,
      },
    });
  };

  const filteredOfficers = officers.filter(officer =>
    (officer?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (officer?.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConversations = conversations.filter(conv =>
    (conv?.otherUser?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderOfficer = ({ item, index }: { item: Officer; index: number }) => (
    <Animated.View entering={FadeInRight.delay(index * 100).duration(600)}>
      <TouchableOpacity
        style={styles.officerCard}
        onPress={() => handleStartChat(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#007AFF', '#5856D6']}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {(item?.name || 'U').split(' ').map(n => n?.[0] || '').join('').toUpperCase().slice(0, 2) || 'U'}
            </Text>
          </LinearGradient>
        </View>
        <View style={styles.officerInfo}>
          <Text style={styles.officerName}>{item?.name || 'Unknown'}</Text>
          <Text style={styles.officerEmail}>{item?.email || ''}</Text>
        </View>
        <Ionicons name="chatbubble-ellipses-outline" size={24} color="#007AFF" />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderConversation = ({ item, index }: { item: Conversation; index: number }) => (
    <Animated.View entering={FadeInRight.delay(index * 100).duration(600)}>
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => handleOpenConversation(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={['#007AFF', '#5856D6']}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {(item?.otherUser?.name || 'U').split(' ').map(n => n?.[0] || '').join('').toUpperCase().slice(0, 2) || 'U'}
            </Text>
          </LinearGradient>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName}>{item?.otherUser?.name || 'Unknown'}</Text>
            <Text style={styles.messageTime}>
              {formatTime(item?.lastMessageTime || Date.now())}
            </Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item?.lastMessage || 'No messages yet'}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={styles.backButton} />
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'messages' && styles.activeTab]}
            onPress={() => setActiveTab('messages')}
          >
            <Text style={[styles.tabText, activeTab === 'messages' && styles.activeTabText]}>
              Messages
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'officers' && styles.activeTab]}
            onPress={() => setActiveTab('officers')}
          >
            <Text style={[styles.tabText, activeTab === 'officers' && styles.activeTabText]}>
              All Officers
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${activeTab === 'messages' ? 'conversations' : 'officers'}...`}
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        style={styles.content}
      >
        {activeTab === 'messages' ? (
          filteredConversations.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>
                Start chatting with other officers
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredConversations}
              renderItem={renderConversation}
              keyExtractor={(item) => item.conversationId}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )
        ) : (
          filteredOfficers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyText}>No officers found</Text>
            </View>
          ) : (
            <FlatList
              data={filteredOfficers}
              renderItem={renderOfficer}
              keyExtractor={(item) => item.uid}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0c29',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.large,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: Typography.medium,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.medium,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  officerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Typography.medium,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: Typography.small,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  officerInfo: {
    flex: 1,
  },
  officerName: {
    fontSize: Typography.medium,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  officerEmail: {
    fontSize: Typography.small,
    color: 'rgba(255,255,255,0.6)',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: Typography.medium,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: Typography.small,
    color: 'rgba(255,255,255,0.5)',
  },
  lastMessage: {
    fontSize: Typography.small,
    color: 'rgba(255,255,255,0.7)',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: Typography.large,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: Typography.medium,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
});
