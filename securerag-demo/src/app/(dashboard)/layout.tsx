'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');

  const isTextInputFocused = () => {
    const active = document.activeElement as HTMLElement | null;
    if (!active) return false;
    const tag = active.tagName.toLowerCase();
    return (
      tag === 'input' ||
      tag === 'textarea' ||
      active.isContentEditable ||
      active.getAttribute('role') === 'textbox'
    );
  };

  const runQuickQuery = useCallback(() => {
    const query = quickQuery.trim();
    if (!query) return;
    const target = `/playground?q=${encodeURIComponent(query)}`;
    router.push(target);
    setQuickOpen(false);
    setQuickQuery('');
    toast.success('Quick query opened in Playground');
  }, [quickQuery, router]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const modifierK = (event.metaKey || event.ctrlKey) && key === 'k';
      if (modifierK) {
        event.preventDefault();
        setQuickOpen(true);
        return;
      }

      if (
        key === 'r' &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        pathname === '/overview' &&
        !isTextInputFocused()
      ) {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent('securerag:run-scan'));
        toast.message('Security scan triggered (shortcut R)');
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <Navbar />
      <main className="lg:pl-64">
        <div className="grid-pattern min-h-[calc(100vh-3.5rem)] p-4 md:p-6 lg:p-8">
          {children}
          <div className="mt-8 rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-2 text-center text-[11px] text-slate-500">
            SecureRAG Auditor - Demo Environment | All data is synthetic
          </div>
        </div>
      </main>

      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent className="border-slate-700 bg-slate-950 text-slate-100 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4 text-violet-400" />
              Quick Query (Cmd/Ctrl + K)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={quickQuery}
              onChange={(event) => setQuickQuery(event.target.value)}
              placeholder="Ask anything and jump to Playground..."
              className="border-slate-700 bg-slate-900 text-slate-100"
              onKeyDown={(event) => {
                if (event.key === 'Enter') runQuickQuery();
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Shortcut: press <span className="text-slate-300">R</span> on Overview to run scan
              </p>
              <Button
                onClick={runQuickQuery}
                className="bg-violet-600 text-white hover:bg-violet-700"
              >
                <Zap className="mr-1.5 h-3.5 w-3.5" />
                Open in Playground
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
