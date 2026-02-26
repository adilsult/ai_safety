'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  ShieldAlert,
  AlertTriangle,
  FileWarning,
  Users,
  RefreshCw,
  Download,
  Shield,
  Loader2,
} from 'lucide-react';
import { RiskScoreCard } from '@/components/dashboard/RiskScoreCard';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const LeakageHeatmap = dynamic(
  () => import('@/components/dashboard/LeakageHeatmap').then((mod) => mod.LeakageHeatmap),
  {
    loading: () => (
      <div className="h-[340px] animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
    ),
  }
);
const RoleRiskChart = dynamic(
  () => import('@/components/dashboard/RoleRiskChart').then((mod) => mod.RoleRiskChart),
  {
    loading: () => (
      <div className="h-[340px] animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
    ),
  }
);
const RecentAlerts = dynamic(
  () => import('@/components/dashboard/RecentAlerts').then((mod) => mod.RecentAlerts),
  {
    loading: () => (
      <div className="h-[260px] animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
    ),
  }
);

const securityPosture = [
  { label: 'Permission Enforcement', value: 23, color: 'red' as const },
  { label: 'Audit Coverage', value: 41, color: 'amber' as const },
  { label: 'Data Minimization', value: 18, color: 'red' as const },
  { label: 'Role Isolation', value: 31, color: 'amber' as const },
  { label: 'Context Sanitization', value: 12, color: 'red' as const },
];

const progressColors = {
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
};

export default function OverviewPage() {
  const { currentUser } = useAppStore();
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCardsLoading(false), 650);
    return () => clearTimeout(timer);
  }, []);

  const handleScan = useCallback(() => {
    if (scanning) return;
    setScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          toast.success('Scan complete', {
            description: 'Permission leakage baseline refreshed.',
          });
          return 100;
        }
        return prev + 2;
      });
    }, 40);
  }, [scanning]);

  const handleExport = () => {
    if (exporting) return;
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      toast.success('Report generated', {
        description: 'Export is ready for download (demo).',
      });
    }, 800);
  };

  useEffect(() => {
    const shortcutHandler = () => handleScan();
    window.addEventListener('securerag:run-scan', shortcutHandler);
    return () => window.removeEventListener('securerag:run-scan', shortcutHandler);
  }, [handleScan]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6 text-violet-400" />
          <h1 className="text-2xl font-bold text-slate-100">Risk Overview</h1>
          <Badge
            variant="outline"
            className="border-violet-500/30 bg-violet-500/10 text-xs text-violet-400"
          >
            Dashboard
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-3.5 w-3.5" />
            )}
            {exporting ? 'Generating...' : 'Export Report'}
          </Button>
          <Button
            size="sm"
            className="bg-violet-600 text-white hover:bg-violet-700"
            onClick={handleScan}
            disabled={scanning}
          >
            <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', scanning && 'animate-spin')} />
            {scanning ? 'Scanning...' : 'Run New Scan'}
          </Button>
        </div>
      </div>

      {/* Scan progress */}
      {scanning && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3"
        >
          <div className="flex items-center justify-between text-xs text-violet-400">
            <span>Scanning permission boundaries...</span>
            <span>{scanProgress}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <motion.div
              className="h-full rounded-full bg-violet-500"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </motion.div>
      )}

      {/* Current Role Indicator */}
      <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/30 px-4 py-2">
        <Shield className="h-3.5 w-3.5 text-slate-500" />
        <span className="text-xs text-slate-500">Viewing as:</span>
        <span className="text-xs font-medium text-slate-300">{currentUser.name}</span>
        <Badge variant="outline" className="border-slate-700 text-[10px] text-slate-400">
          {currentUser.role.replace('_', ' ')}
        </Badge>
      </div>

      {/* KPI Cards */}
      {cardsLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-[170px] animate-pulse rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900/70 via-slate-800/40 to-slate-900/70"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <RiskScoreCard
            title="Overall Leakage Risk"
            value={73}
            unit="/100"
            subtitle="High Risk — Immediate action required"
            trend="↑ 12 from last scan"
            icon={ShieldAlert}
            color="red"
            delay={0}
          />
          <RiskScoreCard
            title="Vulnerable Queries"
            value="24 / 67"
            subtitle="35.8% leakage rate across all roles"
            icon={AlertTriangle}
            color="amber"
            delay={1}
          />
          <RiskScoreCard
            title="Documents at Risk"
            value={5}
            unit="/ 12"
            subtitle="Documents with leakage exposure"
            icon={FileWarning}
            color="red"
            delay={2}
          >
            <div className="flex flex-wrap gap-1">
              {['Acquisition', 'Compensation', 'Term Sheet'].map((t) => (
                <span key={t} className="rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] text-red-400">
                  {t}
                </span>
              ))}
            </div>
          </RiskScoreCard>
          <RiskScoreCard
            title="Roles Tested"
            value={4}
            subtitle="All roles scanned for leakage vectors"
            icon={Users}
            color="blue"
            delay={3}
          >
            <div className="space-y-1.5">
              {[
                { role: 'CEO', rate: 0 },
                { role: 'Sales', rate: 45 },
                { role: 'Support', rate: 38 },
                { role: 'Partner', rate: 71 },
              ].map((r) => (
                <div key={r.role} className="flex items-center gap-2">
                  <span className="w-12 text-[10px] text-slate-500">{r.role}</span>
                  <div className="h-1 flex-1 rounded-full bg-slate-800">
                    <div
                      className={cn(
                        'h-1 rounded-full',
                        r.rate === 0 ? 'bg-emerald-500' : r.rate > 50 ? 'bg-red-500' : 'bg-amber-500'
                      )}
                      style={{ width: `${Math.max(r.rate, 2)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[10px] text-slate-500">{r.rate}%</span>
                </div>
              ))}
            </div>
          </RiskScoreCard>
        </div>
      )}

      {/* Charts + Security Posture */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <LeakageHeatmap />
            <RoleRiskChart />
          </div>
        </div>

        {/* Security Posture Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="rounded-xl border border-slate-800 bg-slate-900/50 p-5"
        >
          <div className="mb-1">
            <h3 className="text-sm font-semibold text-white">Security Posture</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Before SecureRAG implementation
            </p>
          </div>
          <div className="mt-4 space-y-4">
            {securityPosture.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + i * 0.08 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{item.label}</span>
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      item.color === 'red' ? 'text-red-400' : 'text-amber-400'
                    )}
                  >
                    {item.value}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, delay: 0.8 + i * 0.1 }}
                    className={cn('h-full rounded-full', progressColors[item.color])}
                  />
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
            <p className="text-[11px] font-medium text-red-400">
              Overall Security Grade: D-
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              Critical gaps in permission enforcement and audit coverage detected.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Recent Alerts */}
      <RecentAlerts />
    </div>
  );
}
