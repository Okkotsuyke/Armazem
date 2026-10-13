/**
 * Syonet Client - Cliente para extração de dados do CRM Syonet (VIA SUL)
 *
 * ATENÇÃO: Este módulo é apenas para LEITURA de dados do sistema Syonet.
 * Não são feitas alterações, inserções ou exclusões no sistema alvo.
 *
 * Filtros padrão aplicados:
 * - Tipo de Venda: "Venda Seminovos"
 * - Tipo de Evento: "SEMINOVOS WEB", "SEMINOVOS WEB FACEBOOK"
 * - Tipo de Veículo: "Usado"
 * - Grupo: "Todos"
 */

export interface SyonetConfig {
  baseUrl: string;
  username: string;
  password: string;
}

export interface SyonetCredentials {
  sessionCookie?: string;
  expiresAt?: Date;
}

export interface LeadData {
  id: string;
  storeId: string;
  storeName: string;
  mediaRaw: string;
  eventType: string;
  receivedAt: Date;
  integrationDate?: Date;
  status: string;
  statusNormalized: string;
  priorityFlag: boolean;
  assignedVlId?: string;
  assignedVlName?: string;
  assignedVsId?: string;
  assignedVsName?: string;
  assignedBdcId?: string;
  department?: string;
  tipoVenda?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  vehicleBrand?: string;
}

export interface AppointmentData {
  id: string;
  leadId: string;
  storeId: string;
  storeName: string;
  appointmentDate: Date;
  confirmedFlag: boolean;
  status: string;
  createdById?: string;
  createdByName?: string;
  vlName?: string;
}

export interface SaleData {
  id: string;
  leadId: string;
  storeId: string;
  storeName: string;
  saleDate: Date;
  tipoVenda: string;
  vsUserId?: string;
  vsUserName?: string;
  vlUserId?: string;
  vlUserName?: string;
  bdcUserId?: string;
  bdcUserName?: string;
  mediaRaw?: string;
  amount?: number;
}

export interface FunilMetrics {
  storeId: string;
  storeName: string;
  date: Date;
  leadsTotal: number;
  leadsByMedia: Record<string, number>;
  appointmentsTotal: number;
  appointmentsConfirmed: number;
  flowTotal: number;
  salesTotal: number;
  leadsByVl: Record<string, {
    leads: number;
    appointments: number;
    flow: number;
    sales: number;
  }>;
  leadsByVs: Record<string, {
    leads: number;
    appointments: number;
    flow: number;
    sales: number;
  }>;
}

export interface ProductivityMetrics {
  vlUserId: string;
  vlUserName: string;
  storeId: string;
  date: Date;
  // Gestão de Carteira
  leadsWaiting: number;
  leadsLate: number;
  leadsPendingToday: number;
  leadsFuture: number;
  leadsTotal: number;
  // Performance
  appointmentsToday: number;
  appointmentsConfirmed: number;
  salesSuccess: number;
  // Métricas de Qualidade
  averageContactMinutes?: number;
  priorityClients: number;
  forwardedToVs: number;
}

export interface SyncResult {
  batchId: string;
  screen: 'FUNIL' | 'PRODUTIVIDADE';
  success: boolean;
  rowsRead: number;
  rowsProcessed: number;
  errors: string[];
  startedAt: Date;
  finishedAt: Date;
}

// ============================================================
// NORMALIZAÇÃO DE MÍDIAS
// ============================================================

export const MEDIA_NORMALIZATION: Record<string, { category: string; normalized: string }> = {
  // Meta Ads
  'FACEBOOKADS': { category: 'PAID', normalized: 'Meta Ads' },
  'FB': { category: 'PAID', normalized: 'Meta Ads' },
  'Facebook': { category: 'PAID', normalized: 'Meta Ads' },
  'WHATSAPP FACEBOOK': { category: 'PAID', normalized: 'Meta Ads' },

  // Google Ads
  'GOOGLE': { category: 'PAID', normalized: 'Google Ads' },
  'Google': { category: 'PAID', normalized: 'Google Ads' },
  'GOOGLESM': { category: 'PAID', normalized: 'Google Ads' },
  'GOOGLESMDISCOVERY': { category: 'PAID', normalized: 'Google Ads' },

  // Instagram
  'INSTAGRAM': { category: 'PAID', normalized: 'Instagram' },
  'Instagram': { category: 'PAID', normalized: 'Instagram' },
  'DIRECT': { category: 'PAID', normalized: 'Instagram' },
  'IG': { category: 'PAID', normalized: 'Instagram' },

  // Portais
  'WEBMOTORS': { category: 'PAID', normalized: 'WebMotors' },
  'OLX': { category: 'PAID', normalized: 'OLX' },

  // Ferramentas de Captação
  'CONVERX': { category: 'PAID', normalized: 'Converx' },
  'LEADFY': { category: 'PAID', normalized: 'Leadfy' },
  'LEADFY FACEBOOK': { category: 'PAID', normalized: 'Leadfy' },
  'LWLCO': { category: 'PAID', normalized: 'LWLCO' },

  // Orgânico
  'ORGANICO': { category: 'ORGANIC', normalized: 'Orgânico' },
  'Organico': { category: 'ORGANIC', normalized: 'Orgânico' },
  'INDICACAO LEADS': { category: 'REFERRAL', normalized: 'Indicação' },
  'OUTROS': { category: 'OTHER', normalized: 'Outros' },

  // Direto
  'WHATSAPP': { category: 'OTHER', normalized: 'WhatsApp' },
  'WHATSAPP BDC': { category: 'OTHER', normalized: 'WhatsApp BDC' },

  // TOTAL
  'TOTAL': { category: 'OTHER', normalized: 'TOTAL' },
};

/**
 * Normaliza o nome de uma mídia para categoria e nome padronizado
 */
export function normalizeMedia(rawName: string): { category: string; normalized: string } {
  const key = rawName?.toUpperCase()?.trim() || 'OUTROS';
  return MEDIA_NORMALIZATION[key] || { category: 'OTHER', normalized: rawName };
}

/**
 * Normaliza o status de um lead para valores padronizados
 */
export function normalizeLeadStatus(status: string): string {
  const lower = status?.toLowerCase() || '';

  if (lower.includes('aguardando') || lower.includes('waiting')) return 'AGUARDANDO';
  if (lower.includes('atrasad') || lower.includes('late') || lower.includes('overdue')) return 'ATRASADO';
  if (lower.includes('pendente') || lower.includes('pending') || lower.includes('dia')) return 'PENDENTE_DIA';
  if (lower.includes('futuro') || lower.includes('future')) return 'FUTURO';
  if (lower.includes('encaminh') || lower.includes('forward')) return 'ENCAMINHADO';
  if (lower.includes('vendido') || lower.includes('sold') || lower.includes('venda')) return 'VENDIDO';

  return status || 'DESCONHECIDO';
}

// ============================================================
// MAPEAMENTO DE LOJAS
// ============================================================

