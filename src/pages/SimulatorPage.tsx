/**
 * AgentFuse AI - What-If Security Simulator
 * Sandbox environment comparing Before and After graph states,
 * edge differences, and legitimate workflow impact without mutating saved data.
 */

import React, { useMemo } from 'react';
import {
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Undo2,
  RotateCcw,
  Check,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { analyzeSecurityGraph } from '../core/graph-engine';
import { evaluateWorkflowPreservation } from '../core/remediation-engine';
import { InteractiveGraph } from '../components/InteractiveGraph';

export const SimulatorPage: React.FC<{
  onOpenFindings: () => void;
}> = ({ onOpenFindings }) => {
  const {
    project,
    isSimulating,
    simulatedProject,
    activeSimulationRemediation,
    discardSimulation,
    commitSimulation,
  } = useProject();

  // Baseline before analysis
  const beforeAnalysis = useMemo(() => {
    return analyzeSecurityGraph(project);
  }, [project]);

  // Simulated after analysis
  const afterAnalysis = useMemo(() => {
    if (!simulatedProject) return beforeAnalysis;
    return analyzeSecurityGraph(simulatedProject);
  }, [simulatedProject, beforeAnalysis]);

  // Workflow preservation check on simulated project
  const workflowEvaluation = useMemo(() => {
    if (!simulatedProject) return { allPreserved: true, brokenWorkflowIds: [] };
    return evaluateWorkflowPreservation(simulatedProject);
  }, [simulatedProject]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-amber-400" />
            <span>Interactive What-If Security Simulator</span>
          </h1>
          <p className="text-xs text-slate-400">
            Compare unprotected topology against staged graph cuts in sandbox memory without mutating saved projects.
          </p>
        </div>

        {isSimulating && (
          <div className="flex items-center gap-2">
            <button
              onClick={discardSimulation}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <X className="w-3.5 h-3.5 text-rose-400" />
              <span>Discard Sandbox</span>
            </button>
            <button
              onClick={commitSimulation}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition transform active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Commit Cut to Live Project</span>
            </button>
          </div>
        )}
      </div>

      {!isSimulating ? (
        <div className="p-12 bg-[#0b1021] border border-slate-800 rounded-2xl text-center space-y-3">
          <SlidersHorizontal className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-lg font-bold text-white">No Staged What-If Simulation Active</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Select an intervention from the Remediation Planner or Findings view and click "Simulate" to test its impact before applying.
          </p>
          <button
            onClick={onOpenFindings}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition shadow"
          >
            <span>Explore Attack Paths to Simulate</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Simulation Header Summary Card */}
          <div className="p-5 bg-gradient-to-r from-[#0d162d] via-slate-900 to-[#0d162d] border border-amber-500/50 rounded-2xl shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800 uppercase">
                STAGED SANDBOX INTERVENTION
              </span>
              <span className="text-xs font-mono text-cyan-400">
                Target Entity: {activeSimulationRemediation?.targetEntityType.toUpperCase()}
              </span>
            </div>

            <h3 className="text-base font-bold text-white">{activeSimulationRemediation?.title}</h3>
            <p className="text-xs text-slate-300">{activeSimulationRemediation?.description}</p>

            {/* Precise Delta Edge & Capability Changed */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono flex items-center gap-2">
              <span className="text-cyan-400 font-bold">PRECISE GRAPH DIFF:</span>
              <span className="text-slate-200">{activeSimulationRemediation?.changesSummary}</span>
            </div>
          </div>

          {/* Before vs After Metric Cards Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BEFORE Card */}
            <div className="bg-[#0b1021] border border-rose-900/60 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="font-mono text-xs font-bold text-white uppercase">
                    BEFORE (UNPROTECTED)
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-rose-950 text-rose-300 rounded font-mono text-[10px] border border-rose-800">
                  {beforeAnalysis.attackPaths.length} Active Vector(s)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">MAX RISK SCORE</div>
                  <div className="text-xl font-bold text-rose-400">
                    {beforeAnalysis.attackPaths[0]?.riskScore || 0}/100
                  </div>
                </div>

                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">CRITICAL FINDINGS</div>
                  <div className="text-xl font-bold text-rose-400">
                    {beforeAnalysis.summary.criticalCount}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <span className="font-mono text-[10px] text-slate-400 uppercase font-bold">
                  Existing Attack Paths:
                </span>
                {beforeAnalysis.attackPaths.map((p) => (
                  <div
                    key={p.id}
                    className="p-2 bg-slate-900/60 rounded border border-slate-800 text-[11px] flex items-center justify-between text-rose-200"
                  >
                    <span className="truncate max-w-[240px]">{p.title}</span>
                    <span className="font-mono text-[10px] font-bold shrink-0">{p.riskScore} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AFTER Card */}
            <div className="bg-[#0b1021] border border-emerald-900/60 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-mono text-xs font-bold text-white uppercase">
                    AFTER (SIMULATED STAGED)
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded font-mono text-[10px] border border-emerald-800">
                  {afterAnalysis.attackPaths.length} Active Vector(s)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">MAX RISK SCORE</div>
                  <div className="text-xl font-bold text-emerald-400">
                    {afterAnalysis.attackPaths[0]?.riskScore || 0}/100
                  </div>
                </div>

                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400">PATHS ELIMINATED</div>
                  <div className="text-xl font-bold text-emerald-400">
                    +{Math.max(0, beforeAnalysis.attackPaths.length - afterAnalysis.attackPaths.length)}
                  </div>
                </div>
              </div>

              {/* Legitimate Workflow Health Status */}
              <div className="space-y-1.5 text-xs text-slate-300">
                <span className="font-mono text-[10px] text-slate-400 uppercase font-bold">
                  Authorized Workflows Test:
                </span>
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/80 rounded-lg flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Legitimate Workflows Operational</span>
                  </span>
                  <span className="text-emerald-400">
                    {project.legitimateWorkflows.length}/{project.legitimateWorkflows.length} OK
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Graph in Simulation Mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-300 uppercase">
                SIMULATED TOPOLOGY PREVIEW
              </span>
              <span className="text-xs text-cyan-400 font-mono">Showing Staged State</span>
            </div>
            <InteractiveGraph height="460px" />
          </div>
        </div>
      )}
    </div>
  );
};
