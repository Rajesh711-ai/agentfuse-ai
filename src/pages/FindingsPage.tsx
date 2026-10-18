/**
 * AgentFuse AI - Findings & Attack Paths Page
 * Displays all validated indirect attack pathways, categorized by severity,
 * with transition sequence previews, risk factor summaries, and action triggers.
 */

import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Shield,
  CheckCircle2,
  Filter,
  Search,
  ExternalLink,
  Wrench,
  SlidersHorizontal,
  Flame,
  Info,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { AttackPath } from '../core/types';
import { generateRemediationOptions } from '../core/remediation-engine';

export const FindingsPage: React.FC<{
  onInspectPath: (path: AttackPath) => void;
  onOpenRemediate: () => void;
  onOpenSimulator: () => void;
}> = ({ onInspectPath, onOpenRemediate, onOpenSimulator }) => {
  const { project, analysis, startSimulation, applyRemediation } = useProject();

  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPaths = analysis.attackPaths.filter((p) => {
    if (severityFilter !== 'all' && p.severity.toLowerCase() !== severityFilter) return false;
    if (searchTerm && !p.title.toLowerCase().includes(searchTerm.toLowerCase()) && !p.narrative.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Summary KPIs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-500" />
            <span>Validated Attack Paths & Findings</span>
          </h1>
          <p className="text-xs text-slate-400">
            Discovered through multi-hop BFS graph traversal, validating explicit permissions and context forwarding.
          </p>
        </div>

        {/* Severity counts pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-xs">
            <span className="flex items-center gap-1 text-rose-400 font-bold">
              Critical: {analysis.summary.criticalCount}
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              High: {analysis.summary.highCount}
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1 text-cyan-400 font-bold">
              Medium: {analysis.summary.mediumCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0b1021] border border-slate-800 p-3 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300 font-medium">Filter Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 py-1 px-2.5 rounded-lg focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search finding or narrative..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-56 text-xs"
          />
        </div>
      </div>

      {/* Findings List */}
      {filteredPaths.length === 0 ? (
        <div className="p-12 bg-[#0b1021] border border-slate-800 rounded-2xl text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No Attack Paths Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {severityFilter !== 'all'
              ? `No attack paths match the '${severityFilter}' filter criteria.`
              : 'The permission graph is fully protected against indirect data exfiltration and unverified escalation.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPaths.map((path) => {
            const candidateRemediations = generateRemediationOptions(project, path);
            const bestRemediation = candidateRemediations[0] || null;

            return (
              <div
                key={path.id}
                className="bg-[#0b1021] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border ${
                          path.severity === 'Critical'
                            ? 'bg-rose-950/80 text-rose-300 border-rose-600'
                            : 'bg-amber-950/80 text-amber-300 border-amber-600'
                        }`}
                      >
                        {path.severity.toUpperCase()} ({path.riskScore}/100)
                      </span>
                      <span className="font-mono text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {path.category.toUpperCase()}
                      </span>
                      <span className="text-[11px] font-mono text-cyan-400">
                        {path.transitions.length} Transition Steps
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white tracking-tight">{path.title}</h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onInspectPath(path)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Inspect Evidence</span>
                    </button>

                    {bestRemediation && (
                      <button
                        onClick={() => {
                          startSimulation(bestRemediation);
                          onOpenSimulator();
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Simulate Cut</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Narrative brief */}
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
                  {path.narrative}
                </p>

                {/* Step Transition Pills Horizontal Flow */}
                <div className="overflow-x-auto pb-1">
                  <div className="flex items-center gap-2 min-w-max text-xs">
                    {path.transitions.map((t, idx) => (
                      <React.Fragment key={idx}>
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px]">
                          <span className="text-cyan-400 font-bold">#{t.step}</span>
                          <span className="text-white font-medium">{t.fromName}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-200 font-medium">{t.toName}</span>
                        </div>
                        {idx < path.transitions.length - 1 && (
                          <span className="text-slate-600 font-bold">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Bottom Optimal Cut Recommendation Preview */}
                {bestRemediation && (
                  <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Wrench className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span>Recommended Minimum-Cost Intervention: </span>
                        <strong className="text-emerald-300">{bestRemediation.title}</strong>{' '}
                        <span className="text-slate-500 font-mono text-[10px]">(Cost: {bestRemediation.cost})</span>
                      </div>
                    </div>

                    <button
                      onClick={() => applyRemediation(bestRemediation)}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow shrink-0"
                    >
                      <span>Apply Remediation</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
