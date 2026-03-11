'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, CheckCircle2, Lock, FileCheck } from 'lucide-react';
import { RAGResponse } from '@/lib/types';
import { documents } from '@/lib/mock-data';

interface SecureRAGProps {
  response: RAGResponse | null;
  isLoading: boolean;
}

function StreamingText({ text, speed = 30 }: { text: string; speed?: number }) {
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

const loadingSteps = [
  'Checking permissions...',
  'Filtering context...',
  'Redacting sensitive fields...',
  'Generating response...',
];

function LoadingSkeleton() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => (s < loadingSteps.length - 1 ? s + 1 : s));
    }, 400);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-3 py-4">
      {loadingSteps.map((label, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: i <= step ? 1 : 0.3, x: 0 }}
          transition={{ duration: 0.3, delay: i * 0.15 }}
          className="flex items-center gap-2"
        >
          {i <= step ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <div className="h-3.5 w-3.5 rounded-full border border-slate-600" />
          )}
          <span className={`text-xs ${i <= step ? 'text-emerald-400' : 'text-slate-600'}`}>
            {label}
          </span>
        </motion.div>
      ))}
      <div className="mt-2 space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-3 animate-pulse rounded bg-emerald-500/10"
            style={{ width: `${80 - i * 15}%`, animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SecureRAG({ response, isLoading }: SecureRAGProps) {
  const accessedDocs = response
    ? documents.filter((d) => response.sourceDocs.includes(d.id))
    : [];

  // Blocked docs = insecure would have used, but secure filtered out
  const blockedDocIds = response
    ? documents
        .filter((d) => !response.sourceDocs.includes(d.id))
        .filter(
          (d) =>
            d.securityLevel === 'top_secret' || d.securityLevel === 'confidential'
        )
    : [];

  return (
    <div className="flex h-full flex-col rounded-xl border border-emerald-500/20 bg-slate-900/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 border-b border-emerald-500/20 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-300">SecureRAG Auditor</span>
          </div>
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/15 text-[9px] text-emerald-400">
            PROTECTED
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && <LoadingSkeleton />}

        {!isLoading && !response && (
          <div className="flex h-full items-center justify-center py-12">
            <p className="text-xs text-slate-600">Send a query to see the secure response</p>
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
                <StreamingText text={response.answer} speed={25} />
              </p>
            </div>

            {/* Accessed Documents */}
            {accessedDocs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"
              >
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                  <FileCheck className="h-3.5 w-3.5" />
                  Documents Used ({accessedDocs.length})
                </div>
                <div className="mt-2 space-y-1.5">
                  {accessedDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500/60" />
                      <span className="text-[11px] text-emerald-300">{doc.title}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Blocked Resources */}
            {blockedDocIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="rounded-lg border border-slate-700 bg-slate-800/30 p-3"
              >
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <Lock className="h-3.5 w-3.5" />
                  Blocked Resources ({blockedDocIds.length})
                </div>
                <div className="mt-2 space-y-1.5">
                  {blockedDocIds.slice(0, 4).map((doc) => (
                    <div key={doc.id} className="flex items-center gap-2">
                      <Lock className="h-3 w-3 text-slate-600" />
                      <span className="text-[11px] text-slate-500 line-through">{doc.title}</span>
                      <Badge variant="outline" className="border-slate-700 text-[8px] text-slate-500">
                        {doc.securityLevel.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Redacted fields count */}
            {response.blocked && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3"
              >
                <p className="text-[11px] text-amber-400">
                  Query blocked due to detected security threat
                </p>
              </motion.div>
            )}

            {/* Risk Score */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3"
            >
              <span className="text-[11px] text-slate-500">Risk Score</span>
              <span className="text-lg font-bold text-emerald-400">{response.riskScore}</span>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-emerald-500/10 px-4 py-2">
        <p className="text-[10px] text-emerald-400/50">All responses permission-verified</p>
      </div>
    </div>
  );
}
