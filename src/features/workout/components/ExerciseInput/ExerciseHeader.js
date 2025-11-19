import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomDropdown from '../../../nutrition/components/CustomDropdown/CustomDropdown';
import { COLORS } from './ExerciseInputStyles';
import { normalize } from '../../../../shared/hooks/useResponsive';

const ExerciseHeader = React.memo(({
  exercise,
  isMenuVisible,
  setIsMenuVisible,
  menuOptions,
  handleMenuOption,
  onHistoryPress,
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
                style={styles.exerciseImagePlaceholder}
              />
            )}
          </View>
          <View style={styles.exerciseInfoContainer}>
            <Text style={styles.exerciseName} numberOfLines={2} ellipsizeMode="tail">
              {exercise.exerciseName}
            </Text>
            <View style={styles.exerciseMetadata}>
              <Text style={styles.exerciseMetaText}>
                {exercise.muscleGroup || 'Back'}
              </Text>
              <View style={styles.metaDivider} />
              <Text style={styles.exerciseMetaText}>
                {exercise.exerciseType || 'Compound'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={onHistoryPress}
            style={styles.historyButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="time-outline"
              size={normalize(20)}
              color="#06B6D4"
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
              size={normalize(20)}
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
    paddingHorizontal: normalize(18),
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
  },
  exerciseImageContainer: {
    width: normalize(46),
    height: normalize(46),
    borderRadius: normalize(12),
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: normalize(12),
  },
  exerciseImage: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(10),
  },
  exerciseImagePlaceholder: {
    width: normalize(26),
    height: normalize(26),
  },
  exerciseInfoContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: normalize(12),
  },
  exerciseName: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.3,
    lineHeight: normalize(20),
    marginBottom: normalize(3),
  },
  exerciseMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseMetaText: {
    fontSize: normalize(12),
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  metaDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
    marginHorizontal: normalize(8),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
  },
  historyButton: {
    padding: normalize(8),
    borderRadius: normalize(10),
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  menuButton: {
    padding: normalize(8),
    borderRadius: normalize(10),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});

export default ExerciseHeader;