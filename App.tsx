import React, { Suspense, lazy } from 'react';
import Constants from 'expo-constants';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { getMissingRequiredAppConfig } from './src/shared/config/appConfigStatus';
import { colors, spacing, fontSize, fontWeight } from './src/shared/theme';

const ConfiguredApp = lazy(() => import('./ConfiguredApp'));
const missingConfig = getMissingRequiredAppConfig(Constants.expoConfig?.extra);

export default function App() {
  if (missingConfig.length > 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>UpTrack is unavailable</Text>
        <Text style={styles.message}>
          This app installation is missing required setup. Please install an updated build or contact support.
        </Text>
      </View>
    );
  }

  return (
    <Suspense fallback={<View style={styles.loading}><ActivityIndicator color={colors.accent.primary} /></View>}>
      <ConfiguredApp />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    backgroundColor: colors.background.primary,
  },
  title: {
    color: colors.text.primary,
    fontSize: fontSize[24],
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  message: {
    color: colors.text.secondary,
    fontSize: fontSize[16],
    lineHeight: 24,
    marginTop: spacing[3],
    textAlign: 'center',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
});
