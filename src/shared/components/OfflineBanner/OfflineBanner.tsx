import { useContext } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '../../../features/auth/context/AuthContext';
import { colors, fontSize, fontWeight, spacing } from '../../theme';
import { createStyles } from '../../theme/createStyles';

/** Thin top banner when the session is served from a local cache. */
const OfflineBanner = () => {
  const auth = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  if (!auth?.isOffline) return null;

  return (
    <View style={[styles.bar, { paddingTop: Math.max(insets.top, spacing[1]) }]} accessibilityRole="text">
      <Text style={styles.text}>Offline — showing last saved data</Text>
    </View>
  );
};

const styles = createStyles(() => ({
  bar: {
    backgroundColor: colors.background.tertiary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    paddingBottom: spacing[2],
    paddingHorizontal: spacing[4],
    alignItems: 'center',
  },
  text: {
    color: colors.text.secondary,
    fontSize: fontSize[12],
    fontWeight: fontWeight.medium,
  },
}));

export default OfflineBanner;
