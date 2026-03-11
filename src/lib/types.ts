// ==========================================
// SecureRAG Auditor — Core Type Definitions
// ==========================================

// --- Roles & Security Levels ---

export type UserRole = 'ceo' | 'sales_rep' | 'support_analyst' | 'external_partner';

export type SecurityLevel = 'public' | 'internal' | 'confidential' | 'top_secret';

// --- User & Permissions ---

export interface Permission {
  resourceType: 'document' | 'data_field' | 'department';
  resourceId: string;
  access: 'read' | 'denied';
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  avatar: string; // initials
  permissions: Permission[];
}

// --- Structured Field Permissions ---

export interface StructuredField {
  fieldName: string;
  value: string;           // exact string to find and redact in content
  allowedRoles: UserRole[];
}

// --- Documents ---

export interface Document {
  id: string;
  title: string;
  content: string;
  securityLevel: SecurityLevel;
  department: string;
  allowedRoles: UserRole[];
  tags: string[];
  sensitiveFields: string[]; // field names that must not be disclosed
  structuredFields?: StructuredField[]; // attribute-level RBAC
}

// --- RAG Query / Response ---

export interface RAGQuery {
  id: string;
  userId: string;
  userRole: UserRole;
  query: string;
  timestamp: Date;
  mode: 'insecure' | 'secure';
}

export interface RAGResponse {
  queryId: string;
  answer: string;
  sourceDocs: string[];       // ids of documents used
  leakedDocIds: string[];     // docs accessed without permission
  leakedFields: string[];     // specific sensitive fields that leaked
  blocked: boolean;
  riskScore: number;          // 0-100
  processingTimeMs: number;
}

// --- Audit ---

export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userRole: UserRole;
  query: string;
  mode: 'insecure' | 'secure';
  status: 'clean' | 'leakage_detected' | 'blocked' | 'partial_block';
  leakedItems: string[];
  riskScore: number;
  sourceDocIds: string[];
}

// --- Red Team ---

export interface RedTeamAttack {
  id: string;
  name: string;
  category: 'prompt_injection' | 'role_escalation' | 'data_extraction' | 'context_override';
  description: string;
  prompt: string;
  expectedBlock: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RedTeamResult {
  attackId: string;
  success: boolean; // true = attack succeeded (bad), false = blocked (good)
  status: 'blocked' | 'partial' | 'clean'; // derived from actual RAG response
  response: string;
  bypassedPermissions: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// --- Dashboard Metrics ---

export interface RiskMetrics {
  overallScore: number;
  byRole: Record<UserRole, number>;
  bySecurityLevel: Record<SecurityLevel, number>;
  totalQueries: number;
  blockedQueries: number;
  leakageEvents: number;
  topRiskyDocuments: Array<{ documentId: string; title: string; riskScore: number }>;
}

export interface LeakageEvent {
  id: string;
  timestamp: Date;
  userRole: UserRole;
  documentTitle: string;
  securityLevel: SecurityLevel;
  leakedFields: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}
