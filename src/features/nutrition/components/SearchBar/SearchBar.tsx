import { useCallback, memo, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScanBarcode } from 'lucide-react-native';
import { useAppNavigation } from '../../../../shared/navigation/hooks';
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../shared/theme';
import { createStyles } from '../../../../shared/theme/createStyles';

type SearchBarProps = {
  meal?: string | undefined;
  searchQuery: string;
  setSearchQuery?: ((query: string) => void) | undefined;
  onClear?: (() => void) | undefined;
  onFocus?: (() => void) | undefined;
  selectedDate?: string | undefined;
  isSearching: boolean;
};

const SearchBar = memo(({
  meal,
  searchQuery,
  setSearchQuery,
  onClear,
  onFocus,
  selectedDate,
  isSearching,
}: SearchBarProps) => {
  const navigation = useAppNavigation();
  const inputRef = useRef<TextInput>(null);

  const handleFocus = useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  useEffect(() => {
    if (!isSearching || !inputRef.current) return;
    const focusTimeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(focusTimeout);
  }, [isSearching]);

  const handleChangeText = useCallback((text: string) => {
    setSearchQuery?.(text || '');
  }, [setSearchQuery]);

  const handleSubmitEditing = useCallback(() => {
    if (searchQuery?.trim()) {
      Keyboard.dismiss();
    }
  }, [searchQuery]);

  const handleClearPress = useCallback(() => {
    setSearchQuery?.('');
    inputRef.current?.focus();
  }, [setSearchQuery]);

  const handleBackPress = useCallback(() => {
    inputRef.current?.blur();
    Keyboard.dismiss();
    onClear?.();
  }, [onClear]);

  const handleBarcodePress = useCallback(() => {
    Keyboard.dismiss();
    navigation.navigate('BarcodeScanner', { meal, selectedDate });
  }, [navigation, meal, selectedDate]);

  return (
    <View style={[styles.searchContainer, isSearching && styles.searchContainerSearching]}>
      <View style={[styles.searchBar, isSearching && styles.searchBarFocused]}>
        {!isSearching && (
          <TouchableOpacity
            style={styles.searchBarOverlay}
            onPress={() => onFocus?.()}
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel="Search foods"
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
          clearButtonMode="never"
          autoCorrect={false}
          autoCapitalize="none"
          editable={isSearching}
        />

        {searchQuery?.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearPress}
            hitSlop={{ top: spacing[2], bottom: spacing[2], left: spacing[2], right: spacing[2] }}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={spacing.icon}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {isSearching ? (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleBackPress}
          accessibilityRole="button"
          accessibilityLabel="Cancel search"
          hitSlop={{ top: spacing[2], bottom: spacing[2], left: spacing[2], right: spacing[2] }}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.scannerButton}
          onPress={handleBarcodePress}
          accessibilityRole="button"
          accessibilityLabel="Scan barcode"
          accessibilityHint="Opens the barcode scanner"
          activeOpacity={0.7}
        >
          <ScanBarcode size={spacing[5]} color={colors.accent.primary} strokeWidth={2} />
          <Text style={styles.scannerButtonText}>Scan</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = createStyles(() => ({
  searchContainer: {
    marginTop: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  searchContainerSearching: {
    gap: spacing[1],
  },
  searchBar: {
    flex: 1,
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
  scannerButton: {
    height: spacing.inputHeight,
    paddingHorizontal: spacing[3],
    flexDirection: 'row',
    gap: spacing[2],
    backgroundColor: colors.background.secondary,
    borderRadius: radius[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerButtonText: {
    color: colors.text.secondary,
    fontSize: fontSize[12],
    fontWeight: fontWeight.semibold,
  },
  cancelButton: {
    minHeight: spacing[12],
    paddingHorizontal: spacing[1],
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    color: colors.text.secondary,
    fontSize: fontSize[14],
    fontWeight: fontWeight.semibold,
  },
  clearButton: {
    padding: spacing[2],
    borderRadius: radius[2],
    justifyContent: 'center',
    alignItems: 'center',
  },
}));

export default SearchBar;
