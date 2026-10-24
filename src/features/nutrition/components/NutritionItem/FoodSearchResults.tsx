import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import FoodItem from './FoodItem';
import { applyFoodFilter } from './foodSearchFilters';
import { createStyles } from '../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import type { FoodItemData } from './FoodItem';
import type { FoodSearchItem } from '../../../../shared/types';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

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

  const quickSuggestions: { label: string; icon: IconName }[] = [
    { label: 'Chicken', icon: 'nutrition' },
    { label: 'Salmon', icon: 'fish' },
    { label: 'Broccoli', icon: 'leaf' },
    { label: 'Rice', icon: 'restaurant' },
    { label: 'Eggs', icon: 'egg' }
  ];

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
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.iconBadge}>
                  <MaterialCommunityIcons name="clock-outline" size={spacing[5]} color={colors.accent.primary} />
                </View>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
              </View>
              <TouchableOpacity style={styles.clearBtn} onPress={onClearAllRecentSearches}>
                <MaterialCommunityIcons name="delete-sweep" size={spacing[4]} color={colors.accent.error} />
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            </View>

            {recentSearches.map((item, index) => (
              <TouchableOpacity key={index} style={styles.recentItem} onPress={() => onRecentSearchPress?.(item)}>
                <View style={styles.recentLeft}>
                  <MaterialCommunityIcons name="history" size={spacing[4]} color={colors.accent.primary} />
                  <Text style={styles.recentText} numberOfLines={1}>{item}</Text>
                </View>
                <TouchableOpacity onPress={() => onRemoveRecentSearch?.(item)} hitSlop={styles.hitSlop}>
                  <Ionicons name="close-circle" size={spacing[5]} color={colors.text.tertiary} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or try</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.quickGridWrapper}>
              <View style={styles.quickGrid}>
                {quickSuggestions.map((suggestion, index) => (
                  <TouchableOpacity key={index} style={styles.quickCard} onPress={() => onRecentSearchPress?.(suggestion.label)}>
                    <View style={styles.quickIcon}>
                      <Ionicons name={suggestion.icon} size={spacing[6]} color={colors.accent.primary} />
                    </View>
                    <Text style={styles.quickLabel}>{suggestion.label}</Text>
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
            >
              <Text style={[styles.filterText, selectedFilter === filter.key && styles.filterTextActive]}>
                {filter.label}
              </Text>
              <View style={[styles.filterBadge, selectedFilter === filter.key && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, selectedFilter === filter.key && styles.filterBadgeTextActive]}>
                  {filter.count}
                </Text>
              </View>
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
          {bestMatch && (
            <View style={styles.bestMatchSection}>
              <View style={styles.bestMatchHeader}>
                <View style={styles.bestMatchBadge}>
                  <Ionicons name="star" size={spacing[3]} color={colors.accent.primary} />
                  <Text style={styles.bestMatchTitle}>BEST MATCH</Text>
                </View>
                <Text style={styles.resultsCount}>
                  {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
                </Text>
              </View>

              <View style={styles.bestMatchCard}>
                <FoodItem
                  item={bestMatchItem!}
                  onPress={handleItemPress}
                  showPlusButton={false}
                  isSelected={isBestMatchSelected}
                  isFoodDeletable={false}
                  isScrolling={false}
                  foodContainer={styles.bestMatchItemContainer}
                />

                <View style={styles.actions}>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => handlePlusPress(bestMatchItem!, !isBestMatchSelected)}>
                    <Ionicons name={isBestMatchSelected ? 'checkmark' : 'add'} size={spacing[5]} color={colors.background.primary} />
                    <Text style={styles.primaryBtnText}>{isBestMatchSelected ? 'Remove' : 'Add to Log'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleItemPress(transformItem(bestMatch))}>
                    <Ionicons name="information-circle-outline" size={spacing[5]} color={colors.text.secondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {otherResults.length > 0 && (
            <View>
              <View style={styles.otherBadge}>
                <MaterialCommunityIcons name="format-list-bulleted" size={spacing[3]} color={colors.text.secondary} />
                <Text style={styles.otherResultsTitle}>MORE OPTIONS ({otherResults.length})</Text>
              </View>

              {otherResults.map((item, index) => (
                <FoodItem
                  key={item.id || index}
                  item={transformItem(item)}
                  onPress={handleItemPress}
                  showPlusButton={showPlusButton}
                  isSelected={isFoodSelected?.(item)}
                  onPlusPress={handlePlusPress}
                  isFoodDeletable={false}
                  isScrolling={false}
                />
              ))}
            </View>
          )}
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
  section: {},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconBadge: {
    width: spacing[10],
    height: spacing[10],
    borderRadius: radius[3],
    backgroundColor: colors.faded.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  sectionTitle: {
    fontSize: fontSize[16],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.faded.error,
    borderRadius: radius[2],
    borderWidth: 1,
    borderColor: colors.border.error,
  },
  clearBtnText: {
    fontSize: fontSize[12],
    color: colors.accent.error,
    fontWeight: fontWeight.semibold,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderRadius: radius[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  recentLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  recentText: {
    flex: 1,
    fontSize: fontSize[14],
    color: colors.text.primary,
    fontWeight: fontWeight.semibold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[5],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.default,
  },
  dividerText: {
    fontSize: fontSize[10],
    color: colors.text.tertiary,
    fontWeight: fontWeight.semibold,
    marginHorizontal: spacing[3],
    textTransform: 'uppercase',
  },
  quickGridWrapper: {
    alignItems: 'center',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    justifyContent: 'center',
    maxWidth: spacing[100],
  },
  quickCard: {
    width: spacing[18],
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    padding: spacing[2],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  quickIcon: {
    width: spacing[11],
    height: spacing[11],
    borderRadius: radius[3],
    backgroundColor: colors.faded.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  quickLabel: {
    fontSize: fontSize[12],
    color: colors.text.primary,
    fontWeight: fontWeight.semibold,
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
    marginBottom: spacing[4],
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.background.secondary,
    borderRadius: radius[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginRight: spacing[2],
    minHeight: spacing[9],
  },
  filterPillActive: {
    backgroundColor: colors.faded.primary,
    borderColor: colors.border.primary,
  },
  filterText: {
    fontSize: fontSize[12],
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
  },
  filterTextActive: {
    color: colors.accent.primary,
  },
  filterBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    backgroundColor: colors.faded.surface,
    borderRadius: radius[1],
    minWidth: spacing[6],
    height: spacing[5],
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeActive: {
    backgroundColor: colors.faded.primaryLight,
  },
  filterBadgeText: {
    fontSize: fontSize[10],
    color: colors.text.secondary,
    fontWeight: fontWeight.bold,
  },
  filterBadgeTextActive: {
    color: colors.accent.primary,
  },
  bestMatchSection: {
    marginBottom: spacing[5],
  },
  bestMatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
    paddingRight: spacing[1],
  },
  bestMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: colors.faded.primary,
    borderRadius: radius[2],
    borderWidth: 1,
    borderColor: colors.border.primaryAlt,
  },
  bestMatchTitle: {
    fontSize: fontSize[10],
    fontWeight: fontWeight.bold,
    color: colors.accent.primary,
    letterSpacing: 1,
  },
  resultsCount: {
    fontSize: fontSize[12],
    color: colors.text.secondary,
    fontWeight: fontWeight.semibold,
  },
  bestMatchCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  bestMatchItemContainer: {
    marginBottom: spacing[3],
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderWidth: 0,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.accent.primary,
    paddingVertical: spacing[3],
    borderRadius: radius[3],
  },
  primaryBtnText: {
    fontSize: fontSize[14],
    fontWeight: fontWeight.bold,
    color: colors.background.primary,
  },
  secondaryBtn: {
    width: spacing[12],
    height: spacing[12],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: radius[3],
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  otherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  otherResultsTitle: {
    fontSize: fontSize[10],
    fontWeight: fontWeight.bold,
    color: colors.accent.primary,
    letterSpacing: 1,
  },
}));

export default FoodSearchResults;
