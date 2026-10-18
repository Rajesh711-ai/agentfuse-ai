/**
 * AgentFuse AI - Finding & Attack Path Evidence Details Modal
 * Features:
 * - Step-by-step validated transition timeline with entity badges
 * - Boundary crossing and explicit model assumptions
 * - Deterministic risk calculation breakdown
 * - Server-side Gemini AI-assisted security analysis (with fallback)
 * - Quick remediation triggers
 */

import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Cpu,
  Database,
  Lock,
  Sparkles,
  HelpCircle,
  Wrench,
  SlidersHorizontal,
  ChevronRight,
  CheckCircle2,
  Info,
  Send,
  Loader2,
} from 'lucide-react';
import { AttackPath, PathTransition } from '../core/types';
import { useProject } from '../context/ProjectContext';
import { generateRemediationOptions } from '../core/remediation-engine';

export const FindingDetailModal: React.FC<{
  path: AttackPath | null;
  onClose: () => void;
  onSelectRemediate?: (path: AttackPath) => void;
  onSelectSimulate?: (path: AttackPath) => void;
}> = ({ path, onClose, onSelectRemediate, onSelectSimulate }) => {
  const { project, applyRemediation, startSimulation } = useProject();

  const [aiAnalysis, setAiAnalysis] = useState<{
    summary?: string;
    attackVectorAnalysis?: string;
    rootCause?: string;
    businessImpact?: string;
    defenseInDepthRecommendation?: string;
    isAIGenerated?: boolean;
    modelUsed?: string;
  } | null>(null);

  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [activeTab, setActiveTab] = useState<'timeline' | 'risk_math' | 'ai_analysis'>('timeline');

  if (!path) return null;

  const candidateRemediations = generateRemediationOptions(project, path);

  const fetchAiAnalysis = async (customPrompt?: string) => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/ai-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pathData: path,
          userQuestion: customPrompt || userQuestion,
        }),
      });
      const data = await res.json();
      setAiAnalysis(data);
      setActiveTab('ai_analysis');
    } catch (e) {
      console.error('Failed to query AI analysis', e);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const severityColor =
    path.severity === 'Critical'
      ? 'text-rose-400 bg-rose-950/80 border-rose-600'
      : path.severity === 'High'
      ? 'text-amber-400 bg-amber-950/80 border-amber-600'
      : path.severity === 'Medium'
      ? 'text-cyan-400 bg-cyan-950/80 border-cyan-600'
      : 'text-slate-400 bg-slate-900 border-slate-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0b1021] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0d1527] border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${severityColor}`}>
                {path.severity.toUpperCase()} RISK {path.riskScore}/100
              </span>
              <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                CATEGORY: {path.category.toUpperCase()}
              </span>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/60">
                {path.transitions.length} STEPS
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight leading-snug">{path.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-6 bg-slate-950/60 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-2.5 px-4 font-semibold border-b-2 transition ${
              activeTab === 'timeline'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Step-by-Step Validated Transitions ({path.transitions.length})
          </button>
          <button
            onClick={() => setActiveTab('risk_math')}
            className={`py-2.5 px-4 font-semibold border-b-2 transition ${
              activeTab === 'risk_math'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Deterministic Risk Score Breakdown
          </button>
          <button
            onClick={() => {
              setActiveTab('ai_analysis');
              if (!aiAnalysis && !isLoadingAi) fetchAiAnalysis();
            }}
            className={`py-2.5 px-4 font-semibold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'ai_analysis'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Risk Explanation & Modeling</span>
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed">
                <strong className="text-white">Threat Narrative: </strong>
                {path.narrative}
              </div>

              {/* Step Timeline */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                {path.transitions.map((trans, idx) => {
                  const isExfil = trans.transitionType === 'data_exfiltration';
                  const isIntake = trans.transitionType === 'untrusted_intake';
                  const isPerm = trans.transitionType === 'permission_access';

                  return (
                    <div key={idx} className="relative group">
                      {/* Step Circle */}
                      <div
                        className={`absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold border ${
                          isExfil
                            ? 'bg-rose-950 border-rose-500 text-rose-300 shadow-md shadow-rose-950/50'
                            : isIntake
                            ? 'bg-amber-950 border-amber-500 text-amber-300'
                            : 'bg-cyan-950 border-cyan-500 text-cyan-300'
                        }`}
                      >
                        {trans.step}
                      </div>

                      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-white">{trans.fromName}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                            <span className="text-xs font-semibold text-cyan-300">{trans.toName}</span>
                          </div>

                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300">
                            {trans.transitionType.replace('_', ' ')}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 mb-2">{trans.description}</p>

                        {/* Boundary & Assumptions breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800/80">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>
                              Zone Transition:{' '}
                              <strong className="text-slate-200">
                                {trans.fromBoundary} → {trans.toBoundary}
                              </strong>{' '}
                              {trans.boundaryCrossed ? '(Cross-Boundary)' : '(Intra-Zone)'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>
                              Approval Gate:{' '}
                              <strong className={trans.isEnforcedApproval ? 'text-emerald-400' : 'text-rose-400'}>
                                {trans.isEnforcedApproval ? 'Enforced' : 'None / Bypassed'}
                              </strong>
                            </span>
                          </div>

                          <div className="col-span-1 md:col-span-2 text-slate-400 italic bg-slate-950/50 p-1.5 rounded border border-slate-800/60 font-mono text-[10px]">
                            Model Assumption: {trans.assumption}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Prerequisites & Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
                  <h4 className="text-xs font-bold font-mono text-cyan-400 mb-2 uppercase">
                    Exploitation Prerequisites
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    {path.prerequisites.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5">
                  <h4 className="text-xs font-bold font-mono text-rose-400 mb-2 uppercase">
                    Impact Assessment
                  </h4>
                  <p className="text-xs text-slate-300">{path.impactAssessment}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'risk_math' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl text-xs space-y-2">
                <div className="font-mono text-cyan-400 font-bold text-sm">
                  DETERMINISTIC RISK CALCULATION EQUATION
                </div>
                <div className="p-3 bg-slate-950 rounded-lg font-mono text-xs text-slate-200 border border-slate-800 leading-relaxed overflow-x-auto">
                  {path.riskBreakdown.formulaExplanation}
                </div>
                <p className="text-slate-400 text-[11px]">
                  All scores are mathematical estimations prioritizing graph interventions based on asset classification, action gravity, and architectural zones.
                </p>
              </div>

              {/* Individual Contributing Factors */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl">
                  <div className="text-[10px] font-mono text-slate-400">SENSITIVITY FACTOR</div>
                  <div className="text-lg font-bold text-white font-mono">{path.riskBreakdown.sensitivityFactor}</div>
                  <div className="text-[10px] text-slate-500">Resource classification</div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl">
                  <div className="text-[10px] font-mono text-slate-400">ACTION IMPACT</div>
                  <div className="text-lg font-bold text-white font-mono">
                    {path.riskBreakdown.actionImpactFactor.toFixed(2)}x
                  </div>
                  <div className="text-[10px] text-slate-500">Operation severity</div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl">
                  <div className="text-[10px] font-mono text-slate-400">UNTRUSTED INTAKE</div>
                  <div className="text-lg font-bold text-amber-400 font-mono">
                    {path.riskBreakdown.reachabilityFactor.toFixed(2)}x
                  </div>
                  <div className="text-[10px] text-slate-500">Indirect prompt access</div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl">
                  <div className="text-[10px] font-mono text-slate-400">BOUNDARIES CROSSED</div>
                  <div className="text-lg font-bold text-cyan-400 font-mono">
                    +{path.riskBreakdown.trustBoundariesCrossedFactor.toFixed(1)} pts
                  </div>
                  <div className="text-[10px] text-slate-500">Cross-zone friction</div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl">
                  <div className="text-[10px] font-mono text-slate-400">SCOPE FACTOR</div>
                  <div className="text-lg font-bold text-white font-mono">
                    {path.riskBreakdown.scopeFactor.toFixed(2)}x
                  </div>
                  <div className="text-[10px] text-slate-500">Unrestricted reach</div>
                </div>

                <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl">
                  <div className="text-[10px] font-mono text-slate-400">APPROVAL MITIGATION</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">
                    {path.riskBreakdown.approvalMitigation.toFixed(2)}x
                  </div>
                  <div className="text-[10px] text-slate-500">Human-in-the-loop</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai_analysis' && (
            <div className="space-y-4">
              {isLoadingAi ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                  <div className="text-sm font-medium text-slate-200">
                    Running Server-Side AI Security Analysis...
                  </div>
                  <p className="text-xs text-slate-500">
                    Evaluating multi-hop delegation, privilege inheritance, and boundary isolation.
                  </p>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-slate-900 border border-slate-800 rounded-lg font-mono text-[11px]">
                    <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      ANALYSIS MODE: {aiAnalysis.isAIGenerated ? 'GEMINI 3.8 FLASH (SERVER)' : 'DETERMINISTIC RULE ENGINE'}
                    </span>
                    <span className="text-slate-400">Model: {aiAnalysis.modelUsed}</span>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-1">
                    <h4 className="font-bold text-white text-sm">Executive Synopsis</h4>
                    <p className="text-slate-300 leading-relaxed">{aiAnalysis.summary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl space-y-1">
                      <h4 className="font-bold text-cyan-300">Attack Vector Mechanics</h4>
                      <p className="text-slate-300 leading-relaxed">{aiAnalysis.attackVectorAnalysis}</p>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl space-y-1">
                      <h4 className="font-bold text-amber-300">Root Cause Vulnerability</h4>
                      <p className="text-slate-300 leading-relaxed">{aiAnalysis.rootCause}</p>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl space-y-1">
                    <h4 className="font-bold text-rose-300">Potential Business Impact</h4>
                    <p className="text-slate-300 leading-relaxed">{aiAnalysis.businessImpact}</p>
                  </div>

                  <div className="bg-emerald-950/30 border border-emerald-800/60 p-4 rounded-xl space-y-1.5">
                    <h4 className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Defense-In-Depth Architecture Recommendations
                    </h4>
                    <p className="text-emerald-100 whitespace-pre-line leading-relaxed">
                      {aiAnalysis.defenseInDepthRecommendation}
                    </p>
                  </div>

                  {/* Question Follow-up */}
                  <div className="pt-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ask a technical follow-up question regarding this attack path..."
                        value={userQuestion}
                        onChange={(e) => setUserQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && fetchAiAnalysis()}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs"
                      />
                      <button
                        onClick={() => fetchAiAnalysis()}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold flex items-center gap-1.5 transition text-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Query</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Quick Remediation Candidates Section */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-cyan-400" />
                <span>Minimum-Cost Graph Cut Interventions ({candidateRemediations.length})</span>
              </h3>
            </div>

            <div className="space-y-2">
              {candidateRemediations.slice(0, 3).map((cand) => (
                <div
                  key={cand.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-xl hover:border-slate-700 transition text-xs"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{cand.title}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
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
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/80">
                          ✓ Preserves Legitimate Workflows
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-800/80">
                          ⚠ Breaks {cand.brokenWorkflowIds.length} Workflow
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-[11px]">{cand.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        startSimulation(cand);
                        onClose();
                        onSelectSimulate?.(path);
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Simulate</span>
                    </button>

                    <button
                      onClick={() => {
                        applyRemediation(cand);
                        onClose();
                      }}
                      className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow transition"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Apply Cut</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
