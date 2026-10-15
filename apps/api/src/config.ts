import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT || 4000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  auditTimeoutMs: Number(process.env.AUDIT_TIMEOUT_MS || 45000),
  maxHtmlBytes: Number(process.env.MAX_HTML_BYTES || 250000),
  maxFindingsPerAudit: Number(process.env.MAX_FINDINGS_PER_AUDIT || 300)
};
