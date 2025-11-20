import { Typography } from '@/constants/theme';
import { generateReportPDF } from '@/utils/pdf-generator';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    Extrapolate,
    FadeIn,
    FadeInDown,
    interpolate,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function ProfileDetailsScreen() {
  const params = useLocalSearchParams();
  const [treeExpanded, setTreeExpanded] = useState(false);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [expandedDatabase, setExpandedDatabase] = useState<string | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);

  // Parse the profile data from params
  let profileData = null;
  let reportMetadata = null; // For accuracy, profileImage, location from report
  
  if (params.data) {
    try {
      const parsedData = JSON.parse(params.data as string);
      console.log('📄 Received profile data:', parsedData);
      
      // Handle multiple data structure formats
      if (parsedData.fullData && typeof parsedData.fullData === 'object') {
        console.log('✅ Using fullData from report (old format)');
        profileData = parsedData.fullData;
        reportMetadata = {
          accuracy: parsedData.accuracy,
          profileImage: parsedData.profileImage,
          location: parsedData.location,
          name: parsedData.name,
        };
      } else if (parsedData.personalInfo || parsedData.socialMedia || parsedData.personal_info || parsedData.social_media || parsedData.external_search) {
        console.log('✅ Using mixed format - extracting from root and fullData');
        // Handle new Firebase format where some data is at root, some in nested objects
        profileData = {
          personal_info: parsedData.personalInfo || parsedData.personal_info || {},
          social_media: parsedData.socialMedia || parsedData.social_media || {},
          external_search: parsedData.externalSearch || parsedData.external_search || {},
          database_records: parsedData.databaseRecords || parsedData.database_records || {},
          public_records: parsedData.publicRecords || parsedData.public_records || {},
          other: parsedData.other || [],
          summary: parsedData.summary || {},
        };
        reportMetadata = {
          accuracy: parsedData.accuracy,
          profileImage: parsedData.profileImage || parsedData.metadata?.profileImage,
          location: parsedData.location,
          name: parsedData.name || parsedData.personalInfo?.name || parsedData.personal_info?.name,
        };
      } else {
        console.log('✅ Using direct data structure');
        profileData = parsedData;
        reportMetadata = {
          accuracy: parsedData.accuracy,
          profileImage: parsedData.profileImage,
          location: parsedData.location,
          name: parsedData.name,
        };
      }
      
      console.log('📊 Parsed profileData keys:', profileData ? Object.keys(profileData) : 'null');
      console.log('📊 Report metadata:', reportMetadata);
    } catch (error) {
      console.error('❌ Error parsing profile data:', error);
      Alert.alert('Error', 'Failed to load report details. Please try again.');
    }
  }

  // Animation values
  const treeScale = useSharedValue(0);
  const branchRotations = [
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
  ];
  
  // Sub-links animation values
  const subLinksHeight = useSharedValue(0);
  const subLinksOpacity = useSharedValue(0);

  // Branch positions configuration
  const positions = [
    { x: -100, y: -140 },  // Top left
    { x: 100, y: -140 },   // Top right
    { x: -120, y: -40 },   // Middle left  
    { x: 120, y: -40 },    // Middle right
    { x: -100, y: 60 },    // Bottom left
    { x: 100, y: 60 },     // Bottom right
  ];

  // Pre-compute all branch styles at component level (one hook per branch)
  const branchStyle0 = useAnimatedStyle(() => {
    const progress = branchRotations[0]?.value || 0;
    return {
      transform: [
        { translateX: interpolate(progress, [0, 1], [0, positions[0].x]) },
        { translateY: interpolate(progress, [0, 1], [0, positions[0].y]) },
        { scale: interpolate(progress, [0, 0.5, 1], [0, 0.8, 1]) },
      ],
      opacity: progress,
    };
  });

  const branchStyle1 = useAnimatedStyle(() => {
    const progress = branchRotations[1]?.value || 0;
    return {
      transform: [
        { translateX: interpolate(progress, [0, 1], [0, positions[1].x]) },
        { translateY: interpolate(progress, [0, 1], [0, positions[1].y]) },
        { scale: interpolate(progress, [0, 0.5, 1], [0, 0.8, 1]) },
      ],
      opacity: progress,
    };
  });

  const branchStyle2 = useAnimatedStyle(() => {
    const progress = branchRotations[2]?.value || 0;
    return {
      transform: [
        { translateX: interpolate(progress, [0, 1], [0, positions[2].x]) },
        { translateY: interpolate(progress, [0, 1], [0, positions[2].y]) },
        { scale: interpolate(progress, [0, 0.5, 1], [0, 0.8, 1]) },
      ],
      opacity: progress,
    };
  });

  const branchStyle3 = useAnimatedStyle(() => {
    const progress = branchRotations[3]?.value || 0;
    return {
      transform: [
        { translateX: interpolate(progress, [0, 1], [0, positions[3].x]) },
        { translateY: interpolate(progress, [0, 1], [0, positions[3].y]) },
        { scale: interpolate(progress, [0, 0.5, 1], [0, 0.8, 1]) },
      ],
      opacity: progress,
    };
  });

  const branchStyle4 = useAnimatedStyle(() => {
    const progress = branchRotations[4]?.value || 0;
    return {
      transform: [
        { translateX: interpolate(progress, [0, 1], [0, positions[4].x]) },
        { translateY: interpolate(progress, [0, 1], [0, positions[4].y]) },
        { scale: interpolate(progress, [0, 0.5, 1], [0, 0.8, 1]) },
      ],
      opacity: progress,
    };
  });

  const branchStyle5 = useAnimatedStyle(() => {
    const progress = branchRotations[5]?.value || 0;
    return {
      transform: [
        { translateX: interpolate(progress, [0, 1], [0, positions[5].x]) },
        { translateY: interpolate(progress, [0, 1], [0, positions[5].y]) },
        { scale: interpolate(progress, [0, 0.5, 1], [0, 0.8, 1]) },
      ],
      opacity: progress,
    };
  });

  const branchStyles = [branchStyle0, branchStyle1, branchStyle2, branchStyle3, branchStyle4, branchStyle5];

  // Pre-compute all path props at component level
  const pathProps0 = useAnimatedProps(() => {
    const progress = branchRotations[0]?.value || 0;
    const centerX = 150, centerY = 225;
    const endX = centerX + (positions[0].x * progress);
    const endY = centerY + (positions[0].y * progress);
    const controlX = centerX + (positions[0].x * progress * 0.5);
    const controlY = centerY + (positions[0].y * progress * 0.3);
    return { d: `M ${centerX} ${centerY} Q ${controlX} ${controlY}, ${endX} ${endY}` };
  });

  const pathProps1 = useAnimatedProps(() => {
    const progress = branchRotations[1]?.value || 0;
    const centerX = 150, centerY = 225;
    const endX = centerX + (positions[1].x * progress);
    const endY = centerY + (positions[1].y * progress);
    const controlX = centerX + (positions[1].x * progress * 0.5);
    const controlY = centerY + (positions[1].y * progress * 0.3);
    return { d: `M ${centerX} ${centerY} Q ${controlX} ${controlY}, ${endX} ${endY}` };
  });

  const pathProps2 = useAnimatedProps(() => {
    const progress = branchRotations[2]?.value || 0;
    const centerX = 150, centerY = 225;
    const endX = centerX + (positions[2].x * progress);
    const endY = centerY + (positions[2].y * progress);
    const controlX = centerX + (positions[2].x * progress * 0.5);
    const controlY = centerY + (positions[2].y * progress * 0.3);
    return { d: `M ${centerX} ${centerY} Q ${controlX} ${controlY}, ${endX} ${endY}` };
  });

  const pathProps3 = useAnimatedProps(() => {
    const progress = branchRotations[3]?.value || 0;
    const centerX = 150, centerY = 225;
    const endX = centerX + (positions[3].x * progress);
    const endY = centerY + (positions[3].y * progress);
    const controlX = centerX + (positions[3].x * progress * 0.5);
    const controlY = centerY + (positions[3].y * progress * 0.3);
    return { d: `M ${centerX} ${centerY} Q ${controlX} ${controlY}, ${endX} ${endY}` };
  });

  const pathProps4 = useAnimatedProps(() => {
    const progress = branchRotations[4]?.value || 0;
    const centerX = 150, centerY = 225;
    const endX = centerX + (positions[4].x * progress);
    const endY = centerY + (positions[4].y * progress);
    const controlX = centerX + (positions[4].x * progress * 0.5);
    const controlY = centerY + (positions[4].y * progress * 0.3);
    return { d: `M ${centerX} ${centerY} Q ${controlX} ${controlY}, ${endX} ${endY}` };
  });

  const pathProps5 = useAnimatedProps(() => {
    const progress = branchRotations[5]?.value || 0;
    const centerX = 150, centerY = 225;
    const endX = centerX + (positions[5].x * progress);
    const endY = centerY + (positions[5].y * progress);
    const controlX = centerX + (positions[5].x * progress * 0.5);
    const controlY = centerY + (positions[5].y * progress * 0.3);
    return { d: `M ${centerX} ${centerY} Q ${controlX} ${controlY}, ${endX} ${endY}` };
  });

  const allPathProps = [pathProps0, pathProps1, pathProps2, pathProps3, pathProps4, pathProps5];

  const toggleTree = () => {
    if (treeExpanded) {
      // Collapse - animate branches first, then scale down
      branchRotations.forEach((rotation, index) => {
        rotation.value = withDelay(
          index * 50,
          withTiming(0, { duration: 300 })
        );
      });
      treeScale.value = withDelay(200, withTiming(0, { duration: 300 }));
    } else {
      // Expand - scale up first, then animate branches
      treeScale.value = withSpring(1, {
        damping: 20,
        stiffness: 100,
      });
      
      // Animate branches with stagger
      branchRotations.forEach((rotation, index) => {
        rotation.value = withDelay(
          300 + index * 80,
          withSpring(1, {
            damping: 18,
            stiffness: 90,
          })
        );
      });
    }
    setTreeExpanded(!treeExpanded);
  };

  const openLink = (url: string | undefined) => {
    try {
      if (!url || url === '#' || url === '' || url === 'undefined') {
        Alert.alert('Invalid Link', 'This link is not available.');
        return;
      }
      
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(url);
          } else {
            console.error('Cannot open URL:', url);
            Alert.alert('Error', 'Unable to open this link.');
          }
        })
        .catch(err => {
          console.error('Error opening link:', err);
          Alert.alert('Error', 'Could not open link. Please try again.');
        });
    } catch (error) {
      console.error('Link error:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const handleExportPDF = async () => {
    try {
      setExportingPDF(true);
      
      // Prepare report data from profileData and reportMetadata
      const personName = reportMetadata?.name || profileData?.personal_info?.name || 'Unknown';
      const socialMedia = profileData?.social_media || {};
      
      // Extract social media links
      const socialLinks = Object.entries(socialMedia)
        .filter(([_, data]: [string, any]) => data && data.url)
        .map(([platform, data]: [string, any]) => ({
          platform,
          url: data.url,
          username: data.username || data.name || ''
        }));

      const reportData = {
        personName,
        accuracy: reportMetadata?.accuracy || '0',
        location: reportMetadata?.location?.address || profileData?.personal_info?.location || 'Unknown',
        profileImage: reportMetadata?.profileImage || '',
        scanDate: new Date().toISOString(),
        reportId: profileData?.main_id || undefined,
        generatedAt: profileData?.generated_at || undefined,
        aadhar: profileData?.personal_info?.aadhar_card || null,
        pan: profileData?.personal_info?.pan_card || null,
        voter: profileData?.personal_info?.voter_id || null,
        criminalRecords: profileData?.criminal_records || [],
        socialLinks,
        publicRecords: profileData?.public_records || undefined,
        searchResults: profileData?.other || undefined,
        summary: profileData?.summary || undefined,
        databaseRecords: profileData?.database_records || undefined
      };

      await generateReportPDF(reportData);
      
      // Show success notification with person name
      Alert.alert(
        '✅ Export Successful',
        `PDF report for ${personName} has been generated and shared successfully!\\n\\nThe report has been exported and is ready to share with authorized personnel.`,
        [
          { 
            text: 'OK',
            onPress: () => {
              // Optional: Log export event
              console.log(`📄 PDF exported for: ${personName}`);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert(
        '❌ Export Failed',
        'Failed to export report. Please check your permissions and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setExportingPDF(false);
    }
  };

  // Tree container animation
  const treeContainerStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(
        treeScale.value,
        [0, 1],
        [0, 450],
        Extrapolate.CLAMP
      ),
      opacity: treeScale.value,
    };
  });

  if (!profileData) {
    return (
      <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="rgba(255,255,255,0.3)" />
          <Text style={styles.errorText}>No profile data available</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.errorButton}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Safe data extraction with error handling
  const getExternalSearch = () => {
    try {
      return profileData.external_search || {};
    } catch (error) {
      console.error('Error getting external search:', error);
      return {};
    }
  };

  const externalSearch = getExternalSearch();
  
  // Enhanced social platforms with multiple links support
  const getSocialPlatformLinks = (platform: string, data: any) => {
    if (!data) return [];
    
    const links = [];
    
    // If data is an array of links (external_search format)
    if (Array.isArray(data)) {
      data.forEach((item: any, index: number) => {
        if (item.link && item.link !== '#' && item.link !== '') {
          links.push({
            title: item.description || item.name || item.title || `Search Result ${index + 1}`,
            url: item.link,
            subtitle: item.source || 'External Link',
          });
        }
      });
    }
    // If data has a link property (social_media format)
    else if (data.link && data.link !== '#' && data.link !== '') {
      links.push({
        title: data.name || data.username || `${platform.charAt(0).toUpperCase() + platform.slice(1)} Profile`,
        url: data.link,
        subtitle: data.username || data.email || 'Profile',
      });
    }
    // If data has multiple properties with links
    else if (typeof data === 'object') {
      Object.entries(data).forEach(([key, value]: [string, any]) => {
        if (key !== 'link' && value && typeof value === 'object' && value.link) {
          links.push({
            title: value.name || value.title || key,
            url: value.link,
            subtitle: value.username || value.description || '',
          });
        }
      });
    }
    
    return links;
  };
  
  const socialPlatforms = [
    { 
      name: 'linkedin', 
      displayName: 'LinkedIn',
      icon: 'logo-linkedin', 
      color: '#0A66C2', 
      data: externalSearch.linkedin,
      links: getSocialPlatformLinks('linkedin', externalSearch.linkedin)
    },
    { 
      name: 'facebook', 
      displayName: 'Facebook',
      icon: 'logo-facebook', 
      color: '#1877F2', 
      data: externalSearch.facebook,
      links: getSocialPlatformLinks('facebook', externalSearch.facebook)
    },
    { 
      name: 'instagram', 
      displayName: 'Instagram',
      icon: 'logo-instagram', 
      color: '#E4405F', 
      data: externalSearch.instagram,
      links: getSocialPlatformLinks('instagram', externalSearch.instagram)
    },
    { 
      name: 'twitter', 
      displayName: 'Twitter',
      icon: 'logo-twitter', 
      color: '#1DA1F2', 
      data: externalSearch.twitter,
      links: getSocialPlatformLinks('twitter', externalSearch.twitter)
    },
    { 
      name: 'youtube', 
      displayName: 'YouTube',
      icon: 'logo-youtube', 
      color: '#FF0000', 
      data: externalSearch.youtube,
      links: getSocialPlatformLinks('youtube', externalSearch.youtube)
    },
    { 
      name: 'other', 
      displayName: 'Other Links',
      icon: 'ellipsis-horizontal-circle', 
      color: '#8E44AD', 
      data: externalSearch.other,
      links: getSocialPlatformLinks('other', externalSearch.other)
    },
  ];
  
  const togglePlatformExpansion = (platformName: string) => {
    if (expandedPlatform === platformName) {
      // Collapse
      subLinksHeight.value = withTiming(0, { duration: 300 });
      subLinksOpacity.value = withTiming(0, { duration: 200 });
      setTimeout(() => setExpandedPlatform(null), 300);
    } else {
      // Expand
      setExpandedPlatform(platformName);
      subLinksHeight.value = withTiming(1, { duration: 400 });
      subLinksOpacity.value = withDelay(100, withTiming(1, { duration: 300 }));
    }
  };

  return (
    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile Details</Text>
          <TouchableOpacity
            onPress={handleExportPDF}
            style={styles.exportButton}
            disabled={exportingPDF}
          >
            {exportingPDF ? (
              <ActivityIndicator color="rgba(255,255,255,0.8)" size="small" />
            ) : (
              <Ionicons name="cloud-upload-outline" size={24} color="rgba(255,255,255,0.8)" />
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.cardGradient}
          >
            <View style={styles.profileHeader}>
              <Image
                source={{ uri: String(reportMetadata?.profileImage || params.profileImage || 'https://ui-avatars.com/api/?name=Unknown&size=300&background=007AFF&color=fff') }}
                style={styles.profileImageSmall}
                defaultSource={require('@/assets/images/react-logo.png')}
                onError={(e) => console.log('Profile image load error:', e.nativeEvent.error)}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.profileNameSmall}>
                  {String(reportMetadata?.name || profileData?.personal_info?.name || 'Unknown')}
                </Text>
                <View style={styles.locationContainerSmall}>
                  <Ionicons name="location" size={12} color="rgba(255,255,255,0.5)" />
                  <Text style={styles.locationTextSmall}>
                    {String(reportMetadata?.location?.address || 
                     profileData?.personal_info?.location || 
                     'Unknown')}
                  </Text>
                </View>
              </View>
              <View style={styles.accuracyBadgeSmall}>
                <Text style={styles.accuracyTextSmall}>
                  {String(reportMetadata?.accuracy || params.accuracy || '0')}%
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Social Media Link Tree */}
        <View style={styles.linkTreeContainer}>
          <TouchableOpacity
            style={styles.linkTreeButton}
            onPress={toggleTree}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
              style={styles.linkTreeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="git-network" size={24} color="rgba(255,255,255,0.9)" />
              <Text style={styles.linkTreeText}>
                {treeExpanded ? 'Hide' : 'Show'} Social Links
              </Text>
              <Ionicons
                name={treeExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#fff"
              />
            </LinearGradient>
          </TouchableOpacity>

          <Animated.View style={[styles.treeContainer, treeContainerStyle]}>
            <View style={styles.treeCenter}>
              {/* SVG for curved branches */}
              <Svg
                height="450"
                width="300"
                style={styles.svgContainer}
                viewBox="0 0 300 450"
              >
                {socialPlatforms.map((platform, index) => (
                  <AnimatedPath
                    key={`path-${platform.name}`}
                    animatedProps={allPathProps[index]}
                    stroke="rgba(0, 212, 255, 0.4)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                ))}
              </Svg>

              {/* Central Profile Circle */}
              <View style={styles.centralCircle}>
                <Ionicons name="person" size={32} color="rgba(255,255,255,0.9)" />
              </View>

              {/* Social media buttons */}
              {socialPlatforms.map((platform, index) => {
                const isExpanded = expandedPlatform === platform.name;
                const hasMultipleLinks = platform.links.length > 1;
                
                return (
                  <Animated.View
                    key={platform.name}
                    style={[
                      styles.branchContainer,
                      branchStyles[index],
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.socialBranch, 
                        { backgroundColor: platform.color },
                        isExpanded && styles.socialBranchExpanded
                      ]}
                      onPress={() => {
                        if (hasMultipleLinks) {
                          togglePlatformExpansion(platform.name);
                        } else if (platform.links.length === 1) {
                          openLink(platform.links[0].url);
                        }
                      }}
                      onLongPress={() => {
                        if (platform.links.length > 0) {
                          openLink(platform.links[0].url);
                        }
                      }}
                      activeOpacity={0.8}
                      disabled={platform.links.length === 0}
                    >
                      <Ionicons 
                        name={platform.icon as any} 
                        size={24} 
                        color="#fff" 
                      />
                      {hasMultipleLinks && (
                        <View style={styles.linkCountBadge}>
                          <Text style={styles.linkCountText}>{platform.links.length}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

          {/* Modal Dialog for Expanded Links - Inside Tree Container */}
          {expandedPlatform && (() => {
            const platform = socialPlatforms.find(p => p.name === expandedPlatform);
            if (!platform || platform.links.length <= 1) return null;
            
            return (
              <View style={styles.modalOverlayInTree}>
                <TouchableOpacity
                  style={styles.modalOverlayTouchable}
                  onPress={() => togglePlatformExpansion(expandedPlatform)}
                  activeOpacity={1}
                />
                <Animated.View
                  entering={FadeInDown.duration(300).springify()}
                  style={[
                    styles.modalContentInTree,
                    { 
                      backgroundColor: 'rgba(20,20,30,0.95)',
                      borderColor: platform.color + '60'
                    }
                  ]}
                >
                  <View style={styles.modalHeader}>
                    <View style={[styles.modalIcon, { backgroundColor: platform.color }]}>
                      <Ionicons name={platform.icon as any} size={24} color="#fff" />
                    </View>
                    <View style={styles.modalHeaderText}>
                      <Text style={styles.modalTitle}>{platform.displayName}</Text>
                      <Text style={styles.modalSubtitle}>
                        {platform.links.length} link{platform.links.length > 1 ? 's' : ''} available
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => togglePlatformExpansion(expandedPlatform)}
                      style={styles.modalCloseButton}
                    >
                      <Ionicons name="close" size={24} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                  </View>
                  
                  <ScrollView style={styles.modalLinksScroll} showsVerticalScrollIndicator={false}>
                    {platform.links.map((link, linkIndex) => (
                      <Animated.View
                        key={linkIndex}
                        entering={FadeInDown.delay(linkIndex * 50).duration(300)}
                      >
                        <TouchableOpacity
                          style={styles.modalLinkItem}
                          onPress={() => {
                            openLink(link.url);
                            togglePlatformExpansion(expandedPlatform);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.modalLinkIcon, { backgroundColor: platform.color }]}>
                            <Ionicons name={platform.icon as any} size={18} color="#fff" />
                          </View>
                          <View style={styles.modalLinkInfo}>
                            <Text style={styles.modalLinkTitle} numberOfLines={2}>
                              {link.title}
                            </Text>
                            {link.subtitle && (
                              <Text style={styles.modalLinkSubtitle} numberOfLines={1}>
                                {link.subtitle}
                              </Text>
                            )}
                          </View>
                          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </ScrollView>
                </Animated.View>
              </View>
            );
          })()}
        </View>

        {/* Public Records */}
        {profileData?.public_records && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={24} color="rgba(255,255,255,0.7)" />
              <Text style={styles.sectionTitle}>Public Records</Text>
            </View>
            
            {profileData.public_records?.business_records?.description && (
              <View style={styles.recordItem}>
                <View style={styles.recordIcon}>
                  <Ionicons name="business" size={20} color="rgba(255,255,255,0.7)" />
                </View>
                <View style={styles.recordContent}>
                  <Text style={styles.recordTitle}>Business Records</Text>
                  <Text style={styles.recordDescription}>
                    {String(profileData.public_records.business_records.description)}
                  </Text>
                </View>
              </View>
            )}

            {profileData.public_records?.property_records?.description && (
              <View style={styles.recordItem}>
                <View style={styles.recordIcon}>
                  <Ionicons name="home" size={20} color="rgba(255,255,255,0.7)" />
                </View>
                <View style={styles.recordContent}>
                  <Text style={styles.recordTitle}>Property Records</Text>
                  <Text style={styles.recordDescription}>
                    {String(profileData.public_records.property_records.description)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Database Records */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="server" size={24} color="rgba(255,255,255,0.7)" />
            <Text style={styles.sectionTitle}>Database Records</Text>
          </View>
          
          {profileData?.database_records && Object.keys(profileData.database_records || {}).length > 0 ? (
            <View style={styles.databaseList}>
              {Object.entries(profileData.database_records || {}).map(([key, value]: [string, any], dbIndex) => {
                // Safe handling of record data
                const recordCount = Array.isArray(value) ? value.length : 0;
                const isExpanded = expandedDatabase === key;
                
                // Get icon for database type
                const getIcon = () => {
                  try {
                    switch(key.toLowerCase()) {
                      case 'aadhar': return 'card';
                      case 'pan': return 'wallet';
                      case 'criminal': return 'alert-circle';
                      case 'voter': return 'checkbox';
                      default: return 'document';
                    }
                  } catch (error) {
                    return 'document';
                  }
                };
                
                return (
                  <Animated.View 
                    key={key}
                    entering={FadeIn.delay(dbIndex * 100).duration(400)}
                    style={styles.databaseItemContainer}
                  >
                    <TouchableOpacity
                      style={[
                        styles.databaseItemFull,
                        recordCount > 0 && styles.databaseItemClickable,
                        isExpanded && styles.databaseItemExpanded,
                      ]}
                      onPress={() => {
                        if (recordCount > 0) {
                          setExpandedDatabase(isExpanded ? null : key);
                        }
                      }}
                      disabled={recordCount === 0}
                      activeOpacity={0.7}
                    >
                      <View style={styles.databaseItemContent}>
                        <View style={styles.databaseIconContainer}>
                          <View style={styles.databaseIconCircle}>
                            <Ionicons name={getIcon() as any} size={24} color="rgba(255,255,255,0.7)" />
                          </View>
                        </View>
                        
                        <View style={styles.databaseInfo}>
                          <Text style={styles.databaseLabelFull}>
                            {key.toUpperCase()}
                          </Text>
                          <Text style={styles.databaseSubtext}>
                            {recordCount === 0 ? 'No records found' : `${recordCount} record${recordCount > 1 ? 's' : ''} available`}
                          </Text>
                        </View>
                        
                        <View style={styles.databaseActions}>
                          <View style={[
                            styles.recordBadge,
                            recordCount === 0 && styles.recordBadgeEmpty
                          ]}>
                            <Text style={[
                              styles.recordBadgeText,
                              recordCount === 0 && styles.recordBadgeTextEmpty
                            ]}>
                              {recordCount}
                            </Text>
                          </View>
                          {recordCount > 0 && (
                            <Ionicons 
                              name={isExpanded ? "chevron-up" : "chevron-down"} 
                              size={20} 
                              color="rgba(255,255,255,0.6)" 
                              style={styles.chevronIcon}
                            />
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Expanded Details with Animation */}
                    {isExpanded && recordCount > 0 && (
                      <Animated.View 
                        entering={FadeInDown.duration(400)}
                        style={styles.databaseDetails}
                      >
                        {(value as any[]).map((record: any, index: number) => (
                          <Animated.View
                            key={index}
                            entering={FadeIn.delay(index * 100).duration(300)}
                            style={styles.recordDetailCard}
                          >
                            <View style={styles.recordDetailHeader}>
                              <View style={styles.recordIconCircle}>
                                <Ionicons name="document-text" size={16} color="rgba(255,255,255,0.7)" />
                              </View>
                              <Text style={styles.recordDetailTitle}>
                                {key.toUpperCase()} Record {(value as any[]).length > 1 ? `#${index + 1}` : ''}
                              </Text>
                            </View>
                            
                            {/* Render all fields */}
                            {Object.entries(record).map(([field, fieldValue]: [string, any]) => {
                              try {
                                // Skip photo links and base64 encoded data
                                if (field.includes('photo') || field.includes('image') || 
                                    (typeof fieldValue === 'string' && fieldValue.length > 200)) {
                                  return null;
                                }
                                
                                // Format field name
                                const formattedField = field
                                  .replace(/_/g, ' ')
                                  .replace(/\b\w/g, c => c.toUpperCase());
                                
                                // Format field value
                                let displayValue = 'N/A';
                                if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
                                  displayValue = String(fieldValue);
                                }
                                
                                return (
                                  <View key={field} style={styles.recordDetailRow}>
                                    <Text style={styles.recordDetailLabel}>
                                      {formattedField}
                                    </Text>
                                    <Text style={styles.recordDetailValue}>
                                      {displayValue}
                                    </Text>
                                  </View>
                                );
                              } catch (error) {
                                console.error('Error rendering field:', field, error);
                                return null;
                              }
                            })}
                          </Animated.View>
                        ))}
                      </Animated.View>
                    )}
                  </Animated.View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={48} color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyText}>No database records found</Text>
            </View>
          )}
        </View>

        {/* Extra Links Section */}
        {(() => {
          try {
            const extraLinks = [];
            
            // Helper function to validate URL
            const isValidUrl = (url: any) => {
              return url && 
                     typeof url === 'string' && 
                     url !== '#' && 
                     url !== '' && 
                     url !== 'undefined' && 
                     url !== 'null' &&
                     (url.startsWith('http://') || url.startsWith('https://'));
            };
            
            if (isValidUrl(profileData?.facebook)) {
              extraLinks.push({ 
                platform: 'Facebook', 
                url: profileData.facebook, 
                icon: 'logo-facebook', 
                color: '#1877F2' 
              });
            }
            if (isValidUrl(profileData?.instagram)) {
              extraLinks.push({ 
                platform: 'Instagram', 
                url: profileData.instagram, 
                icon: 'logo-instagram', 
                color: '#E4405F' 
              });
            }
            if (isValidUrl(profileData?.linkedin)) {
              extraLinks.push({ 
                platform: 'LinkedIn', 
                url: profileData.linkedin, 
                icon: 'logo-linkedin', 
                color: '#0A66C2' 
              });
            }
            if (isValidUrl(profileData?.twitter)) {
              extraLinks.push({ 
                platform: 'Twitter', 
                url: profileData.twitter, 
                icon: 'logo-twitter', 
                color: '#1DA1F2' 
              });
            }
            
            return extraLinks.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="link" size={24} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.sectionTitle}>Extra Links</Text>
                </View>
                
                <View style={styles.extraLinksContainer}>
                  {extraLinks.map((link, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.extraLinkItem}
                      onPress={() => openLink(link.url)}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={[link.color + '40', link.color + '20']}
                        style={styles.extraLinkGradient}
                      >
                        <View style={[styles.extraLinkIcon, { backgroundColor: link.color }]}>
                          <Ionicons name={link.icon as any} size={20} color="#fff" />
                        </View>
                        <Text style={styles.extraLinkText}>{link.platform}</Text>
                        <Ionicons name="open-outline" size={18} color="rgba(255,255,255,0.6)" />
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null;
          } catch (error) {
            console.error('Error rendering extra links:', error);
            return null;
          }
        })()}

        {/* Other Information */}
        {profileData?.other && Array.isArray(profileData.other) && profileData.other.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="search" size={24} color="rgba(255,255,255,0.7)" />
              <Text style={styles.sectionTitle}>Search Results</Text>
            </View>
            
            {profileData.other.map((item: any, index: number) => {
              if (!item) return null;
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.searchItem}
                  onPress={() => openLink(item?.link)}
                  disabled={!item?.link || item.link === '#' || item.link === ''}
                >
                  <View style={styles.searchIcon}>
                    <Ionicons name="globe" size={20} color="rgba(255,255,255,0.7)" />
                  </View>
                  <View style={styles.searchContent}>
                    <Text style={styles.searchSource}>{String(item?.source || 'Unknown')}</Text>
                    <Text style={styles.searchDescription} numberOfLines={2}>
                      {String(item?.description || 'No description')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Summary Section - Enhanced with scrollable analysis */}
        <View style={[styles.section, { marginBottom: 30 }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics" size={24} color="rgba(255,255,255,0.7)" />
            <Text style={styles.sectionTitle}>Investigation Summary</Text>
          </View>
          
          {/* Summary Stats Grid */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryCardHeader}>
                <Ionicons name="shield-checkmark" size={20} color="#00ff88" />
                <Text style={styles.summaryCardLabel}>Identity Verified</Text>
              </View>
              <View style={[
                styles.summaryBadgeLarge,
                { backgroundColor: profileData?.summary?.identity_verified ? 'rgba(0,255,136,0.2)' : 'rgba(255,71,87,0.2)' }
              ]}>
                <Text style={[
                  styles.summaryBadgeTextLarge,
                  { color: profileData?.summary?.identity_verified ? '#00ff88' : '#ff4757' }
                ]}>
                  {profileData?.summary?.identity_verified ? 'VERIFIED' : 'UNVERIFIED'}
                </Text>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryCardHeader}>
                <Ionicons name="earth" size={20} color="#00d4ff" />
                <Text style={styles.summaryCardLabel}>Digital Presence</Text>
              </View>
              <View style={[
                styles.summaryBadgeLarge,
                { backgroundColor: profileData?.summary?.digital_presence ? 'rgba(0,212,255,0.2)' : 'rgba(255,71,87,0.2)' }
              ]}>
                <Text style={[
                  styles.summaryBadgeTextLarge,
                  { color: profileData?.summary?.digital_presence ? '#00d4ff' : '#ff4757' }
                ]}>
                  {profileData?.summary?.digital_presence ? 'ACTIVE' : 'INACTIVE'}
                </Text>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryCardHeader}>
                <Ionicons name="warning" size={20} color="#ffa500" />
                <Text style={styles.summaryCardLabel}>Criminal Records</Text>
              </View>
              <View style={[
                styles.summaryBadgeLarge,
                { backgroundColor: (profileData?.summary?.criminal_records || 0) > 0 ? 'rgba(255,71,87,0.2)' : 'rgba(0,255,136,0.2)' }
              ]}>
                <Text style={[
                  styles.summaryBadgeTextLarge,
                  { color: (profileData?.summary?.criminal_records || 0) > 0 ? '#ff4757' : '#00ff88' }
                ]}>
                  {profileData?.summary?.criminal_records || 0}
                </Text>
              </View>
            </View>
          </View>

          {/* Data Sources Matched */}
          {(() => {
            try {
              const dataSources = profileData?.summary?.data_sources_matched;
              if (dataSources && Array.isArray(dataSources) && dataSources.length > 0) {
                return (
                  <View style={styles.dataSourcesContainer}>
                    <Text style={styles.dataSourcesLabel}>
                      <Ionicons name="checkmark-circle" size={16} color="#00ff88" /> Data Sources Matched
                    </Text>
                    <View style={styles.dataSourcesChips}>
                      {dataSources.map((source: string, index: number) => (
                        <View key={index} style={styles.dataSourceChip}>
                          <Ionicons name="checkmark-circle" size={12} color="#00ff88" />
                          <Text style={styles.dataSourceChipText}>
                            {String(source).toUpperCase()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              }
              return null;
            } catch (error) {
              console.error('Error rendering data sources:', error);
              return null;
            }
          })()}

          {/* Report Metadata */}
          <View style={styles.reportMetadata}>
            <View style={styles.metadataItem}>
              <Ionicons name="document-text" size={16} color="rgba(255,255,255,0.5)" />
              <Text style={styles.metadataLabel}>Report ID:</Text>
              <Text style={styles.metadataValue} numberOfLines={1}>
                {String(profileData?.main_id || 'N/A')}
              </Text>
            </View>

            {profileData?.sub_id && (
              <View style={styles.metadataItem}>
                <Ionicons name="filing" size={16} color="rgba(255,255,255,0.5)" />
                <Text style={styles.metadataLabel}>Sub ID:</Text>
                <Text style={styles.metadataValue} numberOfLines={1}>
                  {String(profileData.sub_id)}
                </Text>
              </View>
            )}

            <View style={styles.metadataItem}>
              <Ionicons name="time" size={16} color="rgba(255,255,255,0.5)" />
              <Text style={styles.metadataLabel}>Generated:</Text>
              <Text style={styles.metadataValue}>
                {(() => {
                  try {
                    if (profileData?.generated_at) {
                      return new Date(profileData.generated_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                    }
                    return 'N/A';
                  } catch (error) {
                    console.error('Error formatting date:', error);
                    return 'N/A';
                  }
                })()}
              </Text>
            </View>
          </View>

          {/* Scrollable Analysis Section */}
          {(() => {
            try {
              const analysis = profileData?.summary?.short_analysis;
              if (analysis && typeof analysis === 'string' && analysis.trim() !== '') {
                return (
                  <View style={styles.analysisContainer}>
                    <View style={styles.analysisHeader}>
                      <Ionicons name="document-text-outline" size={20} color="rgba(255,255,255,0.7)" />
                      <Text style={styles.analysisTitle}>Detailed Analysis</Text>
                      <View style={styles.scrollIndicator}>
                        <Ionicons name="swap-vertical" size={16} color="rgba(255,255,255,0.5)" />
                      </View>
                    </View>
                    <ScrollView 
                      style={styles.analysisScroll}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                      persistentScrollbar={true}
                    >
                      <Text style={styles.analysisText}>
                        {String(analysis)}
                      </Text>
                    </ScrollView>
                  </View>
                );
              }
              return null;
            } catch (error) {
              console.error('Error rendering analysis:', error);
              return null;
            }
          })()}
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  headerTitle: {
    fontSize: Typography.large,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 15,
  },
  profileCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileImageSmall: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileInfo: {
    flex: 1,
  },
  profileNameSmall: {
    fontSize: Typography.medium,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  locationContainerSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationTextSmall: {
    fontSize: Typography.small,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
  },
  accuracyBadgeSmall: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
  },
  accuracyTextSmall: {
    fontSize: Typography.small,
    fontWeight: '700',
    color: '#34C759',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 15,
  },
  profileName: {
    fontSize: Typography.large,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationText: {
    fontSize: Typography.medium,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.large,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: Typography.small,
    color: 'rgba(255,255,255,0.6)',
  },
  linkTreeContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  linkTreeButton: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
  },
  linkTreeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  linkTreeText: {
    fontSize: Typography.medium,
    fontWeight: '600',
    color: '#fff',
  },
  treeContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    marginTop: 20,
  },
  treeCenter: {
    width: 300,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  centralCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  branchContainer: {
    position: 'absolute',
    zIndex: 5,
  },
  socialBranch: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  socialBranchExpanded: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    transform: [{ scale: 1.1 }],
  },
  linkCountBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  linkCountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  subLinksContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -110 }, { translateY: -100 }],
    width: 220,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 100,
  },
  subLinksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  subLinksPlatformName: {
    fontSize: Typography.small + 1,
    fontWeight: '700',
    color: '#fff',
  },
  subLinksCount: {
    fontSize: Typography.small - 1,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  subLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    gap: 8,
  },
  subLinkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subLinkInfo: {
    flex: 1,
  },
  subLinkTitle: {
    fontSize: Typography.small,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  subLinkSubtitle: {
    fontSize: Typography.small - 2,
    color: 'rgba(255,255,255,0.6)',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 15,
    padding: 20,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: Typography.medium,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  recordItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recordContent: {
    flex: 1,
  },
  recordTitle: {
    fontSize: Typography.medium,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  recordDescription: {
    fontSize: Typography.small,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  databaseList: {
    gap: 12,
  },
  databaseItemContainer: {
    width: '100%',
  },
  databaseItemFull: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  databaseItemClickable: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  databaseItemExpanded: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1.5,
  },
  databaseItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  databaseIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  databaseIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  databaseInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  databaseLabelFull: {
    fontSize: Typography.medium,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  databaseSubtext: {
    fontSize: Typography.small,
    color: 'rgba(255,255,255,0.5)',
  },
  databaseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recordBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  recordBadgeEmpty: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  recordBadgeText: {
    fontSize: Typography.medium,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.9)',
  },
  recordBadgeTextEmpty: {
    color: 'rgba(255,255,255,0.4)',
  },
  chevronIcon: {
    marginLeft: 5,
  },
  databaseDetails: {
    marginTop: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  recordDetailCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255,255,255,0.3)',
  },
  recordDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  recordIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordDetailTitle: {
    fontSize: Typography.small,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  recordDetailRow: {
    marginBottom: 10,
  },
  recordDetailLabel: {
    fontSize: Typography.small,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 3,
    fontWeight: '500',
  },
  recordDetailValue: {
    fontSize: Typography.small,
    color: '#fff',
    fontWeight: '400',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: Typography.small,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 10,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 10,
  },
  searchIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  searchContent: {
    flex: 1,
  },
  searchSource: {
    fontSize: Typography.small,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  searchDescription: {
    fontSize: Typography.small,
    color: 'rgba(255,255,255,0.8)',
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  summaryLabel: {
    fontSize: Typography.small,
    color: 'rgba(255,255,255,0.7)',
  },
  summaryValue: {
    fontSize: Typography.small,
    color: '#fff',
    fontWeight: '500',
  },
  summaryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  summaryBadgeText: {
    fontSize: Typography.small,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Extra Links Styles
  extraLinksContainer: {
    gap: 10,
  },
  extraLinkItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  extraLinkGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  extraLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraLinkText: {
    flex: 1,
    fontSize: Typography.medium,
    fontWeight: '600',
    color: '#fff',
  },
  // Enhanced Summary Styles
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  summaryCardLabel: {
    fontSize: Typography.small - 1,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  summaryBadgeLarge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBadgeTextLarge: {
    fontSize: Typography.small,
    fontWeight: 'bold',
  },
  dataSourcesContainer: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: 'rgba(0,255,136,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.2)',
  },
  dataSourcesLabel: {
    fontSize: Typography.small,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: 10,
  },
  dataSourcesChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dataSourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  dataSourceChipText: {
    fontSize: Typography.small - 1,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  reportMetadata: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metadataLabel: {
    fontSize: Typography.small,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
    minWidth: 80,
  },
  metadataValue: {
    flex: 1,
    fontSize: Typography.small,
    color: 'rgba(255,255,255,0.8)',
  },
  analysisContainer: {
    backgroundColor: 'rgba(0,212,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
    overflow: 'hidden',
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    backgroundColor: 'rgba(0,212,255,0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,212,255,0.2)',
  },
  analysisTitle: {
    flex: 1,
    fontSize: Typography.medium,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  scrollIndicator: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 4,
  },
  analysisScroll: {
    maxHeight: 300,
    padding: 15,
  },
  analysisText: {
    fontSize: Typography.small,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
    textAlign: 'justify',
  },
  errorText: {
    fontSize: Typography.medium,
    color: '#fff',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorButton: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  errorButtonText: {
    fontSize: Typography.medium,
    color: '#fff',
    fontWeight: '600',
  },
  // Modal styles
  modalOverlayInTree: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalOverlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContentInTree: {
    width: 300,
    maxHeight: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 1001,
    overflow: 'hidden',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    maxHeight: '70%',
    borderRadius: 20,
    borderWidth: 2,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  modalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: Typography.medium + 2,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: Typography.small - 1,
    color: 'rgba(255,255,255,0.5)',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLinksScroll: {
    maxHeight: 400,
    padding: 16,
    paddingTop: 12,
  },
  modalLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLinkInfo: {
    flex: 1,
  },
  modalLinkTitle: {
    fontSize: Typography.small,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  modalLinkSubtitle: {
    fontSize: Typography.small - 2,
    color: 'rgba(255,255,255,0.4)',
  },
});
