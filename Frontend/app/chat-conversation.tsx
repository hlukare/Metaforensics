import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Typography } from '@/constants/theme';
import { getCurrentUser, sendMessage, listenToMessages, markMessagesAsRead } from '../utils/firebase-service';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: number;
  read: boolean;
}

export default function ChatConversationScreen() {
  const params = useLocalSearchParams();
  const { otherUserId, otherUserName } = params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !otherUserId) {
      router.back();
      return;
    }

    setCurrentUserId(user.uid);

    // Listen to messages
    const unsubscribe = listenToMessages(
      user.uid,
      otherUserId as string,
      (newMessages) => {
        setMessages(newMessages);
        setLoading(false);

        // Mark messages as read
        markMessagesAsRead(user.uid, otherUserId as string);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [otherUserId]);

  const handleSend = async () => {
    if (!messageText.trim() || sending) return;

    const text = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      await sendMessage(currentUserId, otherUserId as string, text);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === currentUserId;

    return (
      <Animated.View entering={FadeInRight.delay(index * 50).duration(400)}>
        <View style={[styles.messageContainer, isMe && styles.myMessageContainer]}>
          <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.otherMessage]}>
            <Text style={[styles.messageText, isMe && styles.myMessageText]}>
              {item?.text || ''}
            </Text>
            <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
              {formatTime(item?.timestamp || Date.now())}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0f0c29', '#302b63', '#24243e']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <LinearGradient
        colors={['#0f0c29', '#302b63', '#24243e']}
        style={styles.container}
      >
        {/* Header */}
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <LinearGradient
              colors={['#007AFF', '#5856D6']}
              style={styles.headerAvatar}
            >
              <Text style={styles.headerAvatarText}>
                {(String(otherUserName || 'Unknown')).split(' ').map(n => n?.[0] || '').join('').toUpperCase().slice(0, 2) || 'U'}
              </Text>
            </LinearGradient>
            <Text style={styles.headerName}>{otherUserName || 'Unknown'}</Text>
          </View>
          <View style={styles.backButton} />
        </LinearGradient>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          inverted
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation</Text>
            </View>
          }
        />

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!messageText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: Typography.small,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerName: {
    fontSize: Typography.medium,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  messagesContainer: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
  },
  otherMessage: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderBottomLeftRadius: 4,
  },
  myMessage: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: Typography.medium,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: Typography.small,
    color: 'rgba(255,255,255,0.6)',
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  inputContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 60 : 50,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: Typography.medium,
    color: '#FFFFFF',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
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
  },
});
