import { z } from 'zod';

// ============================================================
// ENUMS
// ============================================================

export const PlazaSchema = z.enum(['FORTALEZA', 'SALVADOR']);
export type Plaza = z.infer<typeof PlazaSchema>;

export const UserRoleSchema = z.enum([
  'ADMIN',
  'MANAGER',
  'VL_CONSULTANT',
  'VS_SELLER',
  'BDC',
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const GranularitySchema = z.enum(['day', 'month', 'year']);
export type Granularity = z.infer<typeof GranularitySchema>;

export const LeadStatusNormalizedSchema = z.enum([
  'AGUARDANDO',
  'ATRASADO',
  'PENDENTE_DIA',
  'FUTURO',
  'ENCAMINHADO',
  'VENDIDO',
]);
export type LeadStatusNormalized = z.infer<typeof LeadStatusNormalizedSchema>;

export const AppointmentStatusSchema = z.enum([
  'SCHEDULED',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW',
]);
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

export const EventTypeSchema = z.enum([
  'SEMINOVOS WEB',
  'SEMINOVOS WEB FACEBOOK',
]);
export type EventType = z.infer<typeof EventTypeSchema>;

export const MediaCategorySchema = z.enum([
  'SOCIAL',
  'ORGANIC',
  'PAID',
  'REFERRAL',
  'OTHER',
]);
export type MediaCategory = z.infer<typeof MediaCategorySchema>;

export const SyncSourceSchema = z.enum(['SYONET_API', 'CSV_IMPORT', 'RPA']);
export type SyncSource = z.infer<typeof SyncSourceSchema>;

export const SyncStatusSchema = z.enum(['RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL']);
export type SyncStatus = z.infer<typeof SyncStatusSchema>;

// ============================================================
// DOMAIN SCHEMAS
// ============================================================

export const StoreSchema = z.object({
  id: z.string().uuid(),
  shortName: z.string(),
  syonetName: z.string(),
  plaza: PlazaSchema,
  city: z.string(),
  state: z.string().length(2),
  timezone: z.string(),
  active: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Store = z.infer<typeof StoreSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  username: z.string(),
  email: z.string().email().nullable(),
  role: UserRoleSchema,
  storeId: z.string().uuid().nullable(),
  store: StoreSchema.nullable(),
  syonetCode: z.string().nullable(),
  active: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;

export const MediaSourceSchema = z.object({
  id: z.string().uuid(),
  rawName: z.string(),
  normalizedName: z.string(),
  category: MediaCategorySchema.nullable(),
  active: z.boolean(),
  createdAt: z.string().datetime(),
});
export type MediaSource = z.infer<typeof MediaSourceSchema>;

export const LeadSchema = z.object({
  id: z.string().uuid(),
  syonetLeadId: z.string(),
  storeId: z.string().uuid(),
  store: StoreSchema.nullable(),
  mediaSourceId: z.string().uuid().nullable(),
  mediaSource: MediaSourceSchema.nullable(),
  mediaRaw: z.string().nullable(),
  receivedAt: z.string().datetime(),
  integrationDate: z.string().datetime().nullable(),
  status: z.string(),
  statusNormalized: LeadStatusNormalizedSchema.nullable(),
  priorityFlag: z.boolean(),
  assignedVlId: z.string().uuid().nullable(),
  assignedVsId: z.string().uuid().nullable(),
  assignedBdcId: z.string().uuid().nullable(),
  eventType: EventTypeSchema.nullable(),
  department: z.string().nullable(),
  tipoVenda: z.string().nullable(),
  origem: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Lead = z.infer<typeof LeadSchema>;

export const AppointmentSchema = z.object({
  id: z.string().uuid(),
  leadId: z.string().uuid(),
  storeId: z.string().uuid(),
  appointmentDate: z.string().datetime(),
  confirmedFlag: z.boolean(),
  status: AppointmentStatusSchema,
  createdByUserId: z.string().uuid().nullable(),
  syonetReference: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Appointment = z.infer<typeof AppointmentSchema>;

export const SalesSchema = z.object({
  id: z.string().uuid(),
  leadId: z.string().uuid(),
  storeId: z.string().uuid(),
  saleDate: z.string().datetime(),
  tipoVenda: z.string(),
  vsUserId: z.string().uuid().nullable(),
  vlUserId: z.string().uuid().nullable(),
  bdcUserId: z.string().uuid().nullable(),
  mediaSourceId: z.string().uuid().nullable(),
  amount: z.number().nullable(),
  status: z.string(),
  syonetReference: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type Sales = z.infer<typeof SalesSchema>;

export const ProductivitySnapshotSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  storeId: z.string().uuid().nullable(),
  periodStart: z.string(),
  periodEnd: z.string(),
  leadsXVendedorLoja: z.number(),
  leadsXOperadorBdc: z.number(),
  totalWorkedPortfolio: z.number(),
  appointmentsCount: z.number(),
  confirmedVisits: z.number(),
  salesCount: z.number(),
  averageContactMinutes: z.number().nullable(),
  priorityClients: z.number(),
  waitingCount: z.number(),
  lateCount: z.number(),
  pendingTodayCount: z.number(),
  futureCount: z.number(),
  syncedAt: z.string().datetime(),
});
export type ProductivitySnapshot = z.infer<typeof ProductivitySnapshotSchema>;

export const SyncRunSchema = z.object({
  id: z.string().uuid(),
  source: SyncSourceSchema,
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().nullable(),
  status: SyncStatusSchema,
  rowsRead: z.number().nullable(),
  rowsInserted: z.number().nullable(),
  rowsUpdated: z.number().nullable(),
  rowsSkipped: z.number().nullable(),
  errorMessage: z.string().nullable(),
  triggeredBy: z.string().uuid().nullable(),
});
export type SyncRun = z.infer<typeof SyncRunSchema>;

// ============================================================
// DASHBOARD FILTERS & QUERY
// ============================================================

export const QuickPeriodSchema = z.enum([
  'today',
  'yesterday',
  'last7days',
  'currentMonth',
  'previousMonth',
  'custom',
]);
export type QuickPeriod = z.infer<typeof QuickPeriodSchema>;

export const DashboardFiltersSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  granularity: GranularitySchema.default('day'),
  plaza: z.union([PlazaSchema, z.literal('ALL')]).default('ALL'),
  storeIds: z.array(z.string().uuid()).optional(),
  mediaIds: z.array(z.string().uuid()).optional(),
  vlUserIds: z.array(z.string().uuid()).optional(),
  vsUserIds: z.array(z.string().uuid()).optional(),
  eventTypes: z.array(EventTypeSchema).optional(),
  quickPeriod: QuickPeriodSchema.optional(),
});
export type DashboardFilters = z.infer<typeof DashboardFiltersSchema>;

// ============================================================
// KPI OVERVIEW
// ============================================================

export const KpiOverviewSchema = z.object({
  leadsReceived: z.number(),
  appointments: z.number(),
  storeFlow: z.number(),
  sales: z.number(),
  conversionLeadSale: z.number().nullable(),   // null quando denom = 0
  conversionLeadAppointment: z.number().nullable(),
  conversionLeadFlow: z.number().nullable(),
  lastSyncAt: z.string().datetime().nullable(),
});
export type KpiOverview = z.infer<typeof KpiOverviewSchema>;

// ============================================================
// STORE METRICS
// ============================================================

export const StoreMetricsSchema = z.object({
  storeId: z.string().uuid(),
  storeName: z.string(),
  plaza: PlazaSchema,
  leads: z.number(),
  appointments: z.number(),
  storeFlow: z.number(),
  sales: z.number(),
  conversionRate: z.number().nullable(),
  appointmentRate: z.number().nullable(),
  flowRate: z.number().nullable(),
});
export type StoreMetrics = z.infer<typeof StoreMetricsSchema>;

export const PlazaMetricsSchema = StoreMetricsSchema.extend({
  storeId: z.string().uuid().optional(),
  storeName: z.string().optional(),
  isPlazaRow: z.literal(true).optional(),
});
export type PlazaMetrics = z.infer<typeof PlazaMetricsSchema>;

// ============================================================
// MEDIA METRICS
// ============================================================

export const MediaMetricsSchema = z.object({
  mediaId: z.string().uuid(),
  mediaNormalizedName: z.string(),
  mediaCategory: MediaCategorySchema.nullable(),
  leads: z.number(),
  appointments: z.number(),
  storeFlow: z.number(),
  sales: z.number(),
  conversionRate: z.number().nullable(),
  appointmentRate: z.number().nullable(),
  flowRate: z.number().nullable(),
  sharePercent: z.number().nullable(),  // % do total de leads
});
export type MediaMetrics = z.infer<typeof MediaMetricsSchema>;

// ============================================================
// CONSULTANT METRICS (VL)
// ============================================================

export const ConsultantMetricsSchema = z.object({
  userId: z.string().uuid(),
  userName: z.string(),
  username: z.string(),
  role: z.literal('VL_CONSULTANT'),
  storeId: z.string().uuid().nullable(),
  storeName: z.string().nullable(),
  leads: z.number(),
  leadsToVs: z.number(),          // encaminhados para vendedor
  leadsToBdc: z.number(),         // encaminhados para BDC
  appointments: z.number(),
  storeFlow: z.number(),
  sales: z.number(),
  conversionRate: z.number().nullable(),
  averageContactHours: z.number().nullable(),
  lastSyncAt: z.string().datetime().nullable(),
});
export type ConsultantMetrics = z.infer<typeof ConsultantMetricsSchema>;

// ============================================================
// SELLER METRICS (VS)
// ============================================================

export const SellerMetricsSchema = z.object({
  userId: z.string().uuid(),
  userName: z.string(),
  username: z.string(),
  role: z.literal('VS_SELLER'),
  storeId: z.string().uuid(),
  storeName: z.string(),
  leads: z.number(),
  appointments: z.number(),
  storeFlow: z.number(),
  sales: z.number(),
  conversionRate: z.number().nullable(),
  appointmentRate: z.number().nullable(),
  flowRate: z.number().nullable(),
});
export type SellerMetrics = z.infer<typeof SellerMetricsSchema>;

// ============================================================
// PRODUCTIVITY (PAGE 2)
// ============================================================

export const PortfolioStatusCountsSchema = z.object({
  total: z.number(),
  aguardando: z.number(),
  atrasado: z.number(),
  pendenteDia: z.number(),
  futuro: z.number(),
  prioridade: z.number(),
  trabalhados: z.number(),
});
export type PortfolioStatusCounts = z.infer<typeof PortfolioStatusCountsSchema>;

export const PortfolioLeadSchema = z.object({
  id: z.string().uuid(),
  syonetLeadId: z.string(),
  storeName: z.string(),
  mediaNormalizedName: z.string().nullable(),
  status: z.string(),
  statusNormalized: LeadStatusNormalizedSchema,
  priorityFlag: z.boolean(),
  receivedAt: z.string().datetime(),
  lastContactAt: z.string().datetime().nullable(),
  nextAppointmentDate: z.string().datetime().nullable(),
  assignedVlName: z.string().nullable(),
});
export type PortfolioLead = z.infer<typeof PortfolioLeadSchema>;

export const ConsultantPortfolioSchema = z.object({
  userId: z.string().uuid(),
  userName: z.string(),
  username: z.string(),
  storeName: z.string().nullable(),
  statusCounts: PortfolioStatusCountsSchema,
  appointmentsToday: z.number(),
  confirmedToday: z.number(),
  salesToday: z.number(),
  leadsXVendedorLoja: z.number(),
  leadsXOperadorBdc: z.number(),
  totalWorkedPortfolio: z.number(),
  leads: z.array(PortfolioLeadSchema).optional(),
});
export type ConsultantPortfolio = z.infer<typeof ConsultantPortfolioSchema>;

export const TodayAgendaItemSchema = z.object({
  id: z.string().uuid(),
  leadId: z.string().uuid(),
  leadName: z.string().nullable(),
  storeName: z.string(),
  appointmentDate: z.string().datetime(),
  confirmedFlag: z.boolean(),
  status: AppointmentStatusSchema,
  vlName: z.string().nullable(),
  vsName: z.string().nullable(),
  saleGenerated: z.boolean().optional(),
});
export type TodayAgendaItem = z.infer<typeof TodayAgendaItemSchema>;

// ============================================================
// AUTH
// ============================================================

export const LoginRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: UserSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// ============================================================
// API RESPONSE WRAPPERS
// ============================================================

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    meta: z
      .object({
        total: z.number().optional(),
        page: z.number().optional(),
        pageSize: z.number().optional(),
      })
      .optional(),
  });

export const ApiErrorSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  error: z.string(),
});

// ============================================================
// CSV MAPPING CONFIG
// ============================================================

export const CsvMappingConfigSchema = z.object({
  report: z.string(),
  sourceFields: z.record(z.string()),
  targetTable: z.string(),
  dedupKey: z.string(),
  updateStrategy: z.enum(['UPSERT', 'INSERT', 'UPDATE']),
});
export type CsvMappingConfig = z.infer<typeof CsvMappingConfigSchema>;

// ============================================================
// EXPORTS
// ============================================================

export type {
  Plaza,
  UserRole,
  Granularity,
  LeadStatusNormalized,
  AppointmentStatus,
  EventType,
  MediaCategory,
  SyncSource,
  SyncStatus,
  Store,
  User,
  MediaSource,
  Lead,
  Appointment,
  Sales,
  ProductivitySnapshot,
  SyncRun,
  QuickPeriod,
  DashboardFilters,
  KpiOverview,
  StoreMetrics,
  PlazaMetrics,
  MediaMetrics,
  ConsultantMetrics,
  SellerMetrics,
  PortfolioStatusCounts,
  PortfolioLead,
  ConsultantPortfolio,
  TodayAgendaItem,
  LoginRequest,
  AuthResponse,
  CsvMappingConfig,
};
