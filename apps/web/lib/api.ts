/**
 * API client — CRM EUROVIA
 * Usa fetch nativo com JWT via Authorization header
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  accessToken?: string | null;
};

class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public error?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, accessToken } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? 'Erro na requisição', body.error);
  }

  return res.json() as Promise<T>;
}

// ── Tipos compartilhados ───────────────────────────────────────

export type UserDto = { id: string; name: string; username: string; role: string; storeId: string | null; store?: { id: string; shortName: string; plaza: string } | null };
export type StoreDto = { id: string; shortName: string; syonetName: string; plaza: string; city: string; state: string; timezone: string };
export type VlUserDto = { id: string; name: string; username: string; storeId: string | null; store?: { id: string; shortName: string; plaza: string } | null };
export type MediaSourceDto = { id: string; rawName: string; normalizedName: string; category: string | null };

// ── Dashboard types ────────────────────────────────────────────

export type OverviewDto = {
  leadsReceived: number;
  appointments: number;
  storeFlow: number;
  sales: number;
  conversionLeadSale: number | null;
  conversionLeadAppointment: number | null;
  conversionLeadFlow: number | null;
  lastSyncAt: string | null;
};

export type StoreMetricsDto = {
  storeId: string | null;
  storeName: string;
  plaza: string | null;
  leads: number;
  appointments: number;
  storeFlow: number;
  sales: number;
  conversionRate: number | null;
  appointmentRate: number | null;
  flowRate: number | null;
};

export type ByStoreDto = {
  stores: StoreMetricsDto[];
  plazas: StoreMetricsDto[];
  total: StoreMetricsDto;
};

export type ConsultantMetricsDto = {
  userId: string;
  userName: string;
  username: string;
  storeName: string | null;
  leads: number;
  leadsToVs: number;
  leadsToBdc: number;
  appointments: number;
  storeFlow: number;
  sales: number;
  conversionRate: number | null;
};

export type SellerMetricsDto = {
  userId: string;
  userName: string;
  storeName: string | null;
  leads: number;
  appointments: number;
  storeFlow: number;
  sales: number;
  conversionRate: number | null;
  appointmentRate: number | null;
  flowRate: number | null;
};

export type MediaMetricsDto = {
  mediaId: string;
  mediaNormalizedName: string;
  leads: number;
  appointments: number;
  storeFlow: number;
  sales: number;
  conversionRate: number | null;
  appointmentRate: number | null;
  flowRate: number | null;
  sharePercent: number | null;
};

// ── Productivity types ─────────────────────────────────────────

export type PortfolioSummaryDto = {
  total: number;
  aguardando: number;
  atrasado: number;
  pendenteDia: number;
  futuro: number;
  prioridade: number;
  trabalhados: number;
};

export type PortfolioDto = {
  summary: PortfolioSummaryDto;
  leads: unknown[];
};

export type AgendaItemDto = {
  id: string;
  leadId: string;
  leadName: string;
  storeName: string;
  appointmentDate: string;
  confirmedFlag: boolean;
  status: string;
  vlName: string | null;
  vsName: string | null;
  saleGenerated: boolean;
};

// ── Appointment types ─────────────────────────────────────────

export type AppointmentDto = {
  id: string;
  leadId: string;
  lead: {
    id: string;
    syonetLeadId: string;
    status: string;
    priorityFlag: boolean;
    assignedVl: { id: string; name: string; username: string } | null;
    assignedVs: { id: string; name: string; username: string } | null;
    mediaSource: { normalizedName: string } | null;
  };
  storeId: string;
  store: StoreDto;
  appointmentDate: string;
  confirmedFlag: boolean;
  status: string;
  createdByUser: { id: string; name: string; username: string } | null;
  syonetReference: string | null;
  createdAt: string;
};

export type AppointmentListDto = {
  appointments: AppointmentDto[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type TodayAppointmentsDto = {
  date: string;
  appointments: AppointmentDto[];
  stats: {
    total: number;
    confirmed: number;
    pending: number;
    completed: number;
    noShow: number;
  };
};

export type CreateAppointmentDto = {
  leadId: string;
  appointmentDate: string;
  confirmedFlag?: boolean;
  storeId?: string;
};

export type UpdateAppointmentDto = {
  status?: string;
  confirmedFlag?: boolean;
  appointmentDate?: string;
};

export type LeadDto = {
  id: string;
  syonetLeadId: string;
  storeId: string;
  store: StoreDto;
  mediaSource: MediaSourceDto | null;
  mediaRaw: string | null;
  receivedAt: string;
  integrationDate: string | null;
  status: string;
  statusNormalized: string | null;
  priorityFlag: boolean;
  assignedVl: VlUserDto | null;
  assignedVs: VlUserDto | null;
  assignedBdc: VlUserDto | null;
  eventType: string | null;
  department: string | null;
  tipoVenda: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeadEventDto = {
  id: string;
  leadId: string;
  eventType: string;
  eventDate: string;
  user: { id: string; name: string; username: string } | null;
  description: string | null;
  createdAt: string;
};

export type LeadListDto = {
  leads: LeadDto[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type PortfolioStatsDto = {
  total: number;
  byStatus: Record<string, number>;
  todayAppointments: number;
  aguardando: number;
  atrasado: number;
  pendenteDia: number;
  futuro: number;
  vendido: number;
};

// ── API exports ────────────────────────────────────────────────

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ accessToken: string; refreshToken: string; user: UserDto }>(
        '/api/v1/auth/login',
        { method: 'POST', body: { username, password } },
      ),
    me: (token: string) =>
      request<UserDto>('/api/v1/auth/me', { accessToken: token }),
  },

  stores: {
    list: (token: string) =>
      request<StoreDto[]>('/api/v1/stores', { accessToken: token }),
  },

  users: {
    list: (token: string) =>
      request<UserDto[]>('/api/v1/users', { accessToken: token }),
    listVl: (token: string) =>
      request<VlUserDto[]>('/api/v1/users/vl', { accessToken: token }),
    listVs: (token: string) =>
      request<VlUserDto[]>('/api/v1/users/vs', { accessToken: token }),
  },

  mediaSources: {
    list: (token: string) =>
      request<MediaSourceDto[]>('/api/v1/media-sources', { accessToken: token }),
  },

  dashboard: {
    overview: (token: string, params: Record<string, string>) =>
      request<OverviewDto>(
        '/api/v1/dashboard/overview?' + new URLSearchParams(params),
        { accessToken: token },
      ),
    byStore: (token: string, params: Record<string, string>) =>
      request<ByStoreDto>(
        '/api/v1/dashboard/by-store?' + new URLSearchParams(params),
        { accessToken: token },
      ),
    byMedia: (token: string, params: Record<string, string>) =>
      request<MediaMetricsDto[]>(
        '/api/v1/dashboard/by-media?' + new URLSearchParams(params),
        { accessToken: token },
      ),
    byConsultant: (token: string, params: Record<string, string>) =>
      request<ConsultantMetricsDto[]>(
        '/api/v1/dashboard/by-consultant?' + new URLSearchParams(params),
        { accessToken: token },
      ),
    bySeller: (token: string, params: Record<string, string>) =>
      request<SellerMetricsDto[]>(
        '/api/v1/dashboard/by-seller?' + new URLSearchParams(params),
        { accessToken: token },
      ),
  },

  productivity: {
    consultants: (token: string, params: Record<string, string> = {}) =>
      request<unknown[]>(
        '/api/v1/productivity/consultants?' + new URLSearchParams(params),
        { accessToken: token },
      ),
    portfolio: (token: string, params: Record<string, string> = {}) =>
      request<PortfolioDto>(
        '/api/v1/productivity/portfolio?' + new URLSearchParams(params),
        { accessToken: token },
      ),
    todayAgenda: (token: string, params: Record<string, string> = {}) =>
      request<AgendaItemDto[]>(
        '/api/v1/productivity/today-agenda?' + new URLSearchParams(params),
        { accessToken: token },
      ),
  },

  sync: {
    runs: (token: string) => request<unknown[]>('/api/v1/sync/runs', { accessToken: token }),
    uploadCsv: (token: string, formData: FormData) =>
      fetch(`${API_BASE}/api/v1/sync/csv`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }).then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new ApiError(res.status, body.message ?? 'Erro no upload', body.error);
        }
        return res.json();
      }),
  },

  leads: {
    list: (token: string, params: Record<string, string> = {}) =>
      request<LeadListDto>(
        '/api/v1/leads?' + new URLSearchParams(params),
        { accessToken: token },
      ),
    get: (token: string, id: string) =>
      request<LeadDto>(`/api/v1/leads/${id}`, { accessToken: token }),
    update: (token: string, id: string, data: Partial<LeadDto>) =>
      request<LeadDto>(`/api/v1/leads/${id}`, {
        method: 'PUT',
        body: data,
        accessToken: token,
      }),
    addEvent: (token: string, id: string, eventType: string, description?: string) =>
      request<LeadEventDto>(`/api/v1/leads/${id}/events`, {
        method: 'POST',
        body: { eventType, description },
        accessToken: token,
      }),
    stats: {
      portfolio: (token: string, userId?: string) =>
        request<PortfolioStatsDto>(
          '/api/v1/leads/stats/portfolio' + (userId ? `?userId=${userId}` : ''),
          { accessToken: token },
        ),
    },
  },

  appointments: {
    list: (token: string, params: Record<string, string> = {}) =>
      request<AppointmentListDto>(
        '/api/v1/appointments?' + new URLSearchParams(params),
        { accessToken: token },
      ),
    get: (token: string, id: string) =>
      request<AppointmentDto>(`/api/v1/appointments/${id}`, { accessToken: token }),
    create: (token: string, data: CreateAppointmentDto) =>
      request<AppointmentDto>('/api/v1/appointments', {
        method: 'POST',
        body: data,
        accessToken: token,
      }),
    update: (token: string, id: string, data: UpdateAppointmentDto) =>
      request<AppointmentDto>(`/api/v1/appointments/${id}`, {
        method: 'PUT',
        body: data,
        accessToken: token,
      }),
    delete: (token: string, id: string) =>
      request<AppointmentDto>(`/api/v1/appointments/${id}`, {
        method: 'DELETE',
        accessToken: token,
      }),
    today: (token: string, userId?: string) =>
      request<TodayAppointmentsDto>(
        '/api/v1/appointments/calendar/today' + (userId ? `?userId=${userId}` : ''),
        { accessToken: token },
      ),
  },
};

export { ApiError };
