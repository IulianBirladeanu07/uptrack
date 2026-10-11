export const passwordChangeError = (code?: string | null): string => {
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Current password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    case 'auth/network-request-failed':
      return 'No connection. Try again.';
    case 'auth/weak-password':
      return 'The new password is too weak.';
    case 'auth/requires-recent-login':
      return 'Log in again, then retry.';
    default:
      return 'The password was not updated. Try again.';
  }
};
