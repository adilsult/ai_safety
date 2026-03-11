'use client';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AuditEntry } from '@/lib/types';
import { documents, roleLabels } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Clock3,
  FileLock2,
  FileSearch,
  ShieldCheck,
  ShieldX,
  TriangleAlert,
} from 'lucide-react';

interface AuditDetailModalProps {
  entry: AuditEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TimelineStep {
  name: string;
  durationMs: number;
  detail: string;
  status: 'success' | 'warning' | 'blocked';
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function buildTimeline(entry: AuditEntry): TimelineStep[] {
  const seed = entry.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const fromRange = (index: number, min: number, max: number) =>
    min + ((seed * (index + 13)) % (max - min + 1));

  const queryReceived = fromRange(1, 8, 22);
  const permissionCheck = fromRange(2, 45, 160);
  const contextFiltering = fromRange(3, 70, 240);
  const responseGeneration =
    entry.status === 'blocked' ? fromRange(4, 85, 170) : fromRange(4, 140, 420);

  return [
    {
      name: 'Query received',
      durationMs: queryReceived,
      detail: 'Request parsed and user identity resolved.',
      status: 'success',
    },
    {
      name: 'Permission check',
      durationMs: permissionCheck,
      detail:
        entry.status === 'blocked'
          ? 'Escalation/injection markers detected in prompt.'
          : 'RBAC check completed against role and document scope.',
      status: entry.status === 'blocked' ? 'blocked' : 'success',
    },
    {
      name: 'Context filtering',
      durationMs: contextFiltering,
      detail:
        entry.leakedItems.length > 0
          ? 'Restricted docs and sensitive fields were identified for filtering.'
          : 'No restricted context detected for this query.',
      status: entry.leakedItems.length > 0 ? 'warning' : 'success',
    },
    {
      name: 'Response generated',
      durationMs: responseGeneration,
      detail:
        entry.status === 'clean'
          ? 'Safe response produced and logged.'
          : 'Response returned with protective controls and full audit metadata.',
      status: entry.status === 'leakage_detected' ? 'warning' : 'success',
    },
  ];
}

function complianceNote(entry: AuditEntry) {
  if (entry.status === 'leakage_detected') {
    return {
      severity: 'high',
      text: 'This event would be reportable under SOC 2 Type II and GDPR Article 32 due to confirmed exposure.',
      action:
        'Recommended action: trigger incident response, revoke overbroad access scopes, and run a targeted red-team replay for affected docs.',
    };
  }

  if (entry.status === 'partial_block') {
    return {
      severity: 'medium',
      text: 'This event indicates partial control failure; reportable in internal controls review and risk register.',
      action:
        'Recommended action: tighten prompt-injection detection and verify post-generation leakage scanning for this query pattern.',
    };
  }

  if (entry.status === 'blocked') {
    return {
      severity: 'low',
      text: 'Attack pattern was blocked before data exposure. Event is audit-relevant but not a confirmed breach.',
      action:
        'Recommended action: keep monitoring repeated attempts from the same role/session and tune anomaly thresholds.',
    };
  }

  return {
    severity: 'info',
    text: 'No leakage detected. This event contributes positive evidence for SOC 2 and GDPR access-control controls.',
    action:
      'Recommended action: maintain retention policy and periodically sample clean events for quality assurance.',
  };
}

export function AuditDetailModal({
  entry,
  open,
  onOpenChange,
}: AuditDetailModalProps) {
  if (!entry) return null;

  const leakedDocIds = entry.leakedItems.filter((item) => item.startsWith('doc-'));
  const leakedFields = entry.leakedItems.filter((item) => !item.startsWith('doc-'));

  const insecureDocIds = Array.from(new Set([...entry.sourceDocIds, ...leakedDocIds]));
  const secureDocIds =
    entry.mode === 'secure'
      ? entry.sourceDocIds
      : entry.sourceDocIds.filter((id) => !leakedDocIds.includes(id));
  const blockedDocIds = leakedDocIds.filter((id) => !secureDocIds.includes(id));

  const timeline = buildTimeline(entry);
  const compliance = complianceNote(entry);

  const getDocumentTitle = (docId: string) => {
    const doc = documents.find((item) => item.id === docId);
    return doc ? doc.title : docId;
  };

  const blockedReason = (docId: string) => {
    const doc = documents.find((item) => item.id === docId);
    if (!doc) return 'Blocked by policy';
    const roles = doc.allowedRoles.map((role) => roleLabels[role]).join(', ');
    return `${doc.securityLevel.replace('_', ' ')} requires: ${roles}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto border-slate-700 bg-slate-950 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-left text-lg text-white">
            Audit Event Detail
          </DialogTitle>
          <DialogDescription className="text-left text-slate-400">
            Full permission trace for this query and response lifecycle.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="text-sm font-semibold text-white">Query Details</h3>
            <p className="mt-2 text-sm text-slate-200">{entry.query}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span>{toDate(entry.timestamp).toLocaleString()}</span>
              <span className="text-slate-600">|</span>
              <span>{entry.userName}</span>
              <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-300">
                {roleLabels[entry.userRole]}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px]',
                  entry.mode === 'secure'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-red-500/30 bg-red-500/10 text-red-400'
                )}
              >
                {entry.mode === 'secure' ? 'Secure Mode' : 'Insecure Mode'}
              </Badge>
            </div>
          </section>

          <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="text-sm font-semibold text-white">Permission Analysis</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Insecure RAG Retrieved
                </p>
                <div className="mt-2 space-y-1.5">
                  {insecureDocIds.length === 0 ? (
                    <p className="text-xs text-slate-600">-</p>
                  ) : (
                    insecureDocIds.map((docId) => (
                      <p key={docId} className="text-xs text-slate-300">
                        {getDocumentTitle(docId)}
                      </p>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
                  SecureRAG Retrieved
                </p>
                <div className="mt-2 space-y-1.5">
                  {secureDocIds.length === 0 ? (
                    <p className="text-xs text-slate-600">No permitted documents</p>
                  ) : (
                    secureDocIds.map((docId) => (
                      <p key={docId} className="text-xs text-emerald-300">
                        {getDocumentTitle(docId)}
                      </p>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-md border border-red-500/20 bg-red-500/5 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-red-400">
                  Blocked Documents
                </p>
                <div className="mt-2 space-y-2">
                  {blockedDocIds.length === 0 ? (
                    <p className="text-xs text-slate-600">-</p>
                  ) : (
                    blockedDocIds.map((docId) => (
                      <div key={docId}>
                        <p className="text-xs text-red-300">{getDocumentTitle(docId)}</p>
                        <p className="text-[10px] text-red-400/70">{blockedReason(docId)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          {(leakedDocIds.length > 0 || leakedFields.length > 0) && (
            <section className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <h3 className="text-sm font-semibold text-white">Leaked Data Summary</h3>
              <div className="mt-3 space-y-2">
                {leakedDocIds.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-red-300">Leaked documents</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {leakedDocIds.map((docId) => (
                        <span
                          key={docId}
                          className="rounded bg-red-500/15 px-2 py-0.5 text-[11px] text-red-300"
                        >
                          {getDocumentTitle(docId)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {leakedFields.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-red-300">Sensitive fields exposed</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {leakedFields.map((field) => (
                        <span
                          key={field}
                          className="rounded bg-red-500/15 px-2 py-0.5 text-[11px] text-red-300"
                        >
                          {field.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-xs text-emerald-400">
                  These values were NOT present in SecureRAG response.
                </p>
              </div>
            </section>
          )}

          <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="text-sm font-semibold text-white">Timeline</h3>
            <div className="mt-3 space-y-3">
              {timeline.map((step) => (
                <div key={step.name} className="flex gap-3">
                  <div className="mt-0.5">
                    {step.status === 'success' && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    )}
                    {step.status === 'warning' && (
                      <TriangleAlert className="h-4 w-4 text-amber-400" />
                    )}
                    {step.status === 'blocked' && (
                      <ShieldX className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-slate-200">{step.name}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock3 className="h-3 w-3" />
                        {step.durationMs}ms
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section
            className={cn(
              'rounded-lg border p-4',
              compliance.severity === 'high' &&
                'border-red-500/20 bg-red-500/5 text-red-200',
              compliance.severity === 'medium' &&
                'border-amber-500/20 bg-amber-500/5 text-amber-200',
              compliance.severity === 'low' &&
                'border-emerald-500/20 bg-emerald-500/5 text-emerald-200',
              compliance.severity === 'info' &&
                'border-blue-500/20 bg-blue-500/5 text-blue-200'
            )}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <h3 className="text-sm font-semibold">Compliance Note</h3>
            </div>
            <p className="mt-2 text-xs">{compliance.text}</p>
            <p className="mt-1 text-xs opacity-90">{compliance.action}</p>
          </section>

          <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3 text-[10px] text-slate-600">
            <FileSearch className="mr-1 inline h-3 w-3" />
            Event integrity includes timestamp, role context, source documents and risk score.
            <FileLock2 className="mx-1 inline h-3 w-3" />
            Hash-chain retention window: 90 days.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
