import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Typography } from '@/constants/theme';
import { getCurrentUser, getAllOfficers, getConversations } from '../../utils/firebase-service';

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

export default function ChatTabScreen() {
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

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const renderOfficer = ({ item }: { item: Officer }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleStartChat(item)}
    >
      <LinearGradient
        colors={['#007AFF', '#5856D6']}
        style={styles.avatar}
      >
        <Text style={styles.avatarText}>
          {(item?.name || 'Unknown').split(' ').map(n => n?.[0] || '').join('').toUpperCase().slice(0, 2) || 'U'}
        </Text>
      </LinearGradient>
      <View style={styles.listItemContent}>
        <Text style={styles.listItemName}>{item?.name || 'Unknown'}</Text>
        <Text style={styles.listItemEmail}>{item?.email || 'No email'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
    </TouchableOpacity>
  );

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleOpenConversation(item)}
    >
      <LinearGradient
        colors={['#007AFF', '#5856D6']}
        style={styles.avatar}
      >
        <Text style={styles.avatarText}>
          {(item?.otherUser?.name || 'Unknown').split(' ').map(n => n?.[0] || '').join('').toUpperCase().slice(0, 2) || 'U'}
        </Text>
      </LinearGradient>
      <View style={styles.listItemContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.listItemName}>{item?.otherUser?.name || 'Unknown'}</Text>
          <Text style={styles.timestamp}>{formatTimestamp(item?.lastMessageTime || Date.now())}</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item?.lastMessage || 'No messages yet'}
        </Text>
      </View>
      {item?.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#0f0c29', '#302b63', '#24243e']}
      style={styles.container}
    >
      {/* Header */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Messages</Text>
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
              Officers
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.5)" />
          <TextInput
            style={styles.searchInput}
            placeholder={activeTab === 'messages' ? 'Search conversations...' : 'Search officers...'}
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </LinearGradient>

      {/* Content */}
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        style={styles.content}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : activeTab === 'messages' ? (
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
    </LinearGradient>
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
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.medium,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  listItemContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listItemName: {
    fontSize: Typography.medium,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  listItemEmail: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  timestamp: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  lastMessage: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: Typography.large,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 8,
    textAlign: 'center',
  },
});
