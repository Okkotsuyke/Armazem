/**
 * Routes: Dashboard Auth
 *
 * Autenticação para o dashboard analítico (usuário avaliador)
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface LoginBody {
  username: string;
  password: string;
}

export async function dashboardAuthRoutes(fastify: FastifyInstance) {

  /**
   * POST /api/v1/dashboard/auth/login
   * Login do usuário avaliador
   */
  fastify.post<{ Body: LoginBody }>('/login', async (request, reply) => {
    try {
      const { username, password } = request.body || {};

      if (!username || !password) {
        return reply.status(400).send({
          success: false,
          error: 'Username e senha são obrigatórios',
        });
      }

      // Buscar usuário no banco
      const user = await prisma.dashboardUser.findUnique({
        where: { username },
      });

      if (!user || !user.active) {
        return reply.status(401).send({
          success: false,
          error: 'Credenciais inválidas',
        });
      }

      // Verificar senha
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return reply.status(401).send({
          success: false,
          error: 'Credenciais inválidas',
        });
      }

      // Gerar JWT
      const token = fastify.jwt.sign(
        {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          type: 'dashboard',
        },
        { expiresIn: '24h' }
      );

      return {
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
          },
          expiresIn: '24h',
        },
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Erro ao fazer login',
      });
    }
  });

  /**
   * GET /api/v1/dashboard/auth/me
   * Retorna informações do usuário logado
   */
  fastify.get('/me', async (request, reply) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return reply.status(401).send({
          success: false,
          error: 'Token não fornecido',
        });
      }

      let decoded: any;
      try {
        decoded = fastify.jwt.verify(token);
      } catch {
        return reply.status(401).send({
          success: false,
          error: 'Token inválido ou expirado',
        });
      }

      if (decoded.type !== 'dashboard') {
        return reply.status(401).send({
          success: false,
          error: 'Token inválido para dashboard',
        });
      }

      return {
        success: true,
        data: {
          id: decoded.id,
          username: decoded.username,
          name: decoded.name,
          role: decoded.role,
        },
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Erro ao verificar token',
      });
    }
  });

  /**
   * POST /api/v1/dashboard/auth/logout
   * Logout (invalida token no frontend)
   */
  fastify.post('/logout', async (request, reply) => {
    return {
      success: true,
      message: 'Logout realizado com sucesso',
    };
  });
}

export default dashboardAuthRoutes;
