'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  FileWarning,
  KeyRound,
  SearchX,
} from 'lucide-react';
import { AuditEntry } from '@/lib/types';
import { documents, roleColors, roleLabels } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

interface AuditTableProps {
  entries: AuditEntry[];
  hasAnyEntries?: boolean;
  isLoading?: boolean;
  highlightedEntryIds?: Set<string>;
  onSelectEntry: (entry: AuditEntry) => void;
}

const PAGE_SIZE = 10;

const statusBadgeClass: Record<AuditEntry['status'], string> = {
  leakage_detected: 'bg-red-500/15 text-red-400 border-red-500/30',
  blocked: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  partial_block: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  clean: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

const statusLabel: Record<AuditEntry['status'], string> = {
  leakage_detected: 'LEAKED',
  blocked: 'BLOCKED',
  partial_block: 'PARTIAL',
  clean: 'CLEAN',
};

const statusRowAccent: Record<AuditEntry['status'], string> = {
  leakage_detected: 'border-l-2 border-l-red-500/70',
  blocked: 'border-l-2 border-l-emerald-500/70',
  partial_block: 'border-l-2 border-l-amber-500/70',
  clean: 'border-l-2 border-l-blue-500/40',
};

function formatRelativeTime(value: Date | string): string {
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.max(1, Math.floor(diffMs / 1000));

  if (diffSec < 60) return `${diffSec} sec ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
}

function riskColor(score: number): string {
  if (score >= 70) return 'bg-red-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function truncateQuery(query: string): string {
  return query.length > 60 ? `${query.slice(0, 60)}...` : query;
}

function renderLeakedItemLabel(item: string): string {
  if (!item.startsWith('doc-')) return item.replace(/_/g, ' ');
  const matched = documents.find((doc) => doc.id === item);
  return matched ? matched.title : item;
}

export function AuditTable({
  entries,
  hasAnyEntries = true,
  isLoading = false,
  highlightedEntryIds,
  onSelectEntry,
}: AuditTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageEntries = useMemo(
    () => entries.slice(pageStart, pageStart + PAGE_SIZE),
    [entries, pageStart]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [entries]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Audit Events</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Showing {entries.length} record{entries.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 px-4 py-5">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="h-9 animate-pulse rounded-md bg-gradient-to-r from-slate-900 via-slate-800/60 to-slate-900"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        hasAnyEntries ? (
        <div className="flex items-center justify-center gap-2 px-4 py-16 text-slate-500">
          <SearchX className="h-4 w-4" />
          <p className="text-sm">No audit rows match your current filters.</p>
        </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-slate-500">
            <SearchX className="h-6 w-6" />
            <p className="text-sm">No queries yet. Go to RAG Playground.</p>
            <Link
              href="/playground"
              className="text-xs font-medium text-violet-400 hover:text-violet-300"
            >
              Open Playground →
            </Link>
          </div>
        )
      ) : (
        <>
          <TooltipProvider>
            <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="h-10 px-3 text-[10px] uppercase tracking-wider text-slate-500">
                    Timestamp
                  </TableHead>
                  <TableHead className="h-10 px-3 text-[10px] uppercase tracking-wider text-slate-500">
                    User
                  </TableHead>
                  <TableHead className="h-10 px-3 text-[10px] uppercase tracking-wider text-slate-500">
                    Role
                  </TableHead>
                  <TableHead className="h-10 px-3 text-[10px] uppercase tracking-wider text-slate-500">
                    Query
                  </TableHead>
                  <TableHead className="h-10 px-3 text-[10px] uppercase tracking-wider text-slate-500">
                    Mode
                  </TableHead>
                  <TableHead className="h-10 px-3 text-[10px] uppercase tracking-wider text-slate-500">
                    Leaked Items
                  </TableHead>
                  <TableHead className="h-10 px-3 text-[10px] uppercase tracking-wider text-slate-500">
                    Risk
                  </TableHead>
                  <TableHead className="h-10 px-3 text-[10px] uppercase tracking-wider text-slate-500">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {pageEntries.map((entry) => {
                  const highlight = highlightedEntryIds?.has(entry.id);
                  return (
                    <TableRow
                      key={entry.id}
                      className={cn(
                        'cursor-pointer border-slate-800/70 hover:bg-slate-800/40',
                        statusRowAccent[entry.status],
                        highlight && 'bg-violet-500/10 animate-pulse'
                      )}
                      onClick={() => onSelectEntry(entry)}
                    >
                      <TableCell className="px-3 py-2 text-xs text-slate-400">
                        {formatRelativeTime(entry.timestamp)}
                      </TableCell>

                      <TableCell className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-[10px] font-semibold text-slate-200">
                            {entry.userName
                              .split(' ')
                              .map((part) => part[0])
                              .join('')
                              .slice(0, 2)}
                          </div>
                          <span className="text-xs text-slate-200">{entry.userName}</span>
                        </div>
                      </TableCell>

                      <TableCell className="px-3 py-2">
                        <Badge
                          variant="outline"
                          className={cn('text-[10px]', roleColors[entry.userRole])}
                        >
                          {roleLabels[entry.userRole]}
                        </Badge>
                      </TableCell>

                      <TableCell className="max-w-[260px] px-3 py-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help text-xs text-slate-300">
                              {truncateQuery(entry.query)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm border border-slate-700 bg-slate-900 text-slate-100">
                            {entry.query}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      <TableCell className="px-3 py-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px]',
                            entry.mode === 'insecure'
                              ? 'border-red-500/30 bg-red-500/10 text-red-400'
                              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          )}
                        >
                          {entry.mode === 'insecure' ? 'Insecure' : 'Secure'}
                        </Badge>
                      </TableCell>

                      <TableCell className="px-3 py-2">
                        {entry.leakedItems.length === 0 ? (
                          <span className="text-xs text-slate-600">-</span>
                        ) : (
                          <div className="flex items-center gap-1">
                            {entry.leakedItems.slice(0, 3).map((item) => {
                              const isDoc = item.startsWith('doc-');
                              const Icon = isDoc ? FileWarning : KeyRound;
                              return (
                                <Tooltip key={`${entry.id}-${item}`}>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-300">
                                      <Icon className="h-2.5 w-2.5" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm border border-slate-700 bg-slate-900 text-slate-100">
                                    {renderLeakedItemLabel(item)}
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                            {entry.leakedItems.length > 3 && (
                              <span className="text-[10px] text-slate-500">
                                +{entry.leakedItems.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="px-3 py-2">
                        <div className="flex min-w-[120px] items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-800">
                            <div
                              className={cn('h-full rounded-full', riskColor(entry.riskScore))}
                              style={{ width: `${Math.min(100, Math.max(0, entry.riskScore))}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-300">
                            {entry.riskScore}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="px-3 py-2">
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] font-semibold', statusBadgeClass[entry.status])}
                        >
                          {statusLabel[entry.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TooltipProvider>

          <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3">
            <p className="text-xs text-slate-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="mr-1 h-3 w-3" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        </>
      )}

      <div className="border-t border-slate-800 px-4 py-2 text-[10px] text-slate-600">
        <AlertTriangle className="mr-1 inline h-3 w-3" />
        Click any row to inspect permission analysis and compliance details.
      </div>
    </div>
  );
}
