import { useState, useMemo, useCallback, memo } from 'react';
import { FlatList, Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Coffee, Sun, Moon, Apple, Utensils, ChevronRight, ChevronDown } from 'lucide-react-native';
import FoodSearchResults from './FoodSearchResults';
import FoodItem from './FoodItem';
import MealItem from './MealItem';
import { normalize } from '../../../../shared/hooks/useResponsive';

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snacks'];
const ITEM_HEIGHT = normalize(80);
const HEADER_HEIGHT = normalize(40);

const colors = {
  bg: '#0A0E13',
  surface: '#151B23',
  surfaceLight: '#1F2937',
  primary: '#FF9500',
  success: '#32D74B',
  warning: '#FF9F0A',
  purple: '#9333EA',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',

  breakfast: '#FFB627',
  breakfastBg: 'rgba(255, 182, 39, 0.06)',
  breakfastBorder: 'rgba(255, 182, 39, 0.12)',

  lunch: '#FFB627',
  lunchBg: 'rgba(255, 182, 39, 0.06)',
  lunchBorder: 'rgba(255, 182, 39, 0.12)',

  dinner: '#A78BFA',
  dinnerBg: 'rgba(167, 139, 250, 0.06)',
  dinnerBorder: 'rgba(167, 139, 250, 0.12)',

  snacks: '#34D399',
  snacksBg: 'rgba(52, 211, 153, 0.06)',
  snacksBorder: 'rgba(52, 211, 153, 0.12)',
};

const getMealIcon = (mealType, size = normalize(20)) => {
  const iconProps = {
    size,
    strokeWidth: 2.5,
  };
  
  switch (mealType.toLowerCase()) {
    case 'breakfast':
      return <Coffee {...iconProps} color={colors.breakfast} />;
    case 'lunch':
      return <Sun {...iconProps} color={colors.lunch} />;
    case 'dinner':
      return <Moon {...iconProps} color={colors.dinner} />;
    case 'snacks':
      return <Apple {...iconProps} color={colors.snacks} />;
    default:
      return <Utensils {...iconProps} color={colors.textSecondary} />;
  }
};

const getMealIconBackground = (mealType) => {
  const backgrounds = {
    breakfast: colors.breakfastBg,
    lunch: colors.lunchBg,
    dinner: colors.dinnerBg,
    snacks: colors.snacksBg,
  };
  
  return backgrounds[mealType.toLowerCase()] || 'rgba(156, 163, 184, 0.12)';
};

const getMealIconBorder = (mealType) => {
  const borders = {
    breakfast: colors.breakfastBorder,
    lunch: colors.lunchBorder,
    dinner: colors.dinnerBorder,
    snacks: colors.snacksBorder,
  };
  return borders[mealType.toLowerCase()] || 'rgba(156, 163, 184, 0.2)';
};

const renderMealItem = (item, meal, onPress, onPlusPress, index) => (
  <MealItem
    key={item.id || item.productName}
    item={item}
    meal={meal}
    onPress={onPress}
    onPlusPress={onPlusPress}
    showPlusButton={true}
    index={index}
  />
);

const renderFoodItem = (item, onPress, onPlusPress, index) => (
  <FoodItem
    key={item.id || item.productName}
    item={item}
    onPress={onPress}
    onPlusPress={onPlusPress}
    showPlusButton={true}
    index={index}
  />
);

const EmptyComponent = memo(({ text, mealType }) => (
  <View style={styles.emptyContainer}>
    <View style={[
      styles.emptyIconContainer,
      { 
        backgroundColor: getMealIconBackground(mealType || 'default'),
        borderColor: getMealIconBorder(mealType || 'default')
      }
    ]}>
      {getMealIcon(mealType || 'default', normalize(28))}
    </View>
    <Text style={styles.emptyText}>{text}</Text>
    <Text style={styles.emptySubtext}>
      {mealType ? `Add your first ${mealType} item` : 'Try searching for foods'}
    </Text>
  </View>
));

