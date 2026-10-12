/**
 * User routes
 */
import { FastifyPluginAsync } from 'fastify';
import { UserRole } from '@prisma/client';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

export const userRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', authenticate);

  // GET /api/v1/users
  fastify.get('/', async (request) => {
    const { role, storeId, active } = request.query as {
      role?: UserRole;
      storeId?: string;
      active?: string;
    };

    // VL_CONSULTANT só vê a si mesmo; ADMIN/MANAGER vê todos
    const isAdmin = ['ADMIN', 'MANAGER'].includes(request.authUser.role);

    const users = await fastify.prisma.user.findMany({
      where: {
        ...(isAdmin ? {} : { id: request.authUser.id }),
        ...(role ? { role } : {}),
        ...(storeId ? { storeId } : {}),
        ...(active !== undefined ? { active: active === 'true' } : {}),
      },
      include: { store: true },
      orderBy: { name: 'asc' },
    });

    return users.map(u => ({
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      role: u.role,
      storeId: u.storeId,
      store: u.store ? {
        id: u.store.id,
        shortName: u.store.shortName,
        plaza: u.store.plaza,
      } : null,
      active: u.active,
    }));
  });

  // GET /api/v1/users/vl — só consultores VL
  fastify.get('/vl', async () => {
    const users = await fastify.prisma.user.findMany({
      where: { role: UserRole.VL_CONSULTANT, active: true },
      include: { store: true },
      orderBy: { name: 'asc' },
    });
    return users.map(u => ({ id: u.id, name: u.name, username: u.username, storeId: u.storeId, store: u.store }));
  });

  // GET /api/v1/users/vs — só vendedores VS
  fastify.get('/vs', async () => {
    const users = await fastify.prisma.user.findMany({
      where: { role: UserRole.VS_SELLER, active: true },
      include: { store: true },
      orderBy: { name: 'asc' },
    });
    return users.map(u => ({ id: u.id, name: u.name, username: u.username, storeId: u.storeId, store: u.store }));
  });

  // POST /api/v1/users (criar usuário — só ADMIN)
  fastify.post('/',
    { onRequest: requireRoles(['ADMIN']) },
    async (request, reply) => {
      const { name, username, email, role, storeId, password } = request.body as any;
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash(password ?? 'changeme123', 12);
      const user = await fastify.prisma.user.create({
        data: { name, username, email, role, storeId, password: passwordHash },
      });
      return reply.status(201).send({ id: user.id, username: user.username, role: user.role });
    },
  );
};
