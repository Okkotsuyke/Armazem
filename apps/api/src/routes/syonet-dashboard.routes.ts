/**
 * Syonet Dashboard Routes - Endpoints para consulta direta ao Syonet
 *
 * Estes endpoints fazem queries diretas ao Syonet API via Playwright.
 * Úteis para dashboards em tempo real e testes de integração.
 *
 * ATENÇÃO: Estes endpoints são apenas para LEITURA.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  getSyonetRealClient,
  syonetLogin,
  syonetLogout,
  extractFunilData,
  extractProductivityData,
  SyonetRealConfig,
} from '../services/syonet-real-client';
import { FunilMetrics, ProductivityMetrics } from '../services/syonet-client';
import { authenticateDashboard, requireDashboardRoles } from '../middleware/auth.middleware';

// Schema de query para filtros do funil
const funilQuerySchema = {
  type: 'object',
  properties: {
    empresaIds: { type: 'string' }, // csv: "71,72,75"
    dataInicio: { type: 'string', format: 'date' },
    dataFim: { type: 'string', format: 'date' },
  },
};

// Schema de query para filtros de produtividade
const productivityQuerySchema = {
  type: 'object',
  properties: {
    vlName: { type: 'string' }, // Filtrar por nome do VL
  },
};

/**
 * Helper para criar configuração do Syonet a partir do ambiente
 */
function createSyonetConfig(): SyonetRealConfig {
  return {
    baseUrl: process.env.SYONET_URL || 'https://viasul.syonet.com',
    username: process.env.SYONET_USERNAME || '',
    password: process.env.SYONET_PASSWORD || '',
    headless: process.env.SYONET_HEADLESS !== 'false',
  };
}

/**
 * Helper para converter string CSV em array de números
 */
function parseCsvToNumbers(csv: string | undefined): number[] | undefined {
  if (!csv) return undefined;
  return csv.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
}

