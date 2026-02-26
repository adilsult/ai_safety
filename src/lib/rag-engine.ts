import { UserRole, RAGResponse, Document } from './types';
import { documents, users } from './mock-data';
import {
  filterSensitiveContent,
  detectPromptInjection,
} from './permissions';

// ==========================================
// DOCUMENT RETRIEVAL (keyword matching)
// ==========================================

function findRelevantDocuments(query: string): Document[] {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter((w) => w.length >= 3);
  const scored: Array<{ doc: Document; score: number }> = [];

  for (const doc of documents) {
    let score = 0;
    const contentLower = doc.content.toLowerCase();
    const titleLower = doc.title.toLowerCase();

    for (const word of queryWords) {
      if (titleLower.includes(word)) score += 4;
      if (contentLower.includes(word)) score += 1;
      for (const tag of doc.tags) {
        if (tag.includes(word) || word.includes(tag)) score += 3;
      }
    }

    // Boost by security level for insecure mode to make leaks more dramatic
    if (score > 0) {
      scored.push({ doc, score });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((s) => s.doc);
}

// ==========================================
// INSECURE RAG — No permission checks
// ==========================================

/**
 * Simulates an insecure RAG pipeline that ignores RBAC entirely.
 * Returns ALL matching documents regardless of user's role.
 * This demonstrates the "before" state — what happens without SecureRAG.
 */
export async function simulateInsecureRAG(
  query: string,
  userId: string,
  signal?: AbortSignal
): Promise<RAGResponse> {
  const startTime = Date.now();

  const user = Object.values(users).find((u) => u.id === userId);
  if (!user) {
    return emptyResponse(query, Date.now() - startTime);
  }

  // Retrieve ALL matching docs — no permission checks
  const retrievedDocs = findRelevantDocuments(query);

  if (retrievedDocs.length === 0) {
    return emptyResponse(query, Date.now() - startTime);
  }

  // Figure out which docs leaked (user shouldn't have access)
  const leakedDocIds = retrievedDocs
    .filter((doc) => !doc.allowedRoles.includes(user.role))
    .map((doc) => doc.id);

  const leakedFields: string[] = [];
  for (const doc of retrievedDocs) {
    if (!doc.allowedRoles.includes(user.role)) {
      leakedFields.push(...doc.sensitiveFields);
    }
  }

  // Build the insecure answer (includes everything)
  const answer = buildInsecureAnswer(query, retrievedDocs);

  // Simulate processing delay (300-800ms)
  const processingTime = 300 + Math.floor(Math.random() * 500);
  await delay(processingTime, signal);

  const riskScore = leakedDocIds.length === 0
    ? 0
    : Math.min(100, leakedDocIds.length * 25 + leakedFields.length * 8);

  return {
    queryId: `q-${Date.now()}`,
    answer,
    sourceDocs: retrievedDocs.map((d) => d.id),
    leakedDocIds,
    leakedFields: Array.from(new Set(leakedFields)),
    blocked: false,
    riskScore,
    processingTimeMs: processingTime,
  };
}

// ==========================================
// SECURE RAG — Full permission enforcement
// ==========================================

/**
 * Simulates a secure RAG pipeline with:
 * 1. Prompt injection detection
 * 2. RBAC document filtering
 * 3. Sensitive field redaction
 * 4. Audit-ready response metadata
 */
export async function simulateSecureRAG(
  query: string,
  userId: string,
  signal?: AbortSignal
): Promise<RAGResponse> {
  const startTime = Date.now();

  const user = Object.values(users).find((u) => u.id === userId);
  if (!user) {
    return emptyResponse(query, Date.now() - startTime);
  }

  // Step 1: Prompt injection detection
  const injection = detectPromptInjection(query);
  if (injection.detected) {
    const processingTime = 150 + Math.floor(Math.random() * 200);
    await delay(processingTime, signal);

    return {
      queryId: `q-${Date.now()}`,
      answer: `⛔ **SECURITY ALERT** — Potential ${injection.type?.replace(/_/g, ' ')} attack detected.\n\nConfidence: ${(injection.confidence * 100).toFixed(0)}%\nMatched patterns: ${injection.matchedPatterns.join(', ') || 'n/a'}\n\nYour query has been **blocked** and this incident has been recorded in the audit log. The request contained patterns consistent with known attack vectors.\n\nIf you believe this is a false positive, please contact your security administrator.`,
      sourceDocs: [],
      leakedDocIds: [],
      leakedFields: [],
      blocked: true,
      riskScore: 95,
      processingTimeMs: processingTime,
    };
  }

  // Step 2: Retrieve relevant documents
  const allRetrieved = findRelevantDocuments(query);

  // Step 3: Filter by permissions
  const allowed: Document[] = [];
  const blocked: Document[] = [];

  for (const doc of allRetrieved) {
    if (doc.allowedRoles.includes(user.role)) {
      allowed.push(doc);
    } else {
      blocked.push(doc);
    }
  }

  // Step 4: Apply sensitive content redaction to allowed docs
  const redactedContents = allowed.map((doc) => ({
    doc,
    content: filterSensitiveContent(doc.content, user.role, doc),
  }));

  // Step 5: Build secure answer
  const answer = buildSecureAnswer(query, redactedContents, blocked, user.role);

  // Simulate processing delay (500-1200ms — secure is slower)
  const processingTime = 500 + Math.floor(Math.random() * 700);
  await delay(processingTime, signal);

  return {
    queryId: `q-${Date.now()}`,
    answer,
    sourceDocs: allowed.map((d) => d.id),
    leakedDocIds: [],
    leakedFields: [],
    blocked: blocked.length > 0 && allowed.length === 0,
    riskScore: 0,
    processingTimeMs: processingTime,
  };
}

// ==========================================
// ANSWER BUILDERS
// ==========================================

function buildInsecureAnswer(query: string, docs: Document[]): string {
  if (docs.length === 0) {
    return 'No relevant information found in the knowledge base.';
  }

  const parts = docs.map((doc) => {
    const snippet = doc.content.length > 200
      ? doc.content.slice(0, 200) + '...'
      : doc.content;
    return `**${doc.title}** [${doc.securityLevel.toUpperCase().replace('_', ' ')}]\n${snippet}`;
  });

  return `Based on our knowledge base, here is what I found:\n\n${parts.join('\n\n---\n\n')}\n\n_Source: ${docs.length} document(s) — ${docs.map((d) => d.title).join(', ')}_`;
}

function buildSecureAnswer(
  query: string,
  allowedDocs: Array<{ doc: Document; content: string }>,
  blockedDocs: Document[],
  role: UserRole
): string {
  if (allowedDocs.length === 0 && blockedDocs.length > 0) {
    return `🔒 I found **${blockedDocs.length}** relevant document(s), but your current role (**${role.replace('_', ' ')}**) does not have permission to access them.\n\nThe documents are classified at a security level above your clearance:\n${blockedDocs.map((d) => `• "${d.title}" — ${d.securityLevel.toUpperCase().replace('_', ' ')}`).join('\n')}\n\nPlease contact your administrator if you need access to these resources.`;
  }

  if (allowedDocs.length === 0) {
    return 'No relevant information found within your accessible documents.';
  }

  const parts = allowedDocs.map(({ doc, content }) => {
    const snippet = content.length > 200 ? content.slice(0, 200) + '...' : content;
    return `**${doc.title}** [${doc.securityLevel.toUpperCase().replace('_', ' ')}]\n${snippet}`;
  });

  let response = `Based on documents accessible to your role:\n\n${parts.join('\n\n---\n\n')}`;

  if (blockedDocs.length > 0) {
    response += `\n\n---\n\n🔒 **${blockedDocs.length}** additional document(s) were found but **filtered** due to permission restrictions. These documents require a higher security clearance.`;
  }

  return response;
}

// ==========================================
// HELPERS
// ==========================================

function emptyResponse(query: string, elapsed: number): RAGResponse {
  return {
    queryId: `q-${Date.now()}`,
    answer: 'No relevant information found in the knowledge base.',
    sourceDocs: [],
    leakedDocIds: [],
    leakedFields: [],
    blocked: false,
    riskScore: 0,
    processingTimeMs: elapsed,
  };
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(new DOMException('Aborted', 'AbortError'));
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
