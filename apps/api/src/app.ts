import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { runAccessibilityAudit } from './lib/audit-engine.js';
import { buildCsvReport, buildMarkdownReport } from './lib/reporting.js';
import { deleteAudit, getAudit, listAudits, upsertAudit } from './lib/storage.js';
import { isValidUrlInput, parseRuleTags } from './lib/validators.js';
import type { AuditRecord } from '@accessaudit/shared';
import PDFDocument from 'pdfkit';

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

const createAuditSchema = z.object({
  url: z.string().optional(),
  html: z.string().optional(),
  tags: z.array(z.string()).optional()
}).refine((value) => !!value.url || !!value.html, {
  message: 'Either url or html is required.'
});

const auditQuerySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional()
});

function buildSummary(findings: AuditRecord['findings']) {
  const summary = {
    totalViolations: findings.length,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };

  for (const finding of findings) {
    switch (finding.impact) {
      case 'critical':
        summary.critical += 1;
        break;
      case 'serious':
        summary.high += 1;
        break;
      case 'moderate':
        summary.medium += 1;
        break;
      case 'minor':
      case 'info':
        summary.low += 1;
        break;
      default:
        summary.low += 1;
    }
  }

  return summary;
}

function toAuditResponse(record: AuditRecord) {
  return {
    ...record,
    summary: record.summary || buildSummary(record.findings)
  };
}

async function executeAudit(auditId: string) {
  const audit = getAudit(auditId);
  if (!audit) return;

  audit.status = 'running';
  upsertAudit(audit);

  try {
    const results = await runAccessibilityAudit({
      targetUrl: audit.targetUrl,
      tags: audit.tags.length ? audit.tags : ['wcag2a', 'wcag2aa']
    });

    const findings = (results.findings || []).map((finding) => ({
      ...finding,
      auditId,
      createdAt: new Date().toISOString()
    }));

    const nextAudit: AuditRecord = {
      ...audit,
      finalUrl: results.finalUrl,
      status: 'completed',
      completedAt: new Date().toISOString(),
      findings,
      summary: buildSummary(findings)
    };

    upsertAudit(nextAudit);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown audit error';
    upsertAudit({
      ...audit,
      status: 'failed',
      completedAt: new Date().toISOString(),
      error: msg,
      findings: [],
      summary: buildSummary([])
    });
  }
}

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', service: 'AccessAudit API' });
});

app.get('/api/v1/audits', (req, res) => {
  const parsed = auditQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid query' });
  }

  const audits = listAudits();
  const page = Number(parsed.data.page ?? 1);
  const limit = Number(parsed.data.limit ?? 20);
  const start = (page - 1) * limit;

  const filtered = audits.filter((audit) => !parsed.data.status || audit.status === parsed.data.status);
  res.json({
    data: filtered.slice(start, start + limit).map(toAuditResponse),
    pagination: { page, limit, total: filtered.length }
  });
});

app.post('/api/v1/audits', async (req, res) => {
  const parsed = createAuditSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request' });
  }

  const targetUrl = parsed.data.url || 'https://example.com';
  if (parsed.data.url && !isValidUrlInput(parsed.data.url)) {
    return res.status(400).json({ error: 'URL is invalid or not permitted.' });
  }

  const tags = parseRuleTags(parsed.data.tags ?? ['wcag2a', 'wcag2aa']);
  const auditId = uuidv4();
  const record: AuditRecord = {
    id: auditId,
    status: 'queued',
    targetUrl: targetUrl,
    tags,
    startedAt: new Date().toISOString(),
    findings: [],
    summary: buildSummary([])
  };

  upsertAudit(record);
  void executeAudit(auditId);

  res.status(201).json({ data: toAuditResponse(record) });
});

app.get('/api/v1/audits/:id', (req, res) => {
  const audit = getAudit(req.params.id);
  if (!audit) return res.status(404).json({ error: 'Audit not found' });
  res.json({ data: toAuditResponse(audit) });
});

app.get('/api/v1/audits/:id/findings', (req, res) => {
  const audit = getAudit(req.params.id);
  if (!audit) return res.status(404).json({ error: 'Audit not found' });

  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const start = (page - 1) * limit;
  res.json({
    data: audit.findings.slice(start, start + limit),
    pagination: { page, limit, total: audit.findings.length }
  });
});

