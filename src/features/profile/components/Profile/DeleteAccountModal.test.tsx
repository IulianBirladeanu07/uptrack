import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import DeleteAccountModal from './DeleteAccountModal';

type ProviderData = { providerId: string };

let mockUser: { email: string; providerData: ProviderData[] } | null = null;
const mockDeleteAccount = jest.fn();
const mockEmailCredential = jest.fn((email: string, password: string) => ({ kind: 'email', email, password }));
const mockGoogleCredential = jest.fn((token: string) => ({ kind: 'google', token }));
const mockAppleCredential = jest.fn((args: { idToken: string; rawNonce: string }) => ({ kind: 'apple', ...args }));
const mockAppleSignIn = jest.fn();
const mockGoogleSignIn = jest.fn();

jest.mock('firebase/auth', () => ({
    getAuth: () => ({ currentUser: mockUser }),
    EmailAuthProvider: { credential: (...args: [string, string]) => mockEmailCredential(...args) },
    GoogleAuthProvider: { credential: (...args: [string]) => mockGoogleCredential(...args) },
    OAuthProvider: function OAuthProvider(this: { credential: unknown }) {
        this.credential = (args: { idToken: string; rawNonce: string }) => mockAppleCredential(args);
    },
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
    GoogleSignin: {
        hasPlayServices: jest.fn(async () => true),
        signOut: jest.fn(async () => undefined),
        signIn: (...args: unknown[]) => mockGoogleSignIn(...args),
    },
    statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED' },
}));

jest.mock('expo-apple-authentication', () => ({
    signInAsync: (...args: unknown[]) => mockAppleSignIn(...args),
    AppleAuthenticationScope: { EMAIL: 1, FULL_NAME: 0 },
}));

jest.mock('../../../auth/utils/appleSignInNonce', () => ({
    createAppleSignInNonce: jest.fn(async () => ({ rawNonce: 'raw-nonce', hashedNonce: 'hashed-nonce' })),
}));

jest.mock('../../services/accountDeletionService', () => ({
    deleteAccount: (...args: unknown[]) => mockDeleteAccount(...args),
}));

const signedInAs = (providerId: string) => {
    mockUser = { email: 'a@b.co', providerData: [{ providerId }] };
};

const pressDelete = async () => {
    await act(async () => {
        fireEvent.press(screen.getByText('Delete'));
    });
};

describe('DeleteAccountModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDeleteAccount.mockResolvedValue(undefined);
    });

    it('keeps Delete disabled for a password account until a password is typed, then reauthenticates with it', async () => {
        signedInAs('password');
        render(<DeleteAccountModal visible onClose={jest.fn()} />);

        await pressDelete();
        expect(mockDeleteAccount).not.toHaveBeenCalled();

        fireEvent.changeText(screen.getByPlaceholderText('Password'), 'hunter2');
        await pressDelete();

        expect(mockEmailCredential).toHaveBeenCalledWith('a@b.co', 'hunter2');
        expect(mockDeleteAccount).toHaveBeenCalledWith(mockUser, { kind: 'email', email: 'a@b.co', password: 'hunter2' });
    });

    it('shows a wrong-password message and re-enables Delete', async () => {
        signedInAs('password');
        mockDeleteAccount.mockRejectedValueOnce(Object.assign(new Error('x'), { code: 'auth/wrong-password' }));
        render(<DeleteAccountModal visible onClose={jest.fn()} />);

        fireEvent.changeText(screen.getByPlaceholderText('Password'), 'nope');
        await pressDelete();

        expect(await screen.findByText('Wrong password.')).toBeTruthy();
        await pressDelete();
        expect(mockDeleteAccount).toHaveBeenCalledTimes(2);
    });

    it('confirms a Google account with a Google credential', async () => {
        signedInAs('google.com');
        mockGoogleSignIn.mockResolvedValueOnce({ data: { idToken: 'google-token' } });
        render(<DeleteAccountModal visible onClose={jest.fn()} />);

        expect(screen.getByText('You will be asked to confirm with Google.')).toBeTruthy();
        await pressDelete();

        expect(mockGoogleCredential).toHaveBeenCalledWith('google-token');
        expect(mockDeleteAccount).toHaveBeenCalledWith(mockUser, { kind: 'google', token: 'google-token' });
        expect(mockAppleSignIn).not.toHaveBeenCalled();
    });

    it('confirms an Apple account with an Apple credential built from the identity token and raw nonce', async () => {
        signedInAs('apple.com');
        mockAppleSignIn.mockResolvedValueOnce({ identityToken: 'apple-token' });
        render(<DeleteAccountModal visible onClose={jest.fn()} />);

        expect(screen.getByText('You will be asked to confirm with Apple.')).toBeTruthy();
        await pressDelete();

        expect(mockAppleSignIn).toHaveBeenCalledWith(expect.objectContaining({ nonce: 'hashed-nonce' }));
        expect(mockAppleCredential).toHaveBeenCalledWith({ idToken: 'apple-token', rawNonce: 'raw-nonce' });
        expect(mockDeleteAccount).toHaveBeenCalledWith(mockUser, { kind: 'apple', idToken: 'apple-token', rawNonce: 'raw-nonce' });
        expect(mockGoogleSignIn).not.toHaveBeenCalled();
    });

    it('treats a cancelled Apple sheet as no action, with no error and no deletion', async () => {
        signedInAs('apple.com');
        mockAppleSignIn.mockRejectedValueOnce(Object.assign(new Error('cancelled'), { code: 'ERR_REQUEST_CANCELED' }));
        render(<DeleteAccountModal visible onClose={jest.fn()} />);

        await pressDelete();

        expect(mockDeleteAccount).not.toHaveBeenCalled();
        expect(screen.queryByText('Deletion did not finish. Try again.')).toBeNull();
    });

    it('treats a cancelled Google sheet as no action', async () => {
        signedInAs('google.com');
        mockGoogleSignIn.mockRejectedValueOnce(Object.assign(new Error('cancelled'), { code: 'SIGN_IN_CANCELLED' }));
        render(<DeleteAccountModal visible onClose={jest.fn()} />);

        await pressDelete();

        expect(mockDeleteAccount).not.toHaveBeenCalled();
        expect(screen.queryByText('Deletion did not finish. Try again.')).toBeNull();
    });

    it('shows a generic message when deletion fails after confirming', async () => {
        signedInAs('apple.com');
        mockAppleSignIn.mockResolvedValueOnce({ identityToken: 'apple-token' });
        mockDeleteAccount.mockRejectedValueOnce(new Error('boom'));
        render(<DeleteAccountModal visible onClose={jest.fn()} />);

        await pressDelete();

        expect(await screen.findByText('Deletion did not finish. Try again.')).toBeTruthy();
    });

    it('closes from Cancel and clears the typed password', async () => {
        signedInAs('password');
        const onClose = jest.fn();
        render(<DeleteAccountModal visible onClose={onClose} />);

        fireEvent.changeText(screen.getByPlaceholderText('Password'), 'typed');
        await waitFor(() => expect(screen.getByPlaceholderText('Password').props.value).toBe('typed'));
        fireEvent.press(screen.getByText('Cancel'));

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(screen.getByPlaceholderText('Password').props.value).toBe('');
    });
});
