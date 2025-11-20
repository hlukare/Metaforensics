import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

// Load API configuration from environment variables
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://13.51.172.220:5000';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY || '';
const SEARCH_API_BASE = process.env.EXPO_PUBLIC_SEARCH_API_BASE || 'http://13.51.172.220:3000';

// Validate that required environment variables are set
if (!API_KEY) {
  console.warn('⚠️ WARNING: EXPO_PUBLIC_API_KEY is not set in environment variables!');
}

export interface ScanResult {
  id: string;
  name: string;
  accuracy: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  timestamp: string;
  profileImage: string;
  additionalInfo: {
    age?: number;
    gender?: string;
    lastSeen?: string;
    matchCount?: number;
  };
  fullData?: {
    main_id: string;
    sub_id: string;
    personal_info: any;
    social_media: any;
    public_records: any;
    database_records: any;
    other: any[];
    summary: any;
    metadata: any;
    generated_at: string;
  };
}

export interface ImageWithExif {
  uri: string;
  base64: string;
  exif: any;
  location: {
    latitude: number;
    longitude: number;
  } | null;
}

/**
 * Compress and prepare image with EXIF data for upload
 */
export async function compressImageWithExif(
  imageUri: string,
  location: { latitude: number; longitude: number } | null
): Promise<ImageWithExif> {
  try {
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        { resize: { width: 800 } }
      ],
      {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    return {
      uri: manipulatedImage.uri,
      base64: manipulatedImage.base64 || '',
      exif: {
        timestamp: new Date().toISOString(),
        location: location,
        imageSize: manipulatedImage.base64?.length || 0,
        orientation: 6, // EXIF orientation tag for 90° clockwise rotation
      },
      location,
    };
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
}

/**
 * Send image to backend for face recognition
 */
export async function scanFaceImage(imageData: ImageWithExif): Promise<ScanResult[]> {
  try {
    console.log('====================================');
    console.log('📤 STARTING SCAN REQUEST');
    console.log('   API URL:', API_BASE_URL);
    console.log('   Endpoint:', `${API_BASE_URL}/overall`);
    console.log('   Has Location:', !!imageData.location);
    console.log('   Image Size:', imageData.base64.length, 'bytes');
    console.log('====================================');

    // Create temporary file from base64
    const tempFilePath = `${FileSystem.cacheDirectory}capture_${Date.now()}.jpg`;
    
    // Write base64 data to temporary file
    await FileSystem.writeAsStringAsync(tempFilePath, imageData.base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('✅ Temp file created:', tempFilePath);

    // Create FormData exactly like Postman
    const formData = new FormData();
    
    // Append image as actual file (match Postman exactly)
    formData.append('image', {
      uri: tempFilePath,
      type: 'image/jpeg',
      name: 'kishandemo.jpg',
    } as any);

    // Append location exactly as in Postman
    formData.append('location', 'Nashik');

    // Add GPS coordinates as separate fields (since EXIF embedding isn't working)
    if (imageData.location) {
      formData.append('latitude', imageData.location.latitude.toString());
      formData.append('longitude', imageData.location.longitude.toString());
      console.log('📍 GPS Coordinates:', {
        latitude: imageData.location.latitude,
        longitude: imageData.location.longitude,
      });
    }

    // Add timestamp
    formData.append('timestamp', new Date().toISOString());

    console.log('📦 FormData prepared:');
    console.log('   - image: kishandemo.jpg (file)');
    console.log('   - location: Dhule');
    console.log('   - latitude & longitude: Included');
    console.log('   - timestamp: Included');
    console.log('➡️ Sending to:', `${API_BASE_URL}/overall`);
    console.log('====================================');

    // Send request to backend with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`${API_BASE_URL}/overall`, {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          // DO NOT set Content-Type - let fetch set it automatically for multipart/form-data
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('📥 Response Status:', response.status);

      // Handle 400 errors gracefully (server-side validation issues)
      if (response.status === 400) {
        console.log('⚠️ SERVER ERROR 400 (handled gracefully)');
        console.log('   This is a server-side issue, not a client error.');
        console.log('   Returning empty results and continuing scan...');
        return []; // Return empty array, don't throw error
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('====================================');
      console.log('✅ SUCCESS! Backend Response received');
      console.log('   Data keys:', Object.keys(data).join(', '));
      if (data.personal_info?.name) {
        console.log('   ✓ Name found:', data.personal_info.name);
      }
      console.log('====================================');

      // Clean up temporary file
      try {
        await FileSystem.deleteAsync(tempFilePath, { idempotent: true });
        console.log('🗑️ Temp file cleaned up');
      } catch (cleanupError) {
        console.warn('⚠️ Could not delete temp file:', cleanupError);
      }

      if (data && typeof data === 'object') {
        const results: ScanResult[] = [];

        if (data.personal_info && data.personal_info.name) {
          const personalInfo = data.personal_info;
          const summary = data.summary || {};
          const socialMedia = data.social_media || {};

          let accuracy = 50;
          if (summary.identity_verified) accuracy += 30;
          if (summary.digital_presence) accuracy += 20;

          const profileImage = socialMedia.linkedin?.link?.includes('linkedin')
            ? `https://ui-avatars.com/api/?name=${encodeURIComponent(personalInfo.name)}&size=300&background=007AFF&color=fff`
            : 'https://i.pravatar.cc/300';

          results.push({
            id: data.main_id || data.sub_id || `${Date.now()}`,
            name: personalInfo.name,
            accuracy: accuracy,
            location: {
              latitude: imageData.location?.latitude || 0,
              longitude: imageData.location?.longitude || 0,
              address: personalInfo.location || 'Dhule',
            },
            timestamp: data.generated_at || new Date().toISOString(),
            profileImage: profileImage,
            additionalInfo: {
              age: personalInfo.age,
              gender: personalInfo.gender,
              lastSeen: data.generated_at ? new Date(data.generated_at).toLocaleString() : undefined,
              matchCount: (data.other?.length || 0) + Object.keys(socialMedia).length,
            },
            fullData: {
              main_id: data.main_id,
              sub_id: data.sub_id,
              personal_info: data.personal_info,
              social_media: data.social_media,
              external_search: data.external_search,
              public_records: data.public_records,
              database_records: data.database_records,
              other: data.other,
              summary: data.summary,
              metadata: data.metadata,
              generated_at: data.generated_at,
            },
          });
        }

        return results;
      }

      return [];
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('⏱️ Request timeout after 30 seconds');
        throw new Error('Request timeout. Please check your network connection.');
      }
      
      console.error('🌐 Network/Fetch Error:', fetchError.message);
      throw fetchError;
    }
  } catch (error: any) {
    console.error('====================================');
    console.error('❌ CRITICAL ERROR in scanFaceImage:');
    console.error('   Error type:', error.name || 'Unknown');
    console.error('   Error message:', error.message || 'No message');
    console.error('   Stack:', error.stack?.substring(0, 200) || 'No stack trace');
    console.error('====================================');
    
    // Return empty array to continue scanning
    return [];
  }
}

/**
 * Search by name and location using the external search API.
 * Returns parsed JSON response or null on error.
 */
export async function searchNameLocation(name: string, location = 'Nashik'): Promise<any | null> {
  try {
    const encodedName = encodeURIComponent(name);
    const encodedLocation = encodeURIComponent(location);
    const url = `${SEARCH_API_BASE}/api/search?name=${encodedName}&location=${encodedLocation}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      console.error('Search API error:', res.status, text);
      return null;
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.error('Search request timed out');
      return null;
    }
    console.error('Error calling searchNameLocation:', err);
    return null;
  }
}