export async function syonetDashboardRoutes(fastify: FastifyInstance) {
  // Autenticação do dashboard
  fastify.addHook('onRequest', authenticateDashboard);

  /**
   * GET /api/v1/syonet-dashboard/status
   * Retorna o status da conexão com o Syonet
   */
  fastify.get('/status', async (request, reply) => {
    try {
      const config = createSyonetConfig();

      // Verificar se as credenciais estão configuradas
      if (!config.username || !config.password) {
        return {
          success: false,
          error: 'Credenciais Syonet não configuradas',
          configured: false,
          hasUsername: !!config.username,
          hasPassword: !!config.password,
        };
      }

      // Tentar login
      const logged = await syonetLogin(config);

      if (!logged) {
        return {
          success: false,
          error: 'Falha ao autenticar no Syonet',
          connected: false,
          configured: true,
        };
      }

      // Logout após verificar
      await syonetLogout();

      return {
        success: true,
        connected: true,
        configured: true,
        message: 'Conexão com Syonet estabelecida com sucesso',
      };
    } catch (error) {
      fastify.log.error({ err: error }, 'Erro ao verificar status do Syonet');
      return reply.status(500).send({
        success: false,
        error: 'Erro ao conectar com Syonet',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/v1/syonet-dashboard/funil
   * Extrai dados do funil diretamente do Syonet
   */
  fastify.get('/funil', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as any;
      const config = createSyonetConfig();

      // Verificar credenciais
      if (!config.username || !config.password) {
        return reply.status(500).send({
          success: false,
          error: 'Credenciais Syonet não configuradas',
        });
      }

      console.log('📊 Syonet Dashboard: Extraindo dados do funil...');

      const metrics: FunilMetrics[] = await extractFunilData(config, {
        empresaIds: parseCsvToNumbers(query.empresaIds),
        dataInicio: query.dataInicio,
        dataFim: query.dataFim,
      });

      // Calcular totais
      const totais = metrics.reduce(
        (acc, m) => ({
          leadsTotal: acc.leadsTotal + m.leadsTotal,
          appointmentsTotal: acc.appointmentsTotal + m.appointmentsTotal,
          appointmentsConfirmed: acc.appointmentsConfirmed + m.appointmentsConfirmed,
          flowTotal: acc.flowTotal + m.flowTotal,
          salesTotal: acc.salesTotal + m.salesTotal,
        }),
        { leadsTotal: 0, appointmentsTotal: 0, appointmentsConfirmed: 0, flowTotal: 0, salesTotal: 0 }
      );

      return {
        success: true,
        timestamp: new Date().toISOString(),
        totalLojas: metrics.length,
        totais,
        dados: metrics.map(m => ({
          storeId: m.storeId,
          storeName: m.storeName,
          leadsTotal: m.leadsTotal,
          leadsByMedia: m.leadsByMedia,
          appointmentsTotal: m.appointmentsTotal,
          appointmentsConfirmed: m.appointmentsConfirmed,
          flowTotal: m.flowTotal,
          salesTotal: m.salesTotal,
        })),
      };
    } catch (error) {
      fastify.log.error({ err: error }, 'Erro ao extrair funil do Syonet');
      return reply.status(500).send({
        success: false,
        error: 'Erro ao extrair dados do funil',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/v1/syonet-dashboard/produtividade
   * Extrai dados de produtividade diretamente do Syonet
   */
  fastify.get('/produtividade', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as any;
      const config = createSyonetConfig();

      // Verificar credenciais
      if (!config.username || !config.password) {
        return reply.status(500).send({
          success: false,
          error: 'Credenciais Syonet não configuradas',
        });
      }

      console.log('📊 Syonet Dashboard: Extraindo dados de produtividade...');

      const metrics: ProductivityMetrics[] = await extractProductivityData(
        config,
        query.vlName
      );

      // Calcular totais
      const totais = metrics.reduce(
        (acc, m) => ({
          leadsTotal: acc.leadsTotal + m.leadsTotal,
          leadsWaiting: acc.leadsWaiting + m.leadsWaiting,
          leadsLate: acc.leadsLate + m.leadsLate,
          leadsPendingToday: acc.leadsPendingToday + m.leadsPendingToday,
          leadsFuture: acc.leadsFuture + m.leadsFuture,
          appointmentsToday: acc.appointmentsToday + m.appointmentsToday,
          appointmentsConfirmed: acc.appointmentsConfirmed + m.appointmentsConfirmed,
          salesSuccess: acc.salesSuccess + m.salesSuccess,
          forwardedToVs: acc.forwardedToVs + (m.forwardedToVs || 0),
        }),
        {
          leadsTotal: 0,
          leadsWaiting: 0,
          leadsLate: 0,
          leadsPendingToday: 0,
          leadsFuture: 0,
          appointmentsToday: 0,
          appointmentsConfirmed: 0,
          salesSuccess: 0,
          forwardedToVs: 0,
        }
      );

      // Calcular conversion rates
      const conversionRate = totais.leadsTotal > 0
        ? ((totais.salesSuccess / totais.leadsTotal) * 100).toFixed(2)
        : '0.00';

      // Visit rate não está disponível diretamente na produtividade por VL
      const visitRate = 'N/A';

      return {
        success: true,
        timestamp: new Date().toISOString(),
        totalVl: metrics.length,
        totais,
        conversionRate: `${conversionRate}%`,
        visitRate: `${visitRate}%`,
        dados: metrics.map(m => ({
          vlUserId: m.vlUserId,
          vlUserName: m.vlUserName,
          storeId: m.storeId,
          leadsTotal: m.leadsTotal,
          leadsWaiting: m.leadsWaiting,
          leadsLate: m.leadsLate,
          leadsPendingToday: m.leadsPendingToday,
          leadsFuture: m.leadsFuture,
          appointmentsToday: m.appointmentsToday,
          appointmentsConfirmed: m.appointmentsConfirmed,
          salesSuccess: m.salesSuccess,
          forwardedToVs: m.forwardedToVs,
        })),
      };
    } catch (error) {
      fastify.log.error({ err: error }, 'Erro ao extrair produtividade do Syonet');
      return reply.status(500).send({
        success: false,
        error: 'Erro ao extrair dados de produtividade',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/v1/syonet-dashboard/empresas
   * Lista empresas disponíveis no Syonet
   */
  fastify.get('/empresas', async (request, reply) => {
    try {
      const config = createSyonetConfig();

      if (!config.username || !config.password) {
        return reply.status(500).send({
          success: false,
          error: 'Credenciais Syonet não configuradas',
        });
      }

      // Login
      const logged = await syonetLogin(config);
      if (!logged) {
        return reply.status(500).send({
          success: false,
          error: 'Falha ao autenticar no Syonet',
        });
      }

      // Obter cliente
      const client = getSyonetRealClient();

      // Buscar empresas via API request interno
      // Como não temos acesso direto à página aqui, retornamos as empresas de interesse
      const empresasInteresse = [
        { id: 71, nome: 'VIASUL PIEDADE - PE', marca: 'FIAT' },
        { id: 72, nome: 'VIASUL ARRUDA - PE', marca: 'FIAT' },
        { id: 75, nome: 'VIASUL DUNAS - CE', marca: 'FIAT' },
        { id: 91, nome: 'BYD ARRUDA - PE', marca: 'BYD' },
        { id: 92, nome: 'BYD CAMINHO DAS ARVORES - BA', marca: 'BYD' },
        { id: 102, nome: 'BYD WASHINGTON SOARES - CE', marca: 'BYD' },
      ];

      await syonetLogout();

      return {
        success: true,
        empresas: empresasInteresse,
      };
    } catch (error) {
      fastify.log.error({ err: error }, 'Erro ao listar empresas');
      return reply.status(500).send({
        success: false,
        error: 'Erro ao listar empresas',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /api/v1/syonet-dashboard/dashboards
   * Lista dashboards disponíveis no Syonet
   */
  fastify.get('/dashboards', async (request, reply) => {
    const dashboardsConhecidos = [
      { id: 189, nome: 'Incluidos / Agendados / Comparecidos / Vendas' },
      { id: 162, nome: 'Produtividade Resultado' },
      { id: 244, nome: 'Funil de Vendas' },
    ];

    return {
      success: true,
      dashboards: dashboardsConhecidos,
    };
  });
}

export default syonetDashboardRoutes;
