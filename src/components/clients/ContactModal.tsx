import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User } from 'lucide-react';
import { ClientContact } from '@/types/database';

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    role?: string;
    email?: string;
    phone?: string;
    description?: string;
  }) => Promise<void>;
  contact?: ClientContact;
  saving?: boolean;
}

export function ContactModal({
  open,
  onClose,
  onSave,
  contact,
  saving = false,
}: ContactModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setRole(contact.role || '');
      setEmail(contact.email || '');
      setPhone(contact.phone || '');
      setDescription(contact.description || '');
    } else {
      setName('');
      setRole('');
      setEmail('');
      setPhone('');
      setDescription('');
    }
  }, [contact, open]);

  const handleSave = async () => {
    if (!name.trim()) return;

    await onSave({
      name: name.trim(),
      role: role.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      description: description.trim() || undefined,
    });

    onClose();
  };

  const handleClose = () => {
    setName('');
    setRole('');
    setEmail('');
    setPhone('');
    setDescription('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {contact ? 'Editar Contacto' : 'Agregar Contacto'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              placeholder="Nombre del contacto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol / Cargo</Label>
            <Input
              id="role"
              placeholder="Ej: CEO, Director Comercial, etc."
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                placeholder="+57 300 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción / Notas</Label>
            <Textarea
              id="description"
              placeholder="Notas sobre este contacto, responsabilidades, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? 'Guardando...' : contact ? 'Guardar' : 'Agregar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
