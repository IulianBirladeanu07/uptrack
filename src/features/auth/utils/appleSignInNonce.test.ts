jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  randomUUID: jest.fn(() => 'raw-nonce'),
  digestStringAsync: jest.fn(async () => 'hashed-nonce'),
}));

import * as Crypto from 'expo-crypto';
import { createAppleSignInNonce } from './appleSignInNonce';

describe('createAppleSignInNonce', () => {
  it('uses a cryptographically generated nonce and sends only its SHA-256 digest to Apple', async () => {
    await expect(createAppleSignInNonce()).resolves.toEqual({
      rawNonce: 'raw-nonce',
      hashedNonce: 'hashed-nonce',
    });
    expect(Crypto.randomUUID).toHaveBeenCalledTimes(1);
    expect(Crypto.digestStringAsync).toHaveBeenCalledWith(
      Crypto.CryptoDigestAlgorithm.SHA256,
      'raw-nonce',
    );
  });
});
