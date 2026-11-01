import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FoodItem from './FoodItem';
import { applyFoodFilter } from './foodSearchFilters';
import { createStyles } from '../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import type { FoodItemData } from './FoodItem';
import type { FoodSearchItem } from '../../../../shared/types';

type Filter = {
  key: string;
  label: string;
  count: number;
};

type FoodSearchResultsProps = {
  searchResults?: FoodSearchItem[] | undefined;
  searchQuery?: string | undefined;
  searchLoading?: boolean | undefined;
  searchError?: string | null | undefined;
  onRetrySearch?: (() => void) | undefined;
  onItemPress?: ((item: FoodItemData) => void) | undefined;
  onPlusPress?: ((item: FoodItemData, toggleToAdd?: boolean) => void) | undefined;
  isFoodSelected?: ((item: FoodItemData) => boolean) | undefined;
  showPlusButton?: boolean | undefined;
  onCreateFood?: (() => void) | undefined;
  recentSearches?: string[] | undefined;
  onRecentSearchPress?: ((term: string) => void) | undefined;
  onRemoveRecentSearch?: ((term: string) => void) | undefined;
  onClearAllRecentSearches?: (() => void) | undefined;
  recentSearchesLoading?: boolean | undefined;
};

const FoodSearchResults = memo(({
  searchResults = [],
  searchQuery = '',
  searchLoading = false,
  searchError,
  onRetrySearch,
  onItemPress,
  onPlusPress,
  isFoodSelected,
  showPlusButton = false,
  onCreateFood,
  recentSearches = [],
  onRecentSearchPress,
  onRemoveRecentSearch,
  onClearAllRecentSearches,
  recentSearchesLoading = false,
}: FoodSearchResultsProps) => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    setSelectedFilter('all');
  }, [searchQuery]);

  const filters = useMemo<Filter[]>(() => [
    { key: 'all', label: 'All', count: searchResults.length },
    { key: 'under200', label: 'Under 200 kcal', count: applyFoodFilter(searchResults, 'under200').length },
    { key: 'high-protein', label: '10g+ protein', count: applyFoodFilter(searchResults, 'high-protein').length },
  ], [searchResults]);

  const filteredResults = useMemo(
    () => applyFoodFilter(searchResults, selectedFilter),
    [searchResults, selectedFilter]
  );

  const bestMatch = filteredResults[0];
  const otherResults = filteredResults.slice(1);

  const transformItem = useCallback((item: FoodSearchItem) => ({
    ...item,
    quantity: item.servingSize?.value,
    unit: item.servingSize?.unit,
  }), []);

  const bestMatchItem = bestMatch ? transformItem(bestMatch) : undefined;
  const isBestMatchSelected = bestMatch ? isFoodSelected?.(bestMatch) ?? false : false;

  const handleItemPress = useCallback((item: FoodItemData) => {
    const originalItem = searchResults.find(result => result.id === item.id);
    onItemPress?.(originalItem || item);
  }, [searchResults, onItemPress]);

  const handlePlusPress = useCallback((item: FoodItemData, toggleToAdd?: boolean) => {
    const originalItem = searchResults.find(result => result.id === item.id);
    onPlusPress?.(originalItem || item, toggleToAdd);
  }, [searchResults, onPlusPress]);

  const quickSuggestions = ['Chicken', 'Rice', 'Eggs', 'Oats', 'Greek yogurt'];

  if (recentSearchesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="loading" size={spacing[8]} color={colors.accent.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!searchQuery.trim() && !searchResults.length) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {recentSearches.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={onClearAllRecentSearches}
                accessibilityRole="button"
                accessibilityLabel="Clear recent searches"
              >
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            </View>

            {recentSearches.map(item => (
              <View key={item} style={styles.recentItem}>
                <TouchableOpacity
                  style={styles.recentLeft}
                  onPress={() => onRecentSearchPress?.(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`Search for ${item}`}
                >
                  <MaterialCommunityIcons name="history" size={spacing[4]} color={colors.text.tertiary} />
                  <Text style={styles.recentText} numberOfLines={1}>{item}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeRecentBtn}
                  onPress={() => onRemoveRecentSearch?.(item)}
                  hitSlop={styles.hitSlop}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item} from recent searches`}
                >
                  <Ionicons name="close" size={spacing[4]} color={colors.text.tertiary} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.suggestionsSection}>
              <Text style={styles.sectionTitle}>Suggestions</Text>
              <View style={styles.suggestions}>
                {quickSuggestions.map(suggestion => (
                  <TouchableOpacity
                    key={suggestion}
                    style={styles.suggestion}
                    onPress={() => onRecentSearchPress?.(suggestion)}
                    accessibilityRole="button"
                    accessibilityLabel={`Search for ${suggestion}`}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {recentSearches.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="magnify" size={spacing[12]} color={colors.accent.primary} />
            </View>
            <Text style={styles.emptyTitle}>Search for Foods</Text>
            <Text style={styles.emptySubtitle}>Find nutritional information for thousands of foods</Text>
          </View>
        )}
      </ScrollView>
    );
  }

  if (searchQuery && searchLoading) return null;

  if (searchQuery.trim().length < 2) {
    return (
      <View style={styles.emptyResults}>
        <View style={styles.emptyIcon}>
          <MaterialCommunityIcons name="magnify" size={spacing[14]} color={colors.accent.primary} />
        </View>
        <Text style={styles.emptyTitle}>Keep typing</Text>
        <Text style={styles.emptySubtitle}>Enter at least 2 characters to search foods.</Text>
      </View>
    );
  }

  if (searchQuery && searchError) {
    return (
      <View style={styles.emptyResults}>
        <View style={styles.emptyIcon}>
          <MaterialCommunityIcons name="cloud-alert" size={spacing[14]} color={colors.accent.error} />
        </View>
        <Text style={styles.emptyTitle}>Search Unavailable</Text>
        <Text style={styles.emptySubtitle}>{searchError}</Text>
        <TouchableOpacity onPress={onRetrySearch} style={styles.createBtn}>
          <Text style={styles.createBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!searchResults.length && searchQuery) {
    return (
      <View style={styles.emptyResults}>
        <View style={styles.emptyIcon}>
          <MaterialCommunityIcons name="food-off" size={spacing[14]} color={colors.accent.primary} />
        </View>
        <Text style={styles.emptyTitle}>No Results Found</Text>
        <Text style={styles.emptySubtitle}>We couldn't find "{searchQuery}"</Text>
        <TouchableOpacity onPress={onCreateFood} style={styles.createBtn}>
          <Ionicons name="add-circle" size={spacing[6]} color={colors.background.primary} />
          <Text style={styles.createBtnText}>Create Custom Food</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {searchQuery && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setSelectedFilter(filter.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedFilter === filter.key }}
              accessibilityLabel={`${filter.label}, ${filter.count} results`}
              style={[styles.filterPill, selectedFilter === filter.key && styles.filterPillActive]}
              hitSlop={styles.filterHitSlop}
            >
              <Text style={[styles.filterText, selectedFilter === filter.key && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {filteredResults.length === 0 ? (
        <View style={styles.emptyFilterResults}>
          <Text style={styles.emptyFilterTitle}>No foods match this filter</Text>
          <TouchableOpacity
            style={styles.showAllButton}
            onPress={() => setSelectedFilter('all')}
            accessibilityRole="button"
            accessibilityLabel="Show all search results"
          >
            <Text style={styles.showAllText}>Show all results</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
            </Text>
          </View>
          {bestMatch && (
            <View style={styles.recommendedCard}>
              <Text style={styles.recommendedLabel}>Recommended</Text>
              <FoodItem
                item={bestMatchItem!}
                onPress={handleItemPress}
                showPlusButton={false}
                isSelected={isBestMatchSelected}
                isSelectionEmphasized={false}
                isFoodDeletable={false}
                isScrolling={false}
                foodContainer={styles.recommendedFoodContainer}
              />
              {showPlusButton && (
                <View style={styles.recommendedActions}>
                  <TouchableOpacity
                    style={[
                      styles.recommendedAction,
                      isBestMatchSelected && styles.recommendedActionSelected,
                    ]}
                    onPress={() => handlePlusPress(bestMatchItem!, !isBestMatchSelected)}
                    accessibilityRole="button"
                    accessibilityLabel={isBestMatchSelected ? 'Remove recommended food' : 'Add recommended food to log'}
                    accessibilityState={{ selected: isBestMatchSelected }}
                  >
                    <Ionicons
                      name={isBestMatchSelected ? 'checkmark' : 'add'}
                      size={spacing[5]}
                      color={isBestMatchSelected ? colors.accent.success : colors.accent.buttonText}
                    />
                    <Text
                      style={[
                        styles.recommendedActionText,
                        isBestMatchSelected && styles.recommendedActionTextSelected,
                      ]}
                    >
                      {isBestMatchSelected ? 'Added' : 'Add to Log'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.recommendedInfo}
                    onPress={() => handleItemPress(bestMatchItem!)}
                    accessibilityRole="button"
                    accessibilityLabel="Recommended food details"
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={spacing[5]}
                      color={colors.text.secondary}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <View>
            {otherResults.map((item, index) => (
              <FoodItem
                key={item.id || index}
                item={transformItem(item)}
                onPress={handleItemPress}
                showPlusButton={showPlusButton}
                isSelected={isFoodSelected?.(item)}
                isSelectionEmphasized={false}
                onPlusPress={handlePlusPress}
                isFoodDeletable={false}
                isScrolling={false}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
});

const styles = createStyles(() => ({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[15],
  },
  loadingText: {
    fontSize: fontSize[14],
    color: colors.text.secondary,
    fontWeight: fontWeight.semibold,
    marginTop: spacing[3],
  },
  hitSlop: {
    top: spacing[2],
    bottom: spacing[2],
    left: spacing[2],
    right: spacing[2],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  sectionTitle: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  clearBtn: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
  },
  clearBtnText: {
    fontSize: fontSize[12],
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  recentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    minHeight: spacing[9],
  },
  recentText: {
    flex: 1,
    fontSize: fontSize[14],
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  removeRecentBtn: {
    minWidth: spacing[9],
    minHeight: spacing[9],
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  suggestionsSection: {
    marginTop: spacing[4],
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  suggestion: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  suggestionText: {
    fontSize: fontSize[14],
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[10],
    paddingTop: spacing[20],
  },
  emptyIcon: {
    width: spacing[24],
    height: spacing[24],
    borderRadius: radius[6],
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[5],
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  emptyTitle: {
    fontSize: fontSize[20],
    color: colors.text.primary,
    fontWeight: fontWeight.bold,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fontSize[14],
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: fontWeight.medium,
  },
  emptyResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[10],
  },
  emptyFilterResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  emptyFilterTitle: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  showAllButton: {
    marginTop: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius[3],
    backgroundColor: colors.faded.primary,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  showAllText: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
    color: colors.accent.primary,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[7],
    backgroundColor: colors.accent.primary,
    borderRadius: radius[3],
    marginTop: spacing[6],
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createBtnText: {
    fontSize: fontSize[14],
    color: colors.background.primary,
    fontWeight: fontWeight.bold,
  },
  filters: {
    paddingTop: spacing[3],
    marginBottom: spacing[3],
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: 'transparent',
    borderRadius: radius[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginRight: spacing[2],
    minHeight: spacing[8],
  },
  filterPillActive: {
    backgroundColor: colors.accent.primary,
    borderColor: 'transparent',
  },
  filterText: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
  },
  filterTextActive: {
    color: colors.accent.buttonText,
  },
  resultsHeader: {
    alignItems: 'flex-end',
    marginBottom: spacing[2],
  },
  resultsCount: {
    fontSize: fontSize[12],
    color: colors.text.secondary,
    fontWeight: fontWeight.semibold,
  },
  filterHitSlop: {
    top: spacing[1],
    bottom: spacing[1],
    left: spacing[1],
    right: spacing[1],
  },
  recommendedCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    padding: spacing[3],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  recommendedLabel: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  recommendedFoodContainer: {
    marginBottom: spacing[2],
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  recommendedAction: {
    flex: 1,
    minHeight: spacing[12],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.accent.primary,
    borderRadius: radius[3],
  },
  recommendedActionSelected: {
    backgroundColor: colors.faded.successAlt,
    borderWidth: 1,
    borderColor: colors.border.successAlt,
  },
  recommendedActionText: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.bold,
    color: colors.accent.buttonText,
  },
  recommendedActionTextSelected: {
    color: colors.accent.success,
  },
  recommendedActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  recommendedInfo: {
    width: spacing[12],
    height: spacing[12],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: radius[3],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
}));

export default FoodSearchResults;
