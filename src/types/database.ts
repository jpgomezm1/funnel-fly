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
  | 'OUTBOUND_LINKEDIN'
  | 'OUTBOUND_EMAIL'
  | 'WARM_INTRO'
  | 'INBOUND_REDES'
  | 'INBOUND_WEB'
  | 'WEBINAR'
  | 'PARTNER'
  | 'OTRO';

export type LeadSubchannel =
  | 'NINGUNO'
  | 'INSTAGRAM'
  | 'TIKTOK'
  | 'LINKEDIN'
  | 'YOUTUBE'
  | 'TWITTER'
  | 'FACEBOOK'
  | 'AI_ACADEMY'
  | 'WORKSHOP'
  | 'CONFERENCIA'
  | 'SEO'
  | 'BLOG'
  | 'LANDING_PAGE'
  | 'OTRO';

export type LossReason = 'PRECIO' | 'TIMING' | 'COMPETENCIA' | 'SIN_PRESUPUESTO' | 'NO_RESPONDE' | 'NO_NECESIDAD' | 'OTRO';

export const LOSS_REASON_LABELS: Record<LossReason, string> = {
  'PRECIO': 'Precio',
  'TIMING': 'Timing',
  'COMPETENCIA': 'Competencia',
  'SIN_PRESUPUESTO': 'Sin Presupuesto',
  'NO_RESPONDE': 'No Responde',
  'NO_NECESIDAD': 'No Necesidad',
  'OTRO': 'Otro',
};

export const LOSS_REASON_COLORS: Record<LossReason, string> = {
  'PRECIO': 'bg-amber-100 text-amber-700',
  'TIMING': 'bg-blue-100 text-blue-700',
  'COMPETENCIA': 'bg-purple-100 text-purple-700',
  'SIN_PRESUPUESTO': 'bg-red-100 text-red-700',
  'NO_RESPONDE': 'bg-slate-100 text-slate-700',
  'NO_NECESIDAD': 'bg-orange-100 text-orange-700',
  'OTRO': 'bg-gray-100 text-gray-700',
};

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
  loss_reason?: LossReason;
  loss_reason_notes?: string;
}

// Company types (unified leads + clients)
export type CompanyStatus = 'prospect' | 'client' | 'churned';

export interface Company {
  id: string;
  company_name: string;
  contact_name?: string;
  contact_role?: string;
  phone?: string;
  email?: string;
  status: CompanyStatus;
  channel?: string;
  subchannel?: string;
  owner_id?: string;
  stage?: string;
  stage_entered_at?: string;
  last_activity_at?: string;
  product_tag?: string;
  loss_reason?: LossReason;
  loss_reason_notes?: string;
  notes?: string;
  description?: string;
  linkedin_url?: string;
  website_url?: string;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyContact {
  id: string;
  company_id: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  description?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyWithProjects extends Company {
  projects?: ProjectWithRelations[];
}

export const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
  'prospect': 'Prospecto',
  'client': 'Cliente',
  'churned': 'Churned',
};

export const COMPANY_STATUS_COLORS: Record<CompanyStatus, string> = {
  'prospect': 'bg-blue-100 text-blue-700',
  'client': 'bg-emerald-100 text-emerald-700',
  'churned': 'bg-red-100 text-red-700',
};

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
  'OUTBOUND_LINKEDIN': 'Outbound LinkedIn',
  'OUTBOUND_EMAIL': 'Outbound Email',
  'WARM_INTRO': 'Referido / Warm Intro',
  'INBOUND_REDES': 'Inbound Redes Sociales',
  'INBOUND_WEB': 'Inbound Web',
  'WEBINAR': 'Webinar / Evento',
  'PARTNER': 'Partner / Alianza',
  'OTRO': 'Otro'
};

export const SUBCHANNEL_LABELS: Record<LeadSubchannel, string> = {
  'NINGUNO': 'Ninguno',
  'INSTAGRAM': 'Instagram',
  'TIKTOK': 'TikTok',
  'LINKEDIN': 'LinkedIn',
  'YOUTUBE': 'YouTube',
  'TWITTER': 'Twitter / X',
  'FACEBOOK': 'Facebook',
  'AI_ACADEMY': 'AI Academy',
  'WORKSHOP': 'Workshop',
  'CONFERENCIA': 'Conferencia',
  'SEO': 'SEO / Orgánico',
  'BLOG': 'Blog',
  'LANDING_PAGE': 'Landing Page',
  'OTRO': 'Otro'
};

