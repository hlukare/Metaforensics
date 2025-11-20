import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Typography } from '@/constants/theme';

export default function HelpSupportScreen() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      id: 1,
      question: 'How does face recognition work?',
      answer: 'Our advanced AI technology scans and analyzes facial features from your camera feed. It compares them against our secure database to identify matches with high accuracy. The system uses deep learning algorithms to ensure reliable results.',
    },
    {
      id: 2,
      question: 'How accurate is the face recognition?',
      answer: 'Our system maintains an average accuracy rate of 95-98%. Accuracy depends on factors like image quality, lighting conditions, and camera angle. Results are displayed with confidence percentages to help you assess reliability.',
    },
    {
      id: 3,
      question: 'Is my data secure and private?',
      answer: 'Absolutely. All data is encrypted end-to-end using industry-standard security protocols. Your scans and reports are stored securely in Firebase with user-specific access controls. We never share your data with third parties without explicit consent.',
    },
    {
      id: 4,
      question: 'How do I view my scan history?',
      answer: 'Navigate to the Reports tab from the bottom navigation bar. Here you can view all your past scans, filter by date, and access detailed reports for each profile you\'ve scanned.',
    },
    {
      id: 5,
      question: 'What should I do if scan results are incorrect?',
      answer: 'If you believe results are inaccurate, try rescanning with better lighting and a clearer camera angle. You can also report issues through our support email. Our team reviews all feedback to improve accuracy.',
    },
    {
      id: 6,
      question: 'Can I delete my scan history?',
      answer: 'Yes, you can manage your scan history from the Reports tab. Tap and hold on any report to see delete options. You can also clear all data from Settings > Security > Clear Data.',
    },
    {
      id: 7,
      question: 'Does the app work offline?',
      answer: 'The app requires an internet connection for face recognition as it processes images through our secure cloud servers. However, you can view previously saved reports offline.',
    },
    {
      id: 8,
      question: 'How do I update the app?',
      answer: 'Updates are available through your device\'s app store. We recommend enabling automatic updates to ensure you always have the latest features and security improvements.',
    },
  ];

  const contactOptions = [
    {
      id: 1,
      icon: 'mail',
      title: 'Email Support',
      subtitle: 'support@metaforensics.com',
      color: '#007AFF',
      onPress: () => handleOpenURL('mailto:support@metaforensics.com'),
    },
    {
      id: 2,
      icon: 'call',
      title: 'Phone Support',
      subtitle: '+1 (555) 123-4567',
      color: '#34C759',
      onPress: () => handleOpenURL('tel:+15551234567'),
    },
    {
      id: 3,
      icon: 'chatbubbles',
      title: 'Live Chat',
      subtitle: 'Available 24/7',
      color: '#5856D6',
      onPress: () => console.log('Chat feature coming soon'),
    },
    {
      id: 4,
      icon: 'globe',
      title: 'Visit Website',
      subtitle: 'www.metaforensics.com',
      color: '#FF9500',
      onPress: () => handleOpenURL('https://www.metaforensics.com'),
    },
  ];

  const toggleFaq = (id: number) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Contact Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.contactGrid}>
            {contactOptions.map((option, index) => (
              <Animated.View
                key={option.id}
                entering={FadeInDown.delay(200 + index * 100).duration(600)}
              >
                <TouchableOpacity
                  style={styles.contactCard}
                  onPress={option.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.contactIcon, { backgroundColor: `${option.color}20` }]}>
                    <Ionicons name={option.icon as any} size={28} color={option.color} />
                  </View>
                  <Text style={styles.contactTitle}>{option.title}</Text>
                  <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* FAQs Section */}
        <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="help-circle" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          </View>
          <View style={styles.faqContainer}>
            {faqs.map((faq) => (
              <View key={faq.id} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => toggleFaq(faq.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqQuestionContent}>
                    <View style={styles.faqNumber}>
                      <Text style={styles.faqNumberText}>{faq.id}</Text>
                    </View>
                    <Text style={styles.faqQuestionText}>{faq.question}</Text>
                  </View>
                  <Ionicons
                    name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#007AFF"
                  />
                </TouchableOpacity>
                {expandedFaq === faq.id && (
                  <Animated.View
                    entering={FadeInDown.duration(300)}
                    style={styles.faqAnswer}
                  >
                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                  </Animated.View>
                )}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Additional Resources */}
        <Animated.View entering={FadeInDown.delay(800).duration(600)} style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Resources</Text>
          <TouchableOpacity style={styles.resourceItem}>
            <View style={styles.resourceIcon}>
              <Ionicons name="document-text" size={22} color="#5856D6" />
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>User Guide</Text>
              <Text style={styles.resourceSubtitle}>Learn how to use the app</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceItem}>
            <View style={styles.resourceIcon}>
              <Ionicons name="play-circle" size={22} color="#FF9500" />
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>Video Tutorials</Text>
              <Text style={styles.resourceSubtitle}>Watch step-by-step guides</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceItem}>
            <View style={styles.resourceIcon}>
              <Ionicons name="shield-checkmark" size={22} color="#34C759" />
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>Privacy Policy</Text>
              <Text style={styles.resourceSubtitle}>How we protect your data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceItem}>
            <View style={styles.resourceIcon}>
              <Ionicons name="newspaper" size={22} color="#007AFF" />
            </View>
            <View style={styles.resourceContent}>
              <Text style={styles.resourceTitle}>Terms of Service</Text>
              <Text style={styles.resourceSubtitle}>Legal agreements & policies</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        </Animated.View>

        {/* Response Time */}
        <View style={styles.responseInfo}>
          <Ionicons name="time" size={20} color="#007AFF" />
          <Text style={styles.responseText}>
            Average response time: <Text style={styles.responseBold}>2-4 hours</Text>
          </Text>
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
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: Typography.large,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  contactCard: {
    width: (Platform.OS === 'ios' ? 170 : 165),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  contactIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: Typography.small,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  contactSubtitle: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  faqContainer: {
    gap: 12,
  },
  faqItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  faqNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  faqNumberText: {
    fontSize: Typography.small,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  faqQuestionText: {
    fontSize: Typography.small,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingLeft: 56,
  },
  faqAnswerText: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  resourceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: Typography.medium,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  resourceSubtitle: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  responseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
    gap: 8,
  },
  responseText: {
    fontSize: Typography.small,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  responseBold: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
});
