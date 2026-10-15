# Threat model

AccessAudit is designed around security-first behavior because it accepts arbitrary URLs and potentially untrusted HTML. The main attack surfaces are SSRF, malicious DOM payloads, browser sandbox escapes, AI prompt injection, and report exposure.

## SSRF defenses

- Public URLs only
- Reject localhost, loopback, RFC1918 ranges, link-local addresses, and metadata endpoints
- Revalidate redirects
- Block dangerous ports and embedded credentials
- Enforce sandboxed Playwright execution

## Malicious HTML

- HTML scans are rendered in isolated contexts without external resources
- JavaScript is blocked or heavily restricted
- The app never executes arbitrary code from user input

## AI safety

- The AI service only receives minimal evidence excerpts
- Findings are never overwritten by AI output
- Gemini responses are validated against a schema

## Data protection

- Sensitive browser information is sanitized before storage
- Reports are generated for the audit record and never for unknown resources
- Deletion endpoints remove associated audit data
