import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser Supabase client factory.
 *
 * Use em Client Components ("use client"). Lê as env vars públicas
 * que começam com NEXT_PUBLIC_ — disponíveis tanto no build quanto
 * no runtime do browser.
 *
 * Lança erro explícito se as env vars não estiverem setadas, em vez
 * de aceitar undefined silenciosamente (o que só aparece como erro
 * de rede obscuro em runtime).
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase env vars ausentes. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local e na Vercel.'
    );
  }

  return createBrowserClient(url, key);
}
