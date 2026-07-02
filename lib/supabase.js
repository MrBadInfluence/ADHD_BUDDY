import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const supabase = createClient(
  'https://awtiizmkdagpkkthbsoh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3dGlpem1rZGFncGtrdGhic29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2Nzg4MzcsImV4cCI6MjA5NjI1NDgzN30.Q_adV7grkTF7SZ5q0nYHAhvKRFHpQEqUOOCvNTpgwAo',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
