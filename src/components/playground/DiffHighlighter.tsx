'use client';

import { motion } from 'framer-motion';
import { RAGResponse } from '@/lib/types';
import { Shield, ArrowRight } from 'lucide-react';

interface DiffHighlighterProps {
  insecure: RAGResponse | null;
  secure: RAGResponse | null;
}

export function DiffHighlighter({ insecure, secure }: DiffHighlighterProps) {
  if (!insecure || !secure) return null;

  const leakedCount = insecure.leakedDocIds.length;
  const fieldCount = insecure.leakedFields.length;

  if (leakedCount === 0 && fieldCount === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4"
      >
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-400" />
          <p className="text-sm text-emerald-400">No leakage detected — query within permission scope</p>
        </div>
      </motion.div>
    );
  }

  // Build diff items from leaked fields
  const diffs = insecure.leakedFields.map((field) => ({
    removed: field.replace(/_/g, ' '),
    replacement: '[REDACTED]',
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5 }}
      className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
    >
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">
          What SecureRAG removed from this response
        </h3>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {leakedCount} document(s) blocked &middot; {fieldCount} sensitive field(s) redacted
      </p>

      <div className="mt-4 space-y-2">
        {diffs.slice(0, 6).map((diff, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.7 + i * 0.1 }}
            className="flex items-center gap-3 rounded-lg bg-slate-800/50 px-3 py-2"
          >
            <span className="rounded bg-red-500/15 px-2 py-0.5 text-[11px] text-red-400 line-through">
              {diff.removed}
            </span>
            <ArrowRight className="h-3 w-3 text-slate-600" />
            <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-400">
              {diff.replacement}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
