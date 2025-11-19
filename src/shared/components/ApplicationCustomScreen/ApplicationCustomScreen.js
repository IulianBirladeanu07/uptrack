import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { normalize } from '../../hooks/useResponsive';

const COLORS = {
  background: '#0A0E13',
  textPrimary: '#FFFFFF',
  iconColor: '#d1d5db',
  iconActive: '#ff8535',
};

const ApplicationCustomScreen = ({ children, showHeader = true }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Shared Header */}
      {showHeader && (
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={handleProfilePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="person-circle-outline" size={normalize(32)} color={COLORS.iconColor} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={handleSettingsPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="settings-outline" size={normalize(28)} color={COLORS.iconColor} />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Screen Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
  },
  headerButton: {
    padding: normalize(4),
  },
  content: {
    flex: 1,
  },
});

export default ApplicationCustomScreen;