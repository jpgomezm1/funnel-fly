import { useState, useEffect } from 'react';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Call,
  CallTeamMember,
  CallResult,
  CallSource,
  TEAM_MEMBER_LABELS,
  CALL_RESULT_LABELS,
  CALL_SOURCE_LABELS,
} from '@/types/calls';
import { useCallMutations } from '@/hooks/useCalls';
import {
  Phone,
  Building2,
  User,
  Mail,
  CalendarIcon,
  Clock,
  FileText,
  Save,
  X,
  Users,
  CheckCircle,
  Share2,
  Linkedin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CallModalProps {
  open: boolean;
  onClose: () => void;
  editCall?: Call | null;
}

const initialFormState = {
  scheduled_date: undefined as Date | undefined,
  scheduled_hour: '10',
  scheduled_minute: '00',
  company_name: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  contact_linkedin: '',
  company_linkedin: '',
  team_member: 'pamela' as CallTeamMember,
  source: '' as CallSource | '',
  call_result: '' as CallResult | '',
  notes: '',
  duration_minutes: '',
};

// Generate hour options (8am - 8pm)
const hourOptions = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 8;
  return { value: hour.toString().padStart(2, '0'), label: `${hour}:00` };
});

// Generate minute options (00, 15, 30, 45)
const minuteOptions = [
  { value: '00', label: '00' },
  { value: '15', label: '15' },
  { value: '30', label: '30' },
  { value: '45', label: '45' },
];

