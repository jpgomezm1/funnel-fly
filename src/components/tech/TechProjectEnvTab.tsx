import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  FileKey,
  Copy,
  Download,
  Save,
  Loader2,
  Server,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectEnvVariables } from '@/hooks/useProjectEnvVariables';
import {
  EnvironmentType,
  ENVIRONMENT_LABELS,
} from '@/types/database';
import { toast } from '@/hooks/use-toast';

interface TechProjectEnvTabProps {
  projectId: string;
}

const ENVIRONMENTS: EnvironmentType[] = ['development', 'staging', 'production'];

export function TechProjectEnvTab({ projectId }: TechProjectEnvTabProps) {
  const {
    envVariables,
    envByEnvironment,
    isLoading,
    saveEnvVariables,
    getEnvContent,
    isSaving,
  } = useProjectEnvVariables(projectId);

  // Local state for editing
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState<Record<string, boolean>>({});

  // Initialize content when data loads
  useEffect(() => {
    const initial: Record<string, string> = {};
    ENVIRONMENTS.forEach((env) => {
      initial[env] = getEnvContent(env);
    });
    setEditedContent(initial);
    setHasChanges({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envVariables]);

  const handleContentChange = (env: EnvironmentType, content: string) => {
    setEditedContent(prev => ({ ...prev, [env]: content }));
    setHasChanges(prev => ({ ...prev, [env]: content !== getEnvContent(env) }));
  };

  const handleSave = async (env: EnvironmentType) => {
    try {
      await saveEnvVariables({
        project_id: projectId,
        environment: env.toLowerCase(),
        variables: editedContent[env] || '',
      });
      setHasChanges(prev => ({ ...prev, [env]: false }));
      toast({ title: 'Variables guardadas', description: `Variables de ${ENVIRONMENT_LABELS[env]} actualizadas` });
    } catch (error) {
      console.error('Error saving env variables:', error);
      toast({ title: 'Error', description: 'No se pudieron guardar las variables', variant: 'destructive' });
    }
  };

  const handleCopy = (env: EnvironmentType) => {
    const content = editedContent[env] || '';
    navigator.clipboard.writeText(content);
    toast({ title: 'Copiado', description: 'Variables copiadas al portapapeles' });
  };

  const handleExport = (env: EnvironmentType) => {
    const content = editedContent[env] || '';
    if (!content.trim()) {
      toast({ title: 'Vacío', description: 'No hay variables para exportar' });
      return;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `.env.${env.toLowerCase()}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const countVariables = (content: string): number => {
    if (!content.trim()) return 0;
    return content.split('\n').filter(line =>
      line.trim() && !line.trim().startsWith('#') && line.includes('=')
    ).length;
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Variables de Entorno</h2>
          <p className="text-sm text-muted-foreground">
            Variables de configuración por ambiente
          </p>
        </div>
      </div>

      {/* Warning */}
      <Card className="mb-4 bg-amber-50 border-amber-200">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Información Sensible</p>
            <p className="text-xs text-amber-700">
              Las variables de entorno pueden contener credenciales sensibles. Asegúrate de que solo personas autorizadas tengan acceso.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Environment Accordions */}
      <Accordion type="multiple" defaultValue={['development', 'staging', 'production']} className="space-y-2">
        {ENVIRONMENTS.map((env) => {
          const content = editedContent[env] || '';
          const varCount = countVariables(content);
          const changed = hasChanges[env];

          return (
            <AccordionItem key={env} value={env} className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded flex items-center justify-center",
                    env === 'production' && "bg-red-100",
                    env === 'staging' && "bg-amber-100",
                    env === 'development' && "bg-slate-100"
                  )}>
                    <Server className={cn(
                      "h-4 w-4",
                      env === 'production' && "text-red-600",
                      env === 'staging' && "text-amber-600",
                      env === 'development' && "text-slate-600"
                    )} />
                  </div>
                  <div className="text-left flex items-center gap-2">
                    <span className="font-medium">{ENVIRONMENT_LABELS[env]}</span>
                    <Badge variant="secondary" className="text-xs">
                      {varCount} vars
                    </Badge>
                    {changed && (
                      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-600 border-amber-200">
                        Sin guardar
                      </Badge>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="flex justify-end gap-2 mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(env)}
                    disabled={!content.trim()}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copiar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(env)}
                    disabled={!content.trim()}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Exportar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSave(env)}
                    disabled={!changed || isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : changed ? (
                      <Save className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <Check className="h-3.5 w-3.5 mr-1" />
                    )}
                    {changed ? 'Guardar' : 'Guardado'}
                  </Button>
                </div>

                <Textarea
                  value={content}
                  onChange={(e) => handleContentChange(env, e.target.value)}
                  placeholder={`# Variables de ${ENVIRONMENT_LABELS[env]}\n# Formato: KEY=value\n\nDATABASE_URL=\nAPI_KEY=\nSECRET_KEY=`}
                  className="font-mono text-sm min-h-[200px]"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Formato: KEY=value (una por línea). Líneas que empiezan con # son comentarios.
                </p>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </>
  );
}
