import { useState, useCallback, memo, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, radius, SEARCH } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

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
      await AsyncStorage.setItem(SEARCH.STORAGE_KEY, JSON.stringify(searches));
    } catch (error) {
      console.error('Error saving recent searches:', error);
    }
  };

  const loadRecentSearches = async () => {
    try {
      const saved = await AsyncStorage.getItem(SEARCH.STORAGE_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      } else {
        const testSearches = ['chicken breast', 'banana', 'oats'];
        setRecentSearches(testSearches);
        saveRecentSearches(testSearches);
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const handleFocus = useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  useEffect(() => {
    if (isSearching && inputRef.current) {
      const focusTimeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(focusTimeout);
    }
  }, [isSearching]);

  const addToRecentSearches = useCallback((text) => {
    if (!text || text.trim() === '') return;
    const trimmedText = text.trim();
    setRecentSearches(prev => {
      const updated = [trimmedText, ...prev.filter(item => item.toLowerCase() !== trimmedText.toLowerCase())].slice(0, SEARCH.MAX_RECENT_SEARCHES);
      saveRecentSearches(updated);
      return updated;
    });
  }, []);

  const handleChangeText = useCallback((text) => {
    setSearchQuery?.(text || '');
    handleSearch?.(text || '');
  }, [setSearchQuery, handleSearch]);

  const handleSubmitEditing = useCallback(() => {
    if (searchQuery?.trim()) {
      addToRecentSearches(searchQuery);
      Keyboard.dismiss();
    }
  }, [searchQuery, addToRecentSearches]);

  const handleClearPress = useCallback(() => {
    setSearchQuery?.('');
    handleSearch?.('');
    inputRef.current?.focus();
    setShowRecentSearches(true);
  }, [setSearchQuery, handleSearch]);

  const handleBackPress = useCallback(() => {
    inputRef.current?.blur();
    Keyboard.dismiss();
    onClear?.();
  }, [onClear]);

  const handleBarcodePress = useCallback(() => {
    Keyboard.dismiss();
    navigation.navigate('BarcodeScanner', { meal, selectedDate });
  }, [navigation, meal, selectedDate]);

  const handleRecentSearchPress = useCallback((searchTerm) => {
    setSearchQuery?.(searchTerm);
    handleSearch?.(searchTerm);
    addToRecentSearches(searchTerm);
    setShowRecentSearches(false);
  }, [setSearchQuery, handleSearch, addToRecentSearches]);

  return (
    <View style={styles.searchContainer}>
      <View style={[styles.searchBar, isSearching && styles.searchBarFocused]}>
        {!isSearching && (
          <TouchableOpacity
            style={styles.searchBarOverlay}
            onPress={() => onFocus?.()}
            activeOpacity={1}
          />
        )}

        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="magnify"
            size={spacing.icon}
            color={colors.text.secondary}
          />
        </View>

        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Search foods"
          placeholderTextColor={colors.text.quaternary}
          value={searchQuery}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onSubmitEditing={handleSubmitEditing}
          selectionColor={colors.accent.primary}
          returnKeyType="search"
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
              hitSlop={{ top: spacing[2], bottom: spacing[2], left: spacing[2], right: spacing[2] }}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={spacing.icon}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleBarcodePress}
            hitSlop={{ top: spacing[2], bottom: spacing[2], left: spacing[2], right: spacing[2] }}
          >
            <MaterialCommunityIcons
              name="barcode-scan"
              size={spacing.icon}
              color={colors.text.secondary}
            />
          </TouchableOpacity>

          {searchQuery?.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearPress}
              hitSlop={{ top: spacing[2], bottom: spacing[2], left: spacing[2], right: spacing[2] }}
            >
              <MaterialCommunityIcons
                name="close-circle"
                size={spacing.icon}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = createStyles(() => ({
  searchContainer: {
    marginTop: spacing[3],
  },
  searchBar: {
    flexDirection: 'row',
    height: spacing.inputHeight,
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
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
    borderColor: colors.accent.primary,
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 100,
  },
  iconContainer: {
    paddingLeft: spacing[4],
    paddingRight: spacing[3],
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    color: colors.text.primary,
    fontSize: fontSize[16],
    fontWeight: fontWeight.medium,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing[3],
    gap: spacing[1],
  },
  backButton: {
    width: spacing[9],
    height: spacing[9],
    backgroundColor: colors.faded.surfaceMedium,
    borderRadius: radius[2],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[1],
  },
  clearButton: {
    padding: spacing[2],
    borderRadius: radius[2],
    justifyContent: 'center',
    alignItems: 'center',
  },
}));

export default SearchBar;