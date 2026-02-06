export type ResourceType = 'link' | 'file';

export type ResourceTag =
  | 'ventas'
  | 'aprendizaje'
  | 'tecnologia'
  | 'marketing'
  | 'procesos'
  | 'plantillas'
  | 'finanzas'
  | 'onboarding'
  | 'otro';

export interface ResourceDocument {
  id: string;
  resource_id: string;
  document_type: ResourceType;
  url?: string | null;
  file_path?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  sort_order: number;
  created_at: string;
}

export interface NewResourceDocument {
  document_type: ResourceType;
  url?: string;
  file?: File;
  file_name?: string;
  tempId: string;
}

export interface TeamResource {
  id: string;
  title: string;
  description?: string | null;
  tags: ResourceTag[];
  uploaded_by?: string | null;
  uploaded_by_name?: string | null;
  created_at: string;
  updated_at: string;
  documents: ResourceDocument[];
  /** @deprecated kept for backwards compatibility during migration */
  resource_type?: ResourceType;
  /** @deprecated */
  url?: string | null;
  /** @deprecated */
  file_path?: string | null;
  /** @deprecated */
  file_name?: string | null;
  /** @deprecated */
  file_size?: number | null;
  /** @deprecated */
  mime_type?: string | null;
}

export const RESOURCE_TAG_LABELS: Record<ResourceTag, string> = {
  ventas: 'Ventas',
  aprendizaje: 'Aprendizaje',
  tecnologia: 'Tecnología',
  marketing: 'Marketing',
  procesos: 'Procesos',
  plantillas: 'Plantillas',
  finanzas: 'Finanzas',
  onboarding: 'Onboarding',
  otro: 'Otro',
};

export const RESOURCE_TAG_COLORS: Record<ResourceTag, string> = {
  ventas: 'bg-blue-100 text-blue-700 border-blue-200',
  aprendizaje: 'bg-purple-100 text-purple-700 border-purple-200',
  tecnologia: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  marketing: 'bg-pink-100 text-pink-700 border-pink-200',
  procesos: 'bg-amber-100 text-amber-700 border-amber-200',
  plantillas: 'bg-slate-100 text-slate-700 border-slate-200',
  finanzas: 'bg-green-100 text-green-700 border-green-200',
  onboarding: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  otro: 'bg-gray-100 text-gray-700 border-gray-200',
};

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  link: 'Enlace',
  file: 'Archivo',
};
