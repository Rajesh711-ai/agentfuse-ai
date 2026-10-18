/**
 * AgentFuse AI - Security Architecture, Model Specifications & Judge Guide
 * Comprehensive reference explaining the permission combination problem,
 * graph traversal mechanics, risk formula math, and demo walkthrough.
 */

import React from 'react';
import {
  HelpCircle,
  Shield,
  Layers,
  ArrowRight,
  Lock,
  Cpu,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sliders,
  Award,
} from 'lucide-react';
import { DEFAULT_RISK_WEIGHTS } from '../core/risk-engine';

export const HelpPage: React.FC<{ onOpenWeightsModal: () => void }> = ({ onOpenWeightsModal }) => {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Title */}
      <div className="space-y-2 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950 border border-cyan-800 text-cyan-300">
            TECHNICAL DOCUMENTATION & BENCHMARK METHODOLOGY
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          AgentFuse AI: Graph Security Model & Architecture
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Understanding indirect permission combination hazards in interconnected AI agent meshes, deterministic risk scoring, and minimum-cost remediation algorithms.
        </p>
      </div>

      {/* Quick Judge Walkthrough Card */}
      <div className="p-6 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/40 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase">
          <Award className="w-4 h-4" />
          <span>CYBERSECURITY JUDGE DEMONSTRATION SCRIPT (5-STEP TOUR)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="font-mono text-cyan-400 font-bold">1. Dashboard</div>
            <p className="text-slate-300 text-[11px]">
              Inspect computed risk posture (78/100) and the primary exfiltration attack vector.
            </p>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="font-mono text-cyan-400 font-bold">2. Interactive Graph</div>
            <p className="text-slate-300 text-[11px]">
              Trace pulsing red edges: Email → Document Parser → Confidential Payroll → Workflow Agent → External Sink.
            </p>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="font-mono text-cyan-400 font-bold">3. Finding Drilldown</div>
            <p className="text-slate-300 text-[11px]">
              Open evidence modal: examine step assumptions, boundary hops, and AI analysis.
            </p>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="font-mono text-cyan-400 font-bold">4. What-If Sandbox</div>
            <p className="text-slate-300 text-[11px]">
              Stage minimum-cost cut: observe path drops to 0 while legitimate payroll indexing stays operational!
            </p>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="font-mono text-cyan-400 font-bold">5. 22-Test Benchmark</div>
            <p className="text-slate-300 text-[11px]">
              Execute full automated suite: verify 100% accuracy, confusion matrix, and latency.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: The Problem */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-rose-400" />
          <span>1. The Emerging Cybersecurity Problem: Transitive Permission Chains</span>
        </h2>
        <div className="p-5 bg-[#0b1021] border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-3 leading-relaxed">
          <p>
            Enterprises deploy autonomous AI agents with specialized capabilities: customer email ingestors, document indexers, database administrators, and Slack notification dispatchers. In isolation, each agent is granted legitimate, scoped permissions:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 font-mono text-[11px] text-slate-300">
            <li><strong>Email Triage Agent:</strong> Permitted to ingest incoming customer emails and parse intent.</li>
            <li><strong>Document Analysis Agent:</strong> Permitted to read internal and executive payroll documents for internal compliance indexing.</li>
            <li><strong>Workflow Automation Agent:</strong> Permitted to transmit alerts to external notification webhooks.</li>
          </ul>
          <p className="text-rose-300 font-semibold">
            The Danger: When these agents are linked via autonomous task delegation channels without human gates or payload sanitization, an attacker injecting indirect prompt directives into an external email can force the Email Agent to delegate a task to the Document Agent (reading sensitive payroll), which passes the confidential payload downstream to the Workflow Agent, which broadcasts it out to the external webhook.
          </p>
        </div>
      </section>

      {/* Section 2: Graph Engine Architecture */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>2. Deterministic Graph Traversal & Validation Engine</span>
        </h2>
        <div className="p-5 bg-[#0b1021] border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-3 leading-relaxed">
          <p>
            Unlike naive heuristic scanners, AgentFuse AI validates every step of an attack path against formal structural invariants:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <span className="font-mono text-cyan-400 font-bold">No Assumed Transmission</span>
              <p className="text-slate-400 text-[11px]">
                Reading a resource never automatically grants permission to exfiltrate it. An exfiltration attack path is only validated if an unbroken chain of context-forwarding delegations leads to an agent with an explicit transmit grant to an external sink.
              </p>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <span className="font-mono text-cyan-400 font-bold">Context Forwarding Continuity</span>
              <p className="text-slate-400 text-[11px]">
                If any inter-agent delegation channel has <code className="text-cyan-300">forwardContext: false</code> (payload sanitization / stripping), user prompts cannot traverse across that edge, breaking the indirect injection pathway.
              </p>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <span className="font-mono text-cyan-400 font-bold">Enforced Approval Gates</span>
              <p className="text-slate-400 text-[11px]">
                If an edge enforces human-in-the-loop review (<code className="text-cyan-300">requiresApproval: true</code>), autonomous exploitation is blocked at that checkpoint.
              </p>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
              <span className="font-mono text-cyan-400 font-bold">Cycle Safety</span>
              <p className="text-slate-400 text-[11px]">
                Depth-bounded traversal tracks visited nodes to prevent circular delegation loops from causing infinite recursion or false-positive alarms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Risk Formula */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>3. Mathematical Risk Formula</span>
          </h2>
          <button
            onClick={onOpenWeightsModal}
            className="text-xs font-mono text-cyan-400 hover:underline"
          >
            Tune Scoring Weights →
          </button>
        </div>

        <div className="p-5 bg-[#0b1021] border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-4 leading-relaxed">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 leading-relaxed overflow-x-auto">
            RiskScore = [ (SensitivityWeight × ActionMultiplier × UntrustedInputFactor) + (BoundariesCrossed × BoundaryWeight) ] × ScopeFactor × (1 - ApprovalDiscount)
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-500">SENSITIVITY</div>
              <div className="text-slate-200">Public: 10 pts</div>
              <div className="text-slate-200">Internal: 35 pts</div>
              <div className="text-slate-200">Confidential: 75 pts</div>
              <div className="text-rose-400 font-bold">Restricted: 100 pts</div>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-500">ACTION IMPACT</div>
              <div className="text-slate-200">Read: 0.55x</div>
              <div className="text-slate-200">Write: 0.85x</div>
              <div className="text-slate-200">Delete: 0.95x</div>
              <div className="text-rose-400 font-bold">Transmit: 1.00x</div>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-500">INTAKE & SCOPE</div>
              <div className="text-slate-200">Untrusted Input: 1.25x</div>
              <div className="text-slate-200">Unrestricted: 1.20x</div>
              <div className="text-slate-200">Scoped: 1.00x</div>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-500">MITIGATIONS</div>
              <div className="text-emerald-400 font-bold">Approval Gate: -65%</div>
              <div className="text-slate-200">Boundary Hop: +12 pts</div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            * Disclaimer: Risk scores represent mathematical heuristic rankings for prioritizing graph cuts within an assessment workspace. They do not represent actuarial breach probabilities.
          </p>
        </div>
      </section>

      {/* Section 4: Minimum-Cost Remediation */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>4. Minimum-Cost Remediation & Workflow Preservation</span>
        </h2>
        <div className="p-5 bg-[#0b1021] border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-3 leading-relaxed">
          <p>
            A common failure of security tools is recommending scorched-earth revocations that destroy legitimate business operations. AgentFuse AI assigns an operational disruption cost to each candidate graph cut:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 font-mono text-[11px]">
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-800 rounded-lg">
              <div className="text-emerald-400 font-bold">Cost 1: Approval Gate</div>
              <div className="text-slate-300 text-[10px]">Lowest disruption. Retains capability when confirmed by operator.</div>
            </div>
            <div className="p-2.5 bg-cyan-950/40 border border-cyan-800 rounded-lg">
              <div className="text-cyan-400 font-bold">Cost 1.5: Strip Context</div>
              <div className="text-slate-300 text-[10px]">Stops raw payload forwarding while keeping autonomous ping.</div>
            </div>
            <div className="p-2.5 bg-amber-950/40 border border-amber-800 rounded-lg">
              <div className="text-amber-400 font-bold">Cost 2: Narrow Scope</div>
              <div className="text-slate-300 text-[10px]">Restricts tenant-wide grant to specific designated bucket.</div>
            </div>
            <div className="p-2.5 bg-rose-950/40 border border-rose-800 rounded-lg">
              <div className="text-rose-400 font-bold">Cost 3: Sever / Revoke</div>
              <div className="text-slate-300 text-[10px]">Highest disruption. Completely deletes permission or delegation edge.</div>
            </div>
          </div>
          <p>
            The optimizer prioritizes candidates that achieve <strong>100% preservation of all legitimate business workflows</strong> with the lowest friction score.
          </p>
        </div>
      </section>
    </div>
  );
};
