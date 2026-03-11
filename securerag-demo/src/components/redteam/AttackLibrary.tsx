'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Crosshair, Filter } from 'lucide-react';
import { RedTeamAttack } from '@/lib/types';
import { redTeamAttacks } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

interface AttackLibraryProps {
  onSelectAttack: (attack: RedTeamAttack) => void;
  onCustomAttack: (prompt: string) => void;
  selectedAttackId: string | null;
}

const categoryColors: Record<string, string> = {
  prompt_injection: 'bg-red-500/15 text-red-400 border-red-500/30',
  role_escalation: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  data_extraction: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  context_override: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

const categoryLabels: Record<string, string> = {
  prompt_injection: 'Prompt Injection',
  role_escalation: 'Role Escalation',
  data_extraction: 'Data Extraction',
  context_override: 'Context Override',
};

const severityColors: Record<string, string> = {
  low: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const categories = ['all', 'prompt_injection', 'role_escalation', 'data_extraction', 'context_override'];
const severities = ['all', 'critical', 'high', 'medium', 'low'];

export function AttackLibrary({ onSelectAttack, onCustomAttack, selectedAttackId }: AttackLibraryProps) {
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [customPrompt, setCustomPrompt] = useState('');

  const filtered = redTeamAttacks.filter((a) => {
    if (filterCategory !== 'all' && a.category !== filterCategory) return false;
    if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/50">
      {/* Header */}
      <div className="border-b border-slate-800 p-4">
        <h3 className="text-sm font-semibold text-white">Attack Library</h3>
        <p className="mt-0.5 text-xs text-slate-500">{redTeamAttacks.length} attack vectors</p>
      </div>

      {/* Filters */}
      <div className="border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Filter className="h-3 w-3 text-slate-500" />
          <span className="text-[10px] text-slate-500">Category:</span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={cn(
                'rounded-md px-2 py-0.5 text-[10px] transition-colors',
                filterCategory === c
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              )}
            >
              {c === 'all' ? 'All' : categoryLabels[c]}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500">Severity:</span>
          <div className="flex flex-wrap gap-1">
            {severities.map((s) => (
              <button
                key={s}
                onClick={() => setFilterSeverity(s)}
                className={cn(
                  'rounded-md px-2 py-0.5 text-[10px] capitalize transition-colors',
                  filterSeverity === s
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Attack List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {filtered.map((attack, i) => (
            <motion.div
              key={attack.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={cn(
                'cursor-pointer rounded-lg border p-3 transition-all',
                selectedAttackId === attack.id
                  ? 'border-violet-500/40 bg-violet-500/5'
                  : 'border-slate-800 bg-slate-800/30 hover:border-slate-700 hover:bg-slate-800/50'
              )}
              onClick={() => onSelectAttack(attack)}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium text-slate-200">{attack.name}</p>
                <Badge variant="outline" className={cn('shrink-0 text-[8px]', severityColors[attack.severity])}>
                  {attack.severity.toUpperCase()}
                </Badge>
              </div>
              <Badge variant="outline" className={cn('mt-1.5 text-[8px]', categoryColors[attack.category])}>
                {categoryLabels[attack.category]}
              </Badge>
              <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                {attack.description}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 h-6 border-slate-700 px-2 text-[10px] text-slate-400 hover:border-red-500/30 hover:text-red-400"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAttack(attack);
                }}
              >
                <Crosshair className="mr-1 h-2.5 w-2.5" />
                Test Attack
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Custom Attack */}
      <div className="border-t border-slate-800 p-3">
        <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-2">Custom Attack</p>
        <Textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Write your own attack prompt..."
          className="min-h-[60px] resize-none border-slate-700 bg-slate-800/50 text-xs text-slate-300 placeholder:text-slate-600"
        />
        <Button
          size="sm"
          variant="outline"
          className="mt-2 w-full border-red-500/30 text-xs text-red-400 hover:bg-red-500/10"
          onClick={() => {
            if (customPrompt.trim()) onCustomAttack(customPrompt);
          }}
          disabled={!customPrompt.trim()}
        >
          <Crosshair className="mr-1.5 h-3 w-3" />
          Submit Custom Attack
        </Button>
      </div>
    </div>
  );
}
