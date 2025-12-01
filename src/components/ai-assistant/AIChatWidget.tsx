import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAIChat } from '@/hooks/useAIChat';
import { AIChatWindow } from './AIChatWindow';
import { X } from 'lucide-react';

// URL de imagen de Sheldon Cooper
const SHELDON_IMAGE = 'https://i.redd.it/6ht9iub3umve1.jpeg';

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isLoading, error, sendMessage, clearChat } = useAIChat();

  return (
    <>
      {/* Chat Window */}
      <AIChatWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        isLoading={isLoading}
        error={error}
        onSendMessage={sendMessage}
        onClearChat={clearChat}
      />

      {/* Floating Button - Sheldon Cooper */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50',
          'group transition-all duration-300',
          isOpen ? 'scale-90' : 'scale-100 hover:scale-110'
        )}
      >
        {/* Glow effect */}
        <div
          className={cn(
            'absolute inset-0 rounded-full transition-opacity duration-300',
            'bg-gradient-to-r from-blue-500 to-cyan-500 blur-xl opacity-40',
            isOpen ? 'opacity-0' : 'group-hover:opacity-70'
          )}
        />

        {/* Pulsing ring when not open */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" />
        )}

        {/* Button */}
        <div
          className={cn(
            'relative w-16 h-16 rounded-full transition-all duration-300 overflow-hidden',
            'border-2 shadow-lg',
            isOpen
              ? 'bg-zinc-800 border-zinc-700'
              : 'border-blue-400/50 shadow-blue-500/30'
          )}
        >
          {isOpen ? (
            <div className="w-full h-full flex items-center justify-center bg-zinc-800">
              <X className="w-6 h-6 text-zinc-400" />
            </div>
          ) : (
            <>
              {/* Sheldon image */}
              <img
                src={SHELDON_IMAGE}
                alt="Sheldon Cooper"
                className="w-full h-full object-cover"
              />

              {/* Online indicator */}
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
            </>
          )}
        </div>

        {/* Tooltip */}
        {!isOpen && (
          <div
            className={cn(
              'absolute bottom-full right-0 mb-3 px-4 py-2',
              'bg-zinc-900 border border-zinc-700 rounded-xl',
              'text-sm text-zinc-200 whitespace-nowrap',
              'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
              'pointer-events-none shadow-xl'
            )}
          >
            <span className="font-medium">Dr. Sheldon Cooper</span>
            <span className="text-zinc-500 ml-1">· AI Assistant</span>
            {/* Arrow */}
            <div className="absolute top-full right-5 w-3 h-3 bg-zinc-900 border-r border-b border-zinc-700 transform rotate-45 -translate-y-1.5" />
          </div>
        )}
      </button>
    </>
  );
}
