import { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Animated, Easing, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchExercises, prefetchExercises, clearExercisesCache } from '../../handlers/WorkoutHandler';
import { spacing } from '../../../../shared/theme';
import { styles, COLORS } from './ExerciseSelectionScreenStyle.js';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    setIsDebouncing(true);
    const handler = setTimeout(() => {
      setDebouncedValue(value);
      setIsDebouncing(false);
    }, delay);

    return () => {
      clearTimeout(handler);
      setIsDebouncing(false);
    };
  }, [value, delay]);

  return [debouncedValue, isDebouncing];
};

const useExerciseData = (allGroupedExercises) => {
  return useMemo(() => {
    const exerciseMap = new Map();
    const muscleGroups = new Set();
    const counts = { total: 0 };
    const flatExercises = [];

    if (!Array.isArray(allGroupedExercises)) {
      return { exerciseMap, muscleGroups: [], counts, flatExercises };
    }

    allGroupedExercises.forEach((group) => {
      if (!group?.muscleGroup || !Array.isArray(group.exercises)) return;

      muscleGroups.add(group.muscleGroup);
      const exerciseCount = group.exercises.length;
      counts[group.muscleGroup] = exerciseCount;
      counts.total += exerciseCount;

      group.exercises.forEach((exercise, index) => {
        if (!exercise?.name) return;
        const enrichedExercise = {
          ...exercise,
          muscleGroup: group.muscleGroup,
          id: `${group.muscleGroup}-${exercise.name}-${index}`,
        };
        exerciseMap.set(exercise.name, enrichedExercise);
        flatExercises.push(enrichedExercise);
      });
    });

    return {
      exerciseMap,
      muscleGroups: [...muscleGroups].sort(),
      counts,
      flatExercises,
    };
  }, [allGroupedExercises]);
};

const ExerciseItem = memo(({ exercise, isSelected, onToggle }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [imageError, setImageError] = useState(false);

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    onToggle(exercise.name);
  }, [onToggle, exercise.name, scaleAnim]);

  const categoryText = exercise.category
    ? `${exercise.muscleGroup} · ${exercise.category}`
    : exercise.muscleGroup;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.exerciseContainer,
          isSelected && styles.exerciseContainerSelected,
        ]}
        activeOpacity={0.8}
        accessibilityLabel={`${exercise.name}, ${categoryText}. ${isSelected ? 'Selected' : 'Tap to select'}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        <View style={styles.exerciseContent}>
          <View style={styles.exerciseLeft}>
            <View style={styles.exerciseImageContainer}>
              {!imageError && exercise.imageURL ? (
                <Image
                  source={{ uri: exercise.imageURL }}
                  style={styles.exerciseImage}
                  onError={() => setImageError(true)}
                />
              ) : (
                <Ionicons
                  name="barbell-outline"
                  size={spacing.iconLg}
                  color={COLORS.textMuted}
                />
              )}
            </View>

            <View style={styles.exerciseTextContainer}>
              <Text style={styles.exerciseName} numberOfLines={1}>
                {exercise.name}
              </Text>
              <Text style={styles.exerciseCategory} numberOfLines={1}>
                {categoryText}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.selectionButton,
              isSelected ? styles.selectedExerciseButton : styles.addExerciseButton,
            ]}
          >
            <Ionicons
              name={isSelected ? 'checkmark' : 'add'}
              size={spacing.icon}
              color={isSelected ? COLORS.success : COLORS.textMuted}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}, (prev, next) => {
  return prev.isSelected === next.isSelected &&
         prev.exercise.name === next.exercise.name &&
         prev.exercise.id === next.exercise.id;
});

const FilterBar = memo(({ activeFilter, onFilterChange, muscleGroups, counts }) => {
  const scrollRef = useRef(null);
  const filters = useMemo(() => ['All', ...muscleGroups], [muscleGroups]);
  const animationValues = useRef(
    filters.reduce((acc, filter) => {
      acc[filter] = new Animated.Value(activeFilter === filter ? 1 : 0);
      return acc;
    }, {})
  ).current;

  const scrollToActiveFilter = useCallback(() => {
    const activeIndex = filters.indexOf(activeFilter);
    if (activeIndex >= 0 && scrollRef.current) {
      const pillWidth = 90;
      const scrollX = pillWidth * Math.max(0, activeIndex - 1);

      scrollRef.current.scrollTo({
        x: scrollX,
        animated: true,
      });

      if (activeIndex === filters.length - 1) {
        scrollRef.current.scrollToEnd({ animated: true });
      }
    }
  }, [activeFilter, filters]);

  useEffect(() => {
    const timer = setTimeout(scrollToActiveFilter, 100);
    return () => clearTimeout(timer);
  }, [scrollToActiveFilter]);

  useEffect(() => {
    filters.forEach(filter => {
      if (animationValues[filter]) {
        Animated.timing(animationValues[filter], {
          toValue: activeFilter === filter ? 1 : 0.8,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }
    });
  }, [activeFilter, filters, animationValues]);

  return (
    <View style={styles.filterContainer}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
        keyboardShouldPersistTaps="handled"
        decelerationRate="fast"
        snapToAlignment="start"
        snapToInterval={90}
        scrollEventThrottle={16}
      >
        {filters.map((filter) => {
          const isActive = activeFilter === filter;
          const animValue = animationValues[filter] || new Animated.Value(0);

          return (
            <Animated.View
              key={filter}
              style={{
                transform: [{
                  scale: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1.02],
                  })
                }],
                opacity: animValue,
              }}
            >
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  isActive && styles.filterPillActive,
                ]}
                onPress={() => onFilterChange(filter)}
                activeOpacity={0.7}
                accessibilityLabel={`Filter by ${filter} (${filter === 'All' ? counts.total : counts[filter] || 0} exercises)`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                {isActive && <View style={styles.filterPillGlow} />}
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                  ]}
                >
                  {filter} ({filter === 'All' ? counts.total : counts[filter] || 0})
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
});

const SearchHeader = memo(({ searchTerm, onSearchChange, onBack, onCreateExercise, activeFilter, onFilterChange, muscleGroups, counts }) => {
  const createButtonScale = useRef(new Animated.Value(1)).current;

  const handleCreatePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(createButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(createButtonScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    onCreateExercise();
  }, [onCreateExercise, createButtonScale]);

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerGradientOverlay} />

      <View style={styles.headerTopRow}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityLabel="Go back"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={spacing.iconMd} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Choose Exercises</Text>

        <Animated.View style={{ transform: [{ scale: createButtonScale }] }}>
          <TouchableOpacity
            onPress={handleCreatePress}
            style={styles.createButton}
            accessibilityLabel="Create new exercise"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="add"
              size={spacing.icon}
              color={COLORS.background}
            />
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={spacing.icon} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor={COLORS.textMuted}
          value={searchTerm}
          onChangeText={onSearchChange}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          accessibilityLabel="Search exercises"
        />
        {searchTerm.length > 0 && Platform.OS === 'android' && (
          <TouchableOpacity
            onPress={() => onSearchChange('')}
            style={styles.clearSearchButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={spacing.iconSm} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {muscleGroups.length > 0 && (
        <FilterBar
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          muscleGroups={muscleGroups}
          counts={counts}
        />
      )}
    </View>
  );
});

const SectionHeader = memo(({ title }) => (
  <View style={styles.sectionHeaderContainer}>
    <Text style={styles.sectionHeaderText}>
      {title.toUpperCase()}
    </Text>
  </View>
));

const ExerciseSelectionScreen = ({ route }) => {
  const navigation = useNavigation();

  const [allGroupedExercises, setAllGroupedExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExercises, setSelectedExercises] = useState(new Set());
  const [activeFilter, setActiveFilter] = useState('All');

  const [debouncedSearchTerm, isSearching] = useDebounce(searchTerm, 200);
  const { exerciseMap, muscleGroups, counts, flatExercises } = useExerciseData(allGroupedExercises);
  const doneButtonAnim = useRef(new Animated.Value(0)).current;

  const loadExercises = useCallback(async (isRetry = false) => {
    if (!isRetry && allGroupedExercises.length > 0) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchExercises(true);
      setAllGroupedExercises(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  }, [allGroupedExercises.length]);

  useEffect(() => {
    clearExercisesCache(true);
    fetchExercises(true);
    prefetchExercises().catch(() => {});
    loadExercises();
  }, [loadExercises]);

  useFocusEffect(
    useCallback(() => {
      loadExercises();
    }, [loadExercises])
  );

  const filteredAndGroupedExercises = useMemo(() => {
    if (!flatExercises.length) return [];

    let filtered = flatExercises;

    if (activeFilter !== 'All') {
      filtered = filtered.filter(exercise => exercise.muscleGroup === activeFilter);
    }

    const searchLower = debouncedSearchTerm.toLowerCase().trim();
    if (searchLower) {
      filtered = filtered.filter(exercise =>
        exercise?.name?.toLowerCase().includes(searchLower) ||
        exercise?.equipment?.toLowerCase().includes(searchLower) ||
        exercise?.category?.toLowerCase().includes(searchLower) ||
        exercise?.muscleGroup?.toLowerCase().includes(searchLower)
      );
    }

    const grouped = [];
    const groups = {};

    filtered.forEach(exercise => {
      const group = exercise.muscleGroup;
      if (!groups[group]) {
        groups[group] = {
          title: group,
          data: []
        };
        grouped.push(groups[group]);
      }
      groups[group].data.push(exercise);
    });

    return grouped;
  }, [flatExercises, debouncedSearchTerm, activeFilter]);

  const flatListData = useMemo(() => {
    const result = [];
    filteredAndGroupedExercises.forEach((section, sectionIndex) => {
      result.push({
        type: 'header',
        title: section.title,
        id: `header-${section.title}-${sectionIndex}`
      });
      section.data.forEach((item, itemIndex) =>
        result.push({
          type: 'item',
          ...item,
          listId: `${item.id}-${sectionIndex}-${itemIndex}`
        })
      );
    });
    return result;
  }, [filteredAndGroupedExercises]);

  useEffect(() => {
    Animated.timing(doneButtonAnim, {
      toValue: selectedExercises.size > 0 ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [selectedExercises.size, doneButtonAnim]);

  const handleSearchChange = useCallback((text) => {
    setSearchTerm(text);
  }, []);

  const handleFilterChange = useCallback((filter) => {
    setActiveFilter(filter);
  }, []);

  const handleToggleExercise = useCallback((exerciseName) => {
    setSelectedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseName)) {
        newSet.delete(exerciseName);
      } else {
        newSet.add(exerciseName);
      }
      return newSet;
    });
  }, []);

  const handleConfirmSelection = useCallback(() => {
    const { previousScreen = 'StartWorkout', replaceIndex } = route?.params || {};
    const selectedData = Array.from(selectedExercises)
      .map(name => exerciseMap.get(name))
      .filter(Boolean);

    navigation.navigate(previousScreen, {
      selectedExercises: selectedData,
      replaceIndex,
    });
  }, [selectedExercises, exerciseMap, route, navigation]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleCreateExercise = useCallback(() => {
    navigation.navigate('CreateExercise', {});
  }, [navigation]);

  const renderFlatListItem = useCallback(({ item }) => {
    if (item.type === 'header') {
      return <SectionHeader title={item.title} />;
    }
    return (
      <ExerciseItem
        exercise={item}
        isSelected={selectedExercises.has(item.name)}
        onToggle={handleToggleExercise}
      />
    );
  }, [selectedExercises, handleToggleExercise]);

  const flatListKeyExtractor = useCallback((item) => item.listId || item.id, []);

  const renderListEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="barbell-outline" size={spacing[15]} color={COLORS.textMuted} />
      <Text style={styles.emptyText}>
        {debouncedSearchTerm || activeFilter !== 'All'
          ? 'No exercises match your search criteria.'
          : 'No exercises available.'}
      </Text>
      {(debouncedSearchTerm || activeFilter !== 'All') && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => {
            setSearchTerm('');
            setActiveFilter('All');
          }}
        >
          <Text style={styles.clearButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.clearButton, { marginTop: spacing[3] }]}
        onPress={handleCreateExercise}
      >
        <Text style={styles.clearButtonText}>Create New Exercise</Text>
      </TouchableOpacity>
    </View>
  ), [debouncedSearchTerm, activeFilter, handleCreateExercise]);

  if (loading && !filteredAndGroupedExercises.length) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]} edges={['bottom']}>
        <ActivityIndicator size="large" color={COLORS.primaryOrange} />
        <Text style={styles.loadingText}>Loading exercises...</Text>
        {isSearching && (
          <Text style={[styles.loadingText, { fontSize: 12, marginTop: spacing[2] }]}>
            Searching...
          </Text>
        )}
      </SafeAreaView>
    );
  }

  if (error && !filteredAndGroupedExercises.length) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]} edges={['bottom']}>
        <Ionicons name="cloud-offline-outline" size={spacing[15]} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadExercises(true)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButtonError} onPress={handleGoBack}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <SearchHeader
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onBack={handleGoBack}
        onCreateExercise={handleCreateExercise}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        muscleGroups={muscleGroups}
        counts={counts}
      />

      <FlatList
        data={flatListData}
        renderItem={renderFlatListItem}
        keyExtractor={flatListKeyExtractor}
        contentContainerStyle={[
          styles.listContainer,
          !flatListData.length && styles.listContainerEmpty,
        ]}
        ListEmptyComponent={renderListEmptyComponent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={21}
        removeClippedSubviews={Platform.OS === 'android'}
        getItemLayout={(data, index) => ({
          length: spacing[15],
          offset: spacing[15] * index,
          index,
        })}
      />

      <Animated.View
        style={[
          styles.doneButtonContainer,
          {
            opacity: doneButtonAnim,
            transform: [{
              translateY: doneButtonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0],
              }),
            }],
          }
        ]}
        pointerEvents={selectedExercises.size === 0 ? 'none' : 'auto'}
      >
        <TouchableOpacity
          onPress={handleConfirmSelection}
          style={styles.doneButton}
          activeOpacity={0.8}
          disabled={selectedExercises.size === 0}
        >
          <Text style={styles.doneButtonText}>
            Add {selectedExercises.size > 0 && `(${selectedExercises.size}) `}
            Exercise{selectedExercises.size !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

export default memo(ExerciseSelectionScreen);