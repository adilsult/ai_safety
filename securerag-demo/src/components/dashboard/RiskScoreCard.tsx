'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RiskScoreCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle: string;
  trend?: string;
  trendDirection?: 'up' | 'down';
  icon: LucideIcon;
  color: 'red' | 'amber' | 'violet' | 'blue' | 'emerald';
  children?: React.ReactNode;
  delay?: number;
}

const colorMap = {
  red: {
    iconBg: 'bg-red-500/10',
    iconText: 'text-red-400',
    border: 'border-red-500/20',
    trendBg: 'bg-red-500/10 text-red-400 border-red-500/30',
  },
  amber: {
    iconBg: 'bg-amber-500/10',
    iconText: 'text-amber-400',
    border: 'border-amber-500/20',
    trendBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
  violet: {
    iconBg: 'bg-violet-500/10',
    iconText: 'text-violet-400',
    border: 'border-violet-500/20',
    trendBg: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  },
  blue: {
    iconBg: 'bg-blue-500/10',
    iconText: 'text-blue-400',
    border: 'border-blue-500/20',
    trendBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  },
  emerald: {
    iconBg: 'bg-emerald-500/10',
    iconText: 'text-emerald-400',
    border: 'border-emerald-500/20',
    trendBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
};

function AnimatedNumber({ target, delay = 0 }: { target: number; delay?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      let start = 0;
      const increment = target / (1200 / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, delay]);
  return <>{count}</>;
}

export function RiskScoreCard({
  title,
  value,
  unit,
  subtitle,
  trend,
  icon: Icon,
  color,
  children,
  delay = 0,
}: RiskScoreCardProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      className={cn(
        'rounded-xl border bg-slate-900/50 p-5',
        colors.border
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn('rounded-lg p-2', colors.iconBg)}>
          <Icon className={cn('h-4 w-4', colors.iconText)} />
        </div>
        {trend && (
          <Badge variant="outline" className={cn('text-[10px]', colors.trendBg)}>
            {trend}
          </Badge>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-white">
          {typeof value === 'number' ? <AnimatedNumber target={value} delay={delay * 100} /> : value}
          {unit && <span className="ml-1 text-sm font-normal text-slate-500">{unit}</span>}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{title}</p>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">{subtitle}</p>
      {children && <div className="mt-3">{children}</div>}
    </motion.div>
  );
}
