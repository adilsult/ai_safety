'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RedTeamResult } from '@/lib/types';
import Link from 'next/link';

interface ResultBadgeProps {
  result: RedTeamResult;
}

export function ResultBadge({ result }: ResultBadgeProps) {
  const isBlocked = result.status === 'blocked';
  const isPartial = result.status === 'partial';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
    >
      {isBlocked ? (
        // ── BLOCKED ──────────────────────
        <div className="space-y-3">
          <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600/10 to-emerald-500/5 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">ATTACK BLOCKED</span>
            </div>
            <p className="mt-2 text-xs text-emerald-300/80">
              SecureRAG detected and neutralized this attack
            </p>
          </div>

          {/* Detection details */}
          <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Detection Details
            </p>
            <div className="mt-2 space-y-1.5">
              {result.bypassedPermissions.length > 0 ? (
                result.bypassedPermissions.map((bp, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs text-slate-300">{bp}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-slate-300">
                    Attack pattern detected and blocked at permission layer
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Safe response */}
          <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Safe Response Delivered
            </p>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-400">
              {result.response}
            </p>
          </div>
        </div>
      ) : isPartial ? (
        // ── PARTIAL BYPASS ───────────────
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-600/10 to-amber-500/5 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-bold text-amber-400">PARTIAL BYPASS</span>
            </div>
            <p className="mt-2 text-xs text-amber-300/80">
              This attack succeeded but was logged and flagged in real-time
            </p>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs text-amber-300">
              The query was processed but all access was captured in the audit trail. This demonstrates why comprehensive logging is critical — even when prevention fails, detection ensures accountability.
            </p>
            <Link
              href="/audit"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-400 transition-colors hover:text-amber-300"
            >
              This is why audit logging matters
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Response (Logged)
            </p>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-400">
              {result.response}
            </p>
          </div>

          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-400">
            Risk Level: {result.riskLevel.toUpperCase()}
          </Badge>
        </div>
      ) : (
        // ── QUERY PROCESSED ──────────────
        <div className="space-y-3">
          <div className="rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-600/10 to-blue-500/5 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-blue-400" />
              <span className="text-sm font-bold text-blue-400">QUERY PROCESSED</span>
            </div>
            <p className="mt-2 text-xs text-blue-300/80">
              Prompt was processed normally with no sensitive leakage detected
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Validation Outcome
            </p>
            <div className="mt-2 space-y-1.5">
              {result.bypassedPermissions.map((bp, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-blue-400" />
                  <span className="text-xs text-slate-300">{bp}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Response
            </p>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-400">
              {result.response}
            </p>
          </div>

          <Link
            href="/audit"
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
          >
            Review in Audit Log
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </motion.div>
  );
}
