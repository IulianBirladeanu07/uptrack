import { useState, useMemo, useCallback, memo } from 'react';
import { FlatList, Text, View, TouchableOpacity } from 'react-native';
import { Coffee, Sun, Moon, Apple, Utensils } from 'lucide-react-native';
import FoodSearchResults from './FoodSearchResults';
import FoodItem from './FoodItem';
import MealItem from './MealItem';
import { colors, spacing, fontSize, fontWeight, radius, LIST, EMPTY_STATE } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snacks'];

const MEAL_STYLES = {
    breakfast: { background: colors.faded.breakfast, border: colors.border.breakfast },
    lunch: { background: colors.faded.lunch, border: colors.border.lunch },
    dinner: { background: colors.faded.dinner, border: colors.border.dinner },
    snacks: { background: colors.faded.snacks, border: colors.border.snacks },
};

const DEFAULT_MEAL_STYLE = { background: 'rgba(156, 163, 184, 0.12)', border: 'rgba(156, 163, 184, 0.2)' };

const getMealStyle = (mealType) => MEAL_STYLES[mealType?.toLowerCase()] || DEFAULT_MEAL_STYLE;

const getMealIcon = (mealType, size = spacing[5]) => {
    const iconProps = { size, strokeWidth: 2.5 };
    switch (mealType?.toLowerCase()) {
        case 'breakfast': return <Coffee {...iconProps} color={colors.meal.breakfast} />;
        case 'lunch': return <Sun {...iconProps} color={colors.meal.lunch} />;
        case 'dinner': return <Moon {...iconProps} color={colors.meal.dinner} />;
        case 'snacks': return <Apple {...iconProps} color={colors.meal.snacks} />;
        default: return <Utensils {...iconProps} color={colors.text.secondary} />;
    }
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

const EmptyComponent = memo(({ text, mealType }) => {
    const mealStyle = getMealStyle(mealType);
    return (
        <View style={styles.emptyContainer}>
            <View style={[
                styles.emptyIconContainer,
                { backgroundColor: mealStyle.background, borderColor: mealStyle.border },
            ]}>
                {getMealIcon(mealType || 'default', spacing[7])}
            </View>
            <Text style={styles.emptyText}>{text}</Text>
            <Text style={styles.emptySubtext}>
                {mealType ? `Add your first ${mealType} item` : 'Try searching for foods'}
            </Text>
        </View>
    );
});

const MealHeader = memo(({ mealType, itemCount, isExpanded, maxItems, onToggle }) => {
    const shouldShowToggle = itemCount > maxItems;

    const handlePress = useCallback(() => {
        if (shouldShowToggle) onToggle(mealType);
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
}, (prevProps, nextProps) => (
    prevProps.mealType === nextProps.mealType &&
    prevProps.itemCount === nextProps.itemCount &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.maxItems === nextProps.maxItems
));

const createOptimizedFlatData = (foods, expandedMealType, maxItems) => {
    if (!foods?.length) return [];

    const grouped = Object.create(null);
    for (let i = 0; i < foods.length; i++) {
        const food = foods[i];
        if (!grouped[food.mealType]) grouped[food.mealType] = [];
        grouped[food.mealType].push(food);
    }

    const flatData = [];
    let offset = 0;

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
            height: LIST.HEADER_HEIGHT,
            offset,
        });
        offset += LIST.HEADER_HEIGHT;

        for (let k = 0; k < itemsToShow.length; k++) {
            const food = itemsToShow[k];
            flatData.push({
                type: 'food',
                food,
                id: `${mealType}_${k}_${food.id || food.productName}`,
                height: LIST.ITEM_HEIGHT,
                index: k,
                offset,
            });
            offset += LIST.ITEM_HEIGHT;
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
    maxItemsToShow = LIST.INITIAL_ITEMS_COUNT,
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
        scrollEventThrottle: 16,
        decelerationRate: 0.998,
        keyboardShouldPersistTaps: 'handled',
        showsVerticalScrollIndicator: false,
        bounces: true,
        alwaysBounceVertical: false,
        overScrollMode: 'never',
        nestedScrollEnabled: true,
        keyboardDismissMode: 'on-drag',
        onEndReachedThreshold: 0.2,
    }), []);

    const getItemKey = useCallback((item, index) =>
        item.id || item.productName || `item_${index}`, []);

    const getFlatKey = useCallback((item) => item.id, []);

    const getItemLayout = useCallback((data, index) => {
        const item = data?.[index];
        const height = item?.height ?? LIST.ITEM_HEIGHT;
        const offset = item?.offset ?? index * LIST.ITEM_HEIGHT;
        return { length: height, offset, index };
    }, []);

    const handleRecentSearchPress = useCallback((searchTerm) => {
        setSearchQuery?.(searchTerm);
        handleSearch?.(searchTerm);
        onRecentSearchPress?.(searchTerm);
    }, [setSearchQuery, handleSearch, onRecentSearchPress]);

    if (isSearching) {
        return (
            <FoodSearchResults
                searchResults={searchResults}
                searchQuery={searchQuery}
                onItemPress={handleNavigateToFoodDetail}
                onPlusPress={handlePlusPress}
                showPlusButton={true}
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
                        length: LIST.ITEM_HEIGHT,
                        offset: LIST.ITEM_HEIGHT * index,
                        index,
                    })}
                    extraData={categoryFoods.length}
                />
            );
        case 'Favorite':
            return <EmptyComponent text="Favorite foods coming soon!" mealType="favorite" />;
        default:
            return null;
    }
});

export default FoodListItem;

const styles = createStyles(() => ({
    mealHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: LIST.HEADER_HEIGHT,
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing[1],
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: spacing[2],
    },
    itemCountText: {
        fontSize: fontSize[14],
        color: colors.text.quaternary,
        fontWeight: fontWeight.medium,
        letterSpacing: 0.1,
        marginLeft: spacing[1],
    },
    mealTypeTitle: {
        fontSize: fontSize[18],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
        letterSpacing: 0.2,
    },
    toggleButton: {
        paddingHorizontal: spacing[2],
    },
    toggleText: {
        fontSize: fontSize[12],
        color: colors.accent.primary,
        fontWeight: fontWeight.medium,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[12],
    },
    emptyIconContainer: {
        width: EMPTY_STATE.ICON_SIZE,
        height: EMPTY_STATE.ICON_SIZE,
        borderRadius: 20,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyText: {
        fontSize: fontSize[18],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing[2],
        letterSpacing: 0.3,
    },
    emptySubtext: {
        fontSize: fontSize[14],
        color: colors.text.quaternary,
        textAlign: 'center',
        lineHeight: spacing[5],
        fontWeight: fontWeight.medium,
    },
}));