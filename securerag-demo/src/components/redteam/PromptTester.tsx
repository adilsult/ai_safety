'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Crosshair,
  CheckCircle2,
  Loader2,
  Shield,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RedTeamAttack, RedTeamResult, UserRole } from '@/lib/types';
import { roleLabels, users } from '@/lib/mock-data';
import { queryRAGApi } from '@/lib/rag-engine';
import { Badge } from '@/components/ui/badge';
import { detectPromptInjection } from '@/lib/permissions';
import { ResultBadge } from './ResultBadge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PromptTesterProps {
  selectedAttack: RedTeamAttack | null;
  customPrompt: string | null;
  onTestComplete: (result: RedTeamResult) => void;
}

const scanSteps = [
  'Analyzing intent...',
  'Checking role escalation patterns...',
  'Scanning for injection markers...',
  'Verifying context boundaries...',
];

export function PromptTester({ selectedAttack, customPrompt, onTestComplete }: PromptTesterProps) {
  const [prompt, setPrompt] = useState('');
  const [targetRole, setTargetRole] = useState<UserRole>('sales_rep');
  const [isRunning, setIsRunning] = useState(false);
  const [scanStep, setScanStep] = useState(-1);
  const [result, setResult] = useState<RedTeamResult | null>(null);
  const [llmMode, setLlmMode] = useState<boolean | null>(null);

  // Update prompt when attack is selected
  useEffect(() => {
    if (selectedAttack) {
      setPrompt(selectedAttack.prompt);
      setResult(null);
    }
  }, [selectedAttack]);

  useEffect(() => {
    if (customPrompt) {
      setPrompt(customPrompt);
      setResult(null);
    }
  }, [customPrompt]);

  const runAttack = useCallback(async () => {
    if (!prompt.trim() || isRunning) return;
    setIsRunning(true);
    setResult(null);
    setScanStep(-1);

    // Animate scan steps
    for (let i = 0; i < scanSteps.length; i++) {
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
      setScanStep(i);
    }

    // Run secure RAG to see if it blocks
    const user = users[targetRole];
    const detection = detectPromptInjection(prompt);
    const { response, llmMode: isLlm } = await queryRAGApi(prompt, user.id, 'secure');
    setLlmMode(isLlm);

    let status: RedTeamResult['status'];
    if (response.blocked) {
      status = 'blocked';
    } else if (response.leakedFields.length > 0) {
      status = 'partial';
    } else {
      status = 'clean';
    }

    const matchedSummary =
      detection.matchedPatterns.length > 0
        ? detection.matchedPatterns.map((p) => p.replace(/_/g, ' ')).join(', ')
        : null;

    const testResult: RedTeamResult = {
      attackId: selectedAttack?.id || 'custom',
      success: status !== 'blocked',
      status,
      response: response.answer,
      bypassedPermissions:
        status === 'blocked'
          ? [
              matchedSummary
                ? `Detected patterns: ${matchedSummary}`
                : 'Policy escalation marker detected',
              'Query terminated at security layer',
            ]
          : status === 'partial'
            ? [
                'Some restricted data crossed into output',
                response.leakedFields.length > 0
                  ? `Leaked fields: ${response.leakedFields.join(', ')}`
                  : 'Leakage detected by post-checks',
              ]
            : [
                detection.detected
                  ? `Patterns observed but no sensitive leakage: ${matchedSummary}`
                  : 'No injection markers matched',
                'Query processed with permission-verified context',
              ],
      riskLevel:
        status === 'blocked'
          ? 'low'
          : status === 'partial'
            ? 'high'
            : detection.detected
              ? 'medium'
              : 'low',
    };

    await new Promise((r) => setTimeout(r, 300));
    setResult(testResult);
    setIsRunning(false);
    onTestComplete(testResult);

    if (testResult.status === 'blocked') {
      toast.success('Attack blocked', {
        description: 'SecureRAG neutralized this prompt and logged the event.',
      });
    } else if (testResult.status === 'partial') {
      toast.warning('Partial bypass detected', {
        description: 'Attack succeeded partially and was flagged in audit.',
      });
    } else {
      toast.message('Query processed', {
        description: 'No sensitive leakage was detected for this prompt.',
      });
    }
  }, [prompt, targetRole, isRunning, selectedAttack, onTestComplete]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/50">
      {/* Header */}
      <div className="border-b border-slate-800 p-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Attack Tester</h3>
          {llmMode !== null && (
            <Badge
              variant="outline"
              className={cn(
                'text-[9px]',
                llmMode
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-slate-600 bg-slate-800 text-slate-400'
              )}
            >
              {llmMode ? 'LLM' : 'Mock'}
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          {selectedAttack ? selectedAttack.name : 'Select an attack or write a custom prompt'}
        </p>
      </div>

      {/* Input */}
      <div className="border-b border-slate-800 p-4">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Attack prompt will appear here..."
          className="min-h-[80px] resize-none border-slate-700 bg-slate-800/50 text-xs text-slate-300 placeholder:text-slate-600"
        />
        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">Target Role:</span>
            <Select value={targetRole} onValueChange={(v) => setTargetRole(v as UserRole)}>
              <SelectTrigger className="h-7 w-[160px] border-slate-700 bg-slate-800/50 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-900">
                {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                  <SelectItem key={role} value={role} className="text-xs">
                    {roleLabels[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={runAttack}
            disabled={!prompt.trim() || isRunning}
            size="sm"
            className="ml-auto bg-red-600 text-white hover:bg-red-700"
          >
            {isRunning ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Crosshair className="mr-1.5 h-3.5 w-3.5" />
            )}
            {isRunning ? 'Running...' : 'Run Attack'}
          </Button>
        </div>
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Processing animation */}
        <AnimatePresence>
          {isRunning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
                  Security Scan in Progress
                </p>
                {scanSteps.map((step, i) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{
                      opacity: i <= scanStep ? 1 : 0.3,
                      x: 0,
                    }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                    className="flex items-center gap-2 py-1.5"
                  >
                    {i <= scanStep ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : i === scanStep + 1 ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border border-slate-600" />
                    )}
                    <span
                      className={cn(
                        'text-xs',
                        i <= scanStep ? 'text-emerald-400' : i === scanStep + 1 ? 'text-violet-400' : 'text-slate-600'
                      )}
                    >
                      {step}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        {!isRunning && result && <ResultBadge result={result} />}

        {/* Empty state */}
        {!isRunning && !result && (
          <div className="flex h-full items-center justify-center py-16">
            <div className="text-center">
              <Shield className="mx-auto h-8 w-8 text-slate-700" />
              <p className="mt-3 text-xs text-slate-600">
                Select an attack from the library or write a custom prompt
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
