import { useRef, useEffect } from 'react';
import { X, Trash2, Atom, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIChatMessage } from './AIChatMessage';
import { AIChatInput } from './AIChatInput';
import { Message } from '@/hooks/useAIChat';

// URL de imagen de Sheldon Cooper
const SHELDON_IMAGE = 'https://i.redd.it/6ht9iub3umve1.jpeg';

interface AIChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
  onClearChat: () => void;
}

export function AIChatWindow({
  isOpen,
  onClose,
  messages,
  isLoading,
  error,
  onSendMessage,
  onClearChat,
}: AIChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed bottom-24 right-6 z-50',
        'w-[440px] max-w-[calc(100vw-48px)] h-[650px] max-h-[calc(100vh-140px)]',
        'bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50',
        'flex flex-col overflow-hidden',
        'animate-in slide-in-from-bottom-5 fade-in duration-300'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-blue-500/30">
              <img
                src={SHELDON_IMAGE}
                alt="Sheldon Cooper"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-zinc-900 rounded-full" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100 text-sm flex items-center gap-1.5">
              Dr. Sheldon Cooper
              <Atom className="w-3.5 h-3.5 text-blue-400" />
            </h3>
            <p className="text-xs text-zinc-500">Físico Teórico · IQ 187 · AI Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={onClearChat}
              className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
              title="Limpiar chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            {/* Sheldon intro */}
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500/30 mb-4 shadow-lg shadow-blue-500/20">
              <img
                src={SHELDON_IMAGE}
                alt="Sheldon Cooper"
                className="w-full h-full object-cover"
              />
            </div>
            <h4 className="font-semibold text-zinc-200 mb-1">Dr. Sheldon Cooper</h4>
            <p className="text-xs text-blue-400 mb-4">Físico Teórico · Caltech</p>

            <div className="bg-zinc-800/50 rounded-xl p-4 mb-6 max-w-sm border border-zinc-700/50">
              <p className="text-sm text-zinc-300 italic">
                "Knock knock knock, usuario. Knock knock knock, usuario. Knock knock knock, usuario."
              </p>
              <p className="text-xs text-zinc-500 mt-2">
                Soy tu asistente con acceso completo al ERP. Puedo analizar datos, identificar riesgos,
                dar recomendaciones y ejecutar acciones. Bazinga!
              </p>
            </div>

            {/* Quick suggestions */}
            <div className="space-y-2 w-full max-w-sm">
              <p className="text-xs text-zinc-600 uppercase tracking-wide flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" />
                Sugerencias
              </p>
              {[
                '¿Cuál es el estado del pipeline?',
                '¿Qué leads necesitan atención urgente?',
                'Dame un análisis de riesgos',
                '¿Cómo van las finanzas este mes?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => onSendMessage(suggestion)}
                  className="w-full text-left px-4 py-2.5 text-sm text-zinc-400 bg-zinc-800/30 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all hover:text-zinc-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {messages.map((message) => (
              <AIChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                isStreaming={message.isStreaming}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="px-4 py-3 bg-red-500/10 border-t border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Input */}
      <AIChatInput onSend={onSendMessage} isLoading={isLoading} placeholder="Pregúntale a Sheldon..." />

      {/* Footer branding */}
      <div className="px-4 py-2 border-t border-zinc-800/50 bg-zinc-900/50">
        <p className="text-[10px] text-zinc-600 text-center">
          Powered by Claude AI · Think AI or stay irrelevant
        </p>
      </div>
    </div>
  );
}
