import { describe, expect, it } from 'vitest';
import { buildMarkdownReport } from '../src/lib/reporting';

describe('reporting helpers', () => {
  it('renders a markdown report with a summary and findings section', () => {
    const report = buildMarkdownReport({
      auditId: 'a-123',
      targetUrl: 'https://example.com',
      findings: [
        {
          ruleId: 'image-alt',
          impact: 'serious',
          description: 'Images must have alternative text',
          helpUrl: 'https://example-a11y.com'
        }
      ],
      summary: {
        totalViolations: 1,
        critical: 0,
        high: 1,
        medium: 0,
        low: 0
      }
    });

    expect(report).toContain('AccessAudit Report');
    expect(report).toContain('image-alt');
  });
});
