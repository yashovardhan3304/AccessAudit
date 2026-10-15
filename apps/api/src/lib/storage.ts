import type { AuditRecord } from '@accessaudit/shared';

const audits = new Map<string, AuditRecord>();

export function listAudits(): AuditRecord[] {
  return Array.from(audits.values()).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function getAudit(id: string): AuditRecord | undefined {
  return audits.get(id);
}

export function upsertAudit(record: AuditRecord): AuditRecord {
  audits.set(record.id, record);
  return record;
}

export function deleteAudit(id: string): boolean {
  return audits.delete(id);
}
