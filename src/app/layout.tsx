import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'SecureRAG Auditor — LLM Permission Leakage Detection | Human Delta AI',
  description:
    'Find and fix LLM permission leakage before your enterprise clients do. SecureRAG Auditor detects permission scope leakage, context poisoning, and audit blindspots in RAG systems with real-time RBAC enforcement.',
  keywords: [
    'RAG security',
    'LLM permissions',
    'AI data leakage',
    'enterprise AI safety',
    'RBAC',
    'prompt injection detection',
    'AI audit trail',
    'permission scope leakage',
  ],
  authors: [{ name: 'Human Delta AI' }],
  openGraph: {
    title: 'SecureRAG Auditor — LLM Permission Leakage Detection',
    description:
      'Your LLM is leaking data. Find and fix permission scope leakage before your enterprise clients do.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          richColors
          toastOptions={{
            classNames: {
              toast:
                'border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl',
              title: 'text-slate-100',
              description: 'text-slate-300',
            },
          }}
        />
      </body>
    </html>
  );
}
