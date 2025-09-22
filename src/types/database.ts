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
  created_by?: string;
  created_at: string;
  updated_at: string;
  product_tag: string;
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

export interface Deal {
  id: string;
  lead_id: string;
  mrr_usd: number;
  implementation_fee_usd: number;
  start_date: string;
  status: DealStatus;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  'ACTIVE': 'Activo',
  'CHURNED': 'Churned',
  'ON_HOLD': 'En Pausa'
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