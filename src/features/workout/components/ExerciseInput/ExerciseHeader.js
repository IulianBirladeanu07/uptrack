import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomDropdown from '../../../nutrition/components/CustomDropdown/CustomDropdown';
import { normalize } from '../../../../shared/hooks/useResponsive';

export const COLORS = {
  bg: '#0A0E13',
  surface: '#151B23',
  
  text: '#F9FAFB',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  textInactive: 'rgba(156, 163, 175, 0.4)',
  
  primary: '#FF9500',
  primaryTransparent: 'rgba(255, 149, 0, 0.15)',
  primaryBorder: 'rgba(255, 149, 0, 0.3)',
  
  cyan: '#06B6D4',
  cyanTransparent: 'rgba(6, 182, 212, 0.08)',
  cyanBorder: 'rgba(6, 182, 212, 0.4)',
  cyanGlow: 'rgba(6, 182, 212, 0.25)',
  cyanFocusBg: 'rgba(6, 182, 212, 0.08)',
  cyanCompletedBorder: 'rgba(6, 182, 212, 0.25)',
  cyanCompletedBg: 'rgba(6, 182, 212, 0.04)',
  accent2: '#06B6D4',
  accent2Transparent: 'rgba(6, 182, 212, 0.15)',
  accent2Border: 'rgba(6, 182, 212, 0.3)',
  
  danger: '#FF453A',
  
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  borderDivider: 'rgba(255, 255, 255, 0.08)',
  
  inputBg: 'rgba(31, 41, 55, 0.5)',
  inputBorder: 'rgba(255, 255, 255, 0.12)',
};

const ExerciseHeader = React.memo(({
  exercise,
  isMenuVisible,
  setIsMenuVisible,
  menuOptions,
  handleMenuOption,
  navigation,
}) => {
  return (
    <View style={styles.exerciseHeaderWrapper}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseHeaderContent}>
          <View style={styles.exerciseImageContainer}>
            {exercise.imageURL ? (
              <Image
                source={{ uri: exercise.imageURL }}
                style={styles.exerciseImage}
              />
            ) : (
              <Ionicons
                name="barbell-outline"
                size={normalize(22)}
                color={COLORS.textMuted}
              />
            )}
          </View>
          <View style={styles.exerciseInfoContainer}>
            <Text style={styles.exerciseName} numberOfLines={1} ellipsizeMode="tail">
              {exercise.exerciseName}
            </Text>
            <View style={styles.exerciseMetadata}>
              <Text style={styles.exerciseMetaText} numberOfLines={1}>
                {exercise.muscleGroup || 'General'}
              </Text>
              {exercise.exerciseType && (
                <>
                  <View style={styles.metaDivider} />
                  <Text style={styles.exerciseMetaText} numberOfLines={1}>
                    {exercise.exerciseType}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ExerciseHistory', { exerciseName: exercise.exerciseName })}
            style={styles.historyButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="time-outline"
              size={normalize(18)}
              color={COLORS.cyan}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setIsMenuVisible(prev => !prev)}
            style={styles.menuButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={normalize(18)}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {isMenuVisible && (
        <CustomDropdown
          options={menuOptions}
          isVisible={isMenuVisible}
          onSelect={handleMenuOption}
          onClose={() => setIsMenuVisible(false)}
        />
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  const areEqual = prevProps.exercise.exerciseName === nextProps.exercise.exerciseName &&
                   prevProps.exercise.imageURL === nextProps.exercise.imageURL &&
                   prevProps.exercise.muscleGroup === nextProps.exercise.muscleGroup &&
                   prevProps.exercise.exerciseType === nextProps.exercise.exerciseType &&
                   prevProps.isMenuVisible === nextProps.isMenuVisible;
  return areEqual;
});

const styles = StyleSheet.create({
  exerciseHeaderWrapper: {
    position: 'relative',
  },
  exerciseHeader: {
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDivider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  exerciseImageContainer: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(12),
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: normalize(12),
    flexShrink: 0,
  },
  exerciseImage: {
    width: normalize(34),
    height: normalize(34),
    borderRadius: normalize(10),
  },
  exerciseInfoContainer: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    marginRight: normalize(8),
  },
  exerciseName: {
    fontSize: normalize(15),
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.2,
    lineHeight: normalize(19),
    marginBottom: normalize(4),
  },
  exerciseMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  exerciseMetaText: {
    fontSize: normalize(11),
    color: COLORS.textMuted,
    fontWeight: '500',
    flexShrink: 1,
  },
  metaDivider: {
    width: normalize(3),
    height: normalize(3),
    borderRadius: normalize(1.5),
    backgroundColor: COLORS.textMuted,
    marginHorizontal: normalize(6),
    opacity: 0.6,
    flexShrink: 0,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
    flexShrink: 0,
  },
  historyButton: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(10),
    backgroundColor: COLORS.cyanTransparent,
    borderWidth: 1,
    borderColor: COLORS.cyanBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(10),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ExerciseHeader;