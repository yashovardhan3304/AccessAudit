import { describe, expect, it } from 'vitest';
import { isValidUrlInput, normalizeSeverity } from '../src/lib/validators';

describe('AccessAudit validation helpers', () => {
  it('accepts a safe public HTTPS URL', () => {
    expect(isValidUrlInput('https://example.com')).toBe(true);
  });

  it('rejects localhost targets', () => {
    expect(isValidUrlInput('http://localhost:3000')).toBe(false);
  });

  it('maps axe impact levels to readable severities', () => {
    expect(normalizeSeverity('critical')).toBe('critical');
    expect(normalizeSeverity('serious')).toBe('high');
  });
});
