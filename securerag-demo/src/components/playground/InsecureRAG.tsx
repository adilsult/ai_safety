'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileWarning, XCircle } from 'lucide-react';
import { RAGResponse } from '@/lib/types';
import { documents } from '@/lib/mock-data';

interface InsecureRAGProps {
  response: RAGResponse | null;
  isLoading: boolean;
}

function StreamingText({ text, speed = 25 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const words = text.split(' ');
    const timer = setInterval(() => {
      if (i < words.length) {
        setDisplayed((prev) => (prev ? prev + ' ' + words[i] : words[i]));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return <>{displayed}</>;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3 py-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <div
            className="h-3 animate-pulse rounded bg-red-500/10"
            style={{ width: `${85 - i * 10}%`, animationDelay: `${i * 100}ms` }}
          />
        </div>
      ))}
      <p className="mt-2 text-xs text-red-400/60">Retrieving all documents without permission checks...</p>
    </div>
  );
}

export function InsecureRAG({ response, isLoading }: InsecureRAGProps) {
  const leakedDocs = response
    ? documents.filter((d) => response.leakedDocIds.includes(d.id))
    : [];

  return (
    <div className="flex h-full flex-col rounded-xl border border-red-500/20 bg-slate-900/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600/20 to-red-500/10 border-b border-red-500/20 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-400" />
            <span className="text-sm font-semibold text-red-300">Insecure RAG</span>
          </div>
          <Badge variant="outline" className="border-red-500/30 bg-red-500/15 text-[9px] text-red-400">
            VULNERABLE
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && <LoadingSkeleton />}

        {!isLoading && !response && (
          <div className="flex h-full items-center justify-center py-12">
            <p className="text-xs text-slate-600">Send a query to see the insecure response</p>
          </div>
        )}

        {!isLoading && response && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Answer */}
            <div className="rounded-lg bg-slate-800/50 p-3">
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-300">
                <StreamingText text={response.answer} speed={20} />
              </p>
            </div>

            {/* Leaked Documents */}
            {leakedDocs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="rounded-lg border border-red-500/20 bg-red-500/5 p-3"
              >
                <div className="flex items-center gap-1.5 text-xs font-medium text-red-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Leaked Documents ({leakedDocs.length})
                </div>
                <div className="mt-2 space-y-1.5">
                  {leakedDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-2">
                      <FileWarning className="h-3 w-3 text-red-500/60" />
                      <span className="text-[11px] text-red-300">{doc.title}</span>
                      <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-[8px] text-red-400">
                        {doc.securityLevel.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Exposed Fields */}
            {response.leakedFields.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="rounded-lg border border-red-500/20 bg-red-500/5 p-3"
              >
                <p className="text-xs font-medium text-red-400">
                  Exposed Sensitive Data
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {response.leakedFields.map((f) => (
                    <span key={f} className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] text-red-300">
                      {f.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Risk Score */}
            {response.riskScore > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3"
              >
                <span className="text-[11px] text-slate-500">Risk Score</span>
                <span className="text-lg font-bold text-red-400">{response.riskScore}</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-red-500/10 px-4 py-2">
        <p className="text-[10px] text-red-400/50">No permission checks performed</p>
      </div>
    </div>
  );
}
