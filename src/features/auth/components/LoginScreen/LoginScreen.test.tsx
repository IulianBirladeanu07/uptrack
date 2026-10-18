import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import LoginScreen from './LoginScreen';

const mockNavigate = jest.fn();

jest.mock('@react-native-google-signin/google-signin', () => ({
    GoogleSignin: { configure: jest.fn(), hasPlayServices: jest.fn(), signOut: jest.fn(), signIn: jest.fn() },
    statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED' },
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null, MaterialIcons: () => null }));

jest.mock('../../services/firebaseAuthService', () => ({
    __esModule: true,
    default: {
        getGoogleWebClientId: () => 'web-client-id',
        signInWithEmailAndPassword: jest.fn(),
        signInWithGoogle: jest.fn(),
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
    it('shows both sign-in methods with the Google option as its own action', () => {
        render(<LoginScreen />);

        expect(screen.getAllByText('Login')).toHaveLength(2);
        expect(screen.getByText('Sign In with Google')).toBeTruthy();
        expect(screen.getByText('or')).toBeTruthy();
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
});
