import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0,
  replaysOnErrorSampleRate: 1.0,

  // Environment
  environment: process.env.NODE_ENV,

  // Ignorar erros esperados
  ignoreErrors: [
    'NetworkError',
    'ResizeObserver loop',
    'Non-Error promise rejection',
  ],

  // Filtrar breadcrumbs
  beforeBreadcrumb(breadcrumb) {
    // Não loggar requests de métricas
    if (breadcrumb.category === 'resource') {
      return null;
    }
    return breadcrumb;
  },
});
