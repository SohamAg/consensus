import { createClient } from '@supabase/supabase-js';

// Get environment variables safely
function getEnvVars() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  };
}

// Lazy client cache
let _clientInstance: ReturnType<typeof createClient> | null = null;

// Create and return Supabase client (lazy initialization)
function createClientInstance() {
  if (!_clientInstance) {
    const { supabaseUrl, supabaseAnonKey } = getEnvVars();
    if (!supabaseUrl || !supabaseAnonKey) {
      // Don't throw here - let it fail gracefully in browser
      _clientInstance = createClient('https://placeholder.invalid', 'placeholder');
    } else {
      _clientInstance = createClient(supabaseUrl, supabaseAnonKey);
    }
  }
  return _clientInstance;
}

// Export a Proxy that lazily creates the client
export const supabaseClient = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    const client = createClientInstance();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
  set(target, prop, value) {
    const client = createClientInstance();
    (client as any)[prop] = value;
    return true;
  }
});

// Server client with service role for admin operations
export function supabaseServer() {
  const { supabaseUrl, supabaseServiceRoleKey } = getEnvVars();
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase environment variables not set. Please check .env.local');
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}
