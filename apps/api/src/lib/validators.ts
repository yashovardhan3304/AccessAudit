import { z } from 'zod';

export const auditTagsSchema = z.array(z.string()).default(['wcag2a', 'wcag2aa']);

export function isValidUrlInput(value: string): boolean {
  if (!value || typeof value !== 'string') return false;

  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    if (url.username || url.password) return false;

    const hostname = url.hostname.toLowerCase();
    const blockedHosts = ['localhost', '127.0.0.1', '::1'];
    if (blockedHosts.includes(hostname) || hostname.endsWith('.localhost')) return false;
    if (/^127\.|^10\.|^172\.(1[6-9]|2\d|3[01])\.|^192\.168\.|^169\.254\.|^::1$/.test(hostname)) return false;
    if (hostname === 'metadata.google.internal' || hostname.includes('metadata')) return false;

    const allowedPorts = new Set(['', '80', '443', '8443']);
    if (!allowedPorts.has(url.port)) return false;

    return true;
  } catch {
    return false;
  }
}

export function normalizeSeverity(impact: string): 'critical' | 'high' | 'medium' | 'low' {
  const value = (impact || '').toLowerCase();
  if (value === 'critical') return 'critical';
  if (value === 'serious' || value === 'urgent') return 'high';
  if (value === 'moderate') return 'medium';
  return 'low';
}

export function parseRuleTags(rawTags?: string[]): string[] {
  const allowed = ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];
  const next = (rawTags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  return next.filter((tag) => allowed.includes(tag));
}
