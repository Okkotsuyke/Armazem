/**
 * Auth middleware — re-export from app.ts for route files
 * (app.ts must be imported to set up fastify.authenticate first)
 */
export { authenticate, requireRoles, authenticateDashboard, requireDashboardRoles } from '../app';
