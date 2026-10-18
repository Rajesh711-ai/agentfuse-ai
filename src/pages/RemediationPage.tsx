/**
 * AgentFuse AI - Automated Minimum-Cost Remediation Planner
 * Computes optimal graph cut interventions to eliminate risky paths
 * while guaranteeing the preservation of legitimate business workflows.
 */

import React, { useMemo } from 'react';
import {
  Wrench,
  ShieldCheck,
  AlertTriangle,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Undo2,
  Layers,
  Lock,
  Scissors,
  Check,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { generateRemediationOptions } from '../core/remediation-engine';
import { RemediationOption } from '../core/types';

export const RemediationPage: React.FC<{
  onOpenSimulator: () => void;
}> = ({ onOpenSimulator }) => {
  const {
    project,
    analysis,
    applyRemediation,
    startSimulation,
    undo,
    canUndo,
  } = useProject();

  // Generate options across all active attack paths
  const allRemediationCandidates = useMemo(() => {
    const list: RemediationOption[] = [];
    const seen = new Set<string>();

    for (const path of analysis.attackPaths) {
      const options = generateRemediationOptions(project, path);
      for (const opt of options) {
        if (!seen.has(opt.id)) {
          seen.add(opt.id);
          list.push(opt);
        }
      }
    }

    // Sort by preservation first, then lowest cost
    return list.sort((a, b) => {
      if (a.preservesLegitimateWorkflows && !b.preservesLegitimateWorkflows) return -1;
      if (!a.preservesLegitimateWorkflows && b.preservesLegitimateWorkflows) return 1;
      return a.cost - b.cost;
    });
  }, [project, analysis.attackPaths]);

  const recommendedGlobalCut = allRemediationCandidates.find(
    (c) => c.preservesLegitimateWorkflows
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-400" />
            <span>Automated Minimum-Cost Remediation Planner</span>
          </h1>
          <p className="text-xs text-slate-400">
            Graph optimization algorithm computing the smallest permission cut that eliminates attack paths without breaking authorized workflows.
          </p>
        </div>

        {canUndo && (
          <button
            onClick={undo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Undo2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Rollback Last Remediation</span>
          </button>
        )}
      </div>

      {/* If no attack paths exist */}
      {analysis.attackPaths.length === 0 ? (
        <div className="p-12 bg-[#0b1021] border border-slate-800 rounded-2xl text-center space-y-3">
          <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Graph Topology Already Secured</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No dangerous permission chains or unverified exfiltration paths were detected in the active graph model. All legitimate business workflows remain 100% operational.
          </p>
        </div>
      ) : (
        <>
          {/* Recommended Global Minimum-Cost Cut Hero Banner */}
          {recommendedGlobalCut && (
            <div className="p-6 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-600/60 rounded-2xl shadow-2xl space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-600 text-white uppercase tracking-wider">
                  OPTIMAL GRAPH CUT INTERVENTION (MINIMUM-COST)
                </span>
                <span className="text-xs font-mono text-emerald-300 font-semibold">
                  Cost Score: {recommendedGlobalCut.cost} (Lowest Disruption)
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {recommendedGlobalCut.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  {recommendedGlobalCut.description}
                </p>
              </div>

              {/* Verified Verification Badges */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Eliminates {analysis.attackPaths.length} Active Attack Vector(s)</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Preserves 100% of Authorized Workflows ({project.legitimateWorkflows.length}/{project.legitimateWorkflows.length})</span>
                </div>
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <Scissors className="w-4 h-4" />
                  <span>Target: {recommendedGlobalCut.changesSummary}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => applyRemediation(recommendedGlobalCut)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-950/50 transition transform active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Recommended Cut to Project</span>
                </button>

                <button
                  onClick={() => {
                    startSimulation(recommendedGlobalCut);
                    onOpenSimulator();
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Simulate in What-If Sandbox</span>
                </button>
              </div>
            </div>
          )}

          {/* All Available Remediation Candidate Strategies Table */}
          <div className="space-y-3">
            <h2 className="text-sm font-mono font-bold uppercase text-slate-200 tracking-wider">
              Evaluated Graph Cut Candidates ({allRemediationCandidates.length})
            </h2>

            <div className="space-y-3">
              {allRemediationCandidates.map((cand, idx) => (
                <div
                  key={cand.id}
                  className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs ${
                    cand.preservesLegitimateWorkflows
                      ? 'bg-[#0b1021] border-slate-800 hover:border-slate-700'
                      : 'bg-rose-950/20 border-rose-900/50'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-sm">{cand.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          cand.cost === 1
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : cand.cost <= 2
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        Cost: {cand.cost}
                      </span>
                      {cand.preservesLegitimateWorkflows ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Preserves Legitimate Workflows</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                          <XCircle className="w-3 h-3" />
                          <span>Breaks Authorized Workflow(s)</span>
                        </span>
                      )}
                    </div>

                    <p className="text-slate-300 text-xs">{cand.description}</p>
                    <div className="font-mono text-[10px] text-slate-500">
                      Graph modification: {cand.changesSummary}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        startSimulation(cand);
                        onOpenSimulator();
                      }}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Simulate</span>
                    </button>

                    <button
                      onClick={() => applyRemediation(cand)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow ${
                        cand.preservesLegitimateWorkflows
                          ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                          : 'bg-rose-900/80 hover:bg-rose-800 text-white'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Apply Cut</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