export const STORE_MAPPING: Record<string, { syonetName: string; plaza: string; syonetId?: number; marca?: string }> = {
  // VIASUL (FIAT)
  'VIASUL PIEDADE - PE': { syonetName: 'VIASUL PIEDADE - PE', plaza: 'RECIFE', syonetId: 71, marca: 'FIAT' },
  'VIASUL ARRUDA - PE': { syonetName: 'VIASUL ARRUDA - PE', plaza: 'RECIFE', syonetId: 72, marca: 'FIAT' },
  'VIASUL DUNAS - CE': { syonetName: 'VIASUL DUNAS - CE', plaza: 'FORTALEZA', syonetId: 75, marca: 'FIAT' },

  // BYD
  'BYD WASHINGTON SOARES - CE': { syonetName: 'BYD WASHINGTON SOARES - CE', plaza: 'FORTALEZA', syonetId: 102, marca: 'BYD' },
  'BYD ARRUDA - PE': { syonetName: 'BYD ARRUDA - PE', plaza: 'RECIFE', syonetId: 91, marca: 'BYD' },
  'BYD CAMINHO DAS ARVORES - BA': { syonetName: 'BYD CAMINHO DAS ARVORES - BA', plaza: 'SALVADOR', syonetId: 92, marca: 'BYD' },

  // EUROVIA (RENAULT)
  'EUROVIA PIEDADE - PE': { syonetName: 'EUROVIA PIEDADE - PE', plaza: 'RECIFE', syonetId: 7, marca: 'RENAULT' },
  'EUROVIA AFOGADOS - PE': { syonetName: 'EUROVIA AFOGADOS - PE', plaza: 'RECIFE', syonetId: 8, marca: 'RENAULT' },
  'EUROVIA IGUATEMI - BA': { syonetName: 'EUROVIA IGUATEMI - BA', plaza: 'SALVADOR', syonetId: 12, marca: 'RENAULT' },
  'EUROVIA LAURO - BA': { syonetName: 'EUROVIA LAURO - BA', plaza: 'SALVADOR', syonetId: 23, marca: 'RENAULT' },
  'EUROVIA IMBIRIBEIRA - PE': { syonetName: 'EUROVIA IMBIRIBEIRA - PE', plaza: 'RECIFE', syonetId: 76, marca: 'RENAULT' },
  'EUROVIA OLINDA - PE': { syonetName: 'EUROVIA OLINDA - PE', plaza: 'RECIFE', syonetId: 83, marca: 'RENAULT' },
  'EUROVIA EPITACIO PESSOA - PB': { syonetName: 'EUROVIA EPITACIO PESSOA - PB', plaza: 'JOAO PESSOA', syonetId: 99, marca: 'RENAULT' },
  'EUROVIA CABEDELO - PB': { syonetName: 'EUROVIA CABEDELO - PB', plaza: 'JOAO PESSOA', syonetId: 100, marca: 'RENAULT' },

  // NISSAN
  'NISSAN IMBIRIBEIRA - PE': { syonetName: 'NISSAN IMBIRIBEIRA - PE', plaza: 'RECIFE', syonetId: 15, marca: 'NISSAN' },
  'NISSAN AFOGADOS - PE': { syonetName: 'NISSAN AFOGADOS - PE', plaza: 'RECIFE', syonetId: 13, marca: 'NISSAN' },
  'NISSAN IGUATEMI - BA': { syonetName: 'NISSAN IGUATEMI - BA', plaza: 'SALVADOR', syonetId: 14, marca: 'NISSAN' },
  'NISSAN LAURO - BA': { syonetName: 'NISSAN LAURO - BA', plaza: 'SALVADOR', syonetId: 22, marca: 'NISSAN' },
  'NISSAN PARALELA - BA': { syonetName: 'NISSAN PARALELA - BA', plaza: 'SALVADOR', syonetId: 77, marca: 'NISSAN' },
  'NISSAN PIEDADE - PE': { syonetName: 'NISSAN PIEDADE - PE', plaza: 'RECIFE', syonetId: 82, marca: 'NISSAN' },

  // JEEP
  'JEEP PIEDADE - PE': { syonetName: 'JEEP PIEDADE - PE', plaza: 'RECIFE', syonetId: 81, marca: 'JEEP' },
  'JEEP IMBIRIBEIRA - PE': { syonetName: 'JEEP IMBIRIBEIRA - PE', plaza: 'RECIFE', syonetId: 62, marca: 'JEEP' },
  'JEEP DUNAS - CE': { syonetName: 'JEEP DUNAS - CE', plaza: 'FORTALEZA', syonetId: 63, marca: 'JEEP' },

  // GEELY
  'EUROVIA GEELY IMBIRIBEIRA - PE': { syonetName: 'EUROVIA GEELY IMBIRIBEIRA - PE', plaza: 'RECIFE', syonetId: 108, marca: 'GEELY' },

  // OMODA/JAECOO
  'OMODA | JAECOO FORTALEZA - CE': { syonetName: 'OMODA | JAECOO FORTALEZA - CE', plaza: 'FORTALEZA', syonetId: 103, marca: 'OMODA' },
  'OMODA | JAECOO ABDIAS - PE': { syonetName: 'OMODA | JAECOO ABDIAS - PE', plaza: 'RECIFE', syonetId: 104, marca: 'OMODA' },
  'OMODA | JAECOO PARALELA - BA': { syonetName: 'OMODA | JAECOO PARALELA - BA', plaza: 'SALVADOR', syonetId: 105, marca: 'OMODA' },

  // Legado (mantido para compatibilidade)
  'VIA 1 BONOCO - BA': { syonetName: 'VIA 1 BONOCO - BA', plaza: 'SALVADOR', syonetId: 86, marca: 'MULTIMARCAS' },
};

