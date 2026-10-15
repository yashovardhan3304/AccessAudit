# Testing strategy

AccessAudit includes a mix of unit, integration, frontend, and browser-driven tests.

## Unit tests

- URL validation and SSRF policy
- Severity normalization
- Report rendering
- CSV safety

## Integration tests

- Audit creation
- Finding retrieval
- Report generation
- Retry and delete flows

## Frontend tests

- Form validation
- Loading and error states
- Landing page render

## Browser fixtures

The project includes an accessible page and an intentionally inaccessible page used to verify detection of common rule failures.
