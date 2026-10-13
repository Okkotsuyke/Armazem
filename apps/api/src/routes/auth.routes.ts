/**
 * Auth routes — login, refresh, logout
 */
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/v1/auth/login
  // Rate limit específico: 5 tentativas por minuto (proteção brute force)
  fastify.post('/login', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const body = LoginSchema.parse(request.body);

    const user = await fastify.prisma.user.findFirst({
      where: { username: body.username, active: true },
    });

    if (!user) {
      return reply.status(401).send({ statusCode: 401, message: 'Invalid credentials', error: 'Unauthorized' });
    }

    const valid = await bcrypt.compare(body.password, user.password);
    if (!valid) {
      return reply.status(401).send({ statusCode: 401, message: 'Invalid credentials', error: 'Unauthorized' });
    }

    const accessToken = fastify.jwt.sign(
      { id: user.id, username: user.username, role: user.role, storeId: user.storeId },
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' },
    );

    const refreshToken = fastify.jwt.sign(
      { id: user.id, type: 'refresh' },
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d' },
    );

    // Armazenar refresh token no banco
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await fastify.prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        storeId: user.storeId,
      },
    };
  });

  // POST /api/v1/auth/refresh
  fastify.post('/refresh', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };

    const storedToken = await fastify.prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      return reply.status(401).send({ statusCode: 401, message: 'Invalid refresh token', error: 'Unauthorized' });
    }

    const user = await fastify.prisma.user.findUnique({
      where: { id: storedToken.userId, active: true },
    });
    if (!user) {
      return reply.status(401).send({ statusCode: 401, message: 'User not found', error: 'Unauthorized' });
    }

    const newAccessToken = fastify.jwt.sign(
      { id: user.id, username: user.username, role: user.role, storeId: user.storeId },
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' },
    );

    return { accessToken: newAccessToken };
  });

  // POST /api/v1/auth/logout
  fastify.post('/logout', async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken?: string };
    if (refreshToken) {
      await fastify.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    return { message: 'Logged out successfully' };
  });

  // GET /api/v1/auth/me
  fastify.get('/me', { onRequest: [(fastify as any).authenticate] as any }, async (request) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.authUser.id },
      include: { store: true },
    });
    if (!user) throw { statusCode: 404, message: 'User not found' };
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      storeId: user.storeId,
      store: user.store,
    };
  });
};
