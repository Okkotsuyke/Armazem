/**
 * Smoke tests for the CRM EUROVIA API
 * Validates basic routes and authentication guards
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { buildApp } from '../src/app';

describe('API Smoke Tests', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
  });

  describe('Public Routes', () => {
    it('GET /api/v1/auth/login without body should return 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
      });
      expect([400, 415, 422]).toContain(res.statusCode);
    });

    it('POST /api/v1/auth/login with invalid credentials should return 401', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        headers: { 'content-type': 'application/json' },
        payload: JSON.stringify({
          email: 'invalid@test.com',
          password: 'wrongpassword',
        }),
      });
      expect([401, 400, 422]).toContain(res.statusCode);
    });
  });

  describe('Protected Routes - Auth Required', () => {
    it('GET /api/v1/leads without token should return 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/leads',
      });
      expect([401, 403]).toContain(res.statusCode);
    });

    it('GET /api/v1/dashboard/overview without token should return 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/dashboard/overview',
      });
      expect([401, 403]).toContain(res.statusCode);
    });

    it('GET /api/v1/sync/runs without token should return 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/sync/runs',
      });
      expect([401, 403]).toContain(res.statusCode);
    });
  });

  describe('Cron Routes', () => {
    it('GET /api/cron/health should return 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/cron/health',
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toHaveProperty('status', 'ok');
    });
  });
});
