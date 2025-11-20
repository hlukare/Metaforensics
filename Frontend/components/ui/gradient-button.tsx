import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '@/constants/theme';
import { rs, hp } from '@/utils/responsive';

interface GradientButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
}

export function GradientButton({
  title,
  loading = false,
  variant = 'primary',
  disabled,
  ...props
}: GradientButtonProps) {
  const colors: readonly [string, string, ...string[]] =
    variant === 'primary'
      ? ['#007AFF', '#0051D5']
      : ['#5856D6', '#3634A3'];

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.buttonText}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: rs(12),
    overflow: 'hidden',
    marginVertical: rs(8),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  gradient: {
    paddingVertical: rs(16),
    paddingHorizontal: rs(24),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: hp(6),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: Typography.medium,
    fontWeight: '600',
  },
});
