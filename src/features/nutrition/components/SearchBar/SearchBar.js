import { useState, useCallback, memo, useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { normalize } from '../../../../shared/hooks/useResponsive';

const colors = {
  bg: '#0A0E13',
  surface: '#151B23',
  surfaceLight: '#1F2937',
  primary: '#FF9500',
  cyan: '#00d4ff',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
};

const ICON_SIZE = 18;
const MAX_RECENT_SEARCHES = 5;
const STORAGE_KEY = '@recent_searches';

const SearchBar = memo(({
  meal,
  searchQuery,
  setSearchQuery,
  handleSearch,
  onClear,
  onFocus,
  selectedDate,
  isSearching,
}) => {
  const navigation = useNavigation();
  const inputRef = useRef(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  useEffect(() => {
    if (isSearching && (!searchQuery || searchQuery.trim() === '')) {
      setShowRecentSearches(true);
    } else {
      setShowRecentSearches(false);
    }
  }, [isSearching, searchQuery]);

  const saveRecentSearches = async (searches) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
    } catch (error) {
      console.error('Error saving recent searches:', error);
    }
  };

  const loadRecentSearches = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setRecentSearches(parsed);
        console.log('Loaded recent searches:', parsed);
      } else {
        const testSearches = ['chicken breast', 'banana', 'oats'];
        setRecentSearches(testSearches);
        saveRecentSearches(testSearches);
        console.log('No saved searches, added test data:', testSearches);
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const handleFocus = useCallback(() => {
    console.log('SearchBar - handleFocus called');
    if (onFocus) {
      onFocus();
    }
  }, [onFocus]);

  useEffect(() => {
    if (isSearching && inputRef.current) {
      const focusTimeout = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
      
      return () => clearTimeout(focusTimeout);
    }
  }, [isSearching]);

  const handleBlur = useCallback(() => {
    console.log('SearchBar - handleBlur called');
  }, []);

  const addToRecentSearches = useCallback((text) => {
    if (!text || text.trim() === '') return;
    
    const trimmedText = text.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.toLowerCase() !== trimmedText.toLowerCase());
      const updated = [trimmedText, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      saveRecentSearches(updated);
      console.log('Added to recent searches:', trimmedText, 'Updated list:', updated);
      return updated;
    });
  }, []);

  const handleChangeText = useCallback((text) => {
    console.log('SearchBar - handleChangeText:', text);
    
    if (setSearchQuery) {
      setSearchQuery(text || '');
    }
    
    if (handleSearch) {
      handleSearch(text || '');
    }
  }, [setSearchQuery, handleSearch]);

  const handleSubmitEditing = useCallback(() => {
    if (searchQuery && searchQuery.trim()) {
      addToRecentSearches(searchQuery);
      Keyboard.dismiss();
    }
  }, [searchQuery, addToRecentSearches]);

  const handleClearPress = useCallback(() => {
    console.log('SearchBar - handleClearPress called');
    
    if (setSearchQuery) {
      setSearchQuery('');
    }
    
    if (handleSearch) {
      handleSearch('');
    }
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    setShowRecentSearches(true);
  }, [setSearchQuery, handleSearch]);

  const handleBackPress = useCallback(() => {
    console.log('SearchBar - handleBackPress called');
    
    if (inputRef.current) {
      inputRef.current.blur();
    }
    
    Keyboard.dismiss();
    
    if (onClear) {
      onClear();
    }
  }, [onClear]);

  const handleBarcodePress = useCallback(() => {
    Keyboard.dismiss();
    navigation.navigate('BarcodeScanner', { meal, selectedDate });
  }, [navigation, meal, selectedDate]);

  const handleRecentSearchPress = useCallback((searchTerm) => {
    console.log('Recent search pressed:', searchTerm);
    
    if (setSearchQuery) {
      setSearchQuery(searchTerm);
    }
    
    if (handleSearch) {
      handleSearch(searchTerm);
    }
    
    addToRecentSearches(searchTerm);
    
    setShowRecentSearches(false);
  }, [setSearchQuery, handleSearch, addToRecentSearches]);

  const handleClearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    saveRecentSearches([]);
  }, []);

  const shouldShowRecentSearches = showRecentSearches && 
                                   recentSearches.length > 0 && 
                                   isSearching;

  return (
    <View style={styles.searchContainer}>
      <View style={[
        styles.searchBar,
        isSearching && styles.searchBarFocused
      ]}>
        {!isSearching && (
          <TouchableOpacity
            style={styles.searchBarOverlay}
            onPress={() => {
              if (onFocus) {
                onFocus();
              }
            }}
            activeOpacity={1}
          />
        )}

        <View style={styles.iconContainer}>
          <MaterialCommunityIcons 
            name="magnify" 
            size={ICON_SIZE} 
            color={colors.textSecondary}
          />
        </View>
        
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Search foods"
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmitEditing}
          selectionColor={colors.primary}
          returnKeyType="search"
          blurOnSubmit={false}
          autoFocus={false}
          keyboardShouldPersistTaps="handled"
          clearButtonMode="never"
          autoCorrect={false}
          autoCapitalize="none"
          editable={isSearching}
        />

        <View style={styles.actionsContainer}>
          {isSearching && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons 
                name="arrow-left" 
                size={ICON_SIZE} 
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            onPress={handleBarcodePress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons 
              name="barcode-scan" 
              size={ICON_SIZE} 
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          
          {(searchQuery?.length > 0) && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons 
                name="close-circle" 
                size={ICON_SIZE} 
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  searchContainer: {
    marginTop: normalize(12),
  },
  searchBar: {
    flexDirection: 'row',
    height: normalize(55),
    backgroundColor: colors.surface,
    borderRadius: normalize(16),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  searchBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  searchBarFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 100,
  },
  iconContainer: {
    paddingLeft: normalize(18),
    paddingRight: normalize(12),
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    color: colors.textPrimary,
    fontSize: normalize(16),
    fontWeight: '400',
    lineHeight: normalize(20),
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: normalize(12),
    gap: normalize(4),
  },
  backButton: {
    width: normalize(36),
    height: normalize(36),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: normalize(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: normalize(4),
  },
  barcodeButton: {
    width: normalize(36),
    height: normalize(36),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: normalize(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    padding: normalize(8),
    borderRadius: normalize(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentSearchesDropdown: {
    backgroundColor: colors.surfaceLight,
    borderRadius: normalize(12),
    padding: normalize(12),
    marginTop: normalize(8),
    borderWidth: 1,
    borderColor: colors.border,
  },
  recentSearchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: normalize(12),
  },
  recentSearchesTitle: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: colors.textSecondary,
  },
  clearAllText: {
    fontSize: normalize(12),
    color: colors.primary,
    fontWeight: '500',
  },
  recentSearchesList: {
    flexDirection: 'row',
    gap: normalize(8),
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(6),
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: normalize(8),
    paddingHorizontal: normalize(12),
    borderRadius: normalize(20),
    marginRight: normalize(8),
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  recentSearchText: {
    fontSize: normalize(14),
    color: colors.textPrimary,
    fontWeight: '500',
    maxWidth: normalize(100),
  },
});

export default SearchBar;