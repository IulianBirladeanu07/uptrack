import React, { memo, useCallback, useMemo } from 'react';
import { Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import FoodItem from './FoodItem';
import { createStyles } from '../../../../shared/theme/createStyles';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';

const FoodSearchResults = memo(({
  searchResults = [],
  searchQuery = '',
  onItemPress,
  onPlusPress,
  showPlusButton = false,
  onCreateFood,
  recentSearches = [],
  onRecentSearchPress,
  onRemoveRecentSearch,
  onClearAllRecentSearches,
  recentSearchesLoading = false,
}) => {
  const [selectedFilter, setSelectedFilter] = React.useState('all');

  const filters = useMemo(() => [
    { key: 'all', label: 'All', count: searchResults.length, icon: 'grid-outline' },
    { key: 'under200', label: 'Low Cal', count: searchResults.filter(item => item.calories < 200).length, icon: 'flame-outline' },
    { key: 'high-protein', label: 'Protein', count: searchResults.filter(item => item.protein >= 10).length, icon: 'fitness-outline' },
  ], [searchResults]);

  const filteredResults = useMemo(() => {
    switch (selectedFilter) {
      case 'under200': return searchResults.filter(item => item.calories < 200);
      case 'high-protein': return searchResults.filter(item => item.protein >= 10);
      default: return searchResults;
    }
  }, [searchResults, selectedFilter]);

  const bestMatch = filteredResults[0];
  const otherResults = filteredResults.slice(1);

  const transformItem = useCallback((item) => ({
    ...item,
    productName: item.productName || item.name,
    carbohydrates: item.carbohydrates || item.carbs,
    fats: item.fats || item.fat,
    quantity: item.servingSize?.value || item.quantity || item.serving?.match(/\d+/)?.[0],
    unit: item.servingSize?.unit || item.unit || item.serving?.match(/[a-zA-Z]+/)?.[0],
    id: item.id || item.productName || item.name,
  }), []);

  const handleItemPress = useCallback((item) => {
    const originalItem = searchResults.find(result => 
      result.id === item.id || result.productName === item.productName || result.name === item.productName
    );
    onItemPress?.(originalItem || item);
  }, [searchResults, onItemPress]);

  const handlePlusPress = useCallback((item) => {
    const originalItem = searchResults.find(result => 
      result.id === item.id || result.productName === item.productName || result.name === item.productName
    );
    onPlusPress?.(originalItem || item);
  }, [searchResults, onPlusPress]);

  const quickSuggestions = [
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

  if (!searchQuery && !searchResults.length) {
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
              style={[styles.filterPill, selectedFilter === filter.key && styles.filterPillActive]}
            >
              <Ionicons 
                name={filter.icon} 
                size={spacing[4]} 
                color={selectedFilter === filter.key ? colors.accent.primary : colors.text.secondary} 
              />
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

      <ScrollView showsVerticalScrollIndicator={false}>
        {bestMatch && (
          <View style={styles.bestMatchSection}>
            <View style={styles.bestMatchHeader}>
              <View style={styles.bestMatchBadge}>
                <Ionicons name="star" size={spacing[3]} color={colors.accent.primary} />
                <Text style={styles.badgeText}>BEST MATCH</Text>
              </View>
              <Text style={styles.resultsCount}>
                {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
              </Text>
            </View>
            
            <View style={styles.bestMatchCard}>
              <FoodItem
                item={transformItem(bestMatch)}
                onPress={handleItemPress}
                showPlusButton={false}
                isFoodDeletable={false}
                isScrolling={false}
                foodContainer={styles.bestMatchItemContainer}
              />
              
              <View style={styles.actions}>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => handlePlusPress(transformItem(bestMatch))}>
                  <Ionicons name="add" size={spacing[5]} color={colors.background.primary} />
                  <Text style={styles.primaryBtnText}>Add to Log</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleItemPress(transformItem(bestMatch))}>
                  <Ionicons name="information-circle-outline" size={spacing[5]} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {otherResults.length > 0 && (
          <View style={styles.otherSection}>
            <View style={styles.otherBadge}>
              <MaterialCommunityIcons name="format-list-bulleted" size={spacing[3]} color={colors.text.secondary} />
              <Text style={styles.badgeText}>MORE OPTIONS ({otherResults.length})</Text>
            </View>
            
            {otherResults.map((item, index) => (
              <View key={item.id || index} style={styles.resultItem}>
                <FoodItem
                  item={transformItem(item)}
                  onPress={handleItemPress}
                  showPlusButton={showPlusButton}
                  onPlusPress={handlePlusPress}
                  isFoodDeletable={false}
                  isScrolling={false}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    backgroundColor: colors.background.secondary,
    borderRadius: radius[2],
    borderWidth: 1,
    borderColor: colors.border.default,
    marginRight: spacing[2],
    height: spacing[9],
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
  },
  badgeText: {
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
    borderWidth: 2,
    borderColor: colors.border.primary,
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
}));

export default FoodSearchResults;