import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://vjgejpcglyadjladwygt.supabase.co';
const defaultKey = 'sb_publishable_3uvan_uyBwAGiISd1GA6Dw_Hn9LtUOD';

function getValidUrl(urlStr: string | undefined): string {
  if (!urlStr) return defaultUrl;
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol.startsWith('http') ? urlStr : defaultUrl;
  } catch {
    return defaultUrl;
  }
}

const supabaseUrl = getValidUrl(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || defaultKey).trim() || defaultKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Executes zero-form OAuth login via Supabase.
 * Supported providers: google, github, discord, facebook, spotify, twitter
 */
export async function signInWithSocialProvider(provider: 'google' | 'github' | 'discord' | 'facebook' | 'spotify' | 'twitter') {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider === 'twitter' ? 'twitter' : (provider as any),
      options: {
        redirectTo: `${window.location.origin}`,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      console.error(`[HeyLook Auth] ${provider} OAuth error:`, error.message);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err: any) {
    console.error(`[HeyLook Auth] OAuth exception for ${provider}:`, err);
    return { data: null, error: err };
  }
}
