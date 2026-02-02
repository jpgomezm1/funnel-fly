import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  hasProjects: boolean;
  projectCount: number;
  onConfirm: () => Promise<void>;
}

export function DeleteCompanyDialog({
  open,
  onOpenChange,
  companyName,
  hasProjects,
  projectCount,
  onConfirm,
}: DeleteCompanyDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // error handled by caller
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={isDeleting ? undefined : onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Eliminar Empresa
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              ¿Estás seguro de que deseas eliminar <strong>{companyName}</strong>? Esta acción no se puede deshacer.
            </span>
            {hasProjects ? (
              <span className="block text-destructive font-medium">
                Esta empresa tiene {projectCount} proyecto{projectCount !== 1 ? 's' : ''} asociado{projectCount !== 1 ? 's' : ''}. Se eliminarán todos los proyectos, contratos, contactos, documentos y actividades relacionadas.
              </span>
            ) : (
              <span className="block">
                Se eliminarán todos los contactos, actividades, documentos y llamadas asociadas.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              'Eliminar'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
