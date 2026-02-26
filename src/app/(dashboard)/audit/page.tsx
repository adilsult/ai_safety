'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ScrollText,
  Download,
  Search,
  Activity,
  Ban,
  ShieldCheck,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { AuditEntry, UserRole } from '@/lib/types';
import { mockAuditEntries } from '@/lib/mock-audit-data';
import { useAuditStore } from '@/store/useAuditStore';
import { AuditTable } from '@/components/audit/AuditTable';
import { AuditDetailModal } from '@/components/audit/AuditDetailModal';
import { toast } from 'sonner';

type DatePreset = 'today' | 'last_7_days' | 'last_30_days';
type StatusFilter = 'all' | 'leaked' | 'blocked' | 'partial' | 'clean';
type RoleFilter = 'all' | UserRole;

function toTimestamp(value: Date | string): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

export default function AuditPage() {
  const { entries, initialized, initFromStorage } = useAuditStore();

  const [datePreset, setDatePreset] = useState<DatePreset>('last_7_days');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);
  const [tableLoading, setTableLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [livePulse, setLivePulse] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());

  const hasBootstrappedRef = useRef(false);
  const seenStoreIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  useEffect(() => {
    const timer = setTimeout(() => setTableLoading(false), 550);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const storeIds = entries.map((entry) => entry.id);

    if (!hasBootstrappedRef.current) {
      hasBootstrappedRef.current = true;
      seenStoreIdsRef.current = new Set(storeIds);
      return;
    }

    const newIds = storeIds.filter((id) => !seenStoreIdsRef.current.has(id));
    if (newIds.length === 0) return;

    for (const id of newIds) {
      seenStoreIdsRef.current.add(id);
    }

    setHighlightedIds((prev) => {
      const next = new Set(prev);
      for (const id of newIds) next.add(id);
      return next;
    });
    setLivePulse(true);

    const highlightTimer = setTimeout(() => {
      setHighlightedIds((prev) => {
        const next = new Set(prev);
        for (const id of newIds) next.delete(id);
        return next;
      });
    }, 3000);

    const liveTimer = setTimeout(() => {
      setLivePulse(false);
    }, 4000);

    return () => {
      clearTimeout(highlightTimer);
      clearTimeout(liveTimer);
    };
  }, [entries, initialized]);

  const allEntries = useMemo(() => {
    const map = new Map<string, AuditEntry>();

    for (const entry of mockAuditEntries) map.set(entry.id, entry);
    for (const entry of entries) map.set(entry.id, entry);

    return Array.from(map.values()).sort(
      (a, b) => toTimestamp(b.timestamp) - toTimestamp(a.timestamp)
    );
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return allEntries.filter((entry) => {
      const ts = toTimestamp(entry.timestamp);

      const matchesDate =
        datePreset === 'today'
          ? ts >= todayStart.getTime()
          : datePreset === 'last_7_days'
            ? ts >= now - 7 * 24 * 60 * 60 * 1000
            : ts >= now - 30 * 24 * 60 * 60 * 1000;

      const matchesRole =
        roleFilter === 'all' ? true : entry.userRole === roleFilter;

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'leaked'
            ? entry.status === 'leakage_detected'
            : statusFilter === 'blocked'
              ? entry.status === 'blocked'
              : statusFilter === 'partial'
                ? entry.status === 'partial_block'
                : entry.status === 'clean';

      const searchNeedle = search.trim().toLowerCase();
      const matchesSearch =
        searchNeedle.length === 0
          ? true
          : entry.query.toLowerCase().includes(searchNeedle) ||
            entry.userName.toLowerCase().includes(searchNeedle);

      return matchesDate && matchesRole && matchesStatus && matchesSearch;
    });
  }, [allEntries, datePreset, roleFilter, statusFilter, search]);

  const stats = useMemo(() => {
    const totalQueries = filteredEntries.length;
    const leakageEvents = filteredEntries.filter(
      (entry) =>
        entry.status === 'leakage_detected' || entry.status === 'partial_block'
    ).length;
    const blockedAttempts = filteredEntries.filter(
      (entry) => entry.status === 'blocked'
    ).length;
    const cleanQueries = filteredEntries.filter(
      (entry) => entry.status === 'clean'
    ).length;

    return { totalQueries, leakageEvents, blockedAttempts, cleanQueries };
  }, [filteredEntries]);

  const handleExport = () => {
    if (exporting) return;
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      toast.success('CSV export generated', {
        description: 'Audit data export is ready (demo).',
      });
    }, 700);
  };

  const openDetails = (entry: AuditEntry) => {
    setSelectedEntry(entry);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <ScrollText className="h-6 w-6 text-violet-400" />
            <h1 className="text-2xl font-bold text-slate-100">Audit Log</h1>
            <Badge
              variant="outline"
              className="border-violet-500/30 bg-violet-500/10 text-xs text-violet-400"
            >
              Full Trail
            </Badge>
            <Badge
              variant="outline"
              className={`border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-400 ${
                livePulse ? 'animate-pulse' : ''
              }`}
            >
              <span className="mr-1.5 inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              Live
            </Badge>
          </div>
          <p className="text-sm text-slate-400">
            Complete trail of every query, blocked action, and detected leakage.
          </p>
        </div>
        <Button
          variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {exporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500">Total Queries</p>
          <p className="mt-1 text-2xl font-bold text-white">{stats.totalQueries}</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-xs text-red-300">Leakage Events</p>
          <p className="mt-1 text-2xl font-bold text-red-400">{stats.leakageEvents}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <p className="text-xs text-emerald-300">Blocked Attempts</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{stats.blockedAttempts}</p>
        </div>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="text-xs text-blue-300">Clean Queries</p>
          <p className="mt-1 text-2xl font-bold text-blue-400">{stats.cleanQueries}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <div>
            <p className="mb-1.5 text-[10px] uppercase tracking-wide text-slate-500">
              Date Range
            </p>
            <Select
              value={datePreset}
              onValueChange={(value) => setDatePreset(value as DatePreset)}
            >
              <SelectTrigger className="border-slate-700 bg-slate-800/40 text-xs text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-900">
                <SelectItem value="today" className="text-xs">
                  Today
                </SelectItem>
                <SelectItem value="last_7_days" className="text-xs">
                  Last 7 days
                </SelectItem>
                <SelectItem value="last_30_days" className="text-xs">
                  Last 30 days
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="mb-1.5 text-[10px] uppercase tracking-wide text-slate-500">
              Role
            </p>
            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value as RoleFilter)}
            >
              <SelectTrigger className="border-slate-700 bg-slate-800/40 text-xs text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-900">
                <SelectItem value="all" className="text-xs">
                  All Roles
                </SelectItem>
                <SelectItem value="ceo" className="text-xs">
                  CEO
                </SelectItem>
                <SelectItem value="sales_rep" className="text-xs">
                  Sales
                </SelectItem>
                <SelectItem value="support_analyst" className="text-xs">
                  Support
                </SelectItem>
                <SelectItem value="external_partner" className="text-xs">
                  Partner
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="mb-1.5 text-[10px] uppercase tracking-wide text-slate-500">
              Status
            </p>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger className="border-slate-700 bg-slate-800/40 text-xs text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-900">
                <SelectItem value="all" className="text-xs">
                  All Statuses
                </SelectItem>
                <SelectItem value="leaked" className="text-xs">
                  Leaked
                </SelectItem>
                <SelectItem value="blocked" className="text-xs">
                  Blocked
                </SelectItem>
                <SelectItem value="partial" className="text-xs">
                  Partial
                </SelectItem>
                <SelectItem value="clean" className="text-xs">
                  Clean
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2">
            <p className="mb-1.5 text-[10px] uppercase tracking-wide text-slate-500">
              Search Query
            </p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by query text or user..."
                className="border-slate-700 bg-slate-800/40 pl-8 text-xs text-slate-200 placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <div className="xl:col-span-3">
          <AuditTable
            entries={filteredEntries}
            hasAnyEntries={allEntries.length > 0}
            isLoading={tableLoading}
            highlightedEntryIds={highlightedIds}
            onSelectEntry={openDetails}
          />
        </div>

        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
        >
          <h3 className="text-sm font-semibold text-white">Audit Health</h3>
          <p className="mt-1 text-xs text-slate-500">
            Compliance posture for current logging pipeline
          </p>

          <div className="mt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2">
              <span className="text-slate-400">SOC 2</span>
              <span className="text-emerald-400">Covered</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2">
              <span className="text-slate-400">GDPR</span>
              <span className="text-emerald-400">Covered</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2">
              <span className="text-slate-400">HIPAA</span>
              <span className="text-amber-400">Partial</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2">
              <span className="text-slate-400">ISO 27001</span>
              <span className="text-emerald-400">Covered</span>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              Audit log retention: 90 days
            </div>
            <div className="mt-2 flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Tamper-evident: Yes (hash chain)
            </div>
            <div className="mt-2 flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              Export formats: JSON, CSV, SIEM-compatible
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Ban className="h-3.5 w-3.5 text-slate-500" />
              Undetected bypasses: 0 in current dataset
            </div>
          </div>
        </motion.aside>
      </div>

      <AuditDetailModal
        entry={selectedEntry}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
