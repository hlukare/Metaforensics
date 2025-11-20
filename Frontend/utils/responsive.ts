import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11/12/13 as reference)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

/**
 * Responsive width - scales based on screen width
 */
export const wp = (percentage: number): number => {
  const value = (percentage * SCREEN_WIDTH) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

/**
 * Responsive height - scales based on screen height
 */
export const hp = (percentage: number): number => {
  const value = (percentage * SCREEN_HEIGHT) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

/**
 * Responsive font size - scales based on screen width
 */
export const rfs = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

/**
 * Responsive spacing - scales based on screen width
 */
export const rs = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(size * scale);
};

/**
 * Check if device is a tablet
 */
export const isTablet = (): boolean => {
  const pixelDensity = PixelRatio.get();
  const adjustedWidth = SCREEN_WIDTH * pixelDensity;
  const adjustedHeight = SCREEN_HEIGHT * pixelDensity;
  
  if (pixelDensity < 2 && (adjustedWidth >= 1000 || adjustedHeight >= 1000)) {
    return true;
  }
  
  return (
    (SCREEN_WIDTH >= 768 && SCREEN_HEIGHT >= 1024) ||
    (SCREEN_WIDTH >= 1024 && SCREEN_HEIGHT >= 768)
  );
};

/**
 * Check if device is a small phone
 */
export const isSmallDevice = (): boolean => {
  return SCREEN_WIDTH < 375 || SCREEN_HEIGHT < 667;
};

/**
 * Get responsive value based on device size
 */
export const getResponsiveValue = (small: number, medium: number, large: number): number => {
  if (isTablet()) return large;
  if (isSmallDevice()) return small;
  return medium;
};

export const dimensions = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmallDevice: isSmallDevice(),
  isTablet: isTablet(),
};
