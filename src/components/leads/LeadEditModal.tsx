import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lead, LeadChannel, LeadSubchannel, CHANNEL_LABELS, SUBCHANNEL_LABELS } from '@/types/database';

interface LeadEditModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Lead>) => Promise<void>;
  lead: Lead;
}

export function LeadEditModal({ open, onClose, onSave, lead }: LeadEditModalProps) {
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && lead) {
      setFormData({
        company_name: lead.company_name,
        contact_name: lead.contact_name || '',
        contact_role: lead.contact_role || '',
        phone: lead.phone || '',
        email: lead.email || '',
        channel: lead.channel,
        subchannel: lead.subchannel,
      });
    }
  }, [open, lead]);

  const handleSave = async () => {
    if (!formData.company_name?.trim()) {
      alert('El nombre de la empresa es requerido');
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error updating lead:', error);
      alert('Error al actualizar el lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Lead - {lead?.company_name}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Company Name */}
          <div className="grid gap-2">
            <Label htmlFor="company_name">Empresa *</Label>
            <Input
              id="company_name"
              value={formData.company_name || ''}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            />
          </div>

          {/* Contact Name */}
          <div className="grid gap-2">
            <Label htmlFor="contact_name">Contacto</Label>
            <Input
              id="contact_name"
              value={formData.contact_name || ''}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
            />
          </div>

          {/* Contact Role */}
          <div className="grid gap-2">
            <Label htmlFor="contact_role">Cargo</Label>
            <Input
              id="contact_role"
              value={formData.contact_role || ''}
              onChange={(e) => setFormData({ ...formData, contact_role: e.target.value })}
            />
          </div>

          {/* Phone */}
          <div className="grid gap-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          {/* Email */}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* Channel */}
          <div className="grid gap-2">
            <Label>Canal</Label>
            <Select 
              value={formData.channel} 
              onValueChange={(value: LeadChannel) => setFormData({ ...formData, channel: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subchannel */}
          <div className="grid gap-2">
            <Label>Subcanal</Label>
            <Select 
              value={formData.subchannel} 
              onValueChange={(value: LeadSubchannel) => setFormData({ ...formData, subchannel: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUBCHANNEL_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}