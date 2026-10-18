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
});
