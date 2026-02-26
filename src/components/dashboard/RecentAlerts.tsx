'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import { sampleLeakageEvents } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const statusConfig = {
  critical: { label: 'LEAKED', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
  high: { label: 'PARTIAL', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  medium: { label: 'BLOCKED', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  low: { label: 'BLOCKED', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
};

export function RecentAlerts() {
  const events = sampleLeakageEvents.slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="rounded-xl border border-slate-800 bg-slate-900/50 p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Recent Leakage Alerts</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Latest permission violations detected
          </p>
        </div>
        <Link
          href="/audit"
          className="flex items-center gap-1 text-xs text-violet-400 transition-colors hover:text-violet-300"
        >
          View all in Audit Log
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Time
              </th>
              <th className="pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Role
              </th>
              <th className="pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Document
              </th>
              <th className="pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Leaked Fields
              </th>
              <th className="pb-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Level
              </th>
              <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, i) => {
              const status = statusConfig[event.severity];
              return (
                <motion.tr
                  key={event.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 + i * 0.05 }}
                  className="cursor-pointer border-b border-slate-800/50 transition-colors hover:bg-slate-800/30"
                >
                  <td className="py-2.5 pr-4 text-xs text-slate-400">
                    {event.timestamp.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    <span className="ml-1 text-slate-600">
                      {event.timestamp.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="text-xs text-slate-300">
                      {event.userRole.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="max-w-[200px] truncate py-2.5 pr-4 text-xs text-slate-300">
                    {event.documentTitle}
                  </td>
                  <td className="py-2.5 pr-4">
                    <div className="flex flex-wrap gap-1">
                      {event.leakedFields.slice(0, 2).map((f) => (
                        <span
                          key={f}
                          className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400"
                        >
                          {f}
                        </span>
                      ))}
                      {event.leakedFields.length > 2 && (
                        <span className="text-[10px] text-slate-500">
                          +{event.leakedFields.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[9px]',
                        event.securityLevel === 'top_secret'
                          ? 'border-red-500/30 bg-red-500/10 text-red-400'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                      )}
                    >
                      {event.securityLevel.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-2.5">
                    <Badge variant="outline" className={cn('text-[9px]', status.className)}>
                      {status.label}
                    </Badge>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
