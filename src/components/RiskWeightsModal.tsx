/**
 * AgentFuse AI - Risk Model Tuning & Formula Configuration Modal
 * Allows operators to customize deterministic risk multipliers, boundary penalties,
 * and approval discount weights with live graph recalculation.
 */

import React, { useState } from 'react';
import { X, Sliders, RotateCcw, Check, Info } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { DEFAULT_RISK_WEIGHTS } from '../core/risk-engine';
import { RiskWeights } from '../core/types';

export const RiskWeightsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { project, updateProject } = useProject();
  const [weights, setWeights] = useState<RiskWeights>(project.riskWeights || DEFAULT_RISK_WEIGHTS);

  if (!isOpen) return null;

  const handleSave = () => {
    updateProject(
      { ...project, riskWeights: weights },
      'Updated Deterministic Risk Model Scoring Weights'
    );
    onClose();
  };

  const handleReset = () => {
    setWeights(DEFAULT_RISK_WEIGHTS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0b1021] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0d1527] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Risk Scoring Weights & Formula</h2>
              <p className="text-xs text-slate-400">Configure deterministic factors and mitigation discounts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh] text-xs">
          <div className="p-3 bg-cyan-950/30 border border-cyan-800/60 rounded-xl text-cyan-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              AgentFuse uses a deterministic calculation model. Tuning these weights updates all path severity calculations instantly. Scores are heuristic estimates for prioritizing remediation, not real-world breach probabilities.
            </p>
          </div>

          {/* Boundary and Untrusted Input Multipliers */}
          <div className="space-y-4">
            <h3 className="font-mono font-bold uppercase text-slate-300 text-xs">
              Architectural Multipliers
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 font-medium">Untrusted Input Multiplier</span>
                  <span className="font-mono text-cyan-400 font-bold">{weights.untrustedInputWeight}x</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.0"
                  step="0.05"
                  value={weights.untrustedInputWeight}
                  onChange={(e) =>
                    setWeights({ ...weights, untrustedInputWeight: parseFloat(e.target.value) })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">Amplifier when entry point accepts unverified prompts</span>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 font-medium">Boundary Crossing Penalty</span>
                  <span className="font-mono text-cyan-400 font-bold">+{weights.boundaryCrossWeight} pts</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  value={weights.boundaryCrossWeight}
                  onChange={(e) =>
                    setWeights({ ...weights, boundaryCrossWeight: parseFloat(e.target.value) })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">Points added per trust boundary transition traversed</span>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 font-medium">Unrestricted Scope Penalty</span>
                  <span className="font-mono text-cyan-400 font-bold">{weights.unrestrictedScopeWeight}x</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="1.8"
                  step="0.05"
                  value={weights.unrestrictedScopeWeight}
                  onChange={(e) =>
                    setWeights({ ...weights, unrestrictedScopeWeight: parseFloat(e.target.value) })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">Multiplier applied when access is not resource-scoped</span>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 font-medium">Approval Gate Discount</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    -{Math.round(weights.approvalMitigationDiscount * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.9"
                  step="0.05"
                  value={weights.approvalMitigationDiscount}
                  onChange={(e) =>
                    setWeights({ ...weights, approvalMitigationDiscount: parseFloat(e.target.value) })
                  }
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500">Risk reduction factor when human approval gate is enforced</span>
              </div>
            </div>
          </div>

          {/* Action Impact Multipliers */}
          <div className="space-y-3">
            <h3 className="font-mono font-bold uppercase text-slate-300 text-xs">
              Action Impact Multipliers
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(weights.actionImpactMultiplier).map(([act, val]) => (
                <div key={act} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex flex-col">
                  <span className="text-[10px] font-mono uppercase text-slate-400">{act}</span>
                  <span className="text-sm font-bold text-white font-mono">{val}x</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#0d1527] border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white text-xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Recalculate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
