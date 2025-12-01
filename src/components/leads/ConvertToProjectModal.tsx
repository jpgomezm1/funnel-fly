import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Briefcase, Building2 } from 'lucide-react';
import { Lead } from '@/types/database';
import { useConvertLeadToProject } from '@/hooks/useProjects';

interface ConvertToProjectModalProps {
  open: boolean;
  onClose: () => void;
  lead: Lead;
  onSuccess: () => void;
}

export function ConvertToProjectModal({
  open,
  onClose,
  lead,
  onSuccess,
}: ConvertToProjectModalProps) {
  const { convertLeadToProject, isConverting } = useConvertLeadToProject();
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  const handleConvert = async () => {
    if (!projectName.trim()) return;

    try {
      await convertLeadToProject({
        lead: {
          id: lead.id,
          company_name: lead.company_name,
          contact_name: lead.contact_name,
          contact_role: lead.contact_role,
          phone: lead.phone,
          email: lead.email,
          notes: lead.notes,
        },
        projectName: projectName.trim(),
        projectDescription: projectDescription.trim() || undefined,
      });

      setProjectName('');
      setProjectDescription('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error converting lead to project:', error);
      alert('Error al crear el proyecto');
    }
  };

  const handleClose = () => {
    setProjectName('');
    setProjectDescription('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Crear Proyecto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client info */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{lead.company_name}</span>
            </div>
            {lead.contact_name && (
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                {lead.contact_name}
                {lead.contact_role && ` · ${lead.contact_role}`}
              </p>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Al avanzar a Demostración, se creará un proyecto específico para este cliente.
            El proyecto aparecerá en el pipeline desde esta etapa.
          </p>

          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="projectName">Nombre del Proyecto *</Label>
            <Input
              id="projectName"
              placeholder="Ej: Implementación WhatsApp CRM"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Project Description */}
          <div className="space-y-2">
            <Label htmlFor="projectDescription">Descripción del Proyecto</Label>
            <Textarea
              id="projectDescription"
              placeholder="Describe el alcance, objetivos o detalles importantes del proyecto..."
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Esta descripción será visible en la página del proyecto
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isConverting}>
            Cancelar
          </Button>
          <Button
            onClick={handleConvert}
            disabled={!projectName.trim() || isConverting}
          >
            {isConverting ? 'Creando...' : 'Crear Proyecto'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
