import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: {} } },
}));

jest.mock('../ConfiguredApp', () => {
  throw new Error('Configured app should not load without runtime configuration');
});

import App from '../App';

describe('App configuration bootstrap', () => {
  it('shows a recoverable screen instead of loading configured services', () => {
    const { getByText } = render(<App />);

    expect(getByText('UpTrack is unavailable')).toBeTruthy();
  });
});
