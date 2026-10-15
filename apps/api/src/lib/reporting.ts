export interface MarkdownReportInput {
  auditId: string;
  targetUrl: string;
  findings: Array<{
    ruleId: string;
    impact: string;
    description: string;
    helpUrl: string;
    selector?: string;
    failureSummary?: string;
  }>;
  summary: {
    totalViolations: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export function buildMarkdownReport(input: MarkdownReportInput): string {
  const lines: string[] = [];
  lines.push('# AccessAudit Report');
  lines.push('');
  lines.push(`- Audit ID: ${input.auditId}`);
  lines.push(`- Target URL: ${input.targetUrl}`);
  lines.push(`- Total findings: ${input.summary.totalViolations}`);
  lines.push('');
  lines.push('## Summary');
  lines.push(`- Critical: ${input.summary.critical}`);
  lines.push(`- High: ${input.summary.high}`);
  lines.push(`- Medium: ${input.summary.medium}`);
  lines.push(`- Low: ${input.summary.low}`);
  lines.push('');
  lines.push('## Findings');

  if (!input.findings.length) {
    lines.push('No findings detected.');
    return lines.join('\n');
  }

  for (const finding of input.findings) {
    lines.push(`### ${finding.ruleId}`);
    lines.push(`- Impact: ${finding.impact}`);
    lines.push(`- Description: ${finding.description}`);
    if (finding.selector) lines.push(`- Selector: ${finding.selector}`);
    if (finding.failureSummary) lines.push(`- Summary: ${finding.failureSummary}`);
    lines.push(`- Help: ${finding.helpUrl}`);
    lines.push('');
  }

  return lines.join('\n');
}

export function buildCsvReport(findings: Array<Record<string, string>>): string {
  const headers = ['ruleId', 'impact', 'description', 'helpUrl', 'selector'];
  const rows = findings.map((finding) => headers.map((header) => sanitizeCsvCell(finding[header] ?? '')).join(','));
  return [headers.join(','), ...rows].join('\n');
}

function sanitizeCsvCell(value: string): string {
  const escaped = value.replace(/"/g, '""');
  if (/[",\n]/.test(escaped)) {
    return `"${escaped}"`;
  }
  return escaped.startsWith('=') ? `'${escaped}` : escaped;
}