// ============================================================
// MAPEAMENTO DE CONSULTORES VL
// ============================================================

export const VL_CONSULTANTS = [
  'MONALYSA.SILVA',
  'REBECA.WANDERLEY',
  'SANDRA.SILVA',
  'SAMARA.LIRA',
  'TAFNES.SILVA',
];

/**
 * Verifica se um usuário é um consultor VL conhecido
 */
export function isVlConsultant(username: string): boolean {
  return VL_CONSULTANTS.includes(username?.toUpperCase());
}

// ============================================================
// CLASSE PRINCIPAL: SYONET CLIENT
// ============================================================

export class SyonetClient {
  private config: SyonetConfig;
  private credentials: SyonetCredentials = {};
  private baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  constructor(config: SyonetConfig) {
    this.config = config;
  }

  /**
   * Autentica no Syonet e obtém sessão
   * CHAMADA GET/POST PARA LEITURA APENAS
   */
  async login(): Promise<boolean> {
    try {
      // Simulação: em produção, isso faria uma chamada real ao Syonet
      // POST https://viasul.syonet.com/portal/app.do?modulo=login
      console.log(`🔐 Syonet: Tentando login como ${this.config.username}`);

      // TODO: Implementar autenticação real quando tivermos acesso à API Syonet
      // Por enquanto, simulamos que a autenticação foi bem-sucedida
      this.credentials = {
        sessionCookie: `syonet_session_${Date.now()}`,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
      };

      console.log('✅ Syonet: Login realizado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Syonet: Erro no login:', error);
      return false;
    }
  }

  /**
   * Verifica se a sessão ainda é válida
   */
  isAuthenticated(): boolean {
    return !!this.credentials.sessionCookie &&
           (!this.credentials.expiresAt || this.credentials.expiresAt > new Date());
  }

  /**
   * Extrai métricas do funil da Tela 1
   * GET /api/v1/dashboard/funil
   */
  async extractFunilMetrics(dateRange?: { start: Date; end: Date }): Promise<FunilMetrics[]> {
    if (!this.isAuthenticated()) {
      await this.login();
    }

    try {
      console.log('📊 Syonet: Extraindo métricas do Funil...');

      // TODO: Implementar extração real quando tivermos acesso à API Syonet
      // Por enquanto, retornamos dados simulados para teste

      const mockMetrics: FunilMetrics[] = STORE_MAPPING ? Object.keys(STORE_MAPPING).map((storeKey, idx) => ({
        storeId: `store_${idx + 1}`,
        storeName: storeKey,
        date: new Date(),
        leadsTotal: Math.floor(Math.random() * 100) + 50,
        leadsByMedia: {
          'Meta Ads': Math.floor(Math.random() * 40) + 20,
          'Google Ads': Math.floor(Math.random() * 30) + 10,
          'Instagram': Math.floor(Math.random() * 20) + 5,
          'WebMotors': Math.floor(Math.random() * 15) + 5,
        },
        appointmentsTotal: Math.floor(Math.random() * 30) + 10,
        appointmentsConfirmed: Math.floor(Math.random() * 20) + 5,
        flowTotal: Math.floor(Math.random() * 15) + 5,
        salesTotal: Math.floor(Math.random() * 10) + 2,
        leadsByVl: {},
        leadsByVs: {},
      })) : [];

      console.log(`✅ Syonet: ${mockMetrics.length} registros de funil extraídos`);
      return mockMetrics;
    } catch (error) {
      console.error('❌ Syonet: Erro ao extrair funil:', error);
      throw error;
    }
  }

