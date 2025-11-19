import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { normalize } from '../../../../../shared/hooks/useResponsive';

const COLORS = {
  secondary: '#02111B',
  textPrimary: '#FFFFFF',
  text: '#FFFFFF',
  borderDivider: 'rgba(255, 255, 255, 0.08)',
};

export const Header = ({ title, handleBackPress }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={handleBackPress}
        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <Ionicons name="arrow-back" size={normalize(20)} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.placeholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(16),
    paddingTop: normalize(20),
    paddingBottom: normalize(20),
    backgroundColor: COLORS.secondary,
    borderBottomWidth: normalize(1),
    borderBottomColor: COLORS.borderDivider,
  },
  headerTitle: {
    fontSize: normalize(20),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    padding: normalize(8),
    borderRadius: normalize(10),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  placeholder: {
    width: normalize(32),
  },
});

export default Header;