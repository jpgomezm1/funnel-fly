import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export function AIChatInput({ onSend, isLoading, placeholder = '¿En qué te puedo ayudar?' }: AIChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 border-t border-zinc-800 bg-zinc-900/50">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className={cn(
            'flex-1 resize-none bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3',
            'text-sm text-zinc-200 placeholder:text-zinc-500',
            'focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-200'
          )}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className={cn(
            'flex-shrink-0 p-3 rounded-xl transition-all duration-200',
            message.trim() && !isLoading
              ? 'bg-purple-600 hover:bg-purple-500 text-white'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
      <p className="text-xs text-zinc-600 mt-2 text-center">
        Enter para enviar · Shift+Enter para nueva línea
      </p>
    </div>
  );
}
