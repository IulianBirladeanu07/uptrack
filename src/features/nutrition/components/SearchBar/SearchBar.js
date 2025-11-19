import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Keyboard, 
  ScrollView, 
  Text
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { normalize } from '../../../../shared/hooks/useResponsive';

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

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Show/hide recent searches based on search state and query
  useEffect(() => {
    if (isSearching && (!searchQuery || searchQuery.trim() === '')) {
      setShowRecentSearches(true);
    } else {
      setShowRecentSearches(false);
    }
  }, [isSearching, searchQuery]);

  // Save recent searches to AsyncStorage
  const saveRecentSearches = async (searches) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
    } catch (error) {
      console.error('Error saving recent searches:', error);
    }
  };

  // Load recent searches from AsyncStorage
  const loadRecentSearches = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setRecentSearches(parsed);
        console.log('Loaded recent searches:', parsed);
      } else {
        // For testing - add some sample recent searches
        const testSearches = ['chicken breast', 'banana', 'oats'];
        setRecentSearches(testSearches);
        saveRecentSearches(testSearches);
        console.log('No saved searches, added test data:', testSearches);
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  // Handle input focus
  const handleFocus = useCallback(() => {
    console.log('SearchBar - handleFocus called');
    // Call parent onFocus to enter search mode
    if (onFocus) {
      onFocus();
    }
  }, [onFocus]);

  // Auto-focus when entering search mode
  useEffect(() => {
    if (isSearching && inputRef.current) {
      // Small delay to ensure the component is ready
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
    // Don't automatically exit search mode on blur
    // Let the parent component handle this
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

  // Handle text input changes
  const handleChangeText = useCallback((text) => {
    console.log('SearchBar - handleChangeText:', text);
    
    // Update query via parent
    if (setSearchQuery) {
      setSearchQuery(text || '');
    }
    
    // Trigger search via parent
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

  // Clear search but stay in search mode
  const handleClearPress = useCallback(() => {
    console.log('SearchBar - handleClearPress called');
    
    // Clear the search query
    if (setSearchQuery) {
      setSearchQuery('');
    }
    
    // Clear search results
    if (handleSearch) {
      handleSearch('');
    }
    
    // Keep focus on input
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Show recent searches again
    setShowRecentSearches(true);
  }, [setSearchQuery, handleSearch]);

  // Exit search mode completely
  const handleBackPress = useCallback(() => {
    console.log('SearchBar - handleBackPress called');
    
    // Blur the input
    if (inputRef.current) {
      inputRef.current.blur();
    }
    
    // Dismiss keyboard
    Keyboard.dismiss();
    
    // Call parent onClear to exit search mode
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
    
    // Update search query
    if (setSearchQuery) {
      setSearchQuery(searchTerm);
    }
    
    // Trigger search
    if (handleSearch) {
      handleSearch(searchTerm);
    }
    
    // Add to recent searches (move to top of list)
    addToRecentSearches(searchTerm);
    
    // Hide recent searches since we now have search results
    setShowRecentSearches(false);
  }, [setSearchQuery, handleSearch, addToRecentSearches]);

  const handleClearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    saveRecentSearches([]);
  }, []);

  // Show recent searches when in search mode with empty query
  const shouldShowRecentSearches = showRecentSearches && 
                                   recentSearches.length > 0 && 
                                   isSearching;

  return (
    <View style={styles.searchContainer}>
      <View style={[
        styles.searchBar,
        isSearching && styles.searchBarFocused
      ]}>
        {/* Clickable overlay for the entire search bar when not searching */}
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
            color="#8e95a3"
          />
        </View>
        
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Search foods"
          placeholderTextColor="#8e95a3"
          value={searchQuery}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmitEditing}
          selectionColor="#FF7B00"
          returnKeyType="search"
          blurOnSubmit={false}
          autoFocus={false}
          keyboardShouldPersistTaps="handled"
          clearButtonMode="never"
          autoCorrect={false}
          autoCapitalize="none"
          editable={isSearching} // Only editable when in search mode
        />

        <View style={styles.actionsContainer}>
          {/* Back button - only show when searching */}
          {isSearching && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons 
                name="arrow-left" 
                size={ICON_SIZE} 
                color="#8e95a3"
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
              color="#8e95a3"
            />
          </TouchableOpacity>
          
          {/* Clear button - only show when there's text */}
          {(searchQuery?.length > 0) && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons 
                name="close-circle" 
                size={ICON_SIZE} 
                color="#8e95a3"
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
    backgroundColor: '#151B23',
    borderRadius: normalize(16),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
    borderColor: '#FF7B00',
    shadowColor: '#FF7B00',
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
    color: 'white',
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
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: normalize(12),
    padding: normalize(12),
    marginTop: normalize(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#8e95a3',
  },
  clearAllText: {
    fontSize: normalize(12),
    color: '#FF7B00',
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
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  recentSearchText: {
    fontSize: normalize(14),
    color: '#ffffff',
    fontWeight: '500',
    maxWidth: normalize(100),
  },
});

export default SearchBar;