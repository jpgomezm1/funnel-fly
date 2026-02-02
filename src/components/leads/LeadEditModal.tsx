import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lead, LeadChannel, LeadSubchannel, CHANNEL_LABELS, SUBCHANNEL_LABELS } from '@/types/database';
import { Building, User, Phone, Mail, Activity, Target, Save, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeamMembers } from '@/hooks/useTeamMembers';

interface LeadEditModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Lead>) => Promise<void>;
  lead: Lead;
}

export function LeadEditModal({ open, onClose, onSave, lead }: LeadEditModalProps) {
  const { salesMembers } = useTeamMembers();
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
        owner_id: lead.owner_id || '',
        product_tag: lead.product_tag || 'WhatsApp',
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50 border-0 shadow-2xl backdrop-blur-xl">
        <DialogHeader className="space-y-6 pb-8 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-blue-500/5 to-purple-500/5 rounded-2xl" />
            <div className="absolute top-2 right-2 w-20 h-20 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-full blur-2xl animate-pulse" />

            <div className="relative flex items-center gap-6 p-6 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-slate-200 dark:border-slate-600 shadow-lg">
              <div className="relative p-4 bg-gradient-to-br from-primary/20 to-blue-500/30 rounded-2xl shadow-xl border border-primary/20">
                <Building className="h-8 w-8 text-primary" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                  Editar Lead
                </DialogTitle>
                <p className="text-slate-600 dark:text-slate-300 font-semibold text-lg mt-1">{lead?.company_name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">Editando información</span>
                </div>
              </div>
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-8 py-8">
          {/* Company Information Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="p-3 bg-gradient-to-br from-primary/20 to-blue-500/30 rounded-xl shadow-lg">
                <Building className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Información de la Empresa</h3>
            </div>

            <div className="p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-700/30 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg">
              <div className="space-y-4">
                <Label htmlFor="company_name" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                  <Building className="h-4 w-4 text-primary" />
                  Empresa *
                </Label>
                <Input
                  id="company_name"
                  value={formData.company_name || ''}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className={cn(
                    "h-14 bg-white/70 dark:bg-slate-800/70 border-2 transition-all duration-200 rounded-xl text-lg font-medium shadow-lg",
                    "focus:border-primary/50 focus:bg-white dark:focus:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600",
                    "border-slate-300 dark:border-slate-600"
                  )}
                  placeholder="Nombre de la empresa"
                />
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/30 rounded-xl shadow-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Información de Contacto</h3>
            </div>

            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/70 dark:from-blue-900/30 dark:to-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-lg">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label htmlFor="contact_name" className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2 uppercase tracking-wider">
                    <User className="h-4 w-4" />
                    Contacto
                  </Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name || ''}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    className="h-14 bg-white/80 dark:bg-slate-800/50 border-2 border-blue-200 dark:border-blue-700 transition-all duration-200 focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl text-lg font-medium shadow-lg"
                    placeholder="Nombre del contacto"
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="contact_role" className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2 uppercase tracking-wider">
                    <Target className="h-4 w-4" />
                    Cargo
                  </Label>
                  <Input
                    id="contact_role"
                    value={formData.contact_role || ''}
                    onChange={(e) => setFormData({ ...formData, contact_role: e.target.value })}
                    className="h-14 bg-white/80 dark:bg-slate-800/50 border-2 border-blue-200 dark:border-blue-700 transition-all duration-200 focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl text-lg font-medium shadow-lg"
                    placeholder="Cargo del contacto"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-4">
                  <Label htmlFor="phone" className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2 uppercase tracking-wider">
                    <Phone className="h-4 w-4" />
                    Teléfono
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-14 bg-white/80 dark:bg-slate-800/50 border-2 border-blue-200 dark:border-blue-700 transition-all duration-200 focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl text-lg font-medium shadow-lg"
                    placeholder="Número de teléfono"
                  />
                </div>

                <div className="space-y-4">
                  <Label htmlFor="email" className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2 uppercase tracking-wider">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-14 bg-white/80 dark:bg-slate-800/50 border-2 border-blue-200 dark:border-blue-700 transition-all duration-200 focus:border-blue-400 focus:bg-white dark:focus:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl text-lg font-medium shadow-lg"
                    placeholder="Correo electrónico"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Assignment and Channel Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/30 rounded-xl shadow-lg">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Asignación y Canal</h3>
            </div>

            <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/70 dark:from-purple-900/30 dark:to-purple-950/20 rounded-2xl border border-purple-200 dark:border-purple-800 shadow-lg">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2 uppercase tracking-wider">
                    <Target className="h-4 w-4" />
                    Producto
                  </Label>
                  <Select
                    value={formData.product_tag || 'WhatsApp'}
                    onValueChange={(value: string) => setFormData({ ...formData, product_tag: value })}
                  >
                    <SelectTrigger className="h-14 bg-white/80 dark:bg-slate-800/50 border-2 border-purple-200 dark:border-purple-700 transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-600 rounded-xl shadow-lg">
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-purple-200 dark:border-purple-700 rounded-xl shadow-2xl">
                      <SelectItem value="WhatsApp" className="hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg m-1">
                        WhatsApp
                      </SelectItem>
                      <SelectItem value="AI Academy" className="hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg m-1">
                        AI Academy
                      </SelectItem>
                      <SelectItem value="Otro Desarrollo" className="hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg m-1">
                        Otro Desarrollo
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2 uppercase tracking-wider">
                    <User className="h-4 w-4" />
                    Comercial
                  </Label>
                  <Select
                    value={formData.owner_id || 'unassigned'}
                    onValueChange={(value: string) => setFormData({ ...formData, owner_id: value === 'unassigned' ? null : value })}
                  >
                    <SelectTrigger className="h-14 bg-white/80 dark:bg-slate-800/50 border-2 border-purple-200 dark:border-purple-700 transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-600 rounded-xl shadow-lg">
                      <SelectValue placeholder="Seleccionar comercial" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-purple-200 dark:border-purple-700 rounded-xl shadow-2xl">
                      <SelectItem value="unassigned" className="hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg m-1">
                        Sin asignar
                      </SelectItem>
                      {salesMembers.map((m) => (
                        <SelectItem key={m.slug} value={m.slug} className="hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg m-1">
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2 uppercase tracking-wider">
                    <Activity className="h-4 w-4" />
                    Canal
                  </Label>
                  <Select
                    value={formData.channel}
                    onValueChange={(value: LeadChannel) => setFormData({ ...formData, channel: value })}
                  >
                    <SelectTrigger className="h-14 bg-white/80 dark:bg-slate-800/50 border-2 border-purple-200 dark:border-purple-700 transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-600 rounded-xl shadow-lg">
                      <SelectValue placeholder="Seleccionar canal" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-purple-200 dark:border-purple-700 rounded-xl shadow-2xl">
                      {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key} className="hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg m-1">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2 uppercase tracking-wider">
                    <Target className="h-4 w-4" />
                    Subcanal
                  </Label>
                  <Select
                    value={formData.subchannel}
                    onValueChange={(value: LeadSubchannel) => setFormData({ ...formData, subchannel: value })}
                  >
                    <SelectTrigger className="h-14 bg-white/80 dark:bg-slate-800/50 border-2 border-purple-200 dark:border-purple-700 transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-600 rounded-xl shadow-lg">
                      <SelectValue placeholder="Seleccionar subcanal" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-purple-200 dark:border-purple-700 rounded-xl shadow-2xl">
                      {Object.entries(SUBCHANNEL_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key} className="hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg m-1">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-8 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="h-14 px-8 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl font-semibold"
          >
            <X className="h-5 w-5 mr-3" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !formData.company_name?.trim()}
            className="h-14 px-8 bg-gradient-to-r from-primary via-primary to-blue-600 hover:from-primary/90 hover:via-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-xl border border-primary/20 font-semibold"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 mr-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-3" />
                Guardar Cambios
                <Sparkles className="h-5 w-5 ml-3" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}