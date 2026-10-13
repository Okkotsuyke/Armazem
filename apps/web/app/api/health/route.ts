import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const integrations = {
    supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAdmin: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    sentry: !!process.env.SENTRY_DSN,
    resend: !!process.env.RESEND_API_KEY,
    cloudflare: !!process.env.CLOUDFLARE_API_TOKEN,
    appUrl: !!process.env.NEXT_PUBLIC_APP_URL,
  };

  const allHealthy = Object.values(integrations).every(Boolean);

  return NextResponse.json({
    status: allHealthy ? 'ok' : 'degraded',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    integrations,
    timestamp: new Date().toISOString(),
  }, {
    status: allHealthy ? 200 : 503,
  });
}
