'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const data = [
  { role: 'CEO', top_secret: 0, confidential: 0, internal: 0, public: 0 },
  { role: 'Sales Rep', top_secret: 85, confidential: 15, internal: 0, public: 0 },
  { role: 'Support', top_secret: 92, confidential: 78, internal: 5, public: 0 },
  { role: 'Partner', top_secret: 95, confidential: 88, internal: 72, public: 0 },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-3 shadow-xl">
      <p className="text-sm font-medium text-white">{label}</p>
      <div className="mt-2 space-y-1">
        {payload.map((p: { name: string; value: number; color: string }) => (
          <div key={p.name} className="flex items-center gap-2 text-xs">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-slate-400">{p.name}:</span>
            <span className="font-medium text-white">{p.value}% risk</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function LeakageHeatmap() {
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
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-xl border border-slate-800 bg-slate-900/50 p-5"
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">
          Permission Leakage Matrix
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Role × Document Security Level — higher = more exposure risk
        </p>
      </div>
      {isVisible ? (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="role"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#334155' }}
              label={{
                value: 'Risk %',
                angle: -90,
                position: 'insideLeft',
                fill: '#64748b',
                fontSize: 10,
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
            />
            <Bar dataKey="top_secret" name="Top Secret" fill="#ef4444" radius={[2, 2, 0, 0]} />
            <Bar dataKey="confidential" name="Confidential" fill="#f59e0b" radius={[2, 2, 0, 0]} />
            <Bar dataKey="internal" name="Internal" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            <Bar dataKey="public" name="Public" fill="#10b981" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[280px] animate-pulse rounded-lg bg-slate-800/60" />
      )}
    </motion.div>
  );
}
