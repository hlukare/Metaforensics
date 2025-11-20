import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Typography } from '@/constants/theme';

export default function AboutScreen() {
  const features = [
    {
      id: 1,
      icon: 'scan',
      title: 'Advanced Face Recognition',
      description: 'AI-powered facial analysis with 95%+ accuracy using deep learning algorithms.',
      color: '#007AFF',
    },
    {
      id: 2,
      icon: 'shield-checkmark',
      title: 'Secure & Private',
      description: 'End-to-end encryption and secure cloud storage for all your data.',
      color: '#34C759',
    },
    {
      id: 3,
      icon: 'flash',
      title: 'Real-time Processing',
      description: 'Instant results with automatic scanning every 1.5 seconds.',
      color: '#FF9500',
    },
    {
      id: 4,
      icon: 'analytics',
      title: 'Detailed Reports',
      description: 'Comprehensive profiles with social media, database records, and more.',
      color: '#5856D6',
    },
    {
      id: 5,
      icon: 'location',
      title: 'GPS Integration',
      description: 'Automatic location tagging for every scan with EXIF metadata.',
      color: '#FF3B30',
    },
    {
      id: 6,
      icon: 'cloud',
      title: 'Cloud Sync',
      description: 'All your scans automatically backed up and accessible anywhere.',
      color: '#00C7BE',
    },
  ];

  const teamMembers = [
    {
      id: 1,
      role: 'AI & Machine Learning',
      description: 'Advanced facial recognition algorithms',
    },
    {
      id: 2,
      role: 'Security & Privacy',
      description: 'Enterprise-grade encryption & data protection',
    },
    {
      id: 3,
      role: 'Mobile Development',
      description: 'Cross-platform React Native expertise',
    },
    {
      id: 4,
      role: 'Cloud Infrastructure',
      description: 'Scalable Firebase & AWS architecture',
    },
  ];

  const socialLinks = [
    { id: 1, icon: 'logo-twitter', url: 'https://twitter.com', color: '#1DA1F2' },
    { id: 2, icon: 'logo-linkedin', url: 'https://linkedin.com', color: '#0077B5' },
    { id: 3, icon: 'logo-github', url: 'https://github.com', color: '#FFFFFF' },
    { id: 4, icon: 'logo-youtube', url: 'https://youtube.com', color: '#FF0000' },
  ];

  const handleOpenURL = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.warn('Cannot open URL:', url);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <LinearGradient
        colors={['#007AFF', '#5856D6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Info */}
        <Animated.View entering={FadeIn.delay(100).duration(800)} style={styles.appInfo}>
          <View style={styles.appIconContainer}>
            <View style={styles.appIcon}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
          </View>
          <Text style={styles.appName}>Meta Forensics</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appTagline}>
            Advanced Facial Recognition & Forensic Analysis
          </Text>
        </Animated.View>

        {/* About Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>About the App</Text>
          <View style={styles.card}>
            <Text style={styles.aboutText}>
              Meta Forensics is a cutting-edge mobile application designed for forensic investigators
              and security professionals. Powered by advanced AI and machine learning, our app provides
              instant facial recognition, comprehensive profile analysis, and secure data management.
            </Text>
            <Text style={[styles.aboutText, { marginTop: 12 }]}>
              Built with state-of-the-art technology, Meta Forensics combines real-time camera processing,
              cloud-based storage, and detailed reporting to deliver a complete forensic analysis solution
              in the palm of your hand.
            </Text>
          </View>
        </Animated.View>

        {/* Features */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <Animated.View
                key={feature.id}
                entering={FadeInDown.delay(500 + index * 100).duration(600)}
                style={styles.featureCard}
              >
                <View style={[styles.featureIcon, { backgroundColor: `${feature.color}20` }]}>
                  <Ionicons name={feature.icon as any} size={28} color={feature.color} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Technology Stack */}
        <Animated.View entering={FadeInDown.delay(1000).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Technology Stack</Text>
          <View style={styles.card}>
            <View style={styles.techItem}>
              <Ionicons name="logo-react" size={24} color="#61DAFB" />
              <View style={styles.techInfo}>
                <Text style={styles.techName}>React Native</Text>
                <Text style={styles.techDescription}>Cross-platform mobile framework</Text>
              </View>
            </View>
            <View style={styles.techItem}>
              <Ionicons name="flame" size={24} color="#FFCA28" />
              <View style={styles.techInfo}>
                <Text style={styles.techName}>Firebase</Text>
                <Text style={styles.techDescription}>Authentication & Realtime Database</Text>
              </View>
            </View>
            <View style={styles.techItem}>
              <Ionicons name="bulb" size={24} color="#FF6F00" />
              <View style={styles.techInfo}>
                <Text style={styles.techName}>TensorFlow</Text>
                <Text style={styles.techDescription}>AI-powered face recognition</Text>
              </View>
            </View>
            <View style={styles.techItem}>
              <Ionicons name="cloud" size={24} color="#FF9900" />
              <View style={styles.techInfo}>
                <Text style={styles.techName}>AWS Cloud</Text>
                <Text style={styles.techDescription}>Scalable backend infrastructure</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Team */}
        <Animated.View entering={FadeInDown.delay(1200).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Our Team</Text>
          <View style={styles.card}>
            <Text style={styles.teamIntro}>
              Built by a dedicated team of engineers, data scientists, and security experts
              committed to delivering cutting-edge forensic technology.
            </Text>
            {teamMembers.map((member, index) => (
              <View key={member.id} style={[styles.teamItem, index > 0 && styles.teamItemBorder]}>
                <View style={styles.teamBullet} />
                <View style={styles.teamContent}>
                  <Text style={styles.teamRole}>{member.role}</Text>
                  <Text style={styles.teamDescription}>{member.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Social Links */}
        <Animated.View entering={FadeInDown.delay(1400).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Connect With Us</Text>
          <View style={styles.socialContainer}>
            {socialLinks.map((social) => (
              <TouchableOpacity
                key={social.id}
                style={styles.socialButton}
                onPress={() => handleOpenURL(social.url)}
                activeOpacity={0.7}
              >
                <Ionicons name={social.icon as any} size={28} color={social.color} />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Legal Links */}
        <View style={styles.section}>
          <View style={styles.legalContainer}>
            <TouchableOpacity style={styles.legalLink}>
              <Text style={styles.legalText}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.legalDivider}>•</Text>
            <TouchableOpacity style={styles.legalLink}>
              <Text style={styles.legalText}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.legalDivider}>•</Text>
            <TouchableOpacity style={styles.legalLink}>
              <Text style={styles.legalText}>Licenses</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Copyright */}
        <View style={styles.copyright}>
          <Text style={styles.copyrightText}>© 2025 Meta Forensics</Text>
          <Text style={styles.copyrightText}>All rights reserved</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: Typography.large,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  appInfo: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
  },
  appIconContainer: {
    marginBottom: 16,
  },
  appIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  appName: {
    fontSize: Typography.large,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: Typography.large,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  aboutText: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
  },
  featuresGrid: {
    gap: 12,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: Typography.medium,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  techItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  techInfo: {
    marginLeft: 16,
    flex: 1,
  },
  techName: {
    fontSize: Typography.medium,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  techDescription: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  teamIntro: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
    marginBottom: 20,
  },
  teamItem: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  teamItemBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  teamBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
    marginTop: 7,
    marginRight: 12,
  },
  teamContent: {
    flex: 1,
  },
  teamRole: {
    fontSize: Typography.medium,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  teamDescription: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  legalContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  legalLink: {
    paddingVertical: 4,
  },
  legalText: {
    fontSize: Typography.small,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  legalDivider: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  copyright: {
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 20,
  },
  copyrightText: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
  },
});
