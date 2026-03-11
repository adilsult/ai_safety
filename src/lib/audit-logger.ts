import { AuditEntry, UserRole, RAGResponse } from './types';
import { users } from './mock-data';

// ==========================================
// Audit Entry Factory
// ==========================================

/**
 * Create an AuditEntry by comparing insecure vs secure responses.
 * This is the primary way to log RAG queries in the system.
 */
export function createAuditEntry(
  userId: string,
  userRole: UserRole,
  query: string,
  insecureResponse: RAGResponse,
  secureResponse: RAGResponse
): AuditEntry {
  const user = users[userRole];

  // Determine status
  let status: AuditEntry['status'];
  if (secureResponse.blocked) {
    status = 'blocked';
  } else if (insecureResponse.leakedDocIds.length > 0 && secureResponse.leakedDocIds.length === 0) {
    status = 'partial_block'; // insecure would have leaked, secure blocked it
  } else if (insecureResponse.leakedDocIds.length > 0) {
    status = 'leakage_detected';
  } else {
    status = 'clean';
  }

  // Collect leaked items (from insecure response — to show what WOULD have leaked)
  const leakedItems: string[] = [
    ...insecureResponse.leakedDocIds,
    ...insecureResponse.leakedFields,
  ];

  // Risk score
  const riskScore = insecureResponse.riskScore;

  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date(),
    userId: user.id,
    userName: user.name,
    userRole,
    query,
    mode: 'secure', // default log mode
    status,
    leakedItems: Array.from(new Set(leakedItems)),
    riskScore,
    sourceDocIds: secureResponse.sourceDocs,
  };
}

/**
 * Create a quick audit entry for a single-mode query (secure only).
 */
export function createSecureAuditEntry(
  userId: string,
  userRole: UserRole,
  query: string,
  response: RAGResponse
): AuditEntry {
  const user = users[userRole];

  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date(),
    userId: user.id,
    userName: user.name,
    userRole,
    query,
    mode: 'secure',
    status: response.blocked ? 'blocked' : 'clean',
    leakedItems: [],
    riskScore: response.riskScore,
    sourceDocIds: response.sourceDocs,
  };
}
