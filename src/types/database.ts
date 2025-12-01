export type LeadStage = 
  | 'PROSPECTO'
  | 'CONTACTADO' 
  | 'DESCUBRIMIENTO'
  | 'DEMOSTRACION'
  | 'PROPUESTA'
  | 'CERRADO_GANADO'
  | 'CERRADO_PERDIDO';

export type LeadChannel = 
  | 'OUTBOUND_APOLLO'
  | 'WARM_INTRO'
  | 'INBOUND_REDES';

export type LeadSubchannel = 
  | 'NINGUNO'
  | 'INSTAGRAM'
  | 'TIKTOK'
  | 'LINKEDIN'
  | 'OTRO';

export interface Lead {
  id: string;
  company_name: string;
  contact_name?: string;
  contact_role?: string;
  phone?: string;
  email?: string;
  channel: LeadChannel;
  subchannel: LeadSubchannel;
  owner_id?: string;
  stage: LeadStage;
  stage_entered_at: string;
  last_activity_at: string;
  notes?: string;
  description?: string;
  linkedin_url?: string;
  website_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  product_tag: string;
}

// Lead Contact types
export interface LeadContact {
  id: string;
  lead_id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  description?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadStageHistory {
  id: number;
  lead_id: string;
  from_stage?: LeadStage;
  to_stage: LeadStage;
  changed_at: string;
  changed_by?: string;
}

export const STAGE_LABELS: Record<LeadStage, string> = {
  'PROSPECTO': 'Prospecto',
  'CONTACTADO': 'Contactado',
  'DESCUBRIMIENTO': 'Descubrimiento',
  'DEMOSTRACION': 'Demostración',
  'PROPUESTA': 'Propuesta',
  'CERRADO_GANADO': 'Cerrado Ganado',
  'CERRADO_PERDIDO': 'Cerrado Perdido'
};

export const CHANNEL_LABELS: Record<LeadChannel, string> = {
  'OUTBOUND_APOLLO': 'Outbound Apollo',
  'WARM_INTRO': 'Warm Intro',
  'INBOUND_REDES': 'Inbound Redes'
};

export const SUBCHANNEL_LABELS: Record<LeadSubchannel, string> = {
  'NINGUNO': 'Ninguno',
  'INSTAGRAM': 'Instagram',
  'TIKTOK': 'TikTok',
  'LINKEDIN': 'LinkedIn',
  'OTRO': 'Otro'
};

export type DealStatus =
  | 'ACTIVE'
  | 'CHURNED'
  | 'ON_HOLD';

export type DealCurrency = 'USD' | 'COP';

export interface Deal {
  id: string;
  lead_id: string;
  project_id?: string;
  proposal_id?: string;
  currency: DealCurrency;
  mrr_original: number;
  implementation_fee_original: number;
  exchange_rate?: number;
  mrr_usd: number;
  implementation_fee_usd: number;
  start_date: string;
  status: DealStatus;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Billing configuration
  billing_start_date?: string;
  first_month_covered?: boolean;
  billing_day?: number;
}

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  'ACTIVE': 'Activo',
  'CHURNED': 'Churned',
  'ON_HOLD': 'En Pausa'
};

export const CURRENCY_LABELS: Record<DealCurrency, string> = {
  'USD': 'USD',
  'COP': 'COP'
};

export const STAGE_ORDER: LeadStage[] = [
  'PROSPECTO',
  'CONTACTADO',
  'DESCUBRIMIENTO',
  'DEMOSTRACION',
  'PROPUESTA',
  'CERRADO_GANADO',
  'CERRADO_PERDIDO'
];

// Client types
export interface Client {
  id: string;
  company_name: string;
  contact_name?: string;
  contact_role?: string;
  phone?: string;
  email?: string;
  original_lead_id?: string;
  notes?: string;
  description?: string;
  linkedin_url?: string;
  website_url?: string;
  created_at: string;
  updated_at: string;
}

