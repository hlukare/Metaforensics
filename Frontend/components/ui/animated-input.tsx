import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Typography } from '@/constants/theme';
import { rs, hp } from '@/utils/responsive';

interface AnimatedInputProps extends TextInputProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
}

export function AnimatedInput({
  label,
  icon,
  error,
  secureTextEntry,
  ...props
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={error ? '#FF3B30' : isFocused ? '#007AFF' : 'rgba(255,255,255,0.5)'}
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholderTextColor="rgba(255,255,255,0.4)"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeButton}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="rgba(255,255,255,0.5)"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Animated.Text entering={FadeInDown.duration(300)} style={styles.errorText}>
          {error}
        </Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: rs(16),
  },
  label: {
    fontSize: Typography.small,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: rs(8),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: rs(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: rs(12),
    height: hp(6),
    minHeight: 50,
  },
  inputContainerFocused: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  inputContainerError: {
    borderColor: '#FF3B30',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  icon: {
    marginRight: rs(8),
  },
  input: {
    flex: 1,
    fontSize: Typography.medium,
    color: '#FFFFFF',
    paddingVertical: rs(12),
  },
  eyeButton: {
    padding: rs(4),
  },
  errorText: {
    fontSize: Typography.small,
    color: '#FF3B30',
    marginTop: rs(4),
    marginLeft: rs(4),
  },
});
