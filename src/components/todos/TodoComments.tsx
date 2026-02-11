import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Trash2, MessageSquare } from 'lucide-react';
import { useTodoComments } from '@/hooks/useTodoComments';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface TodoCommentsProps {
  todoId: string;
}

export function TodoComments({ todoId }: TodoCommentsProps) {
  const { comments, isLoading, createComment, deleteComment, isCreating } = useTodoComments(todoId);
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      await createComment(newComment.trim());
      setNewComment('');
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo crear el comentario', variant: 'destructive' });
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(commentId);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el comentario', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Comentarios ({comments.length})
      </h4>

      {/* Comment list */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-2">
            <div className="h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[8px] font-bold text-white">
                {(comment.author_name || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{comment.author_name || 'Usuario'}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(comment.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
                {comment.author_id === user?.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-auto"
                    onClick={() => handleDelete(comment.id)}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
            </div>
          </div>
        ))}

        {comments.length === 0 && !isLoading && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Sin comentarios
          </p>
        )}
      </div>

      {/* New comment */}
      <div className="flex gap-2">
        <Textarea
          placeholder="Escribe un comentario..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[60px] text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={isCreating || !newComment.trim()}
          className="self-end"
        >
          {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
