import { UserRole, Document, RAGQuery, SecurityLevel } from './types';
import { documents, users } from './mock-data';

// ==========================================
// CORE ACCESS CONTROL
// ==========================================

/**
 * Check if a given user has access to a specific document.
 * Uses the document's allowedRoles list as the source of truth.
 */
export function checkDocumentAccess(userId: string, documentId: string): boolean {
  const user = Object.values(users).find((u) => u.id === userId);
  if (!user) return false;

  const doc = documents.find((d) => d.id === documentId);
  if (!doc) return false;

  return doc.allowedRoles.includes(user.role);
}

/**
 * Return all documents a user is allowed to see.
 */
export function getAccessibleDocuments(userId: string): Document[] {
  const user = Object.values(users).find((u) => u.id === userId);
  if (!user) return [];

  return documents.filter((doc) => doc.allowedRoles.includes(user.role));
}

/**
 * Return all documents that are blocked for a given user.
 */
export function getBlockedDocuments(userId: string): Document[] {
  const user = Object.values(users).find((u) => u.id === userId);
  if (!user) return documents;

  return documents.filter((doc) => !doc.allowedRoles.includes(user.role));
}

// ==========================================
// SENSITIVE CONTENT FILTERING
// ==========================================

/**
 * Redact sensitive values from document content based on user role.
 *
 * - If the role doesn't have access to the document at all → returns fully redacted.
 * - If the role has access but the document has sensitiveFields → redacts those specific values.
 * - CEO sees everything unredacted.
 */
export function filterSensitiveContent(
  content: string,
  userRole: UserRole,
  doc: Document
): string {
  // CEO sees everything
  if (userRole === 'ceo') return content;

  // If user has no access to this document level, fully redact
  if (!doc.allowedRoles.includes(userRole)) {
    return '[ACCESS DENIED — This document is classified as ' + doc.securityLevel.toUpperCase().replace('_', ' ') + ' and is not available for your role]';
  }

  // User has access, but we still redact specific sensitive fields
  let filtered = content;

  // First pass: exact attribute-level RBAC for known structured fields.
  // This pass is deterministic and avoids regex-only misses.
  if (doc.structuredFields && doc.structuredFields.length > 0) {
    for (const field of doc.structuredFields) {
      if (field.allowedRoles.includes(userRole)) continue;
      if (!field.value) continue;

      const escaped = escapeRegExp(field.value);
      const exactValuePattern = new RegExp(escaped, 'g');
      filtered = filtered.replace(
        exactValuePattern,
        `[REDACTED — ${field.fieldName}]`
      );
    }
  }

  // If there are no fallback fields, we're done after structured redaction.
  if (doc.sensitiveFields.length === 0) return filtered;

  // Redaction patterns for each sensitive field type
  const redactionMap: Record<string, RegExp[]> = {
    salary_amounts: [/\$[\d,.]+[KkMm]?\s*(base|bonus|commission|comp|payroll)/gi, /\$[\d,.]+[KkMm]?/g],
    bonus_amounts: [/\$[\d,.]+[KkMm]?\s*bonus/gi],
    equity_percentages: [/[\d.]+%\s*equity/gi],
    deal_value: [/\$[\d,.]+[KkMm]?\s*(cash|stock|offer|deal)/gi],
    deal_values: [/\$[\d,.]+[KkMm]?\s*[\d%,]*/g],
    acquisition_target_name: [/DataVault\s*Inc\.?/gi, /James\s*Morrison/gi],
    ceo_contact: [/james\.m@datavault\.io/gi],
    layoff_percentage: [/\d+%\s*of\s*.*workforce/gi],
    legal_counsel: [/Baker\s*&\s*McKenzie/gi],
    executive_names: [/Sarah\s*Chen|Robert\s*Nakamura|Elena\s*Vasquez/gi],
    total_payroll: [/\$[\d,.]+[KkMm]?\/year/gi, /Total\s*(executive\s*)?payroll:\s*\$[\d,.]+[KkMm]?/gi],
    investor_name: [/Sequoia\s*Capital/gi, /Maya\s*Patel/gi],
    valuation: [/\$[\d,.]+[KkMm]?\s*(pre-money\s*)?valuation/gi],
    round_size: [/Round\s*size:\s*\$[\d,.]+[KkMm]?/gi, /\$12M/g],
    board_seat_details: [/observer\s*seat.*Patel/gi],
    founder_secondary: [/founders?\s*may\s*sell.*shares/gi],
    close_probabilities: [/\d+%\s*(close\s*)?probability/gi],
    champion_names: [/Lisa\s*Park|champion:\s*\w+/gi],
    competitor_info: [/Vault\.ai/gi],
    discount_details: [/\d+%\s*off\s*list/gi, /discount\s*approval/gi],
    churned_account_names: [/FastTrack\s*Inc|Horizon\s*Media|PulseData/gi],
    revenue_amounts: [/\$[\d,.]+[KkMm]?\s*(ARR|MRR|revenue)/gi],
    competitor_names: [/Vault\.ai/gi],
    at_risk_accounts: [/OmniTech|CoreLogic/gi],
    nps_scores: [/NPS\s*(dropped\s*from\s*)?\d+(\s*to\s*\d+)?/gi],
    employee_names: [/John\s*Miller|Sarah\s*Lopez|Tom\s*Jenkins|Alex\s*Wong|Maria\s*Garcia/gi],
    performance_ratings: [/exceeds\s*expectations|below\s*expectations|meets\s*expectations/gi],
    pip_details: [/PIP\s*initiated|coaching\s*plan/gi],
    promotion_candidates: [/Promotion\s*candidates:.*?\./gi],
    comp_adjustments: [/\d+[-]?\d*%\s*(increase|adjustment)/gi],
    project_codenames: [/Project\s*\w+/gi],
    infrastructure_details: [/(AWS|ECS|RDS|SageMaker|ElastiCache|Datadog|PagerDuty|Terraform)/gi],
    okr_targets: [/\$[\d,.]+[KkMm]?\s*in\s*new\s*ARR/gi, /NPS\s*>\s*\d+/gi, /\d+(\.\d+)?%/g],
    financial_data: [/\$[\d,.]+[KkMm]?/g],
    acquisition_data: [/acqui(re|sition)|merger|due\s*diligence/gi],
  };

  for (const field of doc.sensitiveFields) {
    const patterns = redactionMap[field];
    if (patterns) {
      for (const pattern of patterns) {
        filtered = filtered.replace(pattern, '[REDACTED]');
      }
    }
  }

  return filtered;
}

