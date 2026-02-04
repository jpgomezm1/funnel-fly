import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Call,
  TEAM_MEMBER_LABELS,
  CALL_SOURCE_LABELS,
  COMPANY_SIZE_LABELS,
  OPERATIONAL_MATURITY_LABELS,
  CONTACT_ROLE_LABELS,
  PROBLEM_TYPE_LABELS,
  AFFECTED_AREA_LABELS,
  IMPACT_LEVEL_LABELS,
  PAYMENT_CAPACITY_LABELS,
  URGENCY_LABELS,
  YES_NO_LABELS,
  RISK_SIGNAL_LABELS,
} from '@/types/calls';
import {
  Building2,
  User,
  Phone,
  Mail,
  Clock,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Target,
  MessageSquare,
  TrendingUp,
  Users,
  DollarSign,
  Shield,
  FileCheck,
  Linkedin,
  Calendar,
  ExternalLink,
  Pencil,
  FileText,
  Sparkles,
  Download,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateCallPDF } from '@/lib/generateCallPDF';

interface CallDetailModalProps {
  open: boolean;
  onClose: () => void;
  call: Call | null;
  onEdit?: (call: Call) => void;
}

function SectionHeader({ icon: Icon, title }: { icon: typeof Building2; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-primary" />
      <h4 className="font-semibold text-sm uppercase tracking-wide text-primary">{title}</h4>
    </div>
  );
}

