import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Upload, Trash2, Download, Loader2, FileText } from 'lucide-react';
import { useTodoAttachments } from '@/hooks/useTodoAttachments';
import { toast } from '@/hooks/use-toast';

interface TodoAttachmentsProps {
  todoId: string;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TodoAttachments({ todoId }: TodoAttachmentsProps) {
  const { attachments, upload, deleteAttachment, getSignedUrl, isUploading } = useTodoAttachments(todoId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await upload(file);
      toast({ title: 'Archivo subido', description: file.name });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo subir el archivo', variant: 'destructive' });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const url = await getSignedUrl(filePath);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo descargar el archivo', variant: 'destructive' });
    }
  };

  const handleDelete = async (attachment: any) => {
    try {
      await deleteAttachment(attachment);
      toast({ title: 'Archivo eliminado' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el archivo', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Adjuntos ({attachments.length})
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
          Subir
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      <div className="space-y-1.5">
        {attachments.map(att => (
          <div key={att.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium">{att.file_name}</p>
              <p className="text-[10px] text-muted-foreground">
                {formatFileSize(att.file_size ?? undefined)} - {att.uploaded_by_name || 'Usuario'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleDownload(att.file_path, att.file_name)}
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleDelete(att)}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
            </Button>
          </div>
        ))}

        {attachments.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-3">Sin adjuntos</p>
        )}
      </div>
    </div>
  );
}
