export type CallTeamMember = 'pamela' | 'juan_pablo' | 'sara' | 'agustin';

export type CallResult =
  | 'lead_no_califica'
  | 'lead_pasa_fase_0'
  | 'lead_quiere_reunion_adicional';

export type CallSource =
  | 'instagram'
  | 'tiktok'
  | 'conocido'
  | 'intro'
  | 'linkedin'
  | 'webinar'
  | 'otro';

// ========== QUALIFICATION TYPES ==========

export type CompanySize = 'micro' | 'pyme' | 'mid_market' | 'enterprise';
export type OperationalMaturity = 'bajo' | 'medio' | 'alto';
export type ContactRole = 'decisor' | 'influenciador' | 'operativo' | 'consultor_externo';
export type ProblemType = 'sintoma' | 'causa';
export type AffectedArea = 'revenue' | 'operaciones' | 'finanzas' | 'customer_experience' | 'multiples';
export type ImpactLevel = 'alto' | 'medio' | 'bajo';
export type PaymentCapacity = 'si' | 'no' | 'no_claro';
export type Urgency = 'hoy' | 'proximo_trimestre' | 'algun_dia';
export type YesNo = 'si' | 'no';
export type QualificationDecision = 'aplica_fase_0' | 'no_aplica';

export type RiskSignal =
  | 'expectativas_magicas_ia'
  | 'lenguaje_vago'
  | 'decisor_ausente'
  | 'falta_datos'
  | 'precio_unica_objecion'
  | 'luego_vemos';

export interface CallQualification {
  // BLOQUE 1 - Contexto del Cliente
  industry?: string | null;
  company_size?: CompanySize | null;
  operational_maturity?: OperationalMaturity | null;
  contact_role?: ContactRole | null;

  // BLOQUE 2 - Problema Declarado (no editable después de guardar)
  client_problem_description?: string | null;
  client_problem_locked?: boolean;

  // BLOQUE 3 - Problema Real
  problem_type?: ProblemType | null;
  affected_area?: AffectedArea | null;
  real_problem_description?: string | null;

  // BLOQUE 4 - Impacto en el Negocio
  impacts_revenue?: YesNo | null;
  impacts_control?: YesNo | null;
  impacts_continuity?: YesNo | null;
  global_impact_level?: ImpactLevel | null;

  // BLOQUE 5 - Decisor y Skin in the Game
  final_decision_maker?: string | null;
  who_pays?: string | null;
  who_suffers_problem?: string | null;
  stakeholders_aligned?: boolean;

  // BLOQUE 6 - Capacidad de Pago y Prioridad
  payment_capacity?: PaymentCapacity | null;
  urgency?: Urgency | null;
  tried_before?: YesNo | null;

  // BLOQUE 7 - Señales de Riesgo
  risk_signals?: RiskSignal[];
  other_risk_signals?: string | null;

  // BLOQUE 8 - Decisión Final
  qualification_decision?: QualificationDecision | null;

  // BLOQUE 9 - Justificación
  decision_justification?: string | null;
}

export interface Call {
  id: string;
  scheduled_at: string;
  lead_id?: string | null;
  client_id?: string | null;
  company_name?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  contact_linkedin?: string | null;
  company_linkedin?: string | null;
  team_member: CallTeamMember;
  source?: CallSource | null;
  call_result?: CallResult | null;
  transcript?: string | null;
  key_notes?: string[] | null;
  notes?: string | null;
  duration_minutes?: number | null;
  qualification?: CallQualification | null;
  created_at: string;
  updated_at: string;
}

export const TEAM_MEMBER_LABELS: Record<CallTeamMember, string> = {
  pamela: 'Pamela Puello',
  juan_pablo: 'Juan Pablo Gomez',
  sara: 'Sara Garces',
  agustin: 'Agustin Hoyos',
};

export const CALL_RESULT_LABELS: Record<CallResult, string> = {
  lead_no_califica: 'Lead No Califica',
  lead_pasa_fase_0: 'Lead Pasa a Fase 0',
  lead_quiere_reunion_adicional: 'Reunion Adicional',
};

