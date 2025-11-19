// (NOBRIDGE) WARN  Non-serializable values were found in the navigation state. Check:
// AuthenticatedScreens > CreateExercise > params.onExerciseCreated (Function)
// This can break usage such as persisting and restoring state. This might happen if you passed non-serializable values such as function, class instances etc. in params. If you need to use components with callbacks in your options, you can use 'navigation.setOptions' instead. See https://reactnavigation.org/docs/troubleshooting#i-get-the-warning-non-serializable-values-were-found-in-the-navigation-state for more details. [Component Stack]

import { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Animated, Easing, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fetchExercises, prefetchExercises } from '../../handlers/WorkoutHandler';
import { normalize } from '../../../../shared/hooks/useResponsive';
import { styles, COLORS } from './ExerciseSelectionScreenStyle.js';

// Custom hook for debounced search with immediate UI feedback
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

// Custom hook for optimized exercise data processing with caching
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

      group.exercises.forEach((exercise) => {
        if (!exercise?.name) return;
        const enrichedExercise = {
          ...exercise,
          muscleGroup: group.muscleGroup,
          id: `${group.muscleGroup}-${exercise.name}`,
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

// Optimized Exercise Item Component
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
                  size={normalize(24)}
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
              size={normalize(18)}
              color={isSelected ? COLORS.success : COLORS.accentPrimary}
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

// Enhanced FilterBar Component
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
      const pillWidth = normalize(90); // Approximate width of each pill
      const scrollX = pillWidth * Math.max(0, activeIndex - 1);

      scrollRef.current.scrollTo({
        x: scrollX,
        animated: true,
      });

      // Ensure last pill is fully visible
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
        removeClippedSubviews={Platform.OS === 'android'}
        snapToAlignment="start" // Ensure snapping aligns to the start of pills
        snapToInterval={normalize(90)} // Approximate pill width for snapping
        scrollEventThrottle={16}
      >
        {filters.map((filter, index) => {
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
// Enhanced Search Header Component
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
          <Ionicons name="arrow-back" size={normalize(20)} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Choose Exercises</Text>

        <Animated.View style={{ transform: [{ scale: createButtonScale }] }}>
          <TouchableOpacity
            onPress={handleCreatePress}
            style={styles.createButton}
            accessibilityLabel="Create new exercise"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.createButtonGlowEffect} />
            <Ionicons
              name="add"
              size={normalize(18)}
              style={styles.createButtonIcon}
            />
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={normalize(18)} color={COLORS.textMuted} style={styles.searchIcon} />
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
            <Ionicons name="close-circle" size={normalize(16)} color={COLORS.textMuted} />
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

// Optimized Section Header Component
const SectionHeader = memo(({ title }) => (
  <View style={styles.sectionHeaderContainer}>
    <Text style={styles.sectionHeaderText}>
      {title.toUpperCase()}
    </Text>
  </View>
));

// Main Component
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

  // State to hold the function for adding a new exercise
  const [newExerciseCallback, setNewExerciseCallback] = useState(null);

  const loadExercises = useCallback(async (isRetry = false) => {
    if (!isRetry && allGroupedExercises.length > 0) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchExercises(isRetry);
      setAllGroupedExercises(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  }, [allGroupedExercises.length]);

  useEffect(() => {
    prefetchExercises().catch(() => {});
    loadExercises();
  }, [loadExercises]);

  // Use useFocusEffect to run the callback when this screen is focused again
  useFocusEffect(
    useCallback(() => {
      // If a callback was set and exists, run it
      if (newExerciseCallback) {
        newExerciseCallback();
        // Clear the callback to prevent it from running again
        setNewExerciseCallback(null);
      }
    }, [newExerciseCallback])
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
    filteredAndGroupedExercises.forEach(section => {
      result.push({ type: 'header', title: section.title, id: `header-${section.title}` });
      section.data.forEach(item => result.push({ type: 'item', ...item }));
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
    console.log('Navigating to:', previousScreen, 'with selected exercises:', selectedData);
  }, [selectedExercises, exerciseMap, route, navigation]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleCreateExercise = useCallback(() => {
    navigation.navigate('CreateExercise', {
      // You can't pass functions in params, so you can just set up the screen to navigate back.
      // The logic to add the exercise will now be handled by a callback that is run
      // when the screen is focused again via useFocusEffect.
    });
    
    // Set the function to be called when the next screen is focused.
    // This function will receive the new exercise from the CreateExercise screen.
    const onExerciseCreatedCallback = (newExercise) => {
      setAllGroupedExercises(prev => {
        const updated = [...prev];
        const groupIndex = updated.findIndex(g => g.muscleGroup === newExercise.muscleGroup);

        if (groupIndex >= 0) {
          updated[groupIndex] = {
            ...updated[groupIndex],
            exercises: [...updated[groupIndex].exercises, newExercise]
          };
        } else {
          updated.push({
            muscleGroup: newExercise.muscleGroup,
            exercises: [newExercise]
          });
        }
        return updated;
      });
      setSelectedExercises(prev => new Set([...prev, newExercise.name]));
    };
    
    // Pass the function to the next screen by setting a property on the navigation object
    // or by using a context/global state manager if needed.
    // For this case, we'll assume the CreateExercise screen will return a new exercise
    // in its navigation params on a successful "go back" action.
    navigation.setOptions({
      onExerciseCreated: onExerciseCreatedCallback,
    });
    
  }, [navigation, setAllGroupedExercises, setSelectedExercises]);


  const renderItem = useCallback(({ item }) => (
    <ExerciseItem
      exercise={item}
      isSelected={selectedExercises.has(item.name)}
      onToggle={handleToggleExercise}
    />
  ), [selectedExercises, handleToggleExercise]);

  const renderFlatListItem = useCallback(({ item }) => {
    if (item.type === 'header') {
      return <SectionHeader title={item.title} />;
    }
    return renderItem({ item });
  }, [renderItem]);

  const flatListKeyExtractor = useCallback((item) => item.id, []);

  const getItemLayout = useCallback((data, index) => ({
    length: normalize(76),
    offset: normalize(76) * index,
    index,
  }), []);

  if (loading && !filteredAndGroupedExercises.length) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.accentPrimary} />
        <Text style={styles.loadingText}>Loading exercises...</Text>
        {isSearching && (
          <Text style={[styles.loadingText, { fontSize: normalize(12), marginTop: normalize(8) }]}>
            Searching...
          </Text>
        )}
      </View>
    );
  }

  if (error && !filteredAndGroupedExercises.length) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="cloud-offline-outline" size={60} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadExercises(true)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButtonError} onPress={handleGoBack}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          !flatListData.length && { flex: 1 },
        ]}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell-outline" size={60} color={COLORS.textMuted} />
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
              style={[styles.clearButton, { marginTop: normalize(12) }]}
              onPress={handleCreateExercise}
            >
              <Text style={styles.clearButtonText}>Create New Exercise</Text>
            </TouchableOpacity>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={10}
        removeClippedSubviews={Platform.OS === 'android'}
        getItemLayout={getItemLayout}
        disableIntervalMomentum={true}
        scrollEventThrottle={16}
      />

      <Animated.View
        style={{
          opacity: doneButtonAnim,
          transform: [{
            translateY: doneButtonAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [100, 0],
            }),
          }],
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          paddingHorizontal: normalize(10),
          // top: normalize(20),
          bottom: normalize(20),
          // left: '5%',
          // right: '5%',
        }}
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
    </View>
  );
};

export default memo(ExerciseSelectionScreen);