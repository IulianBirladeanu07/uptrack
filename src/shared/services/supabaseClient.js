import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const getEnvVars = () => {
  if (Constants.expoConfig?.extra) {
    return {
      supabaseUrl: Constants.expoConfig.extra.supabaseUrl,
      supabaseAnonKey: Constants.expoConfig.extra.supabaseAnonKey,
    };
  }
  
  return {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  };
};

const { supabaseUrl, supabaseAnonKey } = getEnvVars();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Please ensure supabaseUrl and supabaseAnonKey are set.'
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export { supabase };