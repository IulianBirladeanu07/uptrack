import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import * as Updates from 'expo-updates';
import { colors, fontSize, fontWeight, radius, spacing } from '../../theme';
import { createStyles } from '../../theme/createStyles';

type ErrorBoundaryProps = {
    children: ReactNode;
    onRestart?: () => Promise<void>;
};

type ErrorBoundaryState = {
    failed: boolean;
};

const reloadApp = () => Updates.reloadAsync();

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    override state: ErrorBoundaryState = { failed: false };

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { failed: true };
    }

    override componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('RENDER_ERROR:', error.message, error.stack, info.componentStack);
    }

    handleRestart = async () => {
        try {
            await (this.props.onRestart ?? reloadApp)();
        } catch {
            this.setState({ failed: false });
        }
    };

    override render() {
        if (!this.state.failed) return this.props.children;
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Something went wrong</Text>
                <Text style={styles.body}>
                    Uptrack hit an unexpected problem. Your saved data is not affected. Restart the app to continue.
                </Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={this.handleRestart}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Restart the app"
                >
                    <Text style={styles.buttonText}>Restart</Text>
                </TouchableOpacity>
            </View>
        );
    }
}

const styles = createStyles(() => ({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing[6],
        gap: spacing[3],
        backgroundColor: colors.background.primary,
    },
    title: {
        fontSize: fontSize[20],
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
        textAlign: 'center',
    },
    body: {
        fontSize: fontSize[14],
        color: colors.text.secondary,
        textAlign: 'center',
    },
    button: {
        alignSelf: 'stretch',
        alignItems: 'center',
        marginTop: spacing[3],
        paddingVertical: spacing[4],
        borderRadius: radius[3],
        backgroundColor: colors.accent.primary,
    },
    buttonText: {
        fontSize: fontSize[16],
        fontWeight: fontWeight.bold,
        color: colors.accent.buttonText,
    },
}));

export default ErrorBoundary;
