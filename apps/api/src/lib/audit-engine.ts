import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import type { AuditFinding } from '@accessaudit/shared';
import { v4 as uuidv4 } from 'uuid';

export interface AuditExecutionInput {
  targetUrl: string;
  tags: string[];
}

export async function runAccessibilityAudit({ targetUrl, tags }: AuditExecutionInput) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(500);
    const results = await new AxeBuilder({ page }).withTags(tags).analyze();

    const findings: AuditFinding[] = (results.violations || []).map((violation) => {
      const rawSelector = violation.nodes?.[0]?.target ?? 'body';
      const selector = Array.isArray(rawSelector)
        ? rawSelector.join(', ')
        : String(rawSelector);

      return {
      id: uuidv4(),
      auditId: '',
      ruleId: violation.id,
      description: violation.help || 'Accessibility issue detected',
      impact: (violation.impact || 'moderate') as AuditFinding['impact'],
      helpText: violation.help,
      helpUrl: violation.helpUrl || 'https://www.w3.org/WAI/standards-guidelines/wcag/',
      affectedUrl: targetUrl,
      selector,
      htmlSnippet: violation.nodes?.[0]?.html || '<unknown>',
      failureSummary: violation.description || 'Issue detected by automatic accessibility checks.',
      wcagMappings: violation.tags?.filter((tag) => tag.toLowerCase().includes('wcag')) || [],
      pour: classifyPour(violation.tags),
      fingerprint: `${violation.id}:${selector}`,
      evidence: {
        ruleId: violation.id,
        impact: violation.impact || 'moderate',
        summary: violation.description || 'Issue detected'
      },
      createdAt: new Date().toISOString()
      };
    });

    return {
      pageTitle: await page.title(),
      finalUrl: page.url(),
      browserVersion: browser.version(),
      findings,
      raw: results
    };
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

function classifyPour(tags: string[] = []): 'Perceivable' | 'Operable' | 'Understandable' | 'Robust' {
  const lower = tags.join(' ').toLowerCase();
  if (lower.includes('perceivable')) return 'Perceivable';
  if (lower.includes('operable')) return 'Operable';
  if (lower.includes('understandable')) return 'Understandable';
  return 'Robust';
}