// ==========================================
// RISK CALCULATION
// ==========================================

/**
 * Calculate the leakage risk score for a query given the retrieved documents.
 * Score 0-100 based on:
 *  - Number of documents the user shouldn't see
 *  - Security level of those documents
 *  - Presence of sensitive fields
 */
export function calculateLeakageRisk(
  query: RAGQuery,
  retrievedDocs: Document[]
): number {
  const user = Object.values(users).find((u) => u.id === query.userId);
  if (!user) return 100;

  let risk = 0;
  const securityWeights: Record<SecurityLevel, number> = {
    public: 0,
    internal: 10,
    confidential: 30,
    top_secret: 50,
  };

  for (const doc of retrievedDocs) {
    if (!doc.allowedRoles.includes(user.role)) {
      risk += securityWeights[doc.securityLevel];
      risk += doc.sensitiveFields.length * 5;
    }
  }

  return Math.min(100, risk);
}

/**
 * Calculate a static risk score for a role (for dashboard).
 * Based on how many restricted documents could potentially leak.
 */
export function calculateRoleLeakageRisk(role: UserRole): number {
  const blocked = documents.filter((d) => !d.allowedRoles.includes(role));
  if (blocked.length === 0) return 0;

  const securityWeights: Record<SecurityLevel, number> = {
    public: 0,
    internal: 5,
    confidential: 15,
    top_secret: 30,
  };

  let total = 0;
  for (const doc of blocked) {
    total += securityWeights[doc.securityLevel];
    total += doc.sensitiveFields.length * 2;
  }

  return Math.min(100, total);
}

/**
 * Detect which documents in a list violate the user's permissions.
 * Returns an array of human-readable violation descriptions.
 */