// Client Contact types
export interface ClientContact {
  id: string;
  client_id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  description?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

// Project types - Projects have their own stage in the pipeline (from DEMOSTRACION onwards)
export type ProjectStage = 'DEMOSTRACION' | 'PROPUESTA' | 'CERRADO_GANADO' | 'CERRADO_PERDIDO';

// Execution stages for won projects
export type ProjectExecutionStage =
  | 'ONBOARDING'    // Recién cerrado, esperando anticipo
  | 'IN_PROGRESS'   // En implementación
  | 'DELIVERED'     // Entregado, pendiente de pago final
  | 'ACTIVE'        // Operativo, cobrando mensualidades
  | 'CHURNED';      // Cliente canceló el servicio

export const PROJECT_EXECUTION_STAGE_LABELS: Record<ProjectExecutionStage, string> = {
  'ONBOARDING': 'Onboarding',
  'IN_PROGRESS': 'En Implementación',
  'DELIVERED': 'Entregado',
  'ACTIVE': 'Activo',
  'CHURNED': 'Churned'
};

export const PROJECT_EXECUTION_STAGE_COLORS: Record<ProjectExecutionStage, string> = {
  'ONBOARDING': 'bg-amber-100 text-amber-700',
  'IN_PROGRESS': 'bg-blue-100 text-blue-700',
  'DELIVERED': 'bg-purple-100 text-purple-700',
  'ACTIVE': 'bg-emerald-100 text-emerald-700',
  'CHURNED': 'bg-red-100 text-red-700'
};

export interface Project {
  id: string;
  client_id: string;
  lead_id?: string;
  name: string;
  description?: string;
  stage: ProjectStage;
  stage_entered_at: string;
  // Execution stage (for CERRADO_GANADO projects)
  execution_stage?: ProjectExecutionStage;
  execution_stage_entered_at?: string;
  // Key dates for project control
  kickoff_date?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  // Churn info
  churned_at?: string;
  churn_reason?: string;
  // Booked values (expected when in PROPUESTA)
  booked_currency?: DealCurrency;
  booked_mrr_original?: number;
  booked_fee_original?: number;
  booked_exchange_rate?: number;
  booked_mrr_usd?: number;
  booked_fee_usd?: number;
  created_at: string;
  updated_at: string;
}

// Proposal type
export interface Proposal {
  id: string;
  project_id: string;
  name: string;
  url?: string;
  currency: DealCurrency;
  mrr_original: number;
  fee_original: number;
  exchange_rate?: number;
  mrr_usd: number;
  fee_usd: number;
  is_final: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const PROJECT_STAGE_LABELS: Record<ProjectStage, string> = {
  'DEMOSTRACION': 'Demostración',
  'PROPUESTA': 'Propuesta',
  'CERRADO_GANADO': 'Cerrado Ganado',
  'CERRADO_PERDIDO': 'Cerrado Perdido'
};

// Stages where leads appear (early stages)
export const LEAD_STAGES: LeadStage[] = ['PROSPECTO', 'CONTACTADO', 'DESCUBRIMIENTO'];

// Stages where projects appear (advanced stages)
export const PROJECT_STAGES: ProjectStage[] = ['DEMOSTRACION', 'PROPUESTA', 'CERRADO_GANADO', 'CERRADO_PERDIDO'];

// Extended types with relations
export interface ProjectWithRelations extends Project {
  client?: Client;
  deal?: Deal;
}

export interface ClientWithProjects extends Client {
  projects?: ProjectWithRelations[];
}

// Company Document types
export type DocumentType = 'RUT' | 'CAMARA_COMERCIO' | 'OTRO';

export interface CompanyDocument {
  id: string;
  lead_id?: string;
  client_id?: string;
  document_type: DocumentType;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  notes?: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  'RUT': 'RUT',
  'CAMARA_COMERCIO': 'Cámara de Comercio',
  'OTRO': 'Otro'
};

// Invoice types
export type InvoiceType = 'IMPLEMENTATION' | 'RECURRING' | 'ADVANCE';
export type InvoiceStatus = 'PENDING' | 'INVOICED' | 'PAID';

export interface Invoice {
  id: string;
  project_id: string;
  invoice_type: InvoiceType;
  period_month?: string; // For recurring: the month it covers (YYYY-MM-01)
  concept: string;
  subtotal: number;
  has_iva: boolean;
  iva_amount: number;
  total: number;
  currency: DealCurrency;
  exchange_rate?: number;
  total_usd: number;
  invoice_number?: string;
  invoice_file_path?: string;
  status: InvoiceStatus;
  due_date?: string;
  paid_at?: string;
  amount_received?: number;
  retention_amount: number;
  payment_proof_path?: string;
  is_cuenta_cobro: boolean; // true = cuenta de cobro, false = factura
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  'IMPLEMENTATION': 'Implementación',
  'RECURRING': 'Mensualidad',
  'ADVANCE': 'Anticipo'
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  'PENDING': 'Pendiente',
  'INVOICED': 'Facturada',
  'PAID': 'Pagada'
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  'PENDING': 'bg-amber-100 text-amber-700',
  'INVOICED': 'bg-blue-100 text-blue-700',
  'PAID': 'bg-emerald-100 text-emerald-700'
};

// Project Management Types

// Checklist Items
export type ChecklistCategory = 'kickoff' | 'development' | 'testing' | 'delivery' | 'general';

export interface ProjectChecklistItem {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  order_index: number;
  due_date?: string;
  completed_at?: string;
  completed_by?: string;
  notes?: string;
  category: ChecklistCategory;
  is_required: boolean;
  weight: number;
  created_at: string;
  updated_at: string;
}

export const CHECKLIST_CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  'kickoff': 'Kickoff',
  'development': 'Desarrollo',
  'testing': 'Pruebas',
  'delivery': 'Entrega',
  'general': 'General'
};

export const CHECKLIST_CATEGORY_COLORS: Record<ChecklistCategory, string> = {
  'kickoff': 'bg-blue-100 text-blue-700',
  'development': 'bg-purple-100 text-purple-700',
  'testing': 'bg-amber-100 text-amber-700',
  'delivery': 'bg-emerald-100 text-emerald-700',
  'general': 'bg-slate-100 text-slate-700'
};

export const CHECKLIST_CATEGORY_ORDER: ChecklistCategory[] = ['kickoff', 'development', 'testing', 'delivery', 'general'];

// Project Updates
export type ProjectUpdateType = 'progress' | 'blocker' | 'decision' | 'note';

export interface ProjectUpdate {
  id: string;
  project_id: string;
  update_type: ProjectUpdateType;
  content: string;
  created_by?: string;
  // For blockers - resolution tracking
  is_resolved?: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
}

export const PROJECT_UPDATE_TYPE_LABELS: Record<ProjectUpdateType, string> = {
  'progress': 'Avance',
  'blocker': 'Bloqueo',
  'decision': 'Decisión',
  'note': 'Nota'
};

export const PROJECT_UPDATE_TYPE_COLORS: Record<ProjectUpdateType, string> = {
  'progress': 'bg-emerald-100 text-emerald-700',
  'blocker': 'bg-red-100 text-red-700',
  'decision': 'bg-blue-100 text-blue-700',
  'note': 'bg-slate-100 text-slate-700'
};

// Project Documents
export type ProjectDocumentType = 'proposal' | 'contract' | 'credentials' | 'manual' | 'meeting_notes' | 'deliverable' | 'other';

export interface ProjectDocument {
  id: string;
  project_id: string;
  document_type: ProjectDocumentType;
  name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  notes?: string;
  uploaded_by?: string;
  created_at: string;
}

export const PROJECT_DOCUMENT_TYPE_LABELS: Record<ProjectDocumentType, string> = {
  'proposal': 'Propuesta',
  'contract': 'Contrato',
  'credentials': 'Credenciales',
  'manual': 'Manual',
  'meeting_notes': 'Acta de Reunión',
  'deliverable': 'Entregable',
  'other': 'Otro'
};

// Project Milestones
export interface ProjectMilestone {
  id: string;
  project_id: string;
  name: string;
  expected_date?: string;
  actual_date?: string;
  notes?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Project Events
export type ProjectEventType =
  | 'meeting'           // Reuniones con cliente
  | 'change_request'    // Solicitud de cambios
  | 'feedback'          // Feedback del cliente
  | 'delivery'          // Entrega parcial o final
  | 'incident'          // Incidente o problema
  | 'other';            // Otro

export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected' | 'implemented';
export type ChangeImpact = 'low' | 'medium' | 'high';
export type FeedbackSentiment = 'positive' | 'neutral' | 'negative';

export interface ProjectEvent {
  id: string;
  project_id: string;
  event_type: ProjectEventType;
  title: string;
  description?: string;
  event_date: string;
  // For meetings
  transcript?: string;
  transcript_summary?: string;
  meeting_attendees?: string[];
  meeting_duration_minutes?: number;
  // For change requests
  change_request_status?: ChangeRequestStatus;
  change_impact?: ChangeImpact;
  // For feedback
  feedback_sentiment?: FeedbackSentiment;
  // General
  attachments?: { name: string; url: string; type: string }[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const PROJECT_EVENT_TYPE_LABELS: Record<ProjectEventType, string> = {
  'meeting': 'Reunión',
  'change_request': 'Solicitud de Cambio',
  'feedback': 'Feedback',
  'delivery': 'Entrega',
  'incident': 'Incidente',
  'other': 'Otro'
};

export const PROJECT_EVENT_TYPE_COLORS: Record<ProjectEventType, string> = {
  'meeting': 'bg-blue-100 text-blue-700',
  'change_request': 'bg-amber-100 text-amber-700',
  'feedback': 'bg-purple-100 text-purple-700',
  'delivery': 'bg-emerald-100 text-emerald-700',
  'incident': 'bg-red-100 text-red-700',
  'other': 'bg-slate-100 text-slate-700'
};

export const CHANGE_REQUEST_STATUS_LABELS: Record<ChangeRequestStatus, string> = {
  'pending': 'Pendiente',
  'approved': 'Aprobado',
  'rejected': 'Rechazado',
  'implemented': 'Implementado'
};

export const CHANGE_REQUEST_STATUS_COLORS: Record<ChangeRequestStatus, string> = {
  'pending': 'bg-amber-100 text-amber-700',
  'approved': 'bg-blue-100 text-blue-700',
  'rejected': 'bg-red-100 text-red-700',
  'implemented': 'bg-emerald-100 text-emerald-700'
};

export const CHANGE_IMPACT_LABELS: Record<ChangeImpact, string> = {
  'low': 'Bajo',
  'medium': 'Medio',
  'high': 'Alto'
};

export const CHANGE_IMPACT_COLORS: Record<ChangeImpact, string> = {
  'low': 'bg-slate-100 text-slate-700',
  'medium': 'bg-amber-100 text-amber-700',
  'high': 'bg-red-100 text-red-700'
};

export const FEEDBACK_SENTIMENT_LABELS: Record<FeedbackSentiment, string> = {
  'positive': 'Positivo',
  'neutral': 'Neutral',
  'negative': 'Negativo'
};

export const FEEDBACK_SENTIMENT_COLORS: Record<FeedbackSentiment, string> = {
  'positive': 'bg-emerald-100 text-emerald-700',
  'neutral': 'bg-slate-100 text-slate-700',
  'negative': 'bg-red-100 text-red-700'
};

// ==========================================
// TECH MODULE TYPES
// ==========================================

// Task status and priority enums
export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type EnvironmentType = 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';

// Team members (hardcoded for now)
export const TECH_TEAM_MEMBERS = [
  { id: 'juan_pablo', name: 'Juan Pablo', color: 'bg-blue-500' },
  { id: 'juan_david', name: 'Juan David', color: 'bg-emerald-500' },
  { id: 'juan_jose', name: 'Juan José', color: 'bg-purple-500' },
] as const;

export type TechTeamMemberId = typeof TECH_TEAM_MEMBERS[number]['id'];

// Project Repository
export interface ProjectRepository {
  id: string;
  project_id: string;
  name: string;
  repo_type: 'FRONTEND' | 'BACKEND' | 'MOBILE' | 'OTHER';
  repo_url: string;
  production_url?: string;
  staging_url?: string;
  tech_stack?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const REPO_TYPE_LABELS: Record<ProjectRepository['repo_type'], string> = {
  'FRONTEND': 'Frontend',
  'BACKEND': 'Backend',
  'MOBILE': 'Mobile',
  'OTHER': 'Otro'
};

export const REPO_TYPE_COLORS: Record<ProjectRepository['repo_type'], string> = {
  'FRONTEND': 'bg-blue-100 text-blue-700',
  'BACKEND': 'bg-emerald-100 text-emerald-700',
  'MOBILE': 'bg-purple-100 text-purple-700',
  'OTHER': 'bg-slate-100 text-slate-700'
};

// Project Environment Variables
export interface ProjectEnvVariable {
  id: string;
  project_id: string;
  repository_id?: string;
  environment: EnvironmentType;
  key: string;
  value: string;
  is_secret: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const ENVIRONMENT_LABELS: Record<EnvironmentType, string> = {
  'DEVELOPMENT': 'Desarrollo',
  'STAGING': 'Staging',
  'PRODUCTION': 'Producción'
};

export const ENVIRONMENT_COLORS: Record<EnvironmentType, string> = {
  'DEVELOPMENT': 'bg-slate-100 text-slate-700',
  'STAGING': 'bg-amber-100 text-amber-700',
  'PRODUCTION': 'bg-red-100 text-red-700'
};

// Project Dependencies
export interface ProjectDependency {
  id: string;
  project_id: string;
  repository_id?: string;
  dependency_type: 'NPM' | 'PIP' | 'COMPOSER' | 'OTHER';
  name: string;
  version?: string;
  is_dev_dependency: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const DEPENDENCY_TYPE_LABELS: Record<ProjectDependency['dependency_type'], string> = {
  'NPM': 'NPM',
  'PIP': 'PIP (Python)',
  'COMPOSER': 'Composer (PHP)',
  'OTHER': 'Otro'
};

// Project Task
export interface ProjectTask {
  id: string;
  project_id: string;
  parent_task_id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to?: TechTeamMemberId;
  due_date?: string;
  estimated_hours?: number;
  actual_hours: number;
  tags?: string[];
  order_index: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  'BACKLOG': 'Backlog',
  'TODO': 'Por Hacer',
  'IN_PROGRESS': 'En Progreso',
  'IN_REVIEW': 'En Revisión',
  'DONE': 'Completado',
  'BLOCKED': 'Bloqueado'
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  'BACKLOG': 'bg-slate-100 text-slate-700',
  'TODO': 'bg-blue-100 text-blue-700',
  'IN_PROGRESS': 'bg-amber-100 text-amber-700',
  'IN_REVIEW': 'bg-purple-100 text-purple-700',
  'DONE': 'bg-emerald-100 text-emerald-700',
  'BLOCKED': 'bg-red-100 text-red-700'
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  'LOW': 'Baja',
  'MEDIUM': 'Media',
  'HIGH': 'Alta',
  'URGENT': 'Urgente'
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  'LOW': 'bg-slate-100 text-slate-600',
  'MEDIUM': 'bg-blue-100 text-blue-600',
  'HIGH': 'bg-amber-100 text-amber-600',
  'URGENT': 'bg-red-100 text-red-600'
};

export const TASK_STATUS_ORDER: TaskStatus[] = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
  'BLOCKED'
];

// Project Time Log
export interface ProjectTimeLog {
  id: string;
  project_id: string;
  task_id?: string;
  team_member: TechTeamMemberId;
  date: string;
  hours: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Extended types with relations for Tech module
export interface ProjectTaskWithSubtasks extends ProjectTask {
  subtasks?: ProjectTask[];
}

export interface ProjectWithTechDetails extends Project {
  client?: Client;
  deal?: Deal;
  repositories?: ProjectRepository[];
  tasks?: ProjectTask[];
  time_logs?: ProjectTimeLog[];
}

// ==========================================
// FINANCE MODULE TYPES
// ==========================================

// Transaction type
export type FinanceTransactionType = 'INCOME' | 'EXPENSE';

// Expense classification
export type ExpenseClassification = 'FIXED' | 'VARIABLE';

// Income categories
export type IncomeCategory =
  | 'MRR'
  | 'IMPLEMENTATION_FEE'
  | 'CONSULTING'
  | 'OTHER_INCOME';

// Expense categories
export type ExpenseCategory =
  // Fixed expenses
  | 'PAYROLL'
  | 'OFFICE'
  | 'SUBSCRIPTIONS'
  | 'INFRASTRUCTURE'
  | 'INSURANCE'
  | 'ACCOUNTING'
  // Variable expenses
  | 'MARKETING'
  | 'SALES_COMMISSION'
  | 'FREELANCERS'
  | 'TRAVEL'
  | 'EQUIPMENT'
  | 'OTHER_EXPENSE';

// Payment methods
export type PaymentMethod =
  | 'BANK_TRANSFER'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'CASH'
  | 'PAYPAL'
  | 'CRYPTO'
  | 'OTHER';

// Finance Transaction interface
export interface FinanceTransaction {
  id: string;
  transaction_type: FinanceTransactionType;
  income_category?: IncomeCategory;
  expense_category?: ExpenseCategory;
  expense_classification?: ExpenseClassification;
  amount_original: number;
  currency: 'USD' | 'COP';
  exchange_rate?: number;
  amount_usd: number;
  description: string;
  vendor_or_source?: string;
  reference_number?: string;
  transaction_date: string;
  is_recurring: boolean;
  recurring_day?: number;
  recurring_end_date?: string;
  parent_transaction_id?: string;
  payment_method?: PaymentMethod;
  receipt_path?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Exchange Rate interface
export interface FinanceExchangeRate {
  id: string;
  rate_date: string;
  usd_to_cop: number;
  source: string;
  created_at: string;
}

// Budget interface
export interface FinanceBudget {
  id: string;
  year: number;
  month: number;
  budget_type: FinanceTransactionType;
  income_category?: IncomeCategory;
  expense_category?: ExpenseCategory;
  budget_amount_usd: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Labels for Finance types
export const FINANCE_TRANSACTION_TYPE_LABELS: Record<FinanceTransactionType, string> = {
  'INCOME': 'Ingreso',
  'EXPENSE': 'Gasto'
};

export const EXPENSE_CLASSIFICATION_LABELS: Record<ExpenseClassification, string> = {
  'FIXED': 'Fijo',
  'VARIABLE': 'Variable'
};

export const EXPENSE_CLASSIFICATION_COLORS: Record<ExpenseClassification, string> = {
  'FIXED': 'bg-blue-100 text-blue-700',
  'VARIABLE': 'bg-amber-100 text-amber-700'
};

export const INCOME_CATEGORY_LABELS: Record<IncomeCategory, string> = {
  'MRR': 'MRR',
  'IMPLEMENTATION_FEE': 'Fee de Implementación',
  'CONSULTING': 'Consultoría',
  'OTHER_INCOME': 'Otros Ingresos'
};

export const INCOME_CATEGORY_COLORS: Record<IncomeCategory, string> = {
  'MRR': 'bg-emerald-100 text-emerald-700',
  'IMPLEMENTATION_FEE': 'bg-blue-100 text-blue-700',
  'CONSULTING': 'bg-purple-100 text-purple-700',
  'OTHER_INCOME': 'bg-slate-100 text-slate-700'
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  // Fixed
  'PAYROLL': 'Nómina',
  'OFFICE': 'Oficina',
  'SUBSCRIPTIONS': 'Suscripciones',
  'INFRASTRUCTURE': 'Infraestructura',
  'INSURANCE': 'Seguros',
  'ACCOUNTING': 'Contabilidad/Legal',
  // Variable
  'MARKETING': 'Marketing',
  'SALES_COMMISSION': 'Comisiones',
  'FREELANCERS': 'Freelancers',
  'TRAVEL': 'Viáticos',
  'EQUIPMENT': 'Equipos',
  'OTHER_EXPENSE': 'Otros Gastos'
};

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  // Fixed - blue tones
  'PAYROLL': 'bg-blue-100 text-blue-700',
  'OFFICE': 'bg-indigo-100 text-indigo-700',
  'SUBSCRIPTIONS': 'bg-cyan-100 text-cyan-700',
  'INFRASTRUCTURE': 'bg-sky-100 text-sky-700',
  'INSURANCE': 'bg-violet-100 text-violet-700',
  'ACCOUNTING': 'bg-purple-100 text-purple-700',
  // Variable - warm tones
  'MARKETING': 'bg-amber-100 text-amber-700',
  'SALES_COMMISSION': 'bg-orange-100 text-orange-700',
  'FREELANCERS': 'bg-rose-100 text-rose-700',
  'TRAVEL': 'bg-pink-100 text-pink-700',
  'EQUIPMENT': 'bg-red-100 text-red-700',
  'OTHER_EXPENSE': 'bg-slate-100 text-slate-700'
};

// Which categories are fixed vs variable
export const FIXED_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'PAYROLL',
  'OFFICE',
  'SUBSCRIPTIONS',
  'INFRASTRUCTURE',
  'INSURANCE',
  'ACCOUNTING'
];

export const VARIABLE_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'MARKETING',
  'SALES_COMMISSION',
  'FREELANCERS',
  'TRAVEL',
  'EQUIPMENT',
  'OTHER_EXPENSE'
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  'BANK_TRANSFER': 'Transferencia Bancaria',
  'CREDIT_CARD': 'Tarjeta de Crédito',
  'DEBIT_CARD': 'Tarjeta Débito',
  'CASH': 'Efectivo',
  'PAYPAL': 'PayPal',
  'CRYPTO': 'Crypto',
  'OTHER': 'Otro'
};

// Helper to get classification from category
export function getExpenseClassification(category: ExpenseCategory): ExpenseClassification {
  return FIXED_EXPENSE_CATEGORIES.includes(category) ? 'FIXED' : 'VARIABLE';
}