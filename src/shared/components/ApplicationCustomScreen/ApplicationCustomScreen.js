import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { normalize } from '../../hooks/useResponsive';
import { colors, spacing } from '../../theme';

const ApplicationCustomScreen = ({ children, showHeader = true }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {showHeader && (
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="person-circle-outline" size={normalize(32)} color={colors.accent.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="settings-outline" size={normalize(26)} color={colors.text.quaternary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  content: {
    flex: 1,
  },
});

export default ApplicationCustomScreen;