# Architecture overview

AccessAudit is a small monorepo composed of three main parts: a frontend, an API, and a browser scan engine.

## Request flow

1. A user enters a URL or HTML snippet on the landing page.
2. The frontend sends a request to the Express API at /api/v1/audits.
3. The API validates the input, creates an audit record, and starts a scan job.
4. The browser engine launches Chromium with Playwright, opens the page, and runs axe-core.
5. Findings are normalized, stored in the in-memory database, and exposed through the API.
6. Reports can be generated as PDF, Markdown, CSV, or JSON.
7. The dashboard renders summary cards, charts, and detailed findings.

## Main concerns

- Browser security: URL restrictions and isolated context
- Evidence capture: selectors, snippets, timestamps, tools, and raw result references
- Honest reporting: automated checks are not equivalent to full WCAG conformance
- Reliability: queue limits, timeouts, error capture, and graceful cleanup
