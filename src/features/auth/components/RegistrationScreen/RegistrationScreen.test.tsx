import { Alert } from 'react-native';
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

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

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
    expect(Alert.alert.mock.calls[0][1]).toContain('noreply@activerecovery-3a400.firebaseapp.com');
    expect(Alert.alert.mock.calls[0][1]).toContain('not an Uptrack-branded address');
    expect(Alert.alert.mock.calls[0][1]).toContain('spam/junk folder');
    expect(Alert.alert.mock.calls[0][1]).toContain("You don't need to register again.");
  });
});
