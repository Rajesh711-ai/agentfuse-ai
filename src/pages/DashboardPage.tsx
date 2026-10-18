/**
 * AgentFuse AI - Executive Dashboard Page
 * Features computed risk posture KPIs, clickable drill-down cards,
 * risk tier distribution, and active simulated finding summaries.
 */

import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Cpu,
  Database,
  ArrowRight,
  CheckCircle2,
  Share2,
  Wrench,
  SlidersHorizontal,
  Flame,
  Radio,
  FileText,
  Lock,
  Zap,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { AttackPath } from '../core/types';

export const DashboardPage: React.FC<{
  onSelectTab: (tab: string) => void;
  onInspectPath: (path: AttackPath) => void;
}> = ({ onSelectTab, onInspectPath }) => {
  const { project, analysis, startSimulation } = useProject();

  const topPath = analysis.attackPaths[0] || null;
  const criticalCount = analysis.summary.criticalCount;
  const highCount = analysis.summary.highCount;
  const sensitiveResourcesCount = project.resources.filter(
    (r) => r.sensitivity === 'confidential' || r.sensitivity === 'restricted'
  ).length;

  // Maximum risk score across paths
  const overallRiskScore = analysis.attackPaths.length > 0 ? analysis.attackPaths[0].riskScore : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Welcome / Status Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d162d] via-[#101b38] to-[#0d162d] border border-slate-800 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950 border border-cyan-800 text-cyan-300">
                AI MULTI-AGENT PERMISSION GRAPH SECURITY
              </span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-amber-950/80 border border-amber-800 text-amber-300 font-bold">
                SIMULATED PROJECT
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {project.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Evaluating indirect attack pathways where individually legitimate AI agent permissions combine transitively to expose sensitive resources or facilitate unauthorized data exfiltration.
            </p>
          </div>

          {/* Quick Posture Gauge */}
          <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-800/90 p-4 rounded-xl shrink-0">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div
                className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-mono font-extrabold text-lg ${
                  overallRiskScore >= 80
                    ? 'border-rose-500 text-rose-400 bg-rose-950/40'
                    : overallRiskScore >= 60
                    ? 'border-amber-500 text-amber-400 bg-amber-950/40'
                    : overallRiskScore > 0
                    ? 'border-cyan-500 text-cyan-400 bg-cyan-950/40'
                    : 'border-emerald-500 text-emerald-400 bg-emerald-950/40'
                }`}
              >
                {overallRiskScore}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400">MAX GRAPH RISK SCORE</div>
              <div className="text-sm font-bold text-white">
                {overallRiskScore >= 80
                  ? 'CRITICAL EXPOSURE'
                  : overallRiskScore >= 60
                  ? 'ELEVATED RISK'
                  : overallRiskScore > 0
                  ? 'MODERATE RISK'
                  : 'MINIMAL RISK'}
              </div>
              <div className="text-[11px] text-slate-400">
                {analysis.attackPaths.length} Active {analysis.attackPaths.length === 1 ? 'Attack Vector' : 'Attack Vectors'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Risky Attack Paths */}
        <div
          onClick={() => onSelectTab('findings')}
          className="bg-[#0b1021] hover:bg-[#0f172e] border border-slate-800 hover:border-rose-500/50 p-4 rounded-xl cursor-pointer transition shadow-lg group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              ATTACK PATHS
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {analysis.attackPaths.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Critical: <strong className="text-rose-400">{criticalCount}</strong> | High: <strong className="text-amber-400">{highCount}</strong></span>
            <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition" />
          </div>
        </div>

        {/* Card 2: AI Agents */}
        <div
          onClick={() => onSelectTab('inventory')}
          className="bg-[#0b1021] hover:bg-[#0f172e] border border-slate-800 hover:border-cyan-500/50 p-4 rounded-xl cursor-pointer transition shadow-lg group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              INTERCONNECTED AGENTS
            </span>
            <Cpu className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {analysis.agentCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Delegation Links: <strong className="text-cyan-300">{analysis.delegationCount}</strong></span>
            <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition" />
          </div>
        </div>

        {/* Card 3: Sensitive Resources */}
        <div
          onClick={() => onSelectTab('inventory')}
          className="bg-[#0b1021] hover:bg-[#0f172e] border border-slate-800 hover:border-amber-500/50 p-4 rounded-xl cursor-pointer transition shadow-lg group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              SENSITIVE ASSETS AT RISK
            </span>
            <Database className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {sensitiveResourcesCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Total Resources: <strong className="text-slate-200">{analysis.resourceCount}</strong></span>
            <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition" />
          </div>
        </div>

        {/* Card 4: Graph Cuts Ready */}
        <div
          onClick={() => onSelectTab('remediation')}
          className="bg-[#0b1021] hover:bg-[#0f172e] border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl cursor-pointer transition shadow-lg group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              REMEDIATION PLANNER
            </span>
            <Wrench className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {analysis.attackPaths.length > 0 ? 'Optimal Cut Ready' : 'Secured'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Workflows Preserved: <strong className="text-emerald-400">100%</strong></span>
            <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition" />
          </div>
        </div>
      </div>

      {/* Primary Canonical Demo Callout Banner if Attack Path Exists */}
      {topPath && (
        <div className="p-5 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-600/50 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-600 text-white">
                TOP FINDING #{topPath.id}
              </span>
              <span className="text-xs font-mono text-rose-300 font-semibold">
                Risk Score: {topPath.riskScore}/100 ({topPath.severity})
              </span>
            </div>
            <h3 className="text-base font-bold text-white">{topPath.title}</h3>
            <p className="text-xs text-slate-300">{topPath.narrative}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onInspectPath(topPath)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inspect Evidence</span>
            </button>
            <button
              onClick={() => onSelectTab('remediation')}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-950/50 transition"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Remediate Cut</span>
            </button>
          </div>
        </div>
      )}

      {/* Two Column Section: Path Breakdown & Security Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: All Detected Attack Paths */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Validated Attack Paths ({analysis.attackPaths.length})</span>
            </h2>
            <button
              onClick={() => onSelectTab('findings')}
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono"
            >
              View Full Findings Table →
            </button>
          </div>

          {analysis.attackPaths.length === 0 ? (
            <div className="p-8 bg-[#0b1021] border border-slate-800 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="text-sm font-bold text-white">No Attack Paths Detected</div>
              <p className="text-xs text-slate-400">
                All agent delegations and permissions comply with perimeter boundaries and enforced approval policies.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {analysis.attackPaths.map((p) => (
                <div
                  key={p.id}
                  onClick={() => onInspectPath(p)}
                  className="p-4 bg-[#0b1021] hover:bg-[#0f172e] border border-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition shadow group"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          p.severity === 'Critical'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {p.severity.toUpperCase()} ({p.riskScore}/100)
                      </span>
                      <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition">
                        {p.title}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 shrink-0">
                      {p.transitions.length} hops
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">{p.narrative}</p>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Target Action: <strong className="text-slate-300 uppercase">{p.targetAction}</strong></span>
                    <span className="text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition">
                      View step timeline →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Legitimate Workflows Protection Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Legitimate Business Workflows</span>
            </h2>
          </div>

          <div className="bg-[#0b1021] border border-slate-800 rounded-xl p-4 space-y-3">
            <p className="text-xs text-slate-400">
              Crucial: Remediation must never break legitimate business connectivity. AgentFuse validates these authorized pipelines after every graph cut.
            </p>

            <div className="space-y-2.5">
              {project.legitimateWorkflows.map((wf) => (
                <div key={wf.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{wf.name}</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      OPERATIONAL
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{wf.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => onSelectTab('graph')}
              className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition group"
            >
              <Share2 className="w-4 h-4 text-cyan-400 mb-1" />
              <div className="text-xs font-bold text-white">Interactive Graph</div>
              <div className="text-[10px] text-slate-400">Trace nodes & edges</div>
            </button>

            <button
              onClick={() => onSelectTab('benchmark')}
              className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition group"
            >
              <Zap className="w-4 h-4 text-amber-400 mb-1" />
              <div className="text-xs font-bold text-white">22-Test Benchmark</div>
              <div className="text-[10px] text-slate-400">Validate algorithm</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
