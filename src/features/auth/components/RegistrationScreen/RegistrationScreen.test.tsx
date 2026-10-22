import { Alert, KeyboardAvoidingView, ScrollView } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import RegistrationScreen from './RegistrationScreen';

jest.mock('../../services/firebaseAuthService', () => ({
  __esModule: true,
  default: {
    signUpWithEmailAndPassword: jest.fn(),
  },
}));

jest.mock('../../../../shared/navigation', () => ({
  useRootNavigation: () => ({ navigate: jest.fn() }),
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null, MaterialIcons: () => null }));

describe('RegistrationScreen', () => {
  beforeEach(() => {
    jest.requireMock('../../services/firebaseAuthService').default.signUpWithEmailAndPassword.mockReset();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows a user-focused rate-limit message inline without replacing it with a technical error', async () => {
    const mockSignUp = jest.requireMock('../../services/firebaseAuthService').default.signUpWithEmailAndPassword;
    mockSignUp.mockRejectedValueOnce(new Error(
      "We couldn't create your account because sign-up is temporarily limited. Please wait a while before trying again. If this keeps happening, contact support.",
    ));
    render(<RegistrationScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'person@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'GoodPass1!');
    fireEvent.changeText(screen.getByPlaceholderText('Confirm Password'), 'GoodPass1!');
    fireEvent.press(screen.getByTestId('registration-submit-button'));

    await waitFor(() => {
      expect(screen.getByText(
        "We couldn't create your account because sign-up is temporarily limited. Please wait a while before trying again. If this keeps happening, contact support.",
      )).toBeTruthy();
    });
  });

  it('sets expectations for verification email delivery and explains recovery', async () => {
    const mockSignUp = jest.requireMock('../../services/firebaseAuthService').default.signUpWithEmailAndPassword;
    mockSignUp.mockResolvedValueOnce({});
    render(<RegistrationScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'person@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'GoodPass1!');
    fireEvent.changeText(screen.getByPlaceholderText('Confirm Password'), 'GoodPass1!');
    fireEvent.press(screen.getByTestId('registration-submit-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Registration Successful',
        expect.stringContaining('Delivery can take a few minutes'),
        expect.any(Array),
        { cancelable: false },
      );
    });
    expect(Alert.alert.mock.calls[0][1]).toContain('Verify your email for Uptrack');
    expect(Alert.alert.mock.calls[0][1]).not.toMatch(/activerecovery|firebaseapp|not an Uptrack-branded address/i);
    expect(Alert.alert.mock.calls[0][1]).toContain('spam/junk folder');
    expect(Alert.alert.mock.calls[0][1]).toContain("You don't need to register again.");
  });

  it('accepts an email with a trailing space and sends it trimmed', async () => {
    const mockSignUp = jest.requireMock('../../services/firebaseAuthService').default.signUpWithEmailAndPassword;
    mockSignUp.mockResolvedValueOnce({});
    render(<RegistrationScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), '  person@example.com ');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'GoodPass1!');
    fireEvent.changeText(screen.getByPlaceholderText('Confirm Password'), 'GoodPass1!');
    fireEvent.press(screen.getByTestId('registration-submit-button'));

    await waitFor(() => expect(mockSignUp).toHaveBeenCalledWith('person@example.com', 'GoodPass1!'));
    expect(screen.queryByText('Please enter a valid email address.')).toBeNull();
  });

  it('still rejects an email with a space inside it', async () => {
    const mockSignUp = jest.requireMock('../../services/firebaseAuthService').default.signUpWithEmailAndPassword;
    render(<RegistrationScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'per son@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'GoodPass1!');
    fireEvent.changeText(screen.getByPlaceholderText('Confirm Password'), 'GoodPass1!');
    fireEvent.press(screen.getByTestId('registration-submit-button'));

    await waitFor(() => expect(screen.getByText('Please enter a valid email address.')).toBeTruthy());
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('matches the login brand treatment and uses a clear login action', () => {
    render(<RegistrationScreen />);

    expect(screen.getByText('UPTRACK')).toBeTruthy();
    expect(screen.getByText('Already have an account?')).toBeTruthy();
    expect(screen.getByText('Log in')).toBeTruthy();
  });

  it('scrolls and keeps the keyboard from hiding the form', () => {
    render(<RegistrationScreen />);

    expect(screen.UNSAFE_getByType(ScrollView).props.keyboardShouldPersistTaps).toBe('handled');
    expect(screen.UNSAFE_getByType(KeyboardAvoidingView)).toBeTruthy();
  });
});