  /**
   * Extrai métricas de produtividade da Tela 2
   * GET /api/v1/productivity/dashboard
   */
  async extractProductivityMetrics(date?: Date): Promise<ProductivityMetrics[]> {
    if (!this.isAuthenticated()) {
      await this.login();
    }

    try {
      console.log('📊 Syonet: Extraindo métricas de Produtividade...');

      // TODO: Implementar extração real quando tivermos acesso à API Syonet
      // Por enquanto, retornamos dados simulados para teste

      const mockMetrics: ProductivityMetrics[] = VL_CONSULTANTS.map((vl, idx) => ({
        vlUserId: `vl_${idx + 1}`,
        vlUserName: vl,
        storeId: `store_${idx % 2 === 0 ? 1 : 3}`, // Distribuir entre lojas
        date: date || new Date(),
        leadsWaiting: Math.floor(Math.random() * 20) + 5,
        leadsLate: Math.floor(Math.random() * 10) + 2,
        leadsPendingToday: Math.floor(Math.random() * 15) + 3,
        leadsFuture: Math.floor(Math.random() * 10) + 2,
        leadsTotal: Math.floor(Math.random() * 100) + 50,
        appointmentsToday: Math.floor(Math.random() * 10) + 3,
        appointmentsConfirmed: Math.floor(Math.random() * 7) + 2,
        salesSuccess: Math.floor(Math.random() * 5) + 1,
        averageContactMinutes: Math.floor(Math.random() * 30) + 10,
        priorityClients: Math.floor(Math.random() * 20) + 5,
        forwardedToVs: Math.floor(Math.random() * 15) + 3,
      }));

      console.log(`✅ Syonet: ${mockMetrics.length} registros de produtividade extraídos`);
      return mockMetrics;
    } catch (error) {
      console.error('❌ Syonet: Erro ao extrair produtividade:', error);
      throw error;
    }
  }

  /**
   * Extrai leads individuais (para carga granular)
   * GET /api/v1/leads
   */
  async extractLeads(dateRange?: { start: Date; end: Date }): Promise<LeadData[]> {
    if (!this.isAuthenticated()) {
      await this.login();
    }

    try {
      console.log('📊 Syonet: Extraindo leads...');

      // TODO: Implementar extração real quando tivermos acesso à API Syonet
      // Por enquanto, retornamos dados simulados para teste

      const mockLeads: LeadData[] = [];
      const stores = Object.keys(STORE_MAPPING);

      for (let i = 0; i < 50; i++) {
        const storeKey = stores[i % stores.length];
        const mediaKeys = Object.keys(MEDIA_NORMALIZATION);
        const media = MEDIA_NORMALIZATION[mediaKeys[i % mediaKeys.length]];

        mockLeads.push({
          id: `lead_${i + 1}`,
          storeId: `store_${(i % stores.length) + 1}`,
          storeName: storeKey,
          mediaRaw: mediaKeys[i % mediaKeys.length],
          eventType: 'SEMINOVOS WEB',
          receivedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          integrationDate: new Date(),
          status: ['AGUARDANDO', 'ENCAMINHADO', 'VENDIDO'][i % 3],
          statusNormalized: normalizeLeadStatus(['AGUARDANDO', 'ENCAMINHADO', 'VENDIDO'][i % 3]),
          priorityFlag: i % 10 === 0,
          assignedVlId: `vl_${(i % 5) + 1}`,
          assignedVlName: VL_CONSULTANTS[i % 5],
          department: 'SEMINOVOS WEB',
          tipoVenda: 'Venda Seminovos',
        });
      }

      console.log(`✅ Syonet: ${mockLeads.length} leads extraídos`);
      return mockLeads;
    } catch (error) {
      console.error('❌ Syonet: Erro ao extrair leads:', error);
      throw error;
    }
  }

  /**
   * Fecha a sessão
   */
  async logout(): Promise<void> {
    this.credentials = {};
    console.log('🔓 Syonet: Sessão encerrada');
  }
}

// ============================================================
// FACTORY FUNCTION
// ============================================================

let clientInstance: SyonetClient | null = null;

export function getSyonetClient(): SyonetClient {
  if (!clientInstance) {
    const config: SyonetConfig = {
      baseUrl: process.env.SYONET_URL || 'https://viasul.syonet.com',
      username: process.env.SYONET_USERNAME ?? '',
      password: process.env.SYONET_PASSWORD ?? '',
    };
    clientInstance = new SyonetClient(config);
  }
  return clientInstance;
}

// ============================================================
// REAL SYONET CLIENT (Playwright)
// ============================================================

export { getSyonetRealClient, syonetLogin, syonetLogout, isSyonetAuthenticated } from './syonet-real-client';

/**
 * Tipos exportados do cliente real
 */
export type { SyonetRealConfig, SyonetRealCredentials } from './syonet-real-client';
