/**
 * AgentFuse AI - Reproducible Benchmark & Evaluation Suite
 * Executes 22 synthetic test scenarios covering dangerous permission chains,
 * benign indexers, isolated nodes, and approval gates.
 * Computes live mathematical metrics with explicit denominators.
 */

import React, { useState } from 'react';
import {
  TestTube2,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  Filter,
  Search,
  Sparkles,
  Info,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { runFullBenchmark, ScenarioRunResult } from '../core/benchmark-suite';
import { BenchmarkMetrics } from '../core/types';

export const BenchmarkPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState<{
    results: ScenarioRunResult[];
    metrics: BenchmarkMetrics;
  }>(() => runFullBenchmark()); // Run initial baseline synchronously

  const [categoryFilter, setCategoryFilter] = useState<'all' | 'dangerous' | 'benign'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleRunSuite = () => {
    setIsRunning(true);
    setTimeout(() => {
      const data = runFullBenchmark();
      setBenchmarkData(data);
      setIsRunning(false);
    }, 450);
  };

  const { results, metrics } = benchmarkData;

  const filteredResults = results.filter((r) => {
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    if (searchQuery && !r.scenarioName.toLowerCase().includes(searchQuery.toLowerCase()) && !r.scenarioId.includes(searchQuery)) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <TestTube2 className="w-5 h-5 text-cyan-400" />
            <span>Reproducible Security Benchmark Suite</span>
          </h1>
          <p className="text-xs text-slate-400">
            22 synthetic test scenarios validating graph traversal correctness, risk scoring, and workflow preservation.
          </p>
        </div>

        <button
          onClick={handleRunSuite}
          disabled={isRunning}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-950/50 transition transform active:scale-95 disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Executing 22 Scenarios...' : 'Run Benchmark Suite'}</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Accuracy */}
        <div className="bg-[#0b1021] border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="text-[10px] font-mono uppercase text-slate-400">CLASSIFICATION ACCURACY</div>
          <div className="text-2xl font-bold font-mono text-cyan-400">{metrics.accuracy}%</div>
          <div className="text-[10px] text-slate-500 font-mono">
            Denominator: Total Scenarios ({metrics.totalScenarios})
          </div>
        </div>

        {/* Attack Path Elimination Rate */}
        <div className="bg-[#0b1021] border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="text-[10px] font-mono uppercase text-slate-400">PATH ELIMINATION RATE</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {metrics.attackPathEliminationRate}%
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Denominator: Remediations Tested ({metrics.dangerousDetected})
          </div>
        </div>

        {/* Workflow Preservation */}
        <div className="bg-[#0b1021] border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="text-[10px] font-mono uppercase text-slate-400">WORKFLOW PRESERVATION</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {metrics.workflowPreservationRate}%
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Denominator: Preserved / Remediated
          </div>
        </div>

        {/* Latency */}
        <div className="bg-[#0b1021] border border-slate-800 p-4 rounded-xl space-y-1">
          <div className="text-[10px] font-mono uppercase text-slate-400">AVG TRAVERSAL LATENCY</div>
          <div className="text-2xl font-bold font-mono text-white">
            {metrics.averageAnalysisLatencyMs} ms
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Per-scenario graph resolution
          </div>
        </div>
      </div>

      {/* Secondary Metrics & Confusion Matrix Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Confusion Matrix (2x2) */}
        <div className="bg-[#0b1021] border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-slate-200 uppercase">
              CONFUSION MATRIX
            </span>
            <span className="text-[10px] font-mono text-slate-400">N = {metrics.totalScenarios}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-emerald-950/40 border border-emerald-800/80 p-3 rounded-lg text-center">
              <div className="text-[10px] text-emerald-400">TRUE POSITIVE (TP)</div>
              <div className="text-xl font-bold text-white">{metrics.dangerousDetected}</div>
              <div className="text-[10px] text-slate-400">Risky detected</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-center">
              <div className="text-[10px] text-rose-400">FALSE POSITIVE (FP)</div>
              <div className="text-xl font-bold text-white">{metrics.falsePositives}</div>
              <div className="text-[10px] text-slate-400">Benign flagged</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg text-center">
              <div className="text-[10px] text-amber-400">FALSE NEGATIVE (FN)</div>
              <div className="text-xl font-bold text-white">{metrics.falseNegatives}</div>
              <div className="text-[10px] text-slate-400">Risky missed</div>
            </div>

            <div className="bg-cyan-950/40 border border-cyan-800/80 p-3 rounded-lg text-center">
              <div className="text-[10px] text-cyan-400">TRUE NEGATIVE (TN)</div>
              <div className="text-xl font-bold text-white">{metrics.benignCorrectlyPassed}</div>
              <div className="text-[10px] text-slate-400">Benign passed</div>
            </div>
          </div>
        </div>

        {/* Precision, Recall, F1 */}
        <div className="bg-[#0b1021] border border-slate-800 rounded-xl p-4 space-y-3">
          <span className="font-mono text-xs font-bold text-slate-200 uppercase">
            STATISTICAL EVALUATION
          </span>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-mono text-[11px] mb-1">
                <span className="text-slate-400">Precision [TP / (TP + FP)]</span>
                <span className="text-cyan-400 font-bold">{metrics.precision}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${metrics.precision}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-mono text-[11px] mb-1">
                <span className="text-slate-400">Recall / Sensitivity [TP / (TP + FN)]</span>
                <span className="text-cyan-400 font-bold">{metrics.recall}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${metrics.recall}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-mono text-[11px] mb-1">
                <span className="text-slate-400">Harmonic Mean F1 Score</span>
                <span className="text-emerald-400 font-bold">{metrics.f1Score}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${metrics.f1Score}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Methodology & Integrity Note */}
        <div className="bg-[#0b1021] border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
          <span className="font-mono text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5">
            <Info className="w-4 h-4" />
            <span>BENCHMARK INTEGRITY</span>
          </span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            All 22 synthetic test scenarios are executed in memory during this test cycle. Results reflect actual graph model outputs rather than simulated or hardcoded metrics.
          </p>
          <div className="p-2 bg-slate-950 rounded border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
            <div>• Avg Permissions Cut: {metrics.averagePermissionsChanged} per scenario</div>
            <div>• Real-time graph latency: {metrics.averageAnalysisLatencyMs} ms</div>
            <div>• Zero arbitrary scores: 100% deterministic</div>
          </div>
        </div>
      </div>

      {/* Filter and Scenarios Table */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0b1021] border border-slate-800 p-3 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-slate-200 py-1 px-2.5 rounded-lg font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All 22 Scenarios</option>
              <option value="dangerous">Dangerous Scenarios</option>
              <option value="benign">Benign / Safe Scenarios</option>
            </select>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search scenario ID or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-56 text-xs"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#0b1021] border border-slate-800 rounded-xl overflow-hidden shadow-xl text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Scenario ID</th>
                  <th className="py-2.5 px-4">Scenario Name</th>
                  <th className="py-2.5 px-4">Class</th>
                  <th className="py-2.5 px-4">Expected</th>
                  <th className="py-2.5 px-4">Detected</th>
                  <th className="py-2.5 px-4">Remediation</th>
                  <th className="py-2.5 px-4">Workflows</th>
                  <th className="py-2.5 px-4 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredResults.map((r) => (
                  <tr key={r.scenarioId} className="hover:bg-slate-900/60 transition">
                    <td className="py-2.5 px-4 font-mono text-cyan-400 text-[11px]">{r.scenarioId}</td>
                    <td className="py-2.5 px-4 font-semibold text-white max-w-xs truncate">
                      {r.scenarioName}
                    </td>
                    <td className="py-2.5 px-4 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.category === 'dangerous'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        }`}
                      >
                        {r.category.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px]">
                      {r.expectedVulnerable ? (
                        <span className="text-rose-400 font-semibold">Vulnerable</span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">Safe</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px]">
                      {r.actualVulnerable ? (
                        <span className="text-rose-400 font-semibold">
                          {r.detectedPathCount} path(s)
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">0 paths</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px]">
                      {r.remediationTested ? (
                        r.remediationEliminatedPath ? (
                          <span className="text-emerald-400">Eliminated</span>
                        ) : (
                          <span className="text-amber-400">Partial</span>
                        )
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px]">
                      {r.workflowsPreserved ? (
                        <span className="text-emerald-400">Preserved</span>
                      ) : (
                        <span className="text-rose-400">Disrupted</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold">
                      {r.passed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> PASS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800 text-[10px]">
                          <XCircle className="w-3 h-3" /> FAIL
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
