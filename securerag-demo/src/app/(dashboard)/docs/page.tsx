'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Filter,
  ScanSearch,
  ScrollText,
  Lock,
  Cpu,
  Gavel,
  Building2,
} from 'lucide-react';

type FlowMode = 'insecure' | 'secure';

const architectureSteps = [
  {
    title: 'Step 1: Query Interception',
    icon: Lock,
    why: 'Stops direct user prompts from touching raw context before policy enforcement.',
    description:
      'Every query first enters a permission-aware interception layer where user identity, role, and session context are verified.',
    code: `// Every query goes through the permission layer first
const secureQuery = await permissionLayer.intercept(query, {
  userId: user.id,
  role: user.role,
  sessionId: session.id
})`,
  },
  {
    title: 'Step 2: Context Filtering',
    icon: Filter,
    why: 'Prevents unauthorized documents from entering the LLM context window.',
    description:
      'Retrieved documents are filtered against RBAC/ABAC policy before prompt assembly, not after generation.',
    code: `// Documents are filtered before reaching the LLM
const allowedDocs = await rbac.filterDocuments(
  retrievedDocs,
  user.permissions
)`,
  },
  {
    title: 'Step 3: Sensitive Field Redaction',
    icon: ShieldCheck,
    why: 'Enforces data minimization even inside allowed documents.',
    description:
      'Field-level controls redact or mask values that exceed role scope while preserving answer utility.',
    code: `// Even allowed docs have sensitive fields masked
const sanitizedContext = redactor.mask(allowedDocs, {
  fields: user.getSensitiveFieldExclusions(),
  strategy: 'character-mask' // vs 'remove' vs 'summarize'
})`,
  },
  {
    title: 'Step 4: Response Validation',
    icon: ScanSearch,
    why: 'Catches semantic leakage that slips through retrieval-time controls.',
    description:
      'A post-generation scanner validates final output against denied patterns and policy boundaries.',
    code: `// Post-generation scan for leaked data
const validated = await leakageScanner.validate(
  llmResponse,
  { deniedPatterns: user.getDeniedPatterns() }
)`,
  },
  {
    title: 'Step 5: Audit Logging',
    icon: ScrollText,
    why: 'Creates evidence for SOC 2, GDPR, and enterprise security reviews.',
    description:
      'Every interaction is logged with retrieved/blocked docs, risk score, and immutable response metadata.',
    code: `// Every interaction logged with full context
await auditLogger.log({
  query, userId, docsRetrieved, docsBlocked,
  responseHash, leakageRisk
})`,
  },
];

const integrations = {
  openai: `import { secureMiddleware } from '@securerag/sdk'

const guarded = await secureMiddleware({
  provider: 'openai',
  model: 'gpt-4.1',
  user: { id: user.id, role: user.role },
  query
})`,
  anthropic: `import { secureMiddleware } from '@securerag/sdk'

const response = await secureMiddleware({
  provider: 'anthropic',
  model: 'claude-3-7-sonnet',
  userContext,
  prompt: query
})`,
  langchain: `const secureRetriever = SecureRAG.wrapRetriever(baseRetriever, {
  policyEngine,
  auditLogger
})

const chain = RunnableSequence.from([
  secureRetriever,
  llm
])`,
  llamaindex: `from securerag import SecureMiddleware

secure_index = SecureMiddleware(index, policy_engine=rbac)
response = secure_index.query(
  query,
  user={"id": user_id, "role": role}
)`,
};

