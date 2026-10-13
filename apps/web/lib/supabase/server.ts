import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server Supabase client factory.
 *
 * Use em Server Components, Route Handlers e Server Actions. Lê as
 * mesmas env vars públicas que o client browser, mas usa o adapter
 * de cookies do Next para manter a sessão sincronizada.
 *
 * O setAll é envolto em try/catch porque cookies().set() lança em
 * Server Components que foram disparados fora de uma request do
 * usuário (ex.: durante geração estática ou revalidação).
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase env vars ausentes. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component em contexto read-only (geração estática) — ignorar.
        }
      },
    },
  });
}
