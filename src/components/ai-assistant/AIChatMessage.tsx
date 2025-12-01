import { memo } from 'react';
import { cn } from '@/lib/utils';
import { User, Atom } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// URL de imagen de Sheldon Cooper
const SHELDON_IMAGE = 'https://i.redd.it/6ht9iub3umve1.jpeg';

interface AIChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export const AIChatMessage = memo(function AIChatMessage({
  role,
  content,
  isStreaming,
}: AIChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 p-4',
        isUser ? 'bg-zinc-800/30' : 'bg-transparent'
      )}
    >
      {/* Avatar */}
      {isUser ? (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>
      ) : (
        <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border border-blue-500/30">
          <img
            src={SHELDON_IMAGE}
            alt="Sheldon"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <p className={cn(
          'text-xs font-medium flex items-center gap-1',
          isUser ? 'text-blue-400' : 'text-cyan-400'
        )}>
          {isUser ? 'Tú' : (
            <>
              Dr. Sheldon Cooper
              <Atom className="w-3 h-3" />
            </>
          )}
        </p>

        <div className="text-sm text-zinc-200 prose prose-invert prose-sm max-w-none">
          {content ? (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>,
                li: ({ children }) => <li className="mb-0.5">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
                em: ({ children }) => <em className="text-cyan-300">{children}</em>,
                code: ({ children }) => (
                  <code className="px-1.5 py-0.5 bg-zinc-700/50 border border-zinc-600/50 rounded text-xs font-mono text-cyan-300">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="p-3 bg-zinc-800/80 border border-zinc-700/50 rounded-lg overflow-x-auto my-2 text-xs">
                    {children}
                  </pre>
                ),
                h1: ({ children }) => <h1 className="text-lg font-bold text-zinc-100 mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold text-zinc-100 mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold text-zinc-200 mb-1">{children}</h3>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-cyan-500/50 pl-3 italic text-zinc-400 my-2">
                    {children}
                  </blockquote>
                ),
                hr: () => <hr className="border-zinc-700 my-3" />,
                a: ({ href, children }) => (
                  <a href={href} className="text-cyan-400 hover:text-cyan-300 underline" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          ) : isStreaming ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          ) : null}

          {/* Cursor de streaming */}
          {isStreaming && content && (
            <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-0.5 rounded-sm" />
          )}
        </div>
      </div>
    </div>
  );
});
