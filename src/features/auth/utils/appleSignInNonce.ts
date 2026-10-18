import * as Crypto from 'expo-crypto';

export const createAppleSignInNonce = async (): Promise<{
  rawNonce: string;
  hashedNonce: string;
}> => {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );
  return { rawNonce, hashedNonce };
};
