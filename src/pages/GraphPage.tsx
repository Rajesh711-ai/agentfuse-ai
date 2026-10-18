/**
 * AgentFuse AI - Interactive Security Graph Workspace
 * Features fullscreen interactive SVG topology canvas, node/edge inspector drawer,
 * reachable resource tracing, and path highlighting.
 */

import React, { useState } from 'react';
import {
  Share2,
  Cpu,
  Database,
  Lock,
  Unlock,
  AlertTriangle,
  ArrowRight,
  Info,
  ExternalLink,
  Shield,
  Layers,
  Wrench,
  SlidersHorizontal,
} from 'lucide-react';
import { InteractiveGraph } from '../components/InteractiveGraph';
import { useProject } from '../context/ProjectContext';
import { AttackPath } from '../core/types';

export const GraphPage: React.FC<{
  onInspectPath: (path: AttackPath) => void;
  onOpenRemediate: () => void;
}> = ({ onInspectPath, onOpenRemediate }) => {
  const {
    project,
    analysis,
    selectedNodeId,
    selectedEdgeId,
    setSelectedNodeId,
    setSelectedEdgeId,
    selectedPathId,
    setSelectedPathId,
    startSimulation,
  } = useProject();

  const [activeInspectorTab, setActiveInspectorTab] = useState<'node' | 'paths'>('node');

  // Currently inspected agent or resource
  const inspectedAgent = project.agents.find((a) => a.id === selectedNodeId) || null;
  const inspectedResource = project.resources.find((r) => r.id === selectedNodeId) || null;

  // Currently inspected edge (delegation or permission)
  const inspectedDelegation = project.delegations.find((d) => d.id === selectedEdgeId) || null;
  const inspectedPermission = project.permissions.find((p) => p.id === selectedEdgeId) || null;

  // Reachable resources from inspected agent
  const reachableResources = inspectedAgent
    ? analysis.reachableResourcesByAgent[inspectedAgent.id] || []
    : [];

  // Active path for highlighting
  const currentPath =
    analysis.attackPaths.find((p) => p.id === selectedPathId) || analysis.attackPaths[0] || null;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Controls bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d1527] border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-950/80 border border-cyan-800 rounded-lg text-cyan-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">Interactive Graph Workspace</h1>
            <p className="text-xs text-slate-400">
              Drag nodes, inspect boundary transitions, trace reachable resources, and isolate attack paths.
            </p>
          </div>
        </div>

        {/* Path highlight selector */}
        {analysis.attackPaths.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">Highlight Path:</span>
            <select
              value={selectedPathId || analysis.attackPaths[0]?.id || ''}
              onChange={(e) => setSelectedPathId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-rose-300 font-mono py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-rose-500 max-w-xs truncate"
            >
              {analysis.attackPaths.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.severity}] {p.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Workspace: Graph Canvas + Side Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Graph Canvas */}
        <div className="lg:col-span-3">
          <InteractiveGraph
            height="calc(100vh - 220px)"
            focusPath={currentPath}
            onSelectNode={(id) => {
              setSelectedNodeId(id);
              setSelectedEdgeId(null);
            }}
            onSelectEdge={(id) => {
              setSelectedEdgeId(id);
              setSelectedNodeId(null);
            }}
          />
        </div>

        {/* Side Inspector Drawer */}
        <div className="bg-[#0b1021] border border-slate-800 rounded-xl p-4 flex flex-col justify-between overflow-y-auto max-h-[calc(100vh-220px)] space-y-4 text-xs shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-mono text-[11px] font-bold text-cyan-400 uppercase">
                ENTITY & PATH INSPECTOR
              </span>
              {(selectedNodeId || selectedEdgeId) && (
                <button
                  onClick={() => {
                    setSelectedNodeId(null);
                    setSelectedEdgeId(null);
                  }}
                  className="text-slate-400 hover:text-white text-[11px] font-mono"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Inspected Agent Details */}
            {inspectedAgent && (
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-400">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{inspectedAgent.name}</h3>
                    <span className="font-mono text-[10px] text-slate-400">ID: {inspectedAgent.id}</span>
                  </div>
                </div>

                <div className="space-y-1.5 bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-[11px]">
                  <div>
                    Trust Level:{' '}
                    <strong className="text-cyan-300 uppercase">{inspectedAgent.trustLevel}</strong>
                  </div>
                  <div>
                    Zone: <strong className="text-slate-200">{inspectedAgent.trustBoundary}</strong>
                  </div>
                  <div>
                    Untrusted Input:{' '}
                    <strong className={inspectedAgent.canReceiveUntrustedInput ? 'text-amber-400' : 'text-slate-400'}>
                      {inspectedAgent.canReceiveUntrustedInput ? 'YES (External Channel)' : 'No'}
                    </strong>
                  </div>
                  <div>
                    Tools ({inspectedAgent.tools.length}):{' '}
                    <span className="text-slate-300">{inspectedAgent.tools.join(', ') || 'None'}</span>
                  </div>
                </div>

                {/* Reachable Resources */}
                <div className="space-y-1.5">
                  <span className="font-mono text-[10px] text-slate-400 uppercase font-bold">
                    Reachable Resources ({reachableResources.length})
                  </span>
                  <div className="space-y-1">
                    {reachableResources.map((resId) => {
                      const res = project.resources.find((r) => r.id === resId);
                      return (
                        <div
                          key={resId}
                          className="p-1.5 bg-slate-900 rounded border border-slate-800 flex items-center justify-between text-[11px]"
                        >
                          <span className="text-slate-200 font-medium">{res?.name || resId}</span>
                          <span
                            className={`px-1 py-0.2 rounded text-[9px] font-mono font-bold ${
                              res?.sensitivity === 'confidential' || res?.sensitivity === 'restricted'
                                ? 'text-rose-400 bg-rose-950/80'
                                : 'text-slate-400 bg-slate-800'
                            }`}
                          >
                            {res?.sensitivity?.toUpperCase()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Inspected Resource Details */}
            {inspectedResource && (
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-950 border border-amber-800 text-amber-400">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">{inspectedResource.name}</h3>
                    <span className="font-mono text-[10px] text-slate-400">ID: {inspectedResource.id}</span>
                  </div>
                </div>

                <div className="space-y-1.5 bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-[11px]">
                  <div>
                    Type: <strong className="text-slate-200 uppercase">{inspectedResource.type}</strong>
                  </div>
                  <div>
                    Sensitivity Tier:{' '}
                    <strong className="text-amber-400 uppercase">{inspectedResource.sensitivity}</strong>
                  </div>
                  <div>
                    Zone: <strong className="text-slate-200">{inspectedResource.trustBoundary}</strong>
                  </div>
                  <div>
                    Classification: <strong className="text-slate-300">{inspectedResource.dataClassification}</strong>
                  </div>
                  <div>
                    Egress Sink:{' '}
                    <strong className={inspectedResource.isExternalSink ? 'text-rose-400' : 'text-slate-400'}>
                      {inspectedResource.isExternalSink ? 'YES (External Sink)' : 'No'}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Inspected Edge Details */}
            {inspectedDelegation && (
              <div className="mt-3 space-y-3">
                <div className="font-bold text-cyan-300 text-xs font-mono">
                  DELEGATION LINK: {inspectedDelegation.id}
                </div>
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-[11px] space-y-1.5">
                  <div>
                    From: <strong className="text-white">{inspectedDelegation.sourceAgentId}</strong>
                  </div>
                  <div>
                    To: <strong className="text-cyan-300">{inspectedDelegation.targetAgentId}</strong>
                  </div>
                  <div>
                    Type: <strong className="text-slate-200">{inspectedDelegation.delegationType}</strong>
                  </div>
                  <div>
                    Forward Context:{' '}
                    <strong className={inspectedDelegation.forwardContext ? 'text-amber-400' : 'text-slate-400'}>
                      {inspectedDelegation.forwardContext ? 'Enabled' : 'Disabled'}
                    </strong>
                  </div>
                  <div>
                    Requires Approval:{' '}
                    <strong className={inspectedDelegation.requiresApproval ? 'text-emerald-400' : 'text-rose-400'}>
                      {inspectedDelegation.requiresApproval ? 'Yes' : 'No'}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {inspectedPermission && (
              <div className="mt-3 space-y-3">
                <div className="font-bold text-purple-300 text-xs font-mono">
                  PERMISSION GRANT: {inspectedPermission.id}
                </div>
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-[11px] space-y-1.5">
                  <div>
                    Agent: <strong className="text-white">{inspectedPermission.agentId}</strong>
                  </div>
                  <div>
                    Action:{' '}
                    <strong className="text-cyan-400 uppercase">{inspectedPermission.action}</strong>
                  </div>
                  <div>
                    Resource: <strong className="text-slate-200">{inspectedPermission.resourceId}</strong>
                  </div>
                  <div>
                    Scope: <strong className="text-slate-300">{inspectedPermission.scope}</strong>
                  </div>
                  <div>
                    Approval Gate:{' '}
                    <strong className={inspectedPermission.requiresApproval ? 'text-emerald-400' : 'text-rose-400'}>
                      {inspectedPermission.requiresApproval ? 'Enforced' : 'None'}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* If neither node nor edge is selected, show active attack path overview */}
            {!inspectedAgent && !inspectedResource && !inspectedDelegation && !inspectedPermission && (
              <div className="mt-3 space-y-3">
                {currentPath ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-rose-300 font-bold">ACTIVE PATH #{currentPath.id}</span>
                        <span className="text-rose-400 font-bold">{currentPath.riskScore}/100</span>
                      </div>
                      <div className="font-bold text-white text-xs">{currentPath.title}</div>
                      <p className="text-[11px] text-slate-300 line-clamp-3">{currentPath.narrative}</p>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <span className="font-mono text-[10px] text-slate-400 font-bold">TRANSITION HOPS:</span>
                      {currentPath.transitions.map((t) => (
                        <div
                          key={t.step}
                          className="p-1.5 bg-slate-900 rounded border border-slate-800 text-[10px] flex items-center justify-between font-mono"
                        >
                          <span className="text-slate-400">Step {t.step}:</span>
                          <span className="text-slate-200 truncate max-w-[140px]">
                            {t.fromName} → {t.toName}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => onInspectPath(currentPath)}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Inspect Full Evidence Timeline</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900 rounded-xl text-center text-slate-400 text-xs">
                    Click any agent, resource, or edge in the graph canvas to inspect properties.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Jump to Remediation Planner */}
          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={onOpenRemediate}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Open Remediation Planner</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
