/**
 * AgentFuse AI - Security Audit Log Page
 * Records project state mutations, traversal runs, remediations, and benchmarks.
 * Provides live search, category filtering, and JSON/CSV export.
 */

import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Download,
  Filter,
  Search,
  Trash2,
  FileCode,
  FileSpreadsheet,
  Info,
  Calendar,
  Shield,
  User,
} from 'lucide-react';
import {
  getAuditLogs,
  exportAuditLogsAsJSON,
  exportAuditLogsAsCSV,
  clearAuditLogs,
} from '../core/audit-logger';
import { AuditLogEntry } from '../core/types';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLogs(getAuditLogs());
  }, []);

  const handleDownloadJSON = () => {
    const jsonStr = exportAuditLogsAsJSON(logs);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agentfuse-audit-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const csvStr = exportAuditLogsAsCSV(logs);
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agentfuse-audit-log-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((log) => {
    if (categoryFilter !== 'all' && log.category !== categoryFilter) return false;
    if (
      searchTerm &&
      !log.action.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !log.details.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !log.id.includes(searchTerm)
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Download Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-cyan-400" />
            <span>Security Audit Trail & Governance Log</span>
          </h1>
          <p className="text-xs text-slate-400">
            Chronological record of model changes, traversal runs, proposed remediations, and benchmark runs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleDownloadJSON}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Audit Provenance Disclaimer Note */}
      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">PROTOTYPE ENVIRONMENT GOVERNANCE NOTICE: </strong>
          All records generated represent simulated modeling events within this browser session. While local logs are protected against ordinary accidental UI modification, a local prototype does not provide immutable tamper-proof enterprise cryptographic SIEM forwarding.
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0b1021] border border-slate-800 p-3 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300 font-medium">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 py-1 px-2.5 rounded-lg font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Events ({logs.length})</option>
            <option value="analysis">Graph Analyses</option>
            <option value="remediation">Remediation Actions</option>
            <option value="simulation">What-If Simulations</option>
            <option value="project">Project Updates</option>
            <option value="benchmark">Benchmark Runs</option>
          </select>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-56 text-xs"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#0b1021] border border-slate-800 rounded-xl overflow-hidden shadow-xl text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Timestamp (UTC)</th>
                <th className="py-2.5 px-4">Event ID</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Actor</th>
                <th className="py-2.5 px-4">Details & Payload</th>
                <th className="py-2.5 px-4 text-right">Provenance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredLogs.map((log) => {
                const categoryBadge =
                  log.category === 'remediation'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : log.category === 'simulation'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : log.category === 'analysis'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-cyan-950 text-cyan-300 border border-cyan-800';

                return (
                  <tr key={log.id} className="hover:bg-slate-900/60 transition">
                    <td className="py-2.5 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toISOString().replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-cyan-400">{log.id}</td>
                    <td className="py-2.5 px-4 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${categoryBadge}`}>
                        {log.category.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-white">{log.action}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">{log.user}</td>
                    <td className="py-2.5 px-4 text-slate-300 max-w-md truncate">{log.details}</td>
                    <td className="py-2.5 px-4 text-right">
                      <span className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-slate-900 text-slate-500 border border-slate-800">
                        SIMULATED
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
