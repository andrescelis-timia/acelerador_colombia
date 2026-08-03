'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/lib/context/AuthContext';

interface MarkdownViewProps {
  file: string;
}

// Componentes con estilos Tailwind explicitos (evita dependencia @tailwindcss/typography)
const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-semibold text-gray-900 mt-7 mb-3 pb-1 border-b border-gray-100">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-gray-900 mt-5 mb-2">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-gray-900 mt-4 mb-2">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="text-sm text-gray-700 leading-relaxed my-3">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 my-3 space-y-1 text-sm text-gray-700">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 my-3 space-y-1 text-sm text-gray-700">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-sm text-gray-600">{children}</blockquote>
  ),
  a: ({ href, children }) => (
    <a href={href} className="text-timia-accent hover:underline" target="_blank" rel="noreferrer">{children}</a>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code className="block bg-gray-50 border border-gray-200 rounded-md p-3 text-xs font-mono text-gray-800 overflow-x-auto whitespace-pre">{children}</code>
      );
    }
    return (
      <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-[12px] font-mono">{children}</code>
    );
  },
  pre: ({ children }) => <pre className="my-3">{children}</pre>,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="min-w-full border border-gray-200 text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b border-gray-200">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-sm text-gray-700 border-b border-gray-100 align-top">{children}</td>
  ),
  hr: () => <hr className="my-6 border-t border-gray-200" />,
  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
};

export const MarkdownView = ({ file }: MarkdownViewProps) => {
  const { user, country } = useAuth();
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    const load = async () => {
      try {
        const response = await fetch(`/api/docs/${file}`, {
          headers: { 'X-User': user.email!, 'X-Country': country || 'CO' },
        });
        if (response.status === 403) {
          setError('No tienes permisos para ver este documento.');
          return;
        }
        if (!response.ok) {
          setError('No se pudo cargar el documento.');
          return;
        }
        setContent(await response.text());
      } catch {
        setError('Error de conexión al cargar el documento.');
      }
    };
    load();
  }, [file, user?.email, country]);

  if (error) {
    return (
      <div className="p-6 bg-danger-subtle border border-danger-border rounded-lg text-sm text-danger">
        {error}
      </div>
    );
  }

  if (content === null) {
    return <div className="p-6 text-sm text-gray-500">Cargando…</div>;
  }

  return (
    <article className="max-w-4xl">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </article>
  );
};