export function CallModal({ open, onClose, editCall }: CallModalProps) {
  const [formData, setFormData] = useState(initialFormState);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { createCall, updateCall, isCreating, isUpdating } = useCallMutations();

  useEffect(() => {
    if (editCall) {
      const date = new Date(editCall.scheduled_at);
      setFormData({
        scheduled_date: date,
        scheduled_hour: date.getHours().toString().padStart(2, '0'),
        scheduled_minute: date.getMinutes().toString().padStart(2, '0'),
        company_name: editCall.company_name || '',
        contact_name: editCall.contact_name || '',
        contact_phone: editCall.contact_phone || '',
        contact_email: editCall.contact_email || '',
        contact_linkedin: editCall.contact_linkedin || '',
        company_linkedin: editCall.company_linkedin || '',
        team_member: editCall.team_member,
        source: editCall.source || '',
        call_result: editCall.call_result || '',
        notes: editCall.notes || '',
        duration_minutes: editCall.duration_minutes?.toString() || '',
      });
    } else {
      setFormData(initialFormState);
    }
  }, [editCall, open]);

  const handleClose = () => {
    setFormData(initialFormState);
    onClose();
  };

  const getScheduledAt = (): string | null => {
    if (!formData.scheduled_date) return null;
    const date = new Date(formData.scheduled_date);
    date.setHours(parseInt(formData.scheduled_hour), parseInt(formData.scheduled_minute), 0, 0);
    return date.toISOString();
  };

  const handleSave = async () => {
    const scheduledAt = getScheduledAt();
    if (!scheduledAt || !formData.team_member) {
      return;
    }

    if (!formData.company_name.trim()) {
      return;
    }

    const callData = {
      scheduled_at: scheduledAt,
      company_name: formData.company_name.trim() || null,
      contact_name: formData.contact_name.trim() || null,
      contact_phone: formData.contact_phone.trim() || null,
      contact_email: formData.contact_email.trim() || null,
      contact_linkedin: formData.contact_linkedin.trim() || null,
      company_linkedin: formData.company_linkedin.trim() || null,
      team_member: formData.team_member,
      source: formData.source || null,
      call_result: formData.call_result || null,
      notes: formData.notes.trim() || null,
      duration_minutes: formData.duration_minutes
        ? parseInt(formData.duration_minutes)
        : null,
    };

    try {
      if (editCall) {
        await updateCall({ id: editCall.id, ...callData });
      } else {
        await createCall(callData as any);
      }
      handleClose();
    } catch (error) {
      console.error('Error saving call:', error);
    }
  };

  const scheduledAt = getScheduledAt();
  const isPast = scheduledAt ? new Date(scheduledAt) < new Date() : false;

  const isLoading = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4 pb-4 border-b">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">
                {editCall ? 'Editar Llamada' : 'Nueva Llamada'}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {editCall
                  ? 'Actualiza los detalles de la llamada'
                  : 'Programa una nueva llamada de ventas'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date and Time Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              Fecha y Hora *
            </Label>
            <div className="flex gap-3">
              {/* Calendar Popover */}
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 h-11 justify-start text-left font-normal",
                      !formData.scheduled_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.scheduled_date ? (
                      format(formData.scheduled_date, "EEEE d 'de' MMMM, yyyy", { locale: es })
                    ) : (
                      "Seleccionar fecha"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.scheduled_date}
                    onSelect={(date) => {
                      setFormData({ ...formData, scheduled_date: date });
                      setCalendarOpen(false);
                    }}
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>

              {/* Hour Select */}
              <Select
                value={formData.scheduled_hour}
                onValueChange={(value) =>
                  setFormData({ ...formData, scheduled_hour: value })
                }
              >
                <SelectTrigger className="w-[100px] h-11">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hourOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.value}h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="flex items-center text-lg font-medium">:</span>

              {/* Minute Select */}
              <Select
                value={formData.scheduled_minute}
                onValueChange={(value) =>
                  setFormData({ ...formData, scheduled_minute: value })
                }
              >
                <SelectTrigger className="w-[80px] h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {minuteOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Team Member and Source */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4 text-muted-foreground" />
                Miembro del Equipo *
              </Label>
              <Select
                value={formData.team_member}
                onValueChange={(value: CallTeamMember) =>
                  setFormData({ ...formData, team_member: value })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Seleccionar miembro" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TEAM_MEMBER_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Share2 className="h-4 w-4 text-muted-foreground" />
                Origen
              </Label>
              <Select
                value={formData.source || 'none'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    source: value === 'none' ? '' : (value as CallSource),
                  })
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Seleccionar origen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin especificar</SelectItem>
                  {Object.entries(CALL_SOURCE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Empresa *
            </Label>
            <Input
              value={formData.company_name}
              onChange={(e) =>
                setFormData({ ...formData, company_name: e.target.value })
              }
              placeholder="Nombre de la empresa"
              className="h-11"
            />
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4 text-muted-foreground" />
                Contacto
              </Label>
              <Input
                value={formData.contact_name}
                onChange={(e) =>
                  setFormData({ ...formData, contact_name: e.target.value })
                }
                placeholder="Nombre"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Telefono
              </Label>
              <Input
                value={formData.contact_phone}
                onChange={(e) =>
                  setFormData({ ...formData, contact_phone: e.target.value })
                }
                placeholder="Telefono"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </Label>
              <Input
                type="email"
                value={formData.contact_email}
                onChange={(e) =>
                  setFormData({ ...formData, contact_email: e.target.value })
                }
                placeholder="Email"
                className="h-11"
              />
            </div>
          </div>

          {/* LinkedIn Profiles */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                LinkedIn del Contacto
              </Label>
              <Input
                value={formData.contact_linkedin}
                onChange={(e) =>
                  setFormData({ ...formData, contact_linkedin: e.target.value })
                }
                placeholder="https://linkedin.com/in/usuario"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                LinkedIn de la Empresa
              </Label>
              <Input
                value={formData.company_linkedin}
                onChange={(e) =>
                  setFormData({ ...formData, company_linkedin: e.target.value })
                }
                placeholder="https://linkedin.com/company/empresa"
                className="h-11"
              />
            </div>
          </div>

          {/* Result and Duration (only show if editing a past call) */}
          {(isPast || editCall) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  Resultado
                </Label>
                <Select
                  value={formData.call_result || 'none'}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      call_result: value === 'none' ? '' : (value as CallResult),
                    })
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Seleccionar resultado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin resultado</SelectItem>
                    {Object.entries(CALL_RESULT_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Duracion (minutos)
                </Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) =>
                    setFormData({ ...formData, duration_minutes: e.target.value })
                  }
                  placeholder="30"
                  className="h-11"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Notas
            </Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Notas sobre la llamada..."
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              isLoading ||
              !formData.scheduled_date ||
              !formData.team_member ||
              !formData.company_name.trim()
            }
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {editCall ? 'Guardar Cambios' : 'Crear Llamada'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