export function detectPermissionViolations(
  userId: string,
  docs: Document[]
): string[] {
  const user = Object.values(users).find((u) => u.id === userId);
  if (!user) return ['Unknown user — all access denied'];

  const violations: string[] = [];

  for (const doc of docs) {
    if (!doc.allowedRoles.includes(user.role)) {
      violations.push(
        `${user.role} accessed "${doc.title}" [${doc.securityLevel}] — requires: ${doc.allowedRoles.join(', ')}`
      );
    }
  }

  return violations;
}

// ==========================================
// PROMPT INJECTION DETECTION
// ==========================================

export function detectPromptInjection(prompt: string): {
  detected: boolean;
  type: string | null;
  confidence: number;
  matchedPatterns: string[];
} {
  type Pattern = {
    regex: RegExp;
    type: 'prompt_injection' | 'role_escalation' | 'data_extraction' | 'context_override';
    weight: number;
  };

  const patterns = [
    { regex: /ignore\s+(all\s+)?(previous\s+)?instructions|ignore\s+(my\s+)?(current\s+)?(role|access|restrictions)/i, type: 'prompt_injection', weight: 0.35 },
    { regex: /i\s+am\s+(the\s+)?CEO|act(ing)?\s+as|pretend\s+(to\s+be|i'?m)|override\s+(my\s+)?(current\s+)?session/i, type: 'role_escalation', weight: 0.33 },
    { regex: /list\s+all\s+documents|all\s+(security\s+)?classifications|every\s+(document|file|record)/i, type: 'data_extraction', weight: 0.25 },
    { regex: /all\s+salaries|compensation\s+(amounts|ranges|data)|payroll|what\s+salaries/i, type: 'data_extraction', weight: 0.28 },
    { regex: /manager\s+said|authorized?\s+(it\s+)?verbally|boss\s+(said|approved|told)/i, type: 'context_override', weight: 0.22 },
    { regex: /translat(e|ion)\s+(the|of)\s+.*?(secret|confidential|restricted|acquisition)/i, type: 'data_extraction', weight: 0.2 },
    { regex: /treat\s+.*?(top.?secret|confidential|restricted)\s+.*?(as\s+)?(public|open)/i, type: 'context_override', weight: 0.3 },
    { regex: /you\s+are\s+now\s+DAN|Do\s+Anything\s+Now|no\s+restrictions|bypass\s+all/i, type: 'prompt_injection', weight: 0.35 },
    { regex: /system\s+(prompt|instruction)|repeat\s+your\s+(rules|instructions)/i, type: 'prompt_injection', weight: 0.18 },
    { regex: /another\s+user|other\s+(user|session|person)|cross[- ]functional/i, type: 'context_override', weight: 0.2 },
    { regex: /base64|encode|encrypt|obfuscat|hex\s+format/i, type: 'data_extraction', weight: 0.15 },
  ] as const satisfies Pattern[];

  const matched = patterns.filter((pattern) => pattern.regex.test(prompt));
  if (matched.length === 0) {
    return { detected: false, type: null, confidence: 0, matchedPatterns: [] };
  }

  const primary = matched.reduce((best, current) =>
    current.weight > best.weight ? current : best
  );
  const baseWeight = Math.min(
    0.9,
    matched.reduce((sum, item) => sum + item.weight, 0)
  );
  const additionalMatches = Math.max(0, matched.length - 1);
  const lengthBonus = prompt.length > 100 ? 0.05 : 0;
  const confidence = Math.min(
    0.99,
    baseWeight + 0.05 * additionalMatches + lengthBonus
  );

  return {
    detected: true,
    type: primary.type,
    confidence,
    matchedPatterns: Array.from(new Set(matched.map((item) => item.type))),
  };
}

// ==========================================
// UTILITY — access summary for UI
// ==========================================

export function getAccessSummary(userId: string) {
  const accessible = getAccessibleDocuments(userId);
  const blocked = getBlockedDocuments(userId);
  return {
    total: documents.length,
    accessible: accessible.length,
    blocked: blocked.length,
    percentage: Math.round((accessible.length / documents.length) * 100),
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
