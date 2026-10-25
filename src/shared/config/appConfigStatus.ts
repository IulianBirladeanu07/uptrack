const REQUIRED_APP_CONFIG_KEYS = [
  'firebaseApiKey',
  'firebaseProjectId',
  'supabaseUrl',
  'supabaseAnonKey',
] as const;

export const getMissingRequiredAppConfig = (
  extra: Record<string, unknown> | undefined,
): string[] => REQUIRED_APP_CONFIG_KEYS.filter(key => {
  const value = extra?.[key];
  return typeof value !== 'string' || value.trim().length === 0;
});
