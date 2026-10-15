# AccessAudit

AccessAudit is a full-stack accessibility auditing platform for scanning public web pages and HTML fragments using Playwright + axe-core. It stores audit metadata, findings, and reports, with a dashboard for exploring issues and exporting PDF, Markdown, CSV, and JSON reports.

## Features

- URL-based and HTML-based accessibility scans
- WCAG tag filtering and severity summaries
- Playwright + axe-core execution with evidence capture
- Audit history dashboard and finding details
- PDF/Markdown/CSV/JSON report generation
- Optional Gemini explanation service
- Demo data and fixtures for local testing

## Quick start

```bash
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Then open http://localhost:5173.

The API runs on http://localhost:4000.