function InfoRow({ label, value, className }: { label: string; value?: string | null; className?: string }) {
  if (!value) return null;
  return (
    <div className={cn("flex justify-between py-1.5", className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

function BooleanIndicator({ value, trueLabel = 'Sí', falseLabel = 'No' }: { value?: string | null; trueLabel?: string; falseLabel?: string }) {
  if (!value) return <span className="text-muted-foreground">-</span>;
  const isTrue = value === 'si';
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-sm font-medium",
      isTrue ? "text-green-600" : "text-red-600"
    )}>
      {isTrue ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {isTrue ? trueLabel : falseLabel}
    </span>
  );
}

export function CallDetailModal({ open, onClose, call, onEdit }: CallDetailModalProps) {
  if (!call) return null;

  const q = call.qualification;
  const isQualified = q?.qualification_decision === 'aplica_fase_0';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 rounded-xl",
                isQualified ? "bg-green-100" : "bg-red-100"
              )}>
                {isQualified ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  {call.company_name}
                  <Badge className={cn(
                    "ml-2",
                    isQualified
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  )}>
                    {isQualified ? 'Aplica Fase 0' : 'No Aplica'}
                  </Badge>
                </DialogTitle>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(call.scheduled_at), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {call.duration_minutes || 30} min
                  </span>
                  <Badge variant="secondary">
                    {TEAM_MEMBER_LABELS[call.team_member]}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(call)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
              <Button size="sm" onClick={async () => await generateCallPDF(call)}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex flex-wrap gap-4 mt-4 p-3 bg-muted/50 rounded-lg">
            {call.contact_name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{call.contact_name}</span>
                {call.contact_linkedin && (
                  <a
                    href={call.contact_linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0A66C2] hover:underline"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            )}
            {call.contact_phone && (
              <a
                href={`tel:${call.contact_phone}`}
                className="flex items-center gap-2 text-sm hover:text-primary"
              >
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{call.contact_phone}</span>
              </a>
            )}
            {call.contact_email && (
              <a
                href={`mailto:${call.contact_email}`}
                className="flex items-center gap-2 text-sm hover:text-primary"
              >
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{call.contact_email}</span>
              </a>
            )}
            {call.source && (
              <Badge variant="outline">
                {CALL_SOURCE_LABELS[call.source]}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Transcript and Key Notes (if available) */}
            {(call.transcript || (call.key_notes && call.key_notes.length > 0)) && (
              <div className="grid grid-cols-2 gap-6">
                {/* Transcript */}
                {call.transcript && (
                  <div className="p-4 border rounded-lg">
                    <SectionHeader icon={FileText} title="Transcript / Resumen" />
                    <div className="bg-muted/50 p-3 rounded-lg max-h-48 overflow-y-auto">
                      <p className="text-sm whitespace-pre-wrap font-mono">{call.transcript}</p>
                    </div>
                  </div>
                )}

                {/* Key Notes */}
                {call.key_notes && call.key_notes.length > 0 && (
                  <div className="p-4 border rounded-lg">
                    <SectionHeader icon={Sparkles} title="Key Notes" />
                    <div className="space-y-2">
                      {call.key_notes.map((note, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg"
                        >
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {q ? (
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Contexto del Cliente */}
                  <div className="p-4 border rounded-lg">
                    <SectionHeader icon={Building2} title="Contexto del Cliente" />
                    <div className="space-y-1">
                      <InfoRow label="Industria" value={q.industry} />
                      <InfoRow label="Tamaño" value={q.company_size ? COMPANY_SIZE_LABELS[q.company_size] : null} />
                      <InfoRow label="Madurez operativa" value={q.operational_maturity ? OPERATIONAL_MATURITY_LABELS[q.operational_maturity] : null} />
                      <InfoRow label="Rol del contacto" value={q.contact_role ? CONTACT_ROLE_LABELS[q.contact_role] : null} />
                    </div>
                  </div>

                  {/* Problema Declarado */}
                  <div className="p-4 border rounded-lg">
                    <SectionHeader icon={MessageSquare} title="Problema Declarado (Versión Cliente)" />
                    <p className="text-sm bg-muted/50 p-3 rounded-lg italic">
                      "{q.client_problem_description || 'No registrado'}"
                    </p>
                  </div>

                  {/* Problema Real */}
                  <div className="p-4 border rounded-lg">
                    <SectionHeader icon={Target} title="Problema Real (Criterio Irrelevant)" />
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Badge variant={q.problem_type === 'causa' ? 'default' : 'secondary'}>
                          {q.problem_type ? PROBLEM_TYPE_LABELS[q.problem_type] : '-'}
                        </Badge>
                        <Badge variant="outline">
                          {q.affected_area ? AFFECTED_AREA_LABELS[q.affected_area] : '-'}
                        </Badge>
                      </div>
                      {q.real_problem_description && (
                        <p className="text-sm bg-muted/50 p-3 rounded-lg">
                          {q.real_problem_description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Decisor y Skin in the Game */}
                  <div className="p-4 border rounded-lg">
                    <SectionHeader icon={Users} title="Decisor y Skin in the Game" />
                    <div className="space-y-1">
                      <InfoRow label="Decisión final" value={q.final_decision_maker} />
                      <InfoRow label="Quién paga" value={q.who_pays} />
                      <InfoRow label="Quién sufre el problema" value={q.who_suffers_problem} />
                    </div>
                    <div className={cn(
                      "mt-3 p-2 rounded-lg flex items-center gap-2 text-sm",
                      q.stakeholders_aligned
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    )}>
                      {q.stakeholders_aligned ? (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Stakeholders alineados
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4" />
                          Stakeholders NO alineados (riesgo)
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Impacto en el Negocio */}
                  <div className="p-4 border rounded-lg">
                    <SectionHeader icon={TrendingUp} title="Impacto en el Negocio" />
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div className="text-center p-2 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Revenue</p>
                        <BooleanIndicator value={q.impacts_revenue} />
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Control</p>
                        <BooleanIndicator value={q.impacts_control} />
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Continuidad</p>
                        <BooleanIndicator value={q.impacts_continuity} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Nivel de impacto global:</span>
                      <Badge className={cn(
                        q.global_impact_level === 'alto' && "bg-green-100 text-green-700",
                        q.global_impact_level === 'medio' && "bg-amber-100 text-amber-700",
                        q.global_impact_level === 'bajo' && "bg-red-100 text-red-700",
                      )}>
                        {q.global_impact_level ? IMPACT_LEVEL_LABELS[q.global_impact_level] : '-'}
                      </Badge>
                    </div>
                  </div>

                  {/* Capacidad de Pago y Prioridad */}
                  <div className="p-4 border rounded-lg">
                    <SectionHeader icon={DollarSign} title="Capacidad de Pago y Prioridad" />
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Capacidad de pago:</span>
                        <Badge variant="outline">
                          {q.payment_capacity ? PAYMENT_CAPACITY_LABELS[q.payment_capacity] : '-'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Urgencia:</span>
                        <Badge className={cn(
                          q.urgency === 'hoy' && "bg-green-100 text-green-700",
                          q.urgency === 'proximo_trimestre' && "bg-amber-100 text-amber-700",
                          q.urgency === 'algun_dia' && "bg-red-100 text-red-700",
                        )}>
                          {q.urgency ? URGENCY_LABELS[q.urgency] : '-'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Intentó resolverlo antes:</span>
                        <BooleanIndicator value={q.tried_before} />
                      </div>
                    </div>
                  </div>

                  {/* Señales de Riesgo */}
                  <div className="p-4 border rounded-lg">
                    <SectionHeader icon={Shield} title="Señales de Riesgo" />
                    {(q.risk_signals?.length || 0) > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {q.risk_signals?.map((signal) => (
                          <Badge key={signal} variant="destructive" className="bg-red-100 text-red-700">
                            {RISK_SIGNAL_LABELS[signal]}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No se detectaron señales de riesgo</p>
                    )}
                    {q.other_risk_signals && (
                      <p className="mt-2 text-sm bg-red-50 p-2 rounded-lg text-red-700">
                        Otras: {q.other_risk_signals}
                      </p>
                    )}
                  </div>

                  {/* Decisión y Justificación */}
                  <div className={cn(
                    "p-4 border-2 rounded-lg",
                    isQualified ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"
                  )}>
                    <SectionHeader icon={FileCheck} title="Decisión Final" />
                    <div className={cn(
                      "p-3 rounded-lg mb-3 flex items-center gap-3",
                      isQualified ? "bg-green-100" : "bg-red-100"
                    )}>
                      {isQualified ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                      <span className={cn(
                        "font-bold text-lg",
                        isQualified ? "text-green-700" : "text-red-700"
                      )}>
                        {isQualified ? 'APLICA PARA FASE 0' : 'NO APLICA'}
                      </span>
                    </div>
                    {q.decision_justification && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Justificación:</p>
                        <p className="text-sm bg-white/50 p-2 rounded border">
                          {q.decision_justification}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Next Step */}
                  {call.next_step && (
                    <div className="p-4 border-2 border-primary/30 bg-primary/5 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <ArrowRight className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold text-sm uppercase tracking-wide text-primary">Next Step</h4>
                      </div>
                      <p className="text-base font-medium">{call.next_step}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium text-muted-foreground">
                  Esta llamada no tiene formulario de calificación
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cierra la llamada para completar el formulario de calificación
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex-shrink-0 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
          <Button
            onClick={async () => await generateCallPDF(call)}
            className="flex-1 bg-primary"
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
