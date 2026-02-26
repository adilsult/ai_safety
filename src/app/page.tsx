'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  ArrowRight,
  ShieldAlert,
  Shuffle,
  EyeOff,
  ShieldCheck,
  Lock,
  ScrollText,
  Zap,
} from 'lucide-react';

// ── Counter hook ──────────────────────────────
function useCounter(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const increment = target / (duration / 16);
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
  }, [inView, target, duration]);

  return { count, ref };
}

// ── Problem cards data ────────────────────────
const problems = [
  {
    icon: ShieldAlert,
    title: 'Role Confusion',
    description:
      "LLMs don't natively understand RBAC. Your AI assistant answers as if every user is an admin.",
    color: 'text-red-400',
    bg: 'bg-red-500/5',
    border: 'border-red-500/20',
    iconBg: 'bg-red-500/10',
  },
  {
    icon: Shuffle,
    title: 'Context Bleeding',
    description:
      "Retrieved documents from one user's session can contaminate another's response.",
    color: 'text-red-400',
    bg: 'bg-red-500/5',
    border: 'border-red-500/20',
    iconBg: 'bg-red-500/10',
  },
  {
    icon: EyeOff,
    title: 'No Audit Trail',
    description:
      'You have no record of what sensitive data your LLM exposed and to whom.',
    color: 'text-red-400',
    bg: 'bg-red-500/5',
    border: 'border-red-500/20',
    iconBg: 'bg-red-500/10',
  },
];

const solutions = [
  {
    icon: ShieldCheck,
    title: 'Permission-Aware RAG',
    description:
      'Every retrieval respects RBAC. Documents are filtered by role before reaching the LLM context window.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/5',
    border: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/10',
  },
  {
    icon: Lock,
    title: 'Session Isolation',
    description:
      'User contexts are cryptographically separated. Zero cross-contamination between sessions.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/5',
    border: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/10',
  },
  {
    icon: ScrollText,
    title: 'Full Audit Trail',
    description:
      'Every query logged with source documents, risk scores, and blocked/allowed decisions.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/5',
    border: 'border-emerald-500/20',
    iconBg: 'bg-emerald-500/10',
  },
];