export const CALL_RESULT_COLORS: Record<CallResult, string> = {
  lead_no_califica: 'bg-red-100 text-red-700',
  lead_pasa_fase_0: 'bg-green-100 text-green-700',
  lead_quiere_reunion_adicional: 'bg-amber-100 text-amber-700',
};

export const CALL_SOURCE_LABELS: Record<CallSource, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  conocido: 'Conocido/Familiar/Amigo',
  intro: 'Intro',
  linkedin: 'LinkedIn',
  webinar: 'Webinar',
  otro: 'Otro',
};

export const CALL_SOURCE_COLORS: Record<CallSource, string> = {
  instagram: 'bg-pink-100 text-pink-700',
  tiktok: 'bg-slate-100 text-slate-700',
  conocido: 'bg-blue-100 text-blue-700',
  intro: 'bg-purple-100 text-purple-700',
  linkedin: 'bg-sky-100 text-sky-700',
  webinar: 'bg-orange-100 text-orange-700',
  otro: 'bg-gray-100 text-gray-700',
};

// ========== QUALIFICATION LABELS ==========

export const COMPANY_SIZE_LABELS: Record<CompanySize, string> = {
  micro: 'Micro',
  pyme: 'PYME',
  mid_market: 'Mid-market',
  enterprise: 'Enterprise',
};

export const OPERATIONAL_MATURITY_LABELS: Record<OperationalMaturity, string> = {
  bajo: 'Bajo',
  medio: 'Medio',
  alto: 'Alto',
};

export const CONTACT_ROLE_LABELS: Record<ContactRole, string> = {
  decisor: 'Decisor',
  influenciador: 'Influenciador',
  operativo: 'Operativo',
  consultor_externo: 'Consultor Externo',
};

export const PROBLEM_TYPE_LABELS: Record<ProblemType, string> = {
  sintoma: 'Síntoma',
  causa: 'Causa',
};

export const AFFECTED_AREA_LABELS: Record<AffectedArea, string> = {
  revenue: 'Revenue',
  operaciones: 'Operaciones',
  finanzas: 'Finanzas',
  customer_experience: 'Customer Experience',
  multiples: 'Múltiples',
};

export const IMPACT_LEVEL_LABELS: Record<ImpactLevel, string> = {
  alto: 'Alto',
  medio: 'Medio',
  bajo: 'Bajo',
};

export const PAYMENT_CAPACITY_LABELS: Record<PaymentCapacity, string> = {
  si: 'Sí',
  no: 'No',
  no_claro: 'No claro',
};

export const URGENCY_LABELS: Record<Urgency, string> = {
  hoy: 'Hoy',
  proximo_trimestre: 'Próximo trimestre',
  algun_dia: 'Algún día',
};

export const YES_NO_LABELS: Record<YesNo, string> = {
  si: 'Sí',
  no: 'No',
};

export const QUALIFICATION_DECISION_LABELS: Record<QualificationDecision, string> = {
  aplica_fase_0: 'Aplica para Fase 0',
  no_aplica: 'No Aplica',
};

export const RISK_SIGNAL_LABELS: Record<RiskSignal, string> = {
  expectativas_magicas_ia: 'Expectativas mágicas con IA',
  lenguaje_vago: 'Lenguaje vago',
  decisor_ausente: 'Decisor ausente',
  falta_datos: 'Falta de datos',
  precio_unica_objecion: 'Precio como única objeción',
  luego_vemos: '"Luego vemos"',
};

export const INDUSTRY_OPTIONS = [
  'Tecnología',
  'E-commerce',
  'Retail',
  'Fintech',
  'Salud',
  'Educación',
  'Manufactura',
  'Logística',
  'Servicios Profesionales',
  'Real Estate',
  'Alimentos y Bebidas',
  'Agro',
  'Energía',
  'Construcción',
  'Entretenimiento',
  'Turismo',
  'Otro',
];
