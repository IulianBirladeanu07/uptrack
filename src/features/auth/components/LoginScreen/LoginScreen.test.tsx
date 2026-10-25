import React from 'react';
import { Alert, KeyboardAvoidingView, ScrollView } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import LoginScreen from './LoginScreen';

const mockNavigate = jest.fn();
const mockAppleSignIn = jest.fn();
const mockAppleAvailable = jest.fn(async () => true);
const mockSignInWithApple = jest.fn();

jest.mock('expo-apple-authentication', () => {
    return {
        isAvailableAsync: (...args: unknown[]) => mockAppleAvailable(...args),
        signInAsync: (...args: unknown[]) => mockAppleSignIn(...args),
        AppleAuthenticationScope: { EMAIL: 1, FULL_NAME: 0 },
        AppleAuthenticationButtonType: { SIGN_IN: 0 },
        AppleAuthenticationButtonStyle: { BLACK: 0 },
        AppleAuthenticationButton: ({ onPress, testID }: { onPress: () => void; testID: string }) => {
            const ReactRuntime = jest.requireActual('react');
            const ReactNative = jest.requireActual('react-native');
            return ReactRuntime.createElement(ReactNative.TouchableOpacity, { onPress, testID });
        },
    };
});

jest.mock('expo-crypto', () => ({
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    randomUUID: jest.fn(() => 'raw-nonce'),
    digestStringAsync: jest.fn(async () => 'hashed-nonce'),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
    GoogleSignin: { configure: jest.fn(), hasPlayServices: jest.fn(), signOut: jest.fn(), signIn: jest.fn() },
    statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED' },
}));

jest.mock('@expo/vector-icons/Ionicons', () => ({ __esModule: true, default: () => null }));
jest.mock('@expo/vector-icons/MaterialIcons', () => ({ __esModule: true, default: () => null }));

jest.mock('../../services/firebaseAuthService', () => ({
    __esModule: true,
    default: {
        getGoogleWebClientId: () => 'web-client-id',
        signInWithEmailAndPassword: jest.fn(),
        signInWithGoogle: jest.fn(),
        signInWithApple: (...args: unknown[]) => mockSignInWithApple(...args),
        resendVerificationEmail: jest.fn(),
    },
}));

jest.mock('../../context/AuthContext', () => {
    const { createContext } = require('react');
    return {
        AuthContext: createContext({ setAuthenticated: jest.fn(), setProfileSetupComplete: jest.fn() }),
    };
});

jest.mock('../../../../shared/navigation', () => ({
    useRootNavigation: () => ({ navigate: mockNavigate }),
}));

describe('LoginScreen', () => {
    beforeEach(() => {
        mockAppleAvailable.mockResolvedValue(false);
        mockAppleSignIn.mockReset();
        mockSignInWithApple.mockReset();
    });

    it('shows both sign-in methods with the Google option as its own action', () => {
        render(<LoginScreen />);

        expect(screen.getAllByText('Login')).toHaveLength(2);
        expect(screen.getByText('Sign In with Google')).toBeTruthy();
        expect(screen.getByText('or')).toBeTruthy();
    });

    it('offers Apple sign-in when the native provider is available', async () => {
        mockAppleAvailable.mockResolvedValueOnce(true);
        render(<LoginScreen />);

        expect(await screen.findByTestId('apple-sign-in-button')).toBeTruthy();
    });

    it('passes the nonce-bound Apple identity token to Firebase', async () => {
        mockAppleAvailable.mockResolvedValueOnce(true);
        mockAppleSignIn.mockResolvedValueOnce({
            identityToken: 'apple-id-token',
            email: 'person@privaterelay.appleid.com',
            fullName: { givenName: 'Ana', middleName: null, familyName: 'Pop' },
        });
        render(<LoginScreen />);
        fireEvent.press(await screen.findByTestId('apple-sign-in-button'));

        await waitFor(() => {
            expect(mockSignInWithApple).toHaveBeenCalledWith(
                'apple-id-token',
                'raw-nonce',
                {
                    email: 'person@privaterelay.appleid.com',
                    fullName: { givenName: 'Ana', middleName: null, familyName: 'Pop' },
                },
                expect.any(Function),
                expect.any(Function),
            );
        });
        expect(mockAppleSignIn).toHaveBeenCalledWith({
            requestedScopes: [1, 0],
            nonce: 'hashed-nonce',
        });
    });

    it('does not show a user-facing error when Apple sign-in is cancelled', async () => {
        mockAppleAvailable.mockResolvedValueOnce(true);
        mockAppleSignIn.mockRejectedValueOnce(Object.assign(new Error('cancelled'), {
            code: 'ERR_REQUEST_CANCELED',
        }));
        render(<LoginScreen />);
        fireEvent.press(await screen.findByTestId('apple-sign-in-button'));

        await waitFor(() => expect(mockAppleSignIn).toHaveBeenCalledTimes(1));
        expect(screen.queryByText(/couldn't sign you in with Apple/i)).toBeNull();
    });

    it('does not render the Apple button when it is unavailable', async () => {
        mockAppleAvailable.mockResolvedValueOnce(false);
        render(<LoginScreen />);

        await waitFor(() => {
            expect(screen.queryByTestId('apple-sign-in-button')).toBeNull();
        });
    });

    it('navigates to Forgot Password and Registration from their links', () => {
        render(<LoginScreen />);

        fireEvent.press(screen.getByTestId('forgot-password-link'));
        expect(mockNavigate).toHaveBeenLastCalledWith('ForgotPassword');

        fireEvent.press(screen.getByTestId('register-link'));
        expect(mockNavigate).toHaveBeenLastCalledWith('Registration');
    });

    it('shows a helpful sign-in message instead of a raw Firebase error', async () => {
        const authService = jest.requireMock('../../services/firebaseAuthService').default;
        authService.signInWithEmailAndPassword.mockRejectedValueOnce(
            Object.assign(new Error('Firebase: Error (auth/too-many-requests).'), {
                code: 'auth/too-many-requests',
            }),
        );
        render(<LoginScreen />);

        fireEvent.changeText(screen.getByPlaceholderText('Email'), 'person@example.com');
        fireEvent.changeText(screen.getByPlaceholderText('Password'), 'not-a-real-password');
        fireEvent.press(screen.getByTestId('login-submit-button'));

        await waitFor(() => {
            expect(screen.getByText(
                "We couldn't sign you in because requests are temporarily limited. Please wait a while, then try again.",
            )).toBeTruthy();
        });
        expect(screen.queryByText(/auth\/too-many-requests/)).toBeNull();
    });

    describe('unverified account', () => {
        const unverifiedError = () => Object.assign(
            new Error('Email not verified. Please verify your email before logging in.'),
            { code: 'auth/email-not-verified' },
        );

        const signInUnverified = async () => {
            const authService = jest.requireMock('../../services/firebaseAuthService').default;
            authService.signInWithEmailAndPassword.mockRejectedValueOnce(unverifiedError());
            render(<LoginScreen />);
            fireEvent.changeText(screen.getByPlaceholderText('Email'), ' person@example.com ');
            fireEvent.changeText(screen.getByPlaceholderText('Password'), 'not-a-real-password');
            fireEvent.press(screen.getByTestId('login-submit-button'));
            await screen.findByTestId('verify-email-notice');
            return authService;
        };

        beforeEach(() => {
            jest.useFakeTimers();
            jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('shows a verification notice with the email address instead of an error banner', async () => {
            await signInUnverified();

            expect(screen.getByText('Verify your email')).toBeTruthy();
            expect(screen.getByText(/person@example\.com/)).toBeTruthy();
            expect(screen.getByText(/Verify your email for Uptrack/)).toBeTruthy();
            expect(screen.queryByText(/activerecovery|firebaseapp|not an Uptrack-branded address/i)).toBeNull();
            expect(screen.queryByText(/Email not verified/)).toBeNull();
            expect(screen.getByText('Resend email')).toBeTruthy();
        });

        it('keeps the notice after resending and counts down before allowing another resend', async () => {
            const authService = await signInUnverified();
            authService.resendVerificationEmail.mockResolvedValueOnce(true);

            await act(async () => {
                fireEvent.press(screen.getByTestId('resend-verification-button'));
            });

            expect(authService.resendVerificationEmail).toHaveBeenCalledTimes(1);
            expect(Alert.alert).toHaveBeenCalledWith(
                'Verification Email Sent',
                expect.stringContaining('Verify your email for Uptrack'),
            );
            expect(screen.getByText('Resend in 60s')).toBeTruthy();

            fireEvent.press(screen.getByTestId('resend-verification-button'));
            expect(authService.resendVerificationEmail).toHaveBeenCalledTimes(1);

            act(() => {
                jest.advanceTimersByTime(18000);
            });
            expect(screen.getByText('Resend in 42s')).toBeTruthy();

            act(() => {
                jest.advanceTimersByTime(42000);
            });
            expect(screen.getByText('Resend email')).toBeTruthy();
        });

        it('hides the notice when the email is edited', async () => {
            await signInUnverified();

            fireEvent.changeText(screen.getByPlaceholderText('Email'), 'other@example.com');

            expect(screen.queryByTestId('verify-email-notice')).toBeNull();
        });
    });

    it('scrolls and keeps the keyboard from hiding the form', () => {
        render(<LoginScreen />);

        expect(screen.UNSAFE_getByType(ScrollView).props.keyboardShouldPersistTaps).toBe('handled');
        expect(screen.UNSAFE_getByType(KeyboardAvoidingView)).toBeTruthy();
    });

    it('labels the password visibility toggle with its current action', () => {
        render(<LoginScreen />);

        fireEvent.press(screen.getByRole('button', { name: 'Show password' }));

        expect(screen.getByRole('button', { name: 'Hide password' })).toBeTruthy();
    });
});
