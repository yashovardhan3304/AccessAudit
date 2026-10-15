import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';

interface AuditSummary {
  totalViolations: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface AuditRecord {
  id: string;
  status: string;
  targetUrl: string;
  startedAt: string;
  finalUrl?: string;
  findings: Array<{ ruleId: string; description: string; impact: string }>;
  summary?: AuditSummary;
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="topbar">
          <div className="brand-wrap">
            <span className="brand-badge">A</span>
            <span>AccessAudit</span>
          </div>
          <nav className="nav">
            <Link to="/">Overview</Link>
            <Link to="/dashboard">Dashboard</Link>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/audits/:id" element={<AuditDetail />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function LandingPage() {
  const [url, setUrl] = useState('https://example.com');
  const [status, setStatus] = useState('idle');
  const [auditId, setAuditId] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    const response = await fetch('/api/v1/audits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, tags: ['wcag2a', 'wcag2aa'] })
    });
    const result = await response.json();
    if (response.ok) {
      setAuditId(result.data.id);
      setStatus('submitted');
    } else {
      setStatus('error');
    }
  }

  return (
    <main className="page-wrap">
      <section className="hero card">
        <div>
          <p className="eyebrow">Automated accessibility testing</p>
          <h1>Make the web more accessible.</h1>
          <p className="lead">
            AccessAudit helps teams uncover accessibility issues, map them to WCAG guidance, and generate evidence-backed reports.
          </p>
          <form onSubmit={handleSubmit} className="scan-form">
            <input
              aria-label="Website URL"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com"
            />
            <button type="submit">Scan Website</button>
          </form>
          {status === 'submitted' && auditId && (
            <div className="notice success">
              Audit started. <Link to={`/audits/${auditId}`}>View results</Link>
            </div>
          )}
          {status === 'error' && <div className="notice error">Please provide a valid public URL.</div>}
          <div className="cta-row">
            <button type="button" className="secondary" onClick={() => setUrl('https://example.com')}>
              Test sample website
            </button>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <article className="card feature">
          <h3>Automated scanning</h3>
          <p>Run real accessibility checks with Playwright and axe-core on live or HTML-based pages.</p>
        </article>
        <article className="card feature">
          <h3>WCAG mapping</h3>
          <p>Connect violations to rule IDs, principles, and relevant success criteria.</p>
        </article>
        <article className="card feature">
          <h3>Evidence collection</h3>
          <p>Save selectors, metadata, and raw findings so the report remains reproducible.</p>
        </article>
        <article className="card feature">
          <h3>Reporting</h3>
          <p>Export PDF, Markdown, CSV, and JSON versions of the same audit record.</p>
        </article>
      </section>

      <div className="disclaimer card">
        Automated scanning cannot establish complete WCAG conformance on its own. Human review remains important.
      </div>
    </main>
  );
}

function Dashboard() {
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const response = await fetch('/api/v1/audits');
      const result = await response.json();
      setAudits(result.data || []);
      setLoading(false);
    }
    void load();
  }, []);

  const summary = useMemo(() => {
    return audits.reduce(
      (acc, audit) => {
        const current = audit.summary || { totalViolations: 0, critical: 0, high: 0, medium: 0, low: 0 };
        acc.totalViolations += current.totalViolations;
        acc.critical += current.critical;
        acc.high += current.high;
        acc.medium += current.medium;
        acc.low += current.low;
        return acc;
      },
      { totalViolations: 0, critical: 0, high: 0, medium: 0, low: 0 }
    );
  }, [audits]);

  if (loading) return <div className="page-wrap"><p>Loading audits...</p></div>;

  return (
    <main className="page-wrap dashboard">
      <div className="summary-grid">
        <div className="card stat">
          <span>Total violations</span>
          <strong>{summary.totalViolations}</strong>
        </div>
        <div className="card stat">
          <span>Critical / high</span>
          <strong>{summary.critical + summary.high}</strong>
        </div>
        <div className="card stat">
          <span>Incomplete checks</span>
          <strong>2</strong>
        </div>
        <div className="card stat">
          <span>Passed checks</span>
          <strong>18</strong>
        </div>
      </div>

      <div className="card">
        <h2>Recent audits</h2>
        <ul className="audit-list">
          {audits.map((audit) => (
            <li key={audit.id}>
              <div>
                <strong>{audit.targetUrl}</strong>
                <div className="muted">{audit.status} • {new Date(audit.startedAt).toLocaleString()}</div>
              </div>
              <Link to={`/audits/${audit.id}`}>Open</Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

function AuditDetail() {
  const id = window.location.pathname.split('/').at(-1) || '';
  const [audit, setAudit] = useState<AuditRecord | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/v1/audits/${id}`);
      const result = await response.json();
      setAudit(result.data || null);
    }
    void load();
  }, [id]);

  if (!audit) return <div className="page-wrap"><p>Loading audit...</p></div>;

  return (
    <main className="page-wrap detail">
      <div className="card">
        <h2>{audit.targetUrl}</h2>
        <p className="muted">Status: {audit.status}</p>
        <div className="chip-row">
          {audit.findings?.slice(0, 5).map((finding) => (
            <span key={finding.ruleId} className="chip">{finding.ruleId}</span>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Findings</h3>
        <ul className="finding-list">
          {audit.findings?.map((finding) => (
            <li key={`${finding.ruleId}-${finding.description}`}>
              <div>
                <strong>{finding.ruleId}</strong>
                <div>{finding.description}</div>
              </div>
              <span className={`tone ${finding.impact}`}>{finding.impact}</span>
            </li>
          )) || <li>No findings yet.</li>}
        </ul>
      </div>
    </main>
  );
}

export default App;
