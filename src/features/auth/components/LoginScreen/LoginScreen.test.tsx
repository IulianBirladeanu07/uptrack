import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
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
});