const MealHeader = memo(({ 
  mealType, 
  itemCount, 
  isExpanded, 
  maxItems, 
  onToggle 
}) => {
  const shouldShowToggle = itemCount > maxItems;
  
  const handlePress = useCallback(() => {
    if (shouldShowToggle) {
      onToggle(mealType);
    }
  }, [mealType, onToggle, shouldShowToggle]);

  return (
    <View style={styles.mealHeaderContainer}>
      <View style={styles.headerContent}>
        <View style={styles.titleRow}>
          <Text style={styles.mealTypeTitle}>
            {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
          </Text>
          <Text style={styles.itemCountText}>• {itemCount}</Text>
        </View>
        {shouldShowToggle && (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={handlePress}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
          <Text style={styles.toggleText}>
            {isExpanded ? 'Show less' : 'Show more'}
          </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.mealType === nextProps.mealType &&
    prevProps.itemCount === nextProps.itemCount &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.maxItems === nextProps.maxItems
  );
});

const createOptimizedFlatData = (foods, expandedMealType, maxItems) => {
  if (!foods?.length) return [];
  
  const grouped = Object.create(null);
  const flatData = [];
  
  for (let i = 0; i < foods.length; i++) {
    const food = foods[i];
    const mealType = food.mealType;
    if (!grouped[mealType]) {
      grouped[mealType] = [];
    }
    grouped[mealType].push(food);
  }
  
  for (let j = 0; j < MEAL_ORDER.length; j++) {
    const mealType = MEAL_ORDER[j];
    const mealFoods = grouped[mealType];
    
    if (!mealFoods?.length) continue;
    
    const isExpanded = expandedMealType === mealType;
    const itemsToShow = isExpanded ? mealFoods : mealFoods.slice(0, maxItems);
    
    flatData.push({
      type: 'header',
      mealType,
      itemCount: mealFoods.length,
      isExpanded,
      id: `header_${mealType}`,
      height: HEADER_HEIGHT,
    });
    
    for (let k = 0; k < itemsToShow.length; k++) {
      const food = itemsToShow[k];
      flatData.push({
        type: 'food',
        food,
        id: `${mealType}_${k}_${food.id || food.productName}`,
        height: ITEM_HEIGHT,
        index: k,
      });
    }
  }
  
  return flatData;
};

const FoodListItem = memo(({
  isSearching,
  selectedCategory,
  searchResults = [],
  categoryFoods = [],
  searchQuery = '',
  handleNavigateToFoodDetail,
  handlePlusPress,
  meal,
  maxItemsToShow = 3,
  recentSearches = [],
  setSearchQuery,
  handleSearch,
  onRecentSearchPress,
}) => {
  const [expandedMealType, setExpandedMealType] = useState(null);

  const flatData = useMemo(() => {
    if (selectedCategory !== 'Frequent') return [];
    return createOptimizedFlatData(categoryFoods, expandedMealType, maxItemsToShow);
  }, [selectedCategory, categoryFoods, expandedMealType, maxItemsToShow]);

  const handleToggleExpand = useCallback((mealType) => {
    setExpandedMealType(prev => prev === mealType ? null : mealType);
  }, []);

  const renderFrequentItem = useCallback(({ item, index }) => {
    if (item.type === 'header') {
      return (
        <MealHeader
          mealType={item.mealType}
          itemCount={item.itemCount}
          isExpanded={item.isExpanded}
          maxItems={maxItemsToShow}
          onToggle={handleToggleExpand}
        />
      );
    }
    
    return renderFoodItem(item.food, handleNavigateToFoodDetail, handlePlusPress, index);
  }, [maxItemsToShow, handleToggleExpand, handleNavigateToFoodDetail, handlePlusPress]);

  const flatListProps = useMemo(() => ({
    initialNumToRender: 6,
    maxToRenderPerBatch: 3,
    windowSize: 4,
    updateCellsBatchingPeriod: 50,
    removeClippedSubviews: true,
    disableVirtualization: false,
    scrollEventThrottle: 16,
    decelerationRate: 0.998,
    keyboardShouldPersistTaps: 'handled',
    delayPressIn: 0,
    delayPressOut: 0,
    delayLongPress: 150,
    showsVerticalScrollIndicator: false,
    bounces: true,
    alwaysBounceVertical: false,
    overScrollMode: 'never',
    maintainVisibleContentPosition: null,
    inverted: false,
    legacyImplementation: false,
    nestedScrollEnabled: true,
    canCancelContentTouches: true,
    pagingEnabled: false,
    keyboardDismissMode: 'on-drag',
    onEndReachedThreshold: 0.2,
    persistentScrollbar: false,
    fadingEdgeLength: 0,
    contentContainerStyle: styles.contentContainer,
  }), []);

  const getItemKey = useCallback((item, index) => 
    item.id || item.productName || `item_${index}`, []
  );
  
  const getFlatKey = useCallback((item) => item.id, []);

  const getItemLayout = useCallback((data, index) => {
    if (!data || !data[index]) {
      return { length: ITEM_HEIGHT, offset: index * ITEM_HEIGHT, index };
    }
    
    const item = data[index];
    const itemHeight = item.height || (item.type === 'header' ? HEADER_HEIGHT : ITEM_HEIGHT);
    
    if (item.offset !== undefined) {
      return { length: itemHeight, offset: item.offset, index };
    }
    
    let offset = 0;
    for (let i = 0; i < index; i++) {
      const prevItem = data[i];
      offset += prevItem?.height || (prevItem?.type === 'header' ? HEADER_HEIGHT : ITEM_HEIGHT);
    }
    
    item.offset = offset;
    
    return { length: itemHeight, offset, index };
  }, []);

  const handleRecentSearchPress = useCallback((searchTerm) => {
    setSearchQuery?.(searchTerm);
    handleSearch?.(searchTerm);
    onRecentSearchPress?.(searchTerm);
  }, [setSearchQuery, handleSearch, onRecentSearchPress]);

  const handleCreateFood = useCallback(() => {
    console.log('Create food clicked');
  }, []);

  const handleRecentItems = useCallback(() => {
    console.log('Recent items clicked');
  }, []);

  if (isSearching) {
    return (
      <FoodSearchResults
        searchResults={searchResults}
        searchQuery={searchQuery}
        onItemPress={handleNavigateToFoodDetail}
        onPlusPress={handlePlusPress}
        showPlusButton={true}
        onCreateFood={handleCreateFood}
        onRecentItems={handleRecentItems}
        recentSearches={recentSearches}
        onRecentSearchPress={handleRecentSearchPress}
      />
    );
  }

  switch (selectedCategory) {
    case 'Frequent':
      return (
        <FlatList
          {...flatListProps}
          data={flatData}
          renderItem={renderFrequentItem}
          keyExtractor={getFlatKey}
          getItemLayout={getItemLayout}
          ListEmptyComponent={<EmptyComponent text="No frequent foods found" />}
          extraData={`${expandedMealType}_${flatData.length}`}
          stickyHeaderIndices={[]}
          CellRendererComponent={undefined}
          debug={false}
        />
      );

    case 'Recent':
      return (
        <FlatList
          {...flatListProps}
          data={categoryFoods}
          renderItem={({ item, index }) => renderMealItem(item, meal, handleNavigateToFoodDetail, handlePlusPress, index)}
          keyExtractor={getItemKey}
          ListEmptyComponent={<EmptyComponent text="No recent meals found" mealType={meal} />}
          getItemLayout={(data, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          extraData={categoryFoods.length}
          stickyHeaderIndices={[]}
        />
      );

    case 'Favorite':
      return (
        <EmptyComponent 
          text="Favorite foods coming soon!" 
          mealType="favorite"
        />
      );

    default:
      return null;
  }
});

export default memo(FoodListItem, (prev, next) => {
  if (prev.isSearching !== next.isSearching) return false;
  if (prev.selectedCategory !== next.selectedCategory) return false;
  if (prev.maxItemsToShow !== next.maxItemsToShow) return false;
  if (prev.meal !== next.meal) return false;
  if (prev.searchQuery !== next.searchQuery) return false;
  if (prev.recentSearches?.length !== next.recentSearches?.length) return false;
  
  if (prev.searchResults?.length !== next.searchResults?.length) return false;
  if (prev.categoryFoods?.length !== next.categoryFoods?.length) return false;
  
  return (
    prev.searchResults === next.searchResults &&
    prev.categoryFoods === next.categoryFoods &&
    prev.recentSearches === next.recentSearches &&
    prev.handleNavigateToFoodDetail === next.handleNavigateToFoodDetail &&
    prev.handlePlusPress === next.handlePlusPress &&
    prev.setSearchQuery === next.setSearchQuery &&
    prev.handleSearch === next.handleSearch &&
    prev.onRecentSearchPress === next.onRecentSearchPress
  );
});

const styles = StyleSheet.create({
  contentContainer: {},
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: normalize(24),
    paddingVertical: normalize(48),
  },
  emptyIconContainer: {
    width: normalize(64),
    height: normalize(64),
    borderRadius: normalize(20),
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: normalize(20),
  },
  emptyText: {
    fontSize: normalize(18),
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: normalize(8),
    letterSpacing: 0.3,
  },
  emptySubtext: {
    fontSize: normalize(14),
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: normalize(20),
    fontWeight: '500',
  },
  mealHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: HEADER_HEIGHT,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: normalize(6),
  },
  mealTypeTitle: {
    fontSize: normalize(18),
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  itemCountText: {
    fontSize: normalize(14),
    color: colors.textTertiary,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  toggleButton: {
    paddingHorizontal: normalize(8),
  },
  toggleText: {
    fontSize: normalize(12),
    color: colors.primary,
    fontWeight: '500',
  },
});