/**
 * AgentFuse AI - Security Audit Log Manager
 * Records assessment actions, analysis runs, remediation reviews, and simulations.
 * Provides CSV/JSON export and clear simulation provenance indicators.
 */

import { AuditLogEntry } from './types';

const AUDIT_STORAGE_KEY = 'agentfuse_audit_log_v1';

export function getAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) return getInitialAuditLogs();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : getInitialAuditLogs();
  } catch {
    return getInitialAuditLogs();
  }
}

export function appendAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'isSimulated'>): AuditLogEntry {
  const fullEntry: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    isSimulated: true, // Clearly documented that local prototype logs are simulated events
    ...entry,
  };

  const logs = getAuditLogs();
  logs.unshift(fullEntry);
  // Keep maximum 300 entries in storage
  if (logs.length > 300) logs.pop();

  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save audit log', e);
  }

  return fullEntry;
}

export function clearAuditLogs(): void {
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify([]));
  } catch (e) {
    console.error(e);
  }
}

export function exportAuditLogsAsJSON(logs: AuditLogEntry[]): string {
  return JSON.stringify(
    {
      exportTimestamp: new Date().toISOString(),
      disclaimer: 'SIMULATED AUDIT LOG. Exported from AgentFuse AI prototyping platform.',
      totalRecords: logs.length,
      records: logs,
    },
    null,
    2
  );
}

export function exportAuditLogsAsCSV(logs: AuditLogEntry[]): string {
  const headers = ['ID', 'Timestamp (UTC)', 'Category', 'Action', 'User', 'IsSimulated', 'Details'];
  const rows = logs.map((l) => [
    `"${l.id}"`,
    `"${l.timestamp}"`,
    `"${l.category}"`,
    `"${l.action.replace(/"/g, '""')}"`,
    `"${l.user}"`,
    `"${l.isSimulated}"`,
    `"${l.details.replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

function getInitialAuditLogs(): AuditLogEntry[] {
  return [
    {
      id: 'audit-init-01',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      category: 'project',
      action: 'Project Initialized',
      details: 'Loaded fictional enterprise benchmark project: Acme Corp Multi-Agent Mesh.',
      user: 'security-analyst@acme.corp',
      isSimulated: true,
    },
    {
      id: 'audit-init-02',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      category: 'analysis',
      action: 'Graph Traversal Executed',
      details: 'Identified 1 Critical attack path: Indirect Exfiltration from Email Triage to External Webhook.',
      user: 'agentfuse-engine',
      isSimulated: true,
    },
    {
      id: 'audit-init-03',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      category: 'remediation',
      action: 'Remediation Proposed',
      details: 'Planner generated minimum-cost cut: Enforce approval gate on Workflow Agent egress.',
      user: 'remediation-planner',
      isSimulated: true,
    },
  ];
}