// Mapeo de subcanales válidos por cada canal
export const CHANNEL_SUBCHANNELS: Record<LeadChannel, LeadSubchannel[]> = {
  'OUTBOUND_APOLLO': [], // No necesita subcanal
  'OUTBOUND_LINKEDIN': [], // No necesita subcanal
  'OUTBOUND_EMAIL': [], // No necesita subcanal
  'WARM_INTRO': [], // No necesita subcanal
  'INBOUND_REDES': ['INSTAGRAM', 'TIKTOK', 'LINKEDIN', 'YOUTUBE', 'TWITTER', 'FACEBOOK', 'OTRO'],
  'INBOUND_WEB': ['SEO', 'BLOG', 'LANDING_PAGE', 'OTRO'],
  'WEBINAR': ['AI_ACADEMY', 'WORKSHOP', 'CONFERENCIA', 'OTRO'],
  'PARTNER': ['OTRO'], // Puede especificar cuál partner
  'OTRO': ['OTRO'],
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

// Proposal status type
export type ProposalStatus = 'DRAFT' | 'SENT' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED';

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
  status: ProposalStatus;
  sent_at?: string;
  version: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  'DRAFT': 'Borrador',
  'SENT': 'Enviada',
  'REVIEWING': 'En Revisión',
  'ACCEPTED': 'Aceptada',
  'REJECTED': 'Rechazada'
};

export const PROPOSAL_STATUS_COLORS: Record<ProposalStatus, string> = {
  'DRAFT': 'bg-slate-100 text-slate-700',
  'SENT': 'bg-blue-100 text-blue-700',
  'REVIEWING': 'bg-amber-100 text-amber-700',
  'ACCEPTED': 'bg-emerald-100 text-emerald-700',
  'REJECTED': 'bg-red-100 text-red-700'
};

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
export type ChecklistCategory = 'negotiation' | 'kickoff' | 'development' | 'testing' | 'delivery' | 'general';

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
  'negotiation': 'Negociación',
  'kickoff': 'Kickoff',
  'development': 'Desarrollo',
  'testing': 'Pruebas',
  'delivery': 'Entrega',
  'general': 'General'
};

export const CHECKLIST_CATEGORY_COLORS: Record<ChecklistCategory, string> = {
  'negotiation': 'bg-orange-100 text-orange-700',
  'kickoff': 'bg-blue-100 text-blue-700',
  'development': 'bg-purple-100 text-purple-700',
  'testing': 'bg-amber-100 text-amber-700',
  'delivery': 'bg-emerald-100 text-emerald-700',
  'general': 'bg-slate-100 text-slate-700'
};

export const CHECKLIST_CATEGORY_ORDER: ChecklistCategory[] = ['negotiation', 'kickoff', 'development', 'testing', 'delivery', 'general'];

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

// Task status and priority enums (lowercase to match DB enum)
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type EnvironmentType = 'development' | 'staging' | 'production';

export type TechTeamMemberId = string;

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
  'development': 'Desarrollo',
  'staging': 'Staging',
  'production': 'Producción'
};

export const ENVIRONMENT_COLORS: Record<EnvironmentType, string> = {
  'development': 'bg-slate-100 text-slate-700',
  'staging': 'bg-amber-100 text-amber-700',
  'production': 'bg-red-100 text-red-700'
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
  'backlog': 'Backlog',
  'todo': 'Por Hacer',
  'in_progress': 'En Progreso',
  'in_review': 'En Revisión',
  'done': 'Completado',
  'blocked': 'Bloqueado'
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  'backlog': 'bg-slate-100 text-slate-700',
  'todo': 'bg-blue-100 text-blue-700',
  'in_progress': 'bg-amber-100 text-amber-700',
  'in_review': 'bg-purple-100 text-purple-700',
  'done': 'bg-emerald-100 text-emerald-700',
  'blocked': 'bg-red-100 text-red-700'
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  'low': 'Baja',
  'medium': 'Media',
  'high': 'Alta',
  'urgent': 'Urgente'
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  'low': 'bg-slate-100 text-slate-600',
  'medium': 'bg-blue-100 text-blue-600',
  'high': 'bg-amber-100 text-amber-600',
  'urgent': 'bg-red-100 text-red-600'
};

export const TASK_STATUS_ORDER: TaskStatus[] = [
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'done',
  'blocked'
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
  | 'PARTNER_CONTRIBUTION'
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
  | 'BANKING'
  // Variable expenses
  | 'MARKETING'
  | 'SALES_COMMISSION'
  | 'FREELANCERS'
  | 'TRAVEL'
  | 'EQUIPMENT'
  | 'BRAND'
  | 'TRAINING'
  | 'EVENTS'
  | 'LEGAL'
  | 'CONSTITUTION'
  | 'TAXES'
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

// Recurring frequency
export type RecurringFrequency = 'MONTHLY' | 'BIWEEKLY';

export const RECURRING_FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  MONTHLY: 'Mensual',
  BIWEEKLY: 'Quincenal',
};

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
  recurring_frequency?: RecurringFrequency;
  recurring_day?: number;
  recurring_end_date?: string;
  parent_transaction_id?: string;
  payment_method?: PaymentMethod;
  receipt_path?: string;
  notes?: string;
  created_by?: string;
  is_active?: boolean;
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
  'PARTNER_CONTRIBUTION': 'Aporte Socios',
  'OTHER_INCOME': 'Otros Ingresos'
};

export const INCOME_CATEGORY_COLORS: Record<IncomeCategory, string> = {
  'MRR': 'bg-emerald-100 text-emerald-700',
  'IMPLEMENTATION_FEE': 'bg-blue-100 text-blue-700',
  'CONSULTING': 'bg-purple-100 text-purple-700',
  'PARTNER_CONTRIBUTION': 'bg-amber-100 text-amber-700',
  'OTHER_INCOME': 'bg-slate-100 text-slate-700'
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  // Fixed
  'PAYROLL': 'Nómina',
  'OFFICE': 'Oficina',
  'SUBSCRIPTIONS': 'Suscripciones',
  'INFRASTRUCTURE': 'Infraestructura',
  'INSURANCE': 'Seguros',
  'ACCOUNTING': 'Contabilidad',
  'BANKING': 'Gastos Bancarios',
  // Variable
  'MARKETING': 'Marketing',
  'SALES_COMMISSION': 'Comisiones',
  'FREELANCERS': 'Freelancers',
  'TRAVEL': 'Viáticos',
  'EQUIPMENT': 'Equipos',
  'BRAND': 'Marca/Branding',
  'TRAINING': 'Capacitación',
  'EVENTS': 'Eventos',
  'LEGAL': 'Legal/Jurídico',
  'CONSTITUTION': 'Constitución',
  'TAXES': 'Impuestos',
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
  'BANKING': 'bg-slate-100 text-slate-700',
  // Variable - warm tones
  'MARKETING': 'bg-amber-100 text-amber-700',
  'SALES_COMMISSION': 'bg-orange-100 text-orange-700',
  'FREELANCERS': 'bg-rose-100 text-rose-700',
  'TRAVEL': 'bg-pink-100 text-pink-700',
  'EQUIPMENT': 'bg-red-100 text-red-700',
  'BRAND': 'bg-lime-100 text-lime-700',
  'TRAINING': 'bg-emerald-100 text-emerald-700',
  'EVENTS': 'bg-yellow-100 text-yellow-700',
  'LEGAL': 'bg-fuchsia-100 text-fuchsia-700',
  'CONSTITUTION': 'bg-violet-100 text-violet-700',
  'TAXES': 'bg-teal-100 text-teal-700',
  'OTHER_EXPENSE': 'bg-gray-100 text-gray-700'
};

// Which categories are fixed vs variable
export const FIXED_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'PAYROLL',
  'OFFICE',
  'SUBSCRIPTIONS',
  'INFRASTRUCTURE',
  'INSURANCE',
  'ACCOUNTING',
  'BANKING'
];

export const VARIABLE_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'MARKETING',
  'SALES_COMMISSION',
  'FREELANCERS',
  'TRAVEL',
  'EQUIPMENT',
  'BRAND',
  'TRAINING',
  'EVENTS',
  'LEGAL',
  'CONSTITUTION',
  'TAXES',
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