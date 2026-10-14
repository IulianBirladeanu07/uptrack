import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import type { Database } from '../database.types';

interface EnvVars {
  supabaseUrl: string | undefined;
  supabaseAnonKey: string | undefined;
}

const getEnvVars = (): EnvVars => {
  const extra = Constants.expoConfig?.extra;
  if (extra) {
    return {
      supabaseUrl: extra['supabaseUrl'],
      supabaseAnonKey: extra['supabaseAnonKey'],
    };
  }

  return {
    supabaseUrl: process.env['SUPABASE_URL'],
    supabaseAnonKey: process.env['SUPABASE_ANON_KEY'],
  };
};

const { supabaseUrl, supabaseAnonKey } = getEnvVars();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Please ensure supabaseUrl and supabaseAnonKey are set.'
  );
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export { supabase };