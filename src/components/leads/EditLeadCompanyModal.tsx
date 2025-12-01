import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2 } from 'lucide-react';
import { Lead } from '@/types/database';

interface EditLeadCompanyModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    company_name: string;
    description?: string;
    linkedin_url?: string;
    website_url?: string;
  }) => Promise<void>;
  lead: Lead;
  saving?: boolean;
}

export function EditLeadCompanyModal({
  open,
  onClose,
  onSave,
  lead,
  saving = false,
}: EditLeadCompanyModalProps) {
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  useEffect(() => {
    if (lead) {
      setCompanyName(lead.company_name);
      setDescription(lead.description || '');
      setLinkedinUrl(lead.linkedin_url || '');
      setWebsiteUrl(lead.website_url || '');
    }
  }, [lead, open]);

  const handleSave = async () => {
    if (!companyName.trim()) return;

    await onSave({
      company_name: companyName.trim(),
      description: description.trim() || undefined,
      linkedin_url: linkedinUrl.trim() || undefined,
      website_url: websiteUrl.trim() || undefined,
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Editar Empresa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nombre de la Empresa *</Label>
            <Input
              id="companyName"
              placeholder="Nombre de la empresa"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe a qué se dedica la empresa, industria, tamaño, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linkedinUrl">LinkedIn</Label>
              <Input
                id="linkedinUrl"
                placeholder="https://linkedin.com/company/..."
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Sitio Web</Label>
              <Input
                id="websiteUrl"
                placeholder="https://ejemplo.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!companyName.trim() || saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
