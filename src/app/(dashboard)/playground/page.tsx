'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FlaskConical,
  Send,
  ChevronDown,
  Shield,
  Sparkles,
  Share2,
  Loader2,
} from 'lucide-react';
import { InsecureRAG } from '@/components/playground/InsecureRAG';
import { SecureRAG } from '@/components/playground/SecureRAG';
import { DiffHighlighter } from '@/components/playground/DiffHighlighter';
import { useAppStore } from '@/store/useAppStore';
import { useAuditStore } from '@/store/useAuditStore';
import { simulateInsecureRAG, simulateSecureRAG } from '@/lib/rag-engine';
import { createAuditEntry } from '@/lib/audit-logger';
import { RAGResponse, UserRole } from '@/lib/types';
import { roleLabels } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const presetQueries = [
  'What is our acquisition strategy for Q4?',
  'Show me the executive salary breakdown',
  'What deals are in our sales pipeline?',
  'Explain our product roadmap for 2025',
  'What are common customer support issues?',
  "Tell me about the company's Series B terms",
];

export default function PlaygroundPage() {
  const { currentUser, setCurrentRole } = useAppStore();
  const auditStore = useAuditStore();

  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insecureResult, setInsecureResult] = useState<RAGResponse | null>(null);
  const [secureResult, setSecureResult] = useState<RAGResponse | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [leaksPrevented, setLeaksPrevented] = useState(0);
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [sharing, setSharing] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const hasAutoRunRef = useRef(false);

  const handleQuery = useCallback(
    async (q: string) => {
      if (!q.trim() || isLoading) return;

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setInsecureResult(null);
      setSecureResult(null);

      try {
        const [insecure, secure] = await Promise.all([
          simulateInsecureRAG(q, currentUser.id, controller.signal),
          simulateSecureRAG(q, currentUser.id, controller.signal),
        ]);

        setInsecureResult(insecure);
        setSecureResult(secure);

        const entry = createAuditEntry(
          currentUser.id,
          currentUser.role,
          q,
          insecure,
          secure
        );
        auditStore.addEntry(entry);

        if (insecure.leakedDocIds.length > 0) {
          setLeaksPrevented((prev) => prev + insecure.leakedDocIds.length);
          setShowCelebrate(true);
          setTimeout(() => setShowCelebrate(false), 2500);
          toast.warning('Leakage detected in Insecure RAG', {
            description: `${insecure.leakedDocIds.length} restricted document(s) would have leaked.`,
          });
        }

        if (insecure.leakedDocIds.length > 0 && secure.leakedDocIds.length === 0) {
          toast.success('SecureRAG blocked leakage', {
            description: 'Sensitive context was filtered by permission controls.',
          });
        }
      } catch (error) {
        const isAbort =
          error instanceof DOMException && error.name === 'AbortError';
        if (!isAbort) {
          toast.error('Failed to process query', {
            description: 'Please retry the request.',
          });
        }
      } finally {
        setIsLoading(false);
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    },
    [currentUser, isLoading, auditStore]
  );

  const handleSubmit = () => handleQuery(query);

  const handlePreset = (q: string) => {
    setQuery(q);
    setShowPresets(false);
    handleQuery(q);
  };

  const handleShareResult = async () => {
    if (!query.trim()) {
      toast.message('Run a query first to share this result');
      return;
    }
    if (sharing) return;
    setSharing(true);

    const url = `${window.location.origin}/playground?q=${encodeURIComponent(
      query
    )}&role=${currentUser.role}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied');
    } catch {
      toast.error('Failed to copy share link');
    } finally {
      setSharing(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryParam = params.get('q');
    const roleParam = params.get('role');
    if (hasAutoRunRef.current || !queryParam) return;

    const roleIsValid =
      roleParam &&
      ['ceo', 'sales_rep', 'support_analyst', 'external_partner'].includes(roleParam);

    if (roleIsValid && currentUser.role !== roleParam) {
      setCurrentRole(roleParam as UserRole);
      setQuery(queryParam);
      return;
    }

    hasAutoRunRef.current = true;
    setQuery(queryParam);
    handleQuery(queryParam);
  }, [handleQuery, setCurrentRole, currentUser.role]);

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-6 w-6 text-violet-400" />
          <h1 className="text-2xl font-bold text-slate-100">RAG Playground</h1>
          <Badge
            variant="outline"
            className="border-violet-500/30 bg-violet-500/10 text-xs text-violet-400"
          >
            Live Comparison
          </Badge>
        </div>
        {(leaksPrevented > 0 || insecureResult || secureResult) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3"
          >
            {leaksPrevented > 0 && (
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">
                  Leaks prevented this session:{' '}
                  <span className="font-bold">{leaksPrevented}</span>
                </span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
              onClick={handleShareResult}
              disabled={sharing}
            >
              {sharing ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Share2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              Share this result
            </Button>
          </motion.div>
        )}
      </div>

      {/* Query Input */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about the company... (e.g. 'What are our Q4 sales targets?')"
              className="min-h-[60px] resize-none border-slate-700 bg-slate-800/50 text-sm text-slate-200 placeholder:text-slate-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!query.trim() || isLoading}
              className="bg-violet-600 text-white hover:bg-violet-700"
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-3.5 w-3.5" />
              )}
              Send Query
            </Button>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-slate-700 text-xs text-slate-400"
                onClick={() => setShowPresets(!showPresets)}
              >
                Preset Queries
                <ChevronDown className={cn('ml-1 h-3 w-3 transition-transform', showPresets && 'rotate-180')} />
              </Button>
              <AnimatePresence>
                {showPresets && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowPresets(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute right-0 top-full z-40 mt-1 w-80 rounded-lg border border-slate-700 bg-slate-900 p-1.5 shadow-xl"
                    >
                      {presetQueries.map((pq) => (
                        <button
                          key={pq}
                          onClick={() => handlePreset(pq)}
                          className="w-full rounded-md px-3 py-2 text-left text-xs text-slate-300 transition-colors hover:bg-slate-800"
                        >
                          {pq}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] text-slate-600">Query as:</span>
          <Select
            value={currentUser.role}
            onValueChange={(value) => setCurrentRole(value as UserRole)}
          >
            <SelectTrigger className="h-7 w-[200px] border-slate-700 bg-slate-800/50 text-[10px] text-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-slate-700 bg-slate-900">
              {(
                [
                  'ceo',
                  'sales_rep',
                  'support_analyst',
                  'external_partner',
                ] as UserRole[]
              ).map((role) => (
                <SelectItem key={role} value={role} className="text-xs">
                  {roleLabels[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Split Panels */}
      <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left — Insecure */}
        <div className="min-h-[400px]">
          <InsecureRAG response={insecureResult} isLoading={isLoading} />
        </div>

        {/* Center divider */}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 hidden -translate-x-1/2 lg:flex">
          <div className="relative flex flex-col items-center">
            <div className="h-full w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
            <div className="absolute top-1/2 -translate-y-1/2">
              <div className="rounded-full border border-slate-700 bg-slate-900 p-2">
                <Shield className="h-4 w-4 text-violet-400" />
              </div>
            </div>
            {/* Leaks prevented indicator */}
            <AnimatePresence>
              {showCelebrate && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute top-1/2 mt-8 -translate-y-1/2 whitespace-nowrap rounded-full border border-emerald-500/30 bg-emerald-500/20 px-3 py-1 shadow-lg"
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-emerald-400" />
                    <span className="text-[11px] font-medium text-emerald-400">
                      {insecureResult?.leakedDocIds.length} leak(s) prevented!
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right — Secure */}
        <div className="min-h-[400px]">
          <SecureRAG response={secureResult} isLoading={isLoading} />
        </div>
      </div>

      {/* Diff Highlighter */}
      <DiffHighlighter insecure={insecureResult} secure={secureResult} />
    </div>
  );
}
