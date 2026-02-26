'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

const data = [
  { metric: 'Leakage Rate', before: 72, after: 3 },
  { metric: 'Blocked Attempts', before: 12, after: 97 },
  { metric: 'Data Exposure', before: 85, after: 5 },
  { metric: 'Audit Coverage', before: 18, after: 98 },
  { metric: 'Role Isolation', before: 25, after: 95 },
  { metric: 'Injection Defense', before: 8, after: 94 },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-3 shadow-xl">
      {payload.map((p: { name: string; value: number; color: string }) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-medium text-white">{p.value}%</span>
        </div>
      ))}
    </div>
  );
};

export function RoleRiskChart() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="rounded-xl border border-slate-800 bg-slate-900/50 p-5"
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">
          Security Posture Comparison
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Before vs After SecureRAG implementation
        </p>
      </div>
      {isVisible ? (
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={data}>
            <PolarGrid stroke="#1e293b" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: '#475569', fontSize: 9 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name="Before (Vulnerable)"
              dataKey="before"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Radar
              name="After SecureRAG"
              dataKey="after"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[280px] animate-pulse rounded-lg bg-slate-800/60" />
      )}
    </motion.div>
  );
}
