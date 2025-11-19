  import React, { memo, useCallback, useMemo } from 'react';
  import { Text, View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
  import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
  import FoodItem from './FoodItem';
  import { normalize } from '../../../../shared/hooks/useResponsive';

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
          <MaterialCommunityIcons name="loading" size={normalize(32)} color="#FF9500" />
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
                    <MaterialCommunityIcons name="clock-outline" size={normalize(18)} color="#FF9500" />
                  </View>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                </View>
                <TouchableOpacity style={styles.clearBtn} onPress={onClearAllRecentSearches}>
                  <MaterialCommunityIcons name="delete-sweep" size={normalize(16)} color="#EF4444" />
                  <Text style={styles.clearBtnText}>Clear</Text>
                </TouchableOpacity>
              </View>

              {recentSearches.map((item, index) => (
                <TouchableOpacity key={index} style={styles.recentItem} onPress={() => onRecentSearchPress?.(item)}>
                  <View style={styles.recentLeft}>
                    <MaterialCommunityIcons name="history" size={normalize(16)} color="#FF9500" />
                    <Text style={styles.recentText} numberOfLines={1}>{item}</Text>
                  </View>
                  <TouchableOpacity onPress={() => onRemoveRecentSearch?.(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close-circle" size={normalize(18)} color="#6B7280" />
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
                        <Ionicons name={suggestion.icon} size={normalize(20)} color="#FF9500" />
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
                <MaterialCommunityIcons name="magnify" size={normalize(48)} color="#FF9500" />
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
            <MaterialCommunityIcons name="food-off" size={normalize(56)} color="#FF9500" />
          </View>
          <Text style={styles.emptyTitle}>No Results Found</Text>
          <Text style={styles.emptySubtitle}>We couldn't find "{searchQuery}"</Text>
          <TouchableOpacity onPress={onCreateFood} style={styles.createBtn}>
            <Ionicons name="add-circle" size={normalize(20)} color="#0f172a" />
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
                  size={normalize(16)} 
                  color={selectedFilter === filter.key ? '#FF9500' : '#9CA3AF'} 
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
                  <Ionicons name="star" size={normalize(12)} color="#FF9500" />
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
                    <Ionicons name="add" size={normalize(18)} color="#0f172a" />
                    <Text style={styles.primaryBtnText}>Add to Log</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleItemPress(transformItem(bestMatch))}>
                    <Ionicons name="information-circle-outline" size={normalize(18)} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {otherResults.length > 0 && (
            <View style={styles.otherSection}>
              <View style={styles.otherBadge}>
                <MaterialCommunityIcons name="format-list-bulleted" size={normalize(12)} color="#9CA3AF" />
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: normalize(60),
    },
    loadingText: {
      fontSize: normalize(14),
      color: '#9CA3AF',
      fontWeight: '600',
      marginTop: normalize(12),
    },
    
    section: {
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: normalize(16),
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: normalize(12),
    },
    iconBadge: {
      width: normalize(40),
      height: normalize(40),
      borderRadius: normalize(12),
      backgroundColor: 'rgba(255, 149, 0, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 149, 0, 0.3)',
    },
    sectionTitle: {
      fontSize: normalize(16),
      fontWeight: '700',
      color: '#F9FAFB',
    },
    clearBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: normalize(6),
      paddingHorizontal: normalize(12),
      paddingVertical: normalize(8),
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderRadius: normalize(10),
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    clearBtnText: {
      fontSize: normalize(12),
      color: '#EF4444',
      fontWeight: '600',
    },
    
    recentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#151B23',
      borderRadius: normalize(14),
      paddingVertical: normalize(14),
      paddingHorizontal: normalize(14),
      marginBottom: normalize(8),
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    recentLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: normalize(12),
    },
    recentText: {
      flex: 1,
      fontSize: normalize(14),
      color: '#F9FAFB',
      fontWeight: '600',
    },
    
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: normalize(20),
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    dividerText: {
      fontSize: normalize(11),
      color: '#6B7280',
      fontWeight: '600',
      marginHorizontal: normalize(12),
      textTransform: 'uppercase',
    },
    
    quickGridWrapper: {
      alignItems: 'center',
    },
    quickGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: normalize(10),
      justifyContent: 'center',
      maxWidth: normalize(400),
    },
    quickCard: {
      width: normalize(70),
      backgroundColor: '#151B23',
      borderRadius: normalize(16),
      padding: normalize(10),
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    quickIcon: {
      width: normalize(44),
      height: normalize(44),
      borderRadius: normalize(12),
      backgroundColor: 'rgba(255, 149, 0, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: normalize(8),
      borderWidth: 1,
      borderColor: 'rgba(255, 149, 0, 0.3)',
    },
    quickLabel: {
      fontSize: normalize(12),
      color: '#F9FAFB',
      fontWeight: '600',
    },
    
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: normalize(40),
      paddingTop: normalize(80),
    },
    emptyIcon: {
      width: normalize(100),
      height: normalize(100),
      borderRadius: normalize(24),
      backgroundColor: '#151B23',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: normalize(20),
      borderWidth: 1,
      borderColor: 'rgba(255, 149, 0, 0.2)',
    },
    emptyTitle: {
      fontSize: normalize(20),
      color: '#F9FAFB',
      fontWeight: '700',
      marginBottom: normalize(8),
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: normalize(14),
      color: '#9CA3AF',
      textAlign: 'center',
      lineHeight: normalize(20),
      fontWeight: '500',
    },
    emptyResults: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: normalize(40),
    },
    createBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: normalize(8),
      paddingVertical: normalize(16),
      paddingHorizontal: normalize(28),
      backgroundColor: '#FF9500',
      borderRadius: normalize(14),
      marginTop: normalize(24),
      shadowColor: '#FF9500',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    createBtnText: {
      fontSize: normalize(15),
      color: '#0f172a',
      fontWeight: '700',
    },
    
    filters: {
      marginBottom: normalize(16),
    },
filterPill: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: normalize(6),
  paddingHorizontal: normalize(10),
  paddingVertical: normalize(7),
  backgroundColor: '#151B23',
  borderRadius: normalize(10),
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.1)',
  marginRight: normalize(8),
  height: normalize(34),
},
filterPillActive: {
  backgroundColor: 'rgba(255, 149, 0, 0.12)',
  borderColor: 'rgba(255, 149, 0, 0.35)',
},
filterText: {
  fontSize: normalize(12),
  fontWeight: '600',
  color: '#9CA3AF',
},
filterTextActive: {
  color: '#FF9500',
},
filterBadge: {
  paddingHorizontal: normalize(6),
  paddingVertical: normalize(2),
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: normalize(6),
  minWidth: normalize(22),
  height: normalize(18),
  alignItems: 'center',
  justifyContent: 'center',
},
filterBadgeActive: {
  backgroundColor: 'rgba(255, 149, 0, 0.2)',
},
filterBadgeText: {
  fontSize: normalize(10),
  color: '#9CA3AF',
  fontWeight: '700',
},
filterBadgeTextActive: {
  color: '#FF9500',
},   
  bestMatchSection: {
    marginBottom: normalize(20),
  },
  bestMatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(10),
    paddingRight: normalize(4),
  },
  bestMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(6),
  },
  badgeText: {
    fontSize: normalize(11),
    fontWeight: '700',
    color: '#FF9500',
    letterSpacing: 1,
  },
  resultsCount: {
    fontSize: normalize(13),
    color: '#9CA3AF',
    fontWeight: '600',
  },
  bestMatchCard: {
    backgroundColor: '#151B23',
    borderRadius: normalize(18),
    padding: normalize(16),
    borderWidth: 2,
    borderColor: 'rgba(255, 149, 0, 0.4)',
  },
  bestMatchItemContainer: {
    marginBottom: normalize(12),
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderWidth: 0,
  },
  actions: {
    flexDirection: 'row',
    gap: normalize(10),
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(8),
    backgroundColor: '#FF9500',
    paddingVertical: normalize(14),
    borderRadius: normalize(12),
  },
  primaryBtnText: {
    fontSize: normalize(14),
    fontWeight: '700',
    color: '#0f172a',
  },
  secondaryBtn: {
    width: normalize(48),
    height: normalize(48),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: normalize(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },

  otherSection: {
  },
  otherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(6),
    marginBottom: normalize(12),
  },
  resultItem: {
  },
  });

  export default FoodSearchResults;