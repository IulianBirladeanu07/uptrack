import { useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { normalize } from '../../../../../shared/hooks/useResponsive';

const colors = {
  bg: '#0A0E13',
  surface: '#151B23',
  surfaceLight: '#1F2937',
  primary: '#FF9500',
  primaryDark: '#E68600',
  success: '#32D74B',
  warning: '#FF9F0A',
  purple: '#9333EA',
  cyan: '#00d4ff',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
};

const COLORS = {
  primary: colors.primary,
  secondary: colors.bg,
  card: colors.surface,
  text: colors.textPrimary,
  textMuted: colors.textTertiary,
  error: '#FCA5A5',
  success: colors.success,
  borderVariations: [
    'rgba(255, 149, 0, 0.2)',
    'rgba(0, 212, 255, 0.2)',
    'rgba(168, 85, 247, 0.2)',
  ],
};

const Notification = ({ message, isError, action, visible, onDismiss }) => {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timeout = setTimeout(() => {
        onDismiss();
      }, 4000);

      return () => clearTimeout(timeout);
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, onDismiss, translateY, opacity]);

  const handleActionPress = useCallback(() => {
    if (action?.onPress) {
      action.onPress();
    }
    onDismiss();
  }, [action, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.alertContainer,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: COLORS.card,
          borderColor: isError ? COLORS.error : COLORS.borderVariations[0],
        },
      ]}
    >
      <View style={styles.alertContent}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={isError ? "alert-circle" : "check-circle"}
            size={normalize(20)}
            color={isError ? COLORS.error : COLORS.success}
          />
        </View>
        <Text
          style={[
            styles.alertText,
            { color: isError ? COLORS.error : COLORS.text },
          ]}
        >
          {message}
        </Text>
        {action && (
          <TouchableOpacity
            style={[
              styles.alertActionButton,
              { backgroundColor: isError ? COLORS.error : COLORS.primary },
            ]}
            activeOpacity={0.7}
            onPress={handleActionPress}
          >
            <Text style={styles.alertActionText}>{action.text}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  alertContainer: {
    position: 'absolute',
    bottom: normalize(100),
    alignSelf: 'center',
    width: '90%',
    maxWidth: normalize(400),
    borderRadius: normalize(12),
    borderWidth: 1,
    padding: normalize(16),
    zIndex: 100,
    shadowColor: COLORS.textMuted,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: normalize(12),
  },
  alertText: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: normalize(20),
    flex: 1,
    marginRight: normalize(12),
  },
  alertActionButton: {
    borderRadius: normalize(8),
    paddingVertical: normalize(8),
    paddingHorizontal: normalize(16),
    backgroundColor: COLORS.primary,
  },
  alertActionText: {
    fontSize: normalize(12),
    fontWeight: '700',
    color: COLORS.secondary,
    textTransform: 'uppercase',
  },
});

export default Notification;