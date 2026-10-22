import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../../shared/theme';
import { createStyles } from '../../../shared/theme/createStyles';

type AuthScreenLayoutProps = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

const AuthScreenLayout = ({ children, contentContainerStyle }: AuthScreenLayoutProps) => (
  <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView
      style={styles.root}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  </KeyboardAvoidingView>
);

const styles = createStyles(() => ({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
}));

export default AuthScreenLayout;
