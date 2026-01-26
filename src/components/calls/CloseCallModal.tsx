import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Call,
  CallQualification,
  CompanySize,
  OperationalMaturity,
  ContactRole,
  ProblemType,
  AffectedArea,
  ImpactLevel,
  PaymentCapacity,
  Urgency,
  YesNo,
  QualificationDecision,
  RiskSignal,
  TEAM_MEMBER_LABELS,
  COMPANY_SIZE_LABELS,
  OPERATIONAL_MATURITY_LABELS,
  CONTACT_ROLE_LABELS,
  PROBLEM_TYPE_LABELS,
  AFFECTED_AREA_LABELS,
  IMPACT_LEVEL_LABELS,
  PAYMENT_CAPACITY_LABELS,
  URGENCY_LABELS,
  YES_NO_LABELS,
  QUALIFICATION_DECISION_LABELS,
  RISK_SIGNAL_LABELS,
  INDUSTRY_OPTIONS,
} from '@/types/calls';
import { useCallMutations } from '@/hooks/useCalls';
import {
  Building2,
  User,
  Clock,
  Save,
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Target,
  MessageSquare,
  TrendingUp,
  Users,
  DollarSign,
  Shield,
  FileCheck,
  AlertCircle,
  FileText,
  Sparkles,
  Plus,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CloseCallModalProps {
  open: boolean;
  onClose: () => void;
  call: Call | null;
}

const STEPS = [
  { id: 1, title: 'Notas', icon: FileText },
  { id: 2, title: 'Contexto', icon: Building2 },
  { id: 3, title: 'Problema Cliente', icon: MessageSquare },
  { id: 4, title: 'Problema Real', icon: Target },
  { id: 5, title: 'Impacto', icon: TrendingUp },
  { id: 6, title: 'Decisor', icon: Users },
  { id: 7, title: 'Capacidad', icon: DollarSign },
  { id: 8, title: 'Riesgos', icon: Shield },
  { id: 9, title: 'Decisión', icon: FileCheck },
  { id: 10, title: 'Justificación', icon: CheckCircle },
];

const RISK_SIGNALS_LIST: RiskSignal[] = [
  'expectativas_magicas_ia',
  'lenguaje_vago',
  'decisor_ausente',
  'falta_datos',
  'precio_unica_objecion',
  'luego_vemos',
];

export function CloseCallModal({ open, onClose, call }: CloseCallModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [duration, setDuration] = useState('30');

  // Transcript and Key Notes (optional, at the beginning)
  const [transcript, setTranscript] = useState('');
  const [keyNotes, setKeyNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState('');

  // Qualification form state
  const [qualification, setQualification] = useState<CallQualification>({});

  const { updateCall, isUpdating } = useCallMutations();

  // Check if this is an existing qualification (already closed)
  const isExistingQualification = call?.qualification?.client_problem_locked === true;

  useEffect(() => {
    if (call && open) {
      setCurrentStep(1);
      setDuration(call.duration_minutes?.toString() || '30');
      setTranscript(call.transcript || '');
      setKeyNotes(call.key_notes || []);
      setNewNote('');

      if (call.qualification) {
        setQualification(call.qualification);
      } else {
        setQualification({
          risk_signals: [],
          stakeholders_aligned: false,
        });
      }
    }
  }, [call, open]);

  const handleClose = () => {
    setCurrentStep(1);
    setQualification({});
    setDuration('30');
    setTranscript('');
    setKeyNotes([]);
    setNewNote('');
    onClose();
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      setKeyNotes([...keyNotes, newNote.trim()]);
      setNewNote('');
    }
  };

  const handleRemoveNote = (index: number) => {
    setKeyNotes(keyNotes.filter((_, i) => i !== index));
  };

  const updateQualification = <K extends keyof CallQualification>(
    field: K,
    value: CallQualification[K]
  ) => {
    setQualification(prev => ({ ...prev, [field]: value }));
  };

  const toggleRiskSignal = (signal: RiskSignal) => {
    const current = qualification.risk_signals || [];
    const updated = current.includes(signal)
      ? current.filter(s => s !== signal)
      : [...current, signal];
    updateQualification('risk_signals', updated);
  };

  // Validation rules
  const impactValidation = useMemo(() => {
    const allNo =
      qualification.impacts_revenue === 'no' &&
      qualification.impacts_control === 'no' &&
      qualification.impacts_continuity === 'no';

    const lowImpact = qualification.global_impact_level === 'bajo';
    const urgencyAlgunDia = qualification.urgency === 'algun_dia';

    return {
      allNo,
      lowImpact,
      urgencyAlgunDia,
      shouldBlockOrWarn: allNo || lowImpact || urgencyAlgunDia,
      suggestNoAplica: lowImpact || urgencyAlgunDia,
    };
  }, [qualification]);

  const stakeholdersNotAligned = !qualification.stakeholders_aligned &&
    qualification.final_decision_maker &&
    qualification.who_pays &&
    qualification.who_suffers_problem;

  // Step validation
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return true; // Transcript and key notes are optional
      case 2:
        return !!qualification.contact_role;
      case 3:
        return !!qualification.client_problem_description &&
               qualification.client_problem_description.length <= 500;
      case 4:
        return !!qualification.problem_type &&
               !!qualification.affected_area &&
               !!qualification.real_problem_description &&
               qualification.real_problem_description.length <= 400;
      case 5:
        return !!qualification.impacts_revenue &&
               !!qualification.impacts_control &&
               !!qualification.impacts_continuity &&
               !!qualification.global_impact_level &&
               !impactValidation.allNo;
      case 6:
        return !!qualification.final_decision_maker &&
               !!qualification.who_pays &&
               !!qualification.who_suffers_problem;
      case 7:
        return !!qualification.payment_capacity &&
               !!qualification.urgency &&
               !!qualification.tried_before;
      case 8:
        return true; // Risk signals are optional
      case 9:
        return !!qualification.qualification_decision;
      case 10:
        return !!qualification.decision_justification &&
               qualification.decision_justification.length <= 300;
      default:
        return true;
    }
  };

  const canProceed = isStepValid(currentStep);

  const handleNext = () => {
    if (currentStep < 10 && canProceed) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSave = async () => {
    if (!call || !qualification.qualification_decision) return;

    try {
      // Lock the client problem description after first save
      const finalQualification: CallQualification = {
        ...qualification,
        client_problem_locked: true,
      };

      // Map qualification decision to call_result
      const callResult = qualification.qualification_decision === 'aplica_fase_0'
        ? 'lead_pasa_fase_0'
        : 'lead_no_califica';

      await updateCall({
        id: call.id,
        call_result: callResult,
        duration_minutes: parseInt(duration) || 30,
        transcript: transcript.trim() || null,
        key_notes: keyNotes.length > 0 ? keyNotes : null,
        qualification: finalQualification,
      } as any);

      handleClose();
    } catch (error) {
      console.error('Error closing call:', error);
    }
  };

  if (!call) return null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Transcript y Notas Clave</h3>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Estos campos son opcionales pero muy valiosos para el seguimiento.
                Puedes pegar el transcript de la llamada y agregar los puntos clave.
              </p>
            </div>

            {/* Transcript */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Transcript / Resumen de la Conversación (opcional)
              </Label>
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Pega aquí el transcript de la llamada o escribe un resumen detallado de la conversación..."
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            {/* Key Notes */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                Key Notes - Puntos Clave (opcional)
              </Label>

              {/* Existing notes */}
              {keyNotes.length > 0 && (
                <div className="space-y-2">
                  {keyNotes.map((note, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-primary/5 border border-primary/20 rounded-lg"
                    >
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="flex-1 text-sm">{note}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveNote(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new note */}
              <div className="flex gap-2">
                <Input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Agregar un punto clave..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Contexto del Cliente</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Industria</Label>
                <Select
                  value={qualification.industry || ''}
                  onValueChange={(v) => updateQualification('industry', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar industria" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_OPTIONS.map(ind => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tamaño de empresa</Label>
                <Select
                  value={qualification.company_size || ''}
                  onValueChange={(v) => updateQualification('company_size', v as CompanySize)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tamaño" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(COMPANY_SIZE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nivel de madurez operativa</Label>
                <Select
                  value={qualification.operational_maturity || ''}
                  onValueChange={(v) => updateQualification('operational_maturity', v as OperationalMaturity)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(OPERATIONAL_MATURITY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Rol de la persona <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={qualification.contact_role || ''}
                  onValueChange={(v) => updateQualification('contact_role', v as ContactRole)}
                >
                  <SelectTrigger className={!qualification.contact_role ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONTACT_ROLE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!qualification.contact_role && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Campo obligatorio
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Problema Declarado (Versión Cliente)</h3>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Describe el problema tal como lo expresó el cliente <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={qualification.client_problem_description || ''}
                onChange={(e) => updateQualification('client_problem_description', e.target.value)}
                placeholder="Escribe exactamente lo que dijo el cliente, sin interpretaciones ni lenguaje técnico..."
                rows={6}
                maxLength={500}
                disabled={isExistingQualification}
                className={cn(
                  "resize-none",
                  isExistingQualification && "bg-muted cursor-not-allowed"
                )}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {isExistingQualification && (
                    <span className="text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Este campo no se puede editar después de guardar
                    </span>
                  )}
                </span>
                <span className={
                  (qualification.client_problem_description?.length || 0) > 500
                    ? 'text-destructive'
                    : ''
                }>
                  {qualification.client_problem_description?.length || 0}/500
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Reglas:</strong> Máximo 500 caracteres. Prohibido lenguaje técnico.
                Prohibido proponer solución. Este campo no se edita después de guardar.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Problema Real (Criterio Irrelevant)</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  ¿Es síntoma o causa? <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={qualification.problem_type || ''}
                  onValueChange={(v) => updateQualification('problem_type', v as ProblemType)}
                >
                  <SelectTrigger className={!qualification.problem_type ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROBLEM_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Área principal afectada <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={qualification.affected_area || ''}
                  onValueChange={(v) => updateQualification('affected_area', v as AffectedArea)}
                >
                  <SelectTrigger className={!qualification.affected_area ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Seleccionar área" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AFFECTED_AREA_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Descripción del problema real <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={qualification.real_problem_description || ''}
                onChange={(e) => updateQualification('real_problem_description', e.target.value)}
                placeholder="Describe el problema real según el criterio de Irrelevant..."
                rows={4}
                maxLength={400}
              />
              <p className="text-xs text-muted-foreground text-right">
                {qualification.real_problem_description?.length || 0}/400
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Impacto en el Negocio</h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  ¿Impacta revenue? <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={qualification.impacts_revenue || ''}
                  onValueChange={(v) => updateQualification('impacts_revenue', v as YesNo)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(YES_NO_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  ¿Impacta control? <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={qualification.impacts_control || ''}
                  onValueChange={(v) => updateQualification('impacts_control', v as YesNo)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(YES_NO_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  ¿Impacta continuidad? <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={qualification.impacts_continuity || ''}
                  onValueChange={(v) => updateQualification('impacts_continuity', v as YesNo)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(YES_NO_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Nivel de impacto global <span className="text-destructive">*</span>
              </Label>
              <Select
                value={qualification.global_impact_level || ''}
                onValueChange={(v) => updateQualification('global_impact_level', v as ImpactLevel)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar nivel de impacto" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(IMPACT_LEVEL_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {impactValidation.allNo && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  <strong>Bloqueado:</strong> Si no impacta revenue, control ni continuidad, no puede avanzar.
                </p>
              </div>
            )}

            {impactValidation.lowImpact && !impactValidation.allNo && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <strong>Recomendación:</strong> Impacto bajo sugiere "No Aplica"
                </p>
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Decisor y Skin in the Game</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  ¿Quién toma la decisión final? <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={qualification.final_decision_maker || ''}
                  onChange={(e) => updateQualification('final_decision_maker', e.target.value)}
                  placeholder="Nombre y cargo"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  ¿Quién paga? <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={qualification.who_pays || ''}
                  onChange={(e) => updateQualification('who_pays', e.target.value)}
                  placeholder="Nombre y cargo / Área"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  ¿Quién sufre el problema si no se resuelve? <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={qualification.who_suffers_problem || ''}
                  onChange={(e) => updateQualification('who_suffers_problem', e.target.value)}
                  placeholder="Nombre y cargo / Área"
                />
              </div>

              <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                <Checkbox
                  id="aligned"
                  checked={qualification.stakeholders_aligned || false}
                  onCheckedChange={(checked) =>
                    updateQualification('stakeholders_aligned', checked as boolean)
                  }
                />
                <Label htmlFor="aligned" className="cursor-pointer">
                  Estas tres personas están alineadas
                </Label>
              </div>

              {stakeholdersNotAligned && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <strong>Señal de riesgo:</strong> Los stakeholders no están alineados
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Capacidad de Pago y Prioridad</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Capacidad de pagar tickets altos <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={qualification.payment_capacity || ''}
                  onValueChange={(v) => updateQualification('payment_capacity', v as PaymentCapacity)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_CAPACITY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Urgencia del problema <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={qualification.urgency || ''}
                  onValueChange={(v) => updateQualification('urgency', v as Urgency)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(URGENCY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  ¿Ya intentaron resolverlo antes? <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={qualification.tried_before || ''}
                  onValueChange={(v) => updateQualification('tried_before', v as YesNo)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(YES_NO_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {impactValidation.urgencyAlgunDia && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <strong>Recomendación:</strong> Urgencia "Algún día" sugiere "No Aplica"
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Señales de Riesgo</h3>
            </div>

            <div className="space-y-3">
              <Label>Selecciona las señales de riesgo detectadas:</Label>
              <div className="grid grid-cols-2 gap-3">
                {RISK_SIGNALS_LIST.map((signal) => (
                  <div
                    key={signal}
                    onClick={() => toggleRiskSignal(signal)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all",
                      qualification.risk_signals?.includes(signal)
                        ? "border-red-400 bg-red-50"
                        : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    <Checkbox
                      checked={qualification.risk_signals?.includes(signal) || false}
                      onCheckedChange={() => toggleRiskSignal(signal)}
                    />
                    <span className="text-sm">{RISK_SIGNAL_LABELS[signal]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Otras señales relevantes (opcional)</Label>
              <Input
                value={qualification.other_risk_signals || ''}
                onChange={(e) => updateQualification('other_risk_signals', e.target.value)}
                placeholder="Describe otras señales de riesgo detectadas..."
              />
            </div>

            {(qualification.risk_signals?.length || 0) > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>{qualification.risk_signals?.length} señal(es) de riesgo detectada(s)</strong>
                </p>
              </div>
            )}
          </div>
        );

      case 9:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Decisión Final</h3>
            </div>

            {impactValidation.suggestNoAplica && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                <p className="text-sm text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Basado en las respuestas anteriores, se recomienda "No Aplica"
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Label className="flex items-center gap-1">
                Selecciona la decisión <span className="text-destructive">*</span>
              </Label>

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => updateQualification('qualification_decision', 'aplica_fase_0')}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left",
                    qualification.qualification_decision === 'aplica_fase_0'
                      ? "border-green-500 bg-green-50"
                      : "border-border hover:border-green-300"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-full",
                    qualification.qualification_decision === 'aplica_fase_0'
                      ? "bg-green-500 text-white"
                      : "bg-muted"
                  )}>
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">Aplica para Fase 0</p>
                    <p className="text-sm text-muted-foreground">
                      El lead cumple los criterios y avanza en el proceso
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateQualification('qualification_decision', 'no_aplica')}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left",
                    qualification.qualification_decision === 'no_aplica'
                      ? "border-red-500 bg-red-50"
                      : "border-border hover:border-red-300"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-full",
                    qualification.qualification_decision === 'no_aplica'
                      ? "bg-red-500 text-white"
                      : "bg-muted"
                  )}>
                    <XCircle className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">No Aplica</p>
                    <p className="text-sm text-muted-foreground">
                      El lead no cumple los criterios de calificación
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Duration section */}
            <div className="space-y-2 pt-4 border-t">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Duración de la llamada (minutos)
              </Label>
              <div className="flex gap-2">
                {['15', '30', '45', '60'].map((min) => (
                  <Button
                    key={min}
                    type="button"
                    variant={duration === min ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDuration(min)}
                  >
                    {min} min
                  </Button>
                ))}
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-20"
                  placeholder="Otro"
                />
              </div>
            </div>
          </div>
        );

      case 10:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Justificación de la Decisión</h3>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Decisión tomada:</span>
                <Badge className={
                  qualification.qualification_decision === 'aplica_fase_0'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }>
                  {qualification.qualification_decision === 'aplica_fase_0'
                    ? '✅ Aplica para Fase 0'
                    : '❌ No Aplica'}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                Justificación breve de la decisión tomada <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={qualification.decision_justification || ''}
                onChange={(e) => updateQualification('decision_justification', e.target.value)}
                placeholder="Explica brevemente por qué tomaste esta decisión..."
                rows={4}
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground text-right">
                {qualification.decision_justification?.length || 0}/300
              </p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Este campo existe para auditoría futura, no para storytelling.
                Sé conciso y objetivo.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-4 pb-4 border-b flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold">
                Cerrar Llamada
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Completa el formulario de calificación
              </p>
            </div>
          </div>

          {/* Call Summary */}
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="font-semibold">{call.company_name}</span>
              </div>
              {call.contact_name && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <User className="h-3.5 w-3.5" />
                  <span>{call.contact_name}</span>
                </div>
              )}
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div>{format(new Date(call.scheduled_at), "d 'de' MMMM, yyyy", { locale: es })}</div>
              <div>{format(new Date(call.scheduled_at), 'HH:mm')} hrs</div>
            </div>
            <Badge variant="secondary">
              {TEAM_MEMBER_LABELS[call.team_member].split(' ')[0]}
            </Badge>
          </div>

          {/* Step Progress */}
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const isValid = isStepValid(step.id);

              return (
                <button
                  key={step.id}
                  onClick={() => {
                    // Can only go back or to completed steps
                    if (step.id < currentStep || (step.id === currentStep)) {
                      setCurrentStep(step.id);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                        ? isValid
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <StepIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{step.title}</span>
                  <span className="sm:hidden">{step.id}</span>
                </button>
              );
            })}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 px-1">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-3 pt-4 border-t flex-shrink-0">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? handleClose : handlePrev}
          >
            {currentStep === 1 ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </>
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </>
            )}
          </Button>

          {currentStep < 10 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed}
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={isUpdating || !canProceed}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar y Cerrar
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
