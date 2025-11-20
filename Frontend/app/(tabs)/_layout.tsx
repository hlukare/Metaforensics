import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  // Calculate responsive tab bar dimensions
  // Add extra padding to ensure it sits comfortably above system buttons
  const tabBarContentHeight = 50; // Icon + label height
  const topPadding = 8;
  const bottomSafeArea = insets.bottom > 0 ? insets.bottom : 0;
  const additionalBottomPadding = Platform.OS === 'android' ? 8 : 4; // Extra cushion for Android
  
  const computedHeight = tabBarContentHeight + topPadding + bottomSafeArea + additionalBottomPadding;
  const computedPaddingBottom = bottomSafeArea + additionalBottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#16213e',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          height: computedHeight,
          paddingBottom: computedPaddingBottom,
          paddingTop: topPadding,
          elevation: 0,
          position: 'relative',
        },
        tabBarLabelStyle: {
          fontSize: Typography.small,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'search' : 'search-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'document-text' : 'document-text-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? 'person' : 'person-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hide from tabs
        }}
      />
    </Tabs>
  );
}