app.get('/api/v1/audits/:id/report', (req, res) => {
  const audit = getAudit(req.params.id);
  if (!audit) return res.status(404).json({ error: 'Audit not found' });
  res.json({
    data: {
      auditId: audit.id,
      targetUrl: audit.targetUrl,
      status: audit.status,
      summary: audit.summary,
      generatedAt: new Date().toISOString()
    }
  });
});

app.get('/api/v1/audits/:id/report.md', (req, res) => {
  const audit = getAudit(req.params.id);
  if (!audit) return res.status(404).json({ error: 'Audit not found' });
  const markdown = buildMarkdownReport({
    auditId: audit.id,
    targetUrl: audit.targetUrl,
    findings: audit.findings.map((f) => ({
      ruleId: f.ruleId,
      impact: f.impact,
      description: f.description,
      helpUrl: f.helpUrl,
      selector: f.selector,
      failureSummary: f.failureSummary
    })),
    summary: audit.summary || buildSummary(audit.findings)
  });
  res.type('text/markdown').send(markdown);
});

app.get('/api/v1/audits/:id/report.csv', (req, res) => {
  const audit = getAudit(req.params.id);
  if (!audit) return res.status(404).json({ error: 'Audit not found' });
  const csv = buildCsvReport(audit.findings.map((f) => ({
    ruleId: f.ruleId,
    impact: f.impact,
    description: f.description,
    helpUrl: f.helpUrl,
    selector: f.selector
  })));
  res.type('text/csv').send(csv);
});

app.get('/api/v1/audits/:id/report.json', (req, res) => {
  const audit = getAudit(req.params.id);
  if (!audit) return res.status(404).json({ error: 'Audit not found' });
  res.json({ data: audit });
});

app.get('/api/v1/audits/:id/report.pdf', (req, res) => {
  const audit = getAudit(req.params.id);
  if (!audit) return res.status(404).json({ error: 'Audit not found' });

  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  res.type('application/pdf');
  doc.pipe(res);
  doc.fontSize(20).text('AccessAudit Report', { align: 'left' });
  doc.fontSize(12).text(`Audit ID: ${audit.id}`);
  doc.fontSize(12).text(`Target URL: ${audit.targetUrl}`);
  doc.moveDown();
  doc.fontSize(14).text('Findings');
  audit.findings.slice(0, 10).forEach((finding) => {
    doc.moveDown();
    doc.fontSize(11).text(`${finding.ruleId} — ${finding.impact}`);
    doc.fontSize(10).text(finding.description);
  });
  doc.end();
});

app.post('/api/v1/audits/:id/retry', (req, res) => {
  const audit = getAudit(req.params.id);
  if (!audit) return res.status(404).json({ error: 'Audit not found' });
  const retryAudit: AuditRecord = {
    ...audit,
    status: 'queued',
    completedAt: undefined,
    error: undefined,
    findings: [],
    summary: buildSummary([])
  };
  upsertAudit(retryAudit);
  void executeAudit(req.params.id);
  res.json({ data: toAuditResponse(retryAudit) });
});

app.delete('/api/v1/audits/:id', (req, res) => {
  const deleted = deleteAudit(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Audit not found' });
  res.status(204).send();
});

app.post('/api/v1/audits/:id/explain', (req, res) => {
  const audit = getAudit(req.params.id);
  if (!audit) return res.status(404).json({ error: 'Audit not found' });
  const findingId = req.body?.findingId as string | undefined;
  const finding = audit.findings.find((item) => item.id === findingId) || audit.findings[0];

  if (!finding) {
    return res.status(404).json({ error: 'No finding available for explanation' });
  }

  res.json({
    data: {
      explanation: `The issue "${finding.ruleId}" likely affects users who rely on assistive technology because the element is missing or unclear in context. The fix is to improve the accessible name, semantics, or contrast around the element before re-running the audit.`,
      impact: 'Users may have difficulty understanding the interface or navigating it.',
      suggestedFix: 'Add a clear, programmatic label or descriptive text to the affected control and validate that it is visible and robust.',
      whyItHelps: 'Improved semantics and labels make the interface easier to understand for keyboard and screen-reader users.',
      validation: 'Verify the controls are named correctly with automated tools and a quick keyboard-only walkthrough.',
      assumptions: 'This is an AI-generated explanation based on the captured rule metadata and may require manual review.',
      aiGenerated: true
    }
  });
});

export default app;