function FlowNode({
  label,
  danger,
  safe,
}: {
  label: string;
  danger?: boolean;
  safe?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-center text-xs font-medium ${
        danger
          ? 'border-red-500/40 bg-red-500/10 text-red-300'
          : safe
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
            : 'border-slate-700 bg-slate-900/60 text-slate-200'
      }`}
    >
      {label}
    </div>
  );
}

export default function DocsPage() {
  const [flowMode, setFlowMode] = useState<FlowMode>('insecure');
  const flow = useMemo(
    () =>
      flowMode === 'insecure'
        ? {
            title: 'Insecure Flow',
            subtitle:
              'Permission checks are absent, so retrieval can pull restricted context into responses.',
            nodes: [
              'User: Sales Rep',
              'Query',
              'LLM',
              'RAG: retrieves ALL docs',
              'Response with TOP SECRET data',
            ],
          }
        : {
            title: 'Secure Flow',
            subtitle:
              'Permission layer enforces RBAC before context reaches the model.',
            nodes: [
              'User: Sales Rep',
              'Query',
              'Permission Layer',
              'Filtered Context',
              'LLM',
              'Safe Response',
            ],
          },
    [flowMode]
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-violet-400" />
        <h1 className="text-2xl font-bold text-slate-100">How It Works</h1>
        <Badge
          variant="outline"
          className="border-violet-500/30 bg-violet-500/10 text-xs text-violet-400"
        >
          Documentation
        </Badge>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">The Problem</h2>
            <p className="mt-1 text-sm text-slate-400">{flow.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={flowMode === 'insecure' ? 'default' : 'outline'}
              className={
                flowMode === 'insecure'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'border-slate-700 text-slate-300'
              }
              onClick={() => setFlowMode('insecure')}
            >
              See insecure flow
            </Button>
            <Button
              variant={flowMode === 'secure' ? 'default' : 'outline'}
              className={
                flowMode === 'secure'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'border-slate-700 text-slate-300'
              }
              onClick={() => setFlowMode('secure')}
            >
              See secure flow
            </Button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="flex min-w-[820px] items-center gap-2">
            {flow.nodes.map((node, index) => {
              const isDanger =
                flowMode === 'insecure' &&
                (node.includes('retrieves ALL') || node.includes('TOP SECRET'));
              const isSafe =
                flowMode === 'secure' &&
                (node.includes('Permission') ||
                  node.includes('Filtered') ||
                  node.includes('Safe'));

              return (
                <div key={node} className="flex items-center gap-2">
                  <FlowNode label={node} danger={isDanger} safe={isSafe} />
                  {index < flow.nodes.length - 1 && (
                    <ArrowRight
                      className={`h-4 w-4 ${
                        flowMode === 'insecure' ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-semibold text-white">SecureRAG Architecture</h2>
        <p className="mt-1 text-sm text-slate-400">
          5-stage permission-aware pipeline from query interception to audit logging.
        </p>
        <div className="mt-5 space-y-4">
          {architectureSteps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
              className="rounded-lg border border-slate-800 bg-slate-950/60 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-md border border-violet-500/30 bg-violet-500/10 p-2">
                  <step.icon className="h-4 w-4 text-violet-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    {step.description}
                  </p>
                  <pre className="mt-3 overflow-x-auto rounded-md border border-slate-800 bg-slate-900/70 p-3 text-[11px] text-slate-300">
                    <code>{step.code}</code>
                  </pre>
                  <p className="mt-2 text-[11px] text-emerald-300">
                    Why this matters: {step.why}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-semibold text-white">Integration Guide</h2>
        <p className="mt-1 text-sm text-slate-400">
          Drop SecureRAG middleware into your existing AI stack.
        </p>
        <Tabs defaultValue="openai" className="mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/60 md:grid-cols-4">
            <TabsTrigger value="openai">OpenAI</TabsTrigger>
            <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
            <TabsTrigger value="langchain">LangChain</TabsTrigger>
            <TabsTrigger value="llamaindex">LlamaIndex</TabsTrigger>
          </TabsList>
          {Object.entries(integrations).map(([key, snippet]) => (
            <TabsContent key={key} value={key} className="mt-3">
              <pre className="overflow-x-auto rounded-md border border-slate-800 bg-slate-950/70 p-3 text-[11px] text-slate-300">
                <code>{snippet}</code>
              </pre>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-semibold text-white">Why This Matters for Enterprise</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-red-500/25 bg-red-500/5 p-4">
            <div className="flex items-center gap-2">
              <Gavel className="h-4 w-4 text-red-400" />
              <p className="text-sm font-semibold text-red-300">GDPR Article 32</p>
            </div>
            <p className="mt-2 text-xs text-slate-300">
              Unauthorized AI data exposure can trigger €20M fines.
            </p>
          </div>
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <p className="text-sm font-semibold text-amber-300">SOC 2 Type II</p>
            </div>
            <p className="mt-2 text-xs text-slate-300">
              LLM audit trails are now expected in enterprise security reviews.
            </p>
          </div>
          <div className="rounded-lg border border-violet-500/25 bg-violet-500/5 p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-violet-400" />
              <p className="text-sm font-semibold text-violet-300">Enterprise Sales</p>
            </div>
            <p className="mt-2 text-xs text-slate-300">
              Your customers&apos; security teams WILL test for this.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-300">
              Ready to secure your RAG pipeline?
            </p>
            <p className="mt-1 text-xs text-slate-300">
              Permission-aware retrieval, response validation, and audit logging in one layer.
            </p>
          </div>
          <div className="flex gap-2">
            <Button className="bg-violet-600 text-white hover:bg-violet-700">
              <ShieldCheck className="mr-1.5 h-4 w-4" />
              Book a Demo
            </Button>
            <Link href="https://github.com" target="_blank" rel="noreferrer">
              <Button variant="outline" className="border-slate-700 text-slate-200">
                <Cpu className="mr-1.5 h-4 w-4" />
                View on GitHub
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