export default function HomePage() {
  const stat1 = useCounter(847);
  const stat2 = useCounter(993);
  const stat3 = useCounter(50);
  const breachCost = useCounter(445);
  const detectionTime = useCounter(277);
  const humanFactor = useCounter(82);

  const problemsRef = useRef(null);
  const problemsInView = useInView(problemsRef, { once: true, margin: '-100px' });

  const solutionsRef = useRef(null);
  const solutionsInView = useInView(solutionsRef, { once: true, margin: '-100px' });

  return (
    <div className="relative min-h-screen bg-slate-950">
      {/* ── Background effects ─────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Grid pattern */}
        <div className="grid-pattern absolute inset-0" />
        {/* Gradient orbs */}
        <div className="absolute -right-20 -top-20 h-[600px] w-[600px] rounded-full bg-violet-600/8 blur-[150px]" />
        <div className="absolute -left-40 top-1/3 h-[400px] w-[400px] rounded-full bg-purple-600/6 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-red-600/5 blur-[100px]" />
      </div>

      {/* ── Hero Section ───────────────────── */}
      <section className="relative mx-auto max-w-6xl px-4 pb-20 pt-24 sm:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <Badge
            variant="outline"
            className="mb-8 border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-400"
          >
            <Shield className="mr-1.5 h-3 w-3" />
            Human Delta AI — SecureRAG Auditor
          </Badge>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-7xl">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="block text-red-400"
            >
              Your LLM is leaking data.
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-2 block text-white"
            >
              Let&apos;s prove it.
            </motion.span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mx-auto mt-8 max-w-3xl text-base leading-relaxed text-slate-400 sm:text-lg"
          >
            SecureRAG Auditor finds permission scope leakage in your RAG systems
            before your enterprise clients do — and shows you exactly how to fix it.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/overview">
              <Button
                size="lg"
                className="bg-violet-600 px-8 text-white shadow-lg shadow-violet-600/25 hover:bg-violet-700"
              >
                Launch Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button
                variant="outline"
                size="lg"
                className="border-slate-700 px-8 text-slate-300 hover:bg-slate-800"
              >
                See How It Works
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* ── Animated Stats Bar ───────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mt-20 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-sm"
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">
                <span ref={stat1.ref}>{stat1.count.toLocaleString()}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                leakage vectors tested
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">
                <span ref={stat2.ref}>
                  {(stat2.count / 10).toFixed(1)}%
                </span>
              </p>
              <p className="mt-1 text-xs text-slate-500">detection rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">
                <Zap className="mr-1 inline h-5 w-5 text-amber-400" />
                &lt;{' '}
                <span ref={stat3.ref}>{stat3.count}</span>ms
              </p>
              <p className="mt-1 text-xs text-slate-500">
                overhead per query
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Problem Statement ──────────────── */}
      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <div ref={problemsRef} className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={problemsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="outline"
              className="mb-4 border-red-500/30 bg-red-500/10 text-xs text-red-400"
            >
              The Problem
            </Badge>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              The Hidden Risk in Every Enterprise RAG Deployment
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-400">
              Most RAG implementations have zero permission awareness. Your AI
              treats every user as a superadmin.
            </p>
          </motion.div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {problems.map((problem, i) => (
              <motion.div
                key={problem.title}
                initial={{ opacity: 0, y: 30 }}
                animate={problemsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
                className={`rounded-xl border ${problem.border} ${problem.bg} p-6 text-left`}
              >
                <div
                  className={`inline-flex rounded-lg ${problem.iconBg} p-2.5`}
                >
                  <problem.icon className={`h-5 w-5 ${problem.color}`} />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-white">
                  {problem.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  {problem.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Solution Section ───────────────── */}
      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <div ref={solutionsRef} className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={solutionsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="outline"
              className="mb-4 border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-400"
            >
              How SecureRAG Fixes It
            </Badge>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Permission-Aware AI in Minutes, Not Months
            </h2>
          </motion.div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {solutions.map((solution, i) => (
              <motion.div
                key={solution.title}
                initial={{ opacity: 0, y: 30 }}
                animate={solutionsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
                className={`rounded-xl border ${solution.border} ${solution.bg} p-6 text-left`}
              >
                <div
                  className={`inline-flex rounded-lg ${solution.iconBg} p-2.5`}
                >
                  <solution.icon className={`h-5 w-5 ${solution.color}`} />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-white">
                  {solution.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  {solution.description}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={solutionsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="mt-10 rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-500/10 via-slate-900/80 to-amber-500/10 p-5 text-left"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-red-300">
              Cost of Inaction
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Every unprotected RAG query is a potential data breach with real financial and legal exposure.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-xl font-bold text-white">
                  $<span ref={breachCost.ref}>{(breachCost.count / 100).toFixed(2)}</span>M
                </p>
                <p className="mt-1 text-[11px] text-slate-500">avg breach cost</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-xl font-bold text-white">
                  <span ref={detectionTime.ref}>{detectionTime.count}</span> days
                </p>
                <p className="mt-1 text-[11px] text-slate-500">avg detection time</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-xl font-bold text-white">
                  <span ref={humanFactor.ref}>{humanFactor.count}</span>%
                </p>
                <p className="mt-1 text-[11px] text-slate-500">involve human element</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={solutionsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <Link href="/playground">
            <Button
              size="lg"
              className="bg-violet-600 px-10 text-white shadow-lg shadow-violet-600/25 hover:bg-violet-700"
            >
              See a live demonstration
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ─────────────────────────── */}
      <footer className="border-t border-slate-800/50 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-purple-600">
              <Shield className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-400">
              Human Delta AI
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            SecureRAG Auditor &middot; Enterprise AI Security Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
