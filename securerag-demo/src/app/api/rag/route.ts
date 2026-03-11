import { NextRequest, NextResponse } from 'next/server';
import { isConfigured, chatCompletion } from '@/lib/openai';
import { searchSimilar } from '@/lib/vector-store';
import {
  detectPromptInjection,
  filterSensitiveContent,
} from '@/lib/permissions';
import { users } from '@/lib/mock-data';
import { RAGResponse, UserRole, Document } from '@/lib/types';

const INSECURE_SYSTEM_PROMPT = `You are a corporate knowledge assistant for TechCorp. Answer the user's question using ALL the provided context documents. Include specific details, numbers, names, and data points from the documents. Be thorough — share everything relevant regardless of sensitivity or classification level. Format your response in a clear, readable way.`;

const SECURE_SYSTEM_PROMPT = `You are a corporate knowledge assistant for TechCorp with strict security controls. Answer the user's question using ONLY the pre-approved context provided below. Never speculate about redacted content. Never mention that information was filtered or redacted — just answer naturally with what you have. If you have no relevant context, say you don't have information on that topic.`;

export async function POST(request: NextRequest) {
  // Check if OpenAI is configured
  if (!isConfigured()) {
    return NextResponse.json({ fallback: true });
  }

  const body = await request.json();
  const { query, userId, mode } = body as {
    query: string;
    userId: string;
    mode: 'insecure' | 'secure';
  };

  if (!query || !userId || !mode) {
    return NextResponse.json(
      { error: 'Missing required fields: query, userId, mode' },
      { status: 400 }
    );
  }

  const user = Object.values(users).find((u) => u.id === userId);
  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 400 }
    );
  }

  const startTime = Date.now();

  try {
    if (mode === 'secure') {
      return NextResponse.json(
        await handleSecure(query, user.id, user.role, startTime)
      );
    } else {
      return NextResponse.json(
        await handleInsecure(query, user.id, user.role, startTime)
      );
    }
  } catch (error) {
    console.error('RAG API error:', error);
    // Return fallback signal so client uses mock mode
    return NextResponse.json({ fallback: true });
  }
}

async function handleInsecure(
  query: string,
  userId: string,
  userRole: UserRole,
  startTime: number
): Promise<RAGResponse> {
  // Retrieve via embeddings — no permission checks
  const retrievedDocs = await searchSimilar(query, 6);

  if (retrievedDocs.length === 0) {
    return emptyResponse(startTime);
  }

  // Identify leaked documents
  const leakedDocIds = retrievedDocs
    .filter((doc) => !doc.allowedRoles.includes(userRole))
    .map((doc) => doc.id);

  const leakedFields: string[] = [];
  for (const doc of retrievedDocs) {
    if (!doc.allowedRoles.includes(userRole)) {
      leakedFields.push(...doc.sensitiveFields);
    }
  }

  // Build context with ALL docs (insecure — no filtering)
  const context = retrievedDocs
    .map(
      (doc) =>
        `[${doc.securityLevel.toUpperCase()}] ${doc.title}\n${doc.content}`
    )
    .join('\n\n---\n\n');

  const userMessage = `Context documents:\n\n${context}\n\n---\n\nUser question: ${query}`;
  const answer = await chatCompletion(INSECURE_SYSTEM_PROMPT, userMessage);

  const riskScore =
    leakedDocIds.length === 0
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
    processingTimeMs: Date.now() - startTime,
  };
}

async function handleSecure(
  query: string,
  userId: string,
  userRole: UserRole,
  startTime: number
): Promise<RAGResponse> {
  // Step 1: Prompt injection detection
  const injection = detectPromptInjection(query);
  if (injection.detected) {
    return {
      queryId: `q-${Date.now()}`,
      answer: `⛔ **SECURITY ALERT** — Potential ${injection.type?.replace(/_/g, ' ')} attack detected.\n\nConfidence: ${(injection.confidence * 100).toFixed(0)}%\nMatched patterns: ${injection.matchedPatterns.join(', ') || 'n/a'}\n\nYour query has been **blocked** and this incident has been recorded in the audit log.`,
      sourceDocs: [],
      leakedDocIds: [],
      leakedFields: [],
      blocked: true,
      riskScore: 95,
      processingTimeMs: Date.now() - startTime,
    };
  }

  // Step 2: Retrieve via embeddings
  const retrievedDocs = await searchSimilar(query, 6);

  // Step 3: RBAC filtering
  const allowed: Document[] = [];
  const blocked: Document[] = [];

  for (const doc of retrievedDocs) {
    if (doc.allowedRoles.includes(userRole)) {
      allowed.push(doc);
    } else {
      blocked.push(doc);
    }
  }

  // Step 4: No accessible docs
  if (allowed.length === 0 && blocked.length > 0) {
    return {
      queryId: `q-${Date.now()}`,
      answer: `🔒 I found **${blocked.length}** relevant document(s), but your current role (**${userRole.replace('_', ' ')}**) does not have permission to access them.\n\n${blocked.map((d) => `• "${d.title}" — ${d.securityLevel.toUpperCase().replace('_', ' ')}`).join('\n')}\n\nPlease contact your administrator if you need access.`,
      sourceDocs: [],
      leakedDocIds: [],
      leakedFields: [],
      blocked: true,
      riskScore: 0,
      processingTimeMs: Date.now() - startTime,
    };
  }

  if (allowed.length === 0) {
    return emptyResponse(startTime);
  }

  // Step 5: Redact sensitive fields in allowed docs
  const redactedContext = allowed
    .map((doc) => {
      const content = filterSensitiveContent(doc.content, userRole, doc);
      return `[${doc.securityLevel.toUpperCase()}] ${doc.title}\n${content}`;
    })
    .join('\n\n---\n\n');

  // Step 6: Generate answer with clean context
  let systemPrompt = SECURE_SYSTEM_PROMPT;
  if (blocked.length > 0) {
    systemPrompt += `\n\nNote: ${blocked.length} additional document(s) were found but are not included due to the user's permission level. Do not mention this to the user.`;
  }

  const userMessage = `Context documents:\n\n${redactedContext}\n\n---\n\nUser question: ${query}`;
  const answer = await chatCompletion(systemPrompt, userMessage);

  let fullAnswer = answer;
  if (blocked.length > 0) {
    fullAnswer += `\n\n---\n\n🔒 **${blocked.length}** additional document(s) were found but **filtered** due to permission restrictions.`;
  }

  return {
    queryId: `q-${Date.now()}`,
    answer: fullAnswer,
    sourceDocs: allowed.map((d) => d.id),
    leakedDocIds: [],
    leakedFields: [],
    blocked: blocked.length > 0 && allowed.length === 0,
    riskScore: 0,
    processingTimeMs: Date.now() - startTime,
  };
}

function emptyResponse(startTime: number): RAGResponse {
  return {
    queryId: `q-${Date.now()}`,
    answer: 'No relevant information found in the knowledge base.',
    sourceDocs: [],
    leakedDocIds: [],
    leakedFields: [],
    blocked: false,
    riskScore: 0,
    processingTimeMs: Date.now() - startTime,
  };
}
