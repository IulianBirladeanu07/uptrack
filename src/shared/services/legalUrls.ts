import Constants from 'expo-constants';

type LegalExtra = {
  privacyPolicyUrl?: string;
  accountDeletionUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as LegalExtra;

/** Public privacy policy page. Empty until the owner hosts one and sets EAS env. */
export const privacyPolicyUrl = (extra.privacyPolicyUrl ?? '').trim();

/** Public account-deletion request page required by store policies. */
export const accountDeletionUrl = (extra.accountDeletionUrl ?? '').trim();
