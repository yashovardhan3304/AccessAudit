export type Severity = 'critical' | 'serious' | 'moderate' | 'minor' | 'info';
export type AuditStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type PourPrinciple = 'Perceivable' | 'Operable' | 'Understandable' | 'Robust';

export interface AuditFinding {
  id: string;
  auditId: string;
  ruleId: string;
  description: string;
  impact: Severity;
  helpText: string;
  helpUrl: string;
  affectedUrl: string;
  selector: string;
  htmlSnippet: string;
  failureSummary: string;
  wcagMappings: string[];
  pour: PourPrinciple;
  fingerprint: string;
  evidence: Record<string, string>;
  createdAt: string;
}

export interface AuditRecord {
  id: string;
  status: AuditStatus;
  targetUrl: string;
  finalUrl?: string;
  tags: string[];
  startedAt: string;
  completedAt?: string;
  error?: string;
  findings: AuditFinding[];
  summary?: { totalViolations: number; critical: number; high: number; medium: number; low: number; };
}

export interface AuditCreateInput {
  url?: string;
  html?: string;
  tags?: string[];
}

export const defaultTags = ['wcag2a', 'wcag2aa', 'wcag2aaa'];
