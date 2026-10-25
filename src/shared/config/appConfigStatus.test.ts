import { getMissingRequiredAppConfig } from './appConfigStatus';

describe('getMissingRequiredAppConfig', () => {
  it('reports required values that are missing or blank', () => {
    expect(getMissingRequiredAppConfig({
      firebaseApiKey: 'key',
      firebaseProjectId: 'project',
      supabaseUrl: ' ',
    })).toEqual(['supabaseUrl', 'supabaseAnonKey']);
  });

  it('returns no missing values when every required value is present', () => {
    expect(getMissingRequiredAppConfig({
      firebaseApiKey: 'key',
      firebaseProjectId: 'project',
      supabaseUrl: 'https://example.supabase.co',
      supabaseAnonKey: 'anon',
    })).toEqual([]);
  });

  it('handles absent Expo config', () => {
    expect(getMissingRequiredAppConfig(undefined)).toEqual([
      'firebaseApiKey',
      'firebaseProjectId',
      'supabaseUrl',
      'supabaseAnonKey',
    ]);
  });
});
