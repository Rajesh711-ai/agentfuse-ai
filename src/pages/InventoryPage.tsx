/**
 * AgentFuse AI - Agent & Resource Inventory Management
 * Allows adding, editing, inspecting, and deleting agents, resources,
 * assigned permissions, and delegation pathways with live validation.
 */

import React, { useState } from 'react';
import {
  Cpu,
  Database,
  Plus,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  Shield,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  X,
  FileCode,
  Tag,
  Radio,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import {
  Agent,
  Permission,
  PermissionAction,
  PermissionScope,
  Resource,
  ResourceSensitivity,
  ResourceType,
  TrustBoundary,
  TrustLevel,
  AgentDelegationLink,
} from '../core/types';

export const InventoryPage: React.FC = () => {
  const { project, updateProject } = useProject();

  const [activeSubTab, setActiveSubTab] = useState<'agents' | 'resources' | 'permissions' | 'delegations'>('agents');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [editingPerm, setEditingPerm] = useState<Permission | null>(null);

  const [isDelModalOpen, setIsDelModalOpen] = useState(false);

  // Form states for Agent
  const [agentForm, setAgentForm] = useState<Partial<Agent>>({
    id: '',
    name: '',
    purpose: '',
    trustLevel: 'medium',
    trustBoundary: 'corporate_lan',
    canReceiveUntrustedInput: false,
    tools: [],
    connectedAgentIds: [],
    tags: [],
  });

  // Form states for Resource
  const [resForm, setResForm] = useState<Partial<Resource>>({
    id: '',
    name: '',
    type: 'document',
    sensitivity: 'internal',
    trustBoundary: 'corporate_lan',
    description: '',
    dataClassification: 'Internal General',
    isExternalSink: false,
  });

  // Form states for Permission
  const [permForm, setPermForm] = useState<Partial<Permission>>({
    id: '',
    agentId: '',
    resourceId: '',
    action: 'read',
    scope: 'scoped',
    requiresApproval: false,
    isDelegatable: false,
  });

  // Form states for Delegation
  const [delForm, setDelForm] = useState<Partial<AgentDelegationLink>>({
    id: '',
    sourceAgentId: '',
    targetAgentId: '',
    delegationType: 'invoke_task',
    forwardContext: true,
    requiresApproval: false,
    isAuthorizedWorkflow: true,
  });

  // Open Edit Agent
  const handleOpenEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setAgentForm({ ...agent });
    setIsAgentModalOpen(true);
  };

  const handleOpenAddAgent = () => {
    setEditingAgent(null);
    setAgentForm({
      id: `agent-custom-${Date.now().toString().slice(-4)}`,
      name: '',
      purpose: '',
      trustLevel: 'medium',
      trustBoundary: 'corporate_lan',
      canReceiveUntrustedInput: false,
      tools: ['general_nlp'],
      connectedAgentIds: [],
      tags: ['Custom'],
    });
    setIsAgentModalOpen(true);
  };

  const handleSaveAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentForm.id || !agentForm.name) return;

    const fullAgent: Agent = {
      id: agentForm.id.trim(),
      name: agentForm.name.trim(),
      purpose: agentForm.purpose?.trim() || 'Custom AI agent',
      trustLevel: (agentForm.trustLevel as TrustLevel) || 'medium',
      trustBoundary: (agentForm.trustBoundary as TrustBoundary) || 'corporate_lan',
      canReceiveUntrustedInput: Boolean(agentForm.canReceiveUntrustedInput),
      tools: Array.isArray(agentForm.tools) ? agentForm.tools : [],
      connectedAgentIds: Array.isArray(agentForm.connectedAgentIds) ? agentForm.connectedAgentIds : [],
      tags: Array.isArray(agentForm.tags) ? agentForm.tags : [],
    };

    let updatedAgents: Agent[];
    if (editingAgent) {
      updatedAgents = project.agents.map((a) => (a.id === editingAgent.id ? fullAgent : a));
    } else {
      updatedAgents = [...project.agents, fullAgent];
    }

    updateProject({ ...project, agents: updatedAgents }, `Saved agent [${fullAgent.name}]`);
    setIsAgentModalOpen(false);
  };

  const handleDeleteAgent = (agentId: string) => {
    const updatedAgents = project.agents.filter((a) => a.id !== agentId);
    const updatedPerms = project.permissions.filter((p) => p.agentId !== agentId);
    const updatedDels = project.delegations.filter(
      (d) => d.sourceAgentId !== agentId && d.targetAgentId !== agentId
    );
    updateProject(
      { ...project, agents: updatedAgents, permissions: updatedPerms, delegations: updatedDels },
      `Deleted agent ${agentId}`
    );
  };

  // Open Edit Resource
  const handleOpenEditResource = (res: Resource) => {
    setEditingResource(res);
    setResForm({ ...res });
    setIsResourceModalOpen(true);
  };

  const handleOpenAddResource = () => {
    setEditingResource(null);
    setResForm({
      id: `res-custom-${Date.now().toString().slice(-4)}`,
      name: '',
      type: 'document',
      sensitivity: 'internal',
      trustBoundary: 'corporate_lan',
      description: '',
      dataClassification: 'Internal General',
      isExternalSink: false,
    });
    setIsResourceModalOpen(true);
  };

  const handleSaveResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resForm.id || !resForm.name) return;

    const fullRes: Resource = {
      id: resForm.id.trim(),
      name: resForm.name.trim(),
      type: (resForm.type as ResourceType) || 'document',
      sensitivity: (resForm.sensitivity as ResourceSensitivity) || 'internal',
      trustBoundary: (resForm.trustBoundary as TrustBoundary) || 'corporate_lan',
      description: resForm.description?.trim() || '',
      dataClassification: resForm.dataClassification?.trim() || 'Internal General',
      isExternalSink: Boolean(resForm.isExternalSink || resForm.type === 'external_sink'),
    };

    let updatedResources: Resource[];
    if (editingResource) {
      updatedResources = project.resources.map((r) => (r.id === editingResource.id ? fullRes : r));
    } else {
      updatedResources = [...project.resources, fullRes];
    }

    updateProject({ ...project, resources: updatedResources }, `Saved resource [${fullRes.name}]`);
    setIsResourceModalOpen(false);
  };

  const handleDeleteResource = (resId: string) => {
    const updatedRes = project.resources.filter((r) => r.id !== resId);
    const updatedPerms = project.permissions.filter((p) => p.resourceId !== resId);
    updateProject(
      { ...project, resources: updatedRes, permissions: updatedPerms },
      `Deleted resource ${resId}`
    );
  };

  // Quick toggle approval on permission
  const handleTogglePermApproval = (permId: string) => {
    const updated = project.permissions.map((p) =>
      p.id === permId ? { ...p, requiresApproval: !p.requiresApproval } : p
    );
    updateProject({ ...project, permissions: updated }, `Toggled approval gate on permission ${permId}`);
  };

  // Quick toggle context forwarding on delegation
  const handleToggleDelegationContext = (delId: string) => {
    const updated = project.delegations.map((d) =>
      d.id === delId ? { ...d, forwardContext: !d.forwardContext } : d
    );
    updateProject({ ...project, delegations: updated }, `Toggled context forwarding on delegation ${delId}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Sub-Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span>AI Agent & Resource Inventory</span>
          </h1>
          <p className="text-xs text-slate-400">
            Explicitly modeled entities, permission scopes, delegation channels, and trust boundaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'agents' && (
            <button
              onClick={handleOpenAddAgent}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add AI Agent</span>
            </button>
          )}
          {activeSubTab === 'resources' && (
            <button
              onClick={handleOpenAddResource}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Resource</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tabs Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('agents')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeSubTab === 'agents'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AI Agents ({project.agents.length})
          </button>
          <button
            onClick={() => setActiveSubTab('resources')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeSubTab === 'resources'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Resources & Sinks ({project.resources.length})
          </button>
          <button
            onClick={() => setActiveSubTab('permissions')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeSubTab === 'permissions'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Permission Grants ({project.permissions.length})
          </button>
          <button
            onClick={() => setActiveSubTab('delegations')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeSubTab === 'delegations'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Delegation Channels ({project.delegations.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search entities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48"
          />
        </div>
      </div>

      {/* Tab 1: AI Agents View */}
      {activeSubTab === 'agents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {project.agents
            .filter((a) => !searchTerm || a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.id.includes(searchTerm))
            .map((ag) => (
              <div
                key={ag.id}
                className="bg-[#0b1021] border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex flex-col justify-between transition shadow-lg space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                      ID: {ag.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        ag.trustLevel === 'untrusted'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : ag.trustLevel === 'low'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : ag.trustLevel === 'medium'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {ag.trustLevel.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1">{ag.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-2">{ag.purpose}</p>

                  {/* Channel Tag */}
                  {ag.canReceiveUntrustedInput && (
                    <div className="p-1.5 mb-2 rounded bg-amber-950/40 border border-amber-700/60 text-[10px] font-mono text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>Accepts Untrusted External Input</span>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                    <div>
                      Zone: <span className="text-slate-200">{ag.trustBoundary}</span>
                    </div>
                    <div>
                      Tools ({ag.tools.length}):{' '}
                      <span className="text-slate-300">{ag.tools.join(', ') || 'none'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono text-[10px]">
                    Delegates to {ag.connectedAgentIds.length} agents
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditAgent(ag)}
                      className="p-1.5 text-slate-400 hover:text-cyan-300 bg-slate-900 hover:bg-slate-800 rounded transition"
                      title="Edit Agent"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAgent(ag.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-300 bg-slate-900 hover:bg-slate-800 rounded transition"
                      title="Delete Agent"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Tab 2: Resources View */}
      {activeSubTab === 'resources' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {project.resources
            .filter((r) => !searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.id.includes(searchTerm))
            .map((res) => {
              const sensBadge =
                res.sensitivity === 'restricted'
                  ? 'bg-rose-950 text-rose-300 border-rose-800'
                  : res.sensitivity === 'confidential'
                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                  : res.sensitivity === 'internal'
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800';

              return (
                <div
                  key={res.id}
                  className="bg-[#0b1021] border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex flex-col justify-between transition shadow-lg space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                        ID: {res.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${sensBadge}`}>
                        {res.sensitivity.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{res.name}</span>
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-2">{res.description}</p>

                    {res.isExternalSink && (
                      <div className="p-1.5 mb-2 rounded bg-rose-950/40 border border-rose-700/60 text-[10px] font-mono text-rose-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        <span>External Transmission Sink (Egress Vector)</span>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                      <div>
                        Type: <span className="text-slate-200 uppercase">{res.type}</span>
                      </div>
                      <div>
                        Classification: <span className="text-slate-300">{res.dataClassification}</span>
                      </div>
                      <div>
                        Zone: <span className="text-slate-300">{res.trustBoundary}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-mono text-[10px]">
                      {res.isExternalSink ? 'Sink Target' : 'Protected Asset'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditResource(res)}
                        className="p-1.5 text-slate-400 hover:text-cyan-300 bg-slate-900 hover:bg-slate-800 rounded transition"
                        title="Edit Resource"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteResource(res.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-300 bg-slate-900 hover:bg-slate-800 rounded transition"
                        title="Delete Resource"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Tab 3: Permissions Matrix */}
      {activeSubTab === 'permissions' && (
        <div className="bg-[#0b1021] border border-slate-800 rounded-xl overflow-hidden shadow-xl text-xs">
          <div className="p-3 bg-[#0d1527] border-b border-slate-800 flex items-center justify-between text-slate-300 font-mono text-[11px]">
            <span>EXPLICIT PERMISSION GRANTS (AGENT → RESOURCE)</span>
            <span>Total Grants: {project.permissions.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Permission ID</th>
                  <th className="py-2.5 px-4">Agent (Subject)</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Resource (Object)</th>
                  <th className="py-2.5 px-4">Scope</th>
                  <th className="py-2.5 px-4">Approval Gate</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {project.permissions.map((p) => {
                  const ag = project.agents.find((a) => a.id === p.agentId);
                  const res = project.resources.find((r) => r.id === p.resourceId);

                  return (
                    <tr key={p.id} className="hover:bg-slate-900/60 transition">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-cyan-400">{p.id}</td>
                      <td className="py-2.5 px-4 font-semibold text-white">
                        {ag?.name || p.agentId}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            p.action === 'transmit'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : p.action === 'read'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {p.action.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-200">
                        {res?.name || p.resourceId}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px]">
                        <span className={p.scope === 'unrestricted' ? 'text-amber-400' : 'text-slate-400'}>
                          {p.scope}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <button
                          onClick={() => handleTogglePermApproval(p.id)}
                          className={`px-2 py-1 rounded flex items-center gap-1.5 font-mono text-[10px] border transition ${
                            p.requiresApproval
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border-rose-800'
                          }`}
                        >
                          {p.requiresApproval ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                          <span>{p.requiresApproval ? 'Enforced' : 'None (Click to Gate)'}</span>
                        </button>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => {
                            const updated = project.permissions.filter((item) => item.id !== p.id);
                            updateProject({ ...project, permissions: updated }, `Revoked permission ${p.id}`);
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1"
                          title="Revoke Permission"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Delegations View */}
      {activeSubTab === 'delegations' && (
        <div className="bg-[#0b1021] border border-slate-800 rounded-xl overflow-hidden shadow-xl text-xs">
          <div className="p-3 bg-[#0d1527] border-b border-slate-800 flex items-center justify-between text-slate-300 font-mono text-[11px]">
            <span>INTER-AGENT TASK DELEGATIONS & PAYLOAD BRIDGES</span>
            <span>Total Delegations: {project.delegations.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Link ID</th>
                  <th className="py-2.5 px-4">Caller Agent</th>
                  <th className="py-2.5 px-4">Target Agent</th>
                  <th className="py-2.5 px-4">Delegation Type</th>
                  <th className="py-2.5 px-4">Payload Context Forwarding</th>
                  <th className="py-2.5 px-4">Approval Gate</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {project.delegations.map((del) => {
                  const src = project.agents.find((a) => a.id === del.sourceAgentId);
                  const tgt = project.agents.find((a) => a.id === del.targetAgentId);

                  return (
                    <tr key={del.id} className="hover:bg-slate-900/60 transition">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-cyan-400">{del.id}</td>
                      <td className="py-2.5 px-4 font-semibold text-white">{src?.name || del.sourceAgentId}</td>
                      <td className="py-2.5 px-4 font-semibold text-cyan-300">{tgt?.name || del.targetAgentId}</td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-300">{del.delegationType}</td>
                      <td className="py-2.5 px-4">
                        <button
                          onClick={() => handleToggleDelegationContext(del.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                            del.forwardContext
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {del.forwardContext ? '⇶ Active (Click to Strip)' : 'Stripped / Blocked'}
                        </button>
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                            del.requiresApproval
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {del.requiresApproval ? 'Enforced' : 'None'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => {
                            const updated = project.delegations.filter((d) => d.id !== del.id);
                            updateProject({ ...project, delegations: updated }, `Severed delegation ${del.id}`);
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1"
                          title="Sever Delegation Link"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Agent Modal */}
      {isAgentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleSaveAgent}
            className="w-full max-w-lg bg-[#0b1021] border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingAgent ? 'Edit AI Agent' : 'Create New AI Agent'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAgentModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-mono text-[11px] mb-1">Agent ID</label>
                <input
                  type="text"
                  required
                  value={agentForm.id}
                  onChange={(e) => setAgentForm({ ...agentForm, id: e.target.value })}
                  disabled={Boolean(editingAgent)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-mono text-[11px] mb-1">Agent Name</label>
                <input
                  type="text"
                  required
                  value={agentForm.name}
                  onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                  placeholder="e.g. Email Processing Agent"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-mono text-[11px] mb-1">Operational Purpose</label>
                <textarea
                  rows={2}
                  value={agentForm.purpose}
                  onChange={(e) => setAgentForm({ ...agentForm, purpose: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-mono text-[11px] mb-1">Trust Level</label>
                  <select
                    value={agentForm.trustLevel}
                    onChange={(e) => setAgentForm({ ...agentForm, trustLevel: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="untrusted">Untrusted</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-mono text-[11px] mb-1">Trust Boundary</label>
                  <select
                    value={agentForm.trustBoundary}
                    onChange={(e) => setAgentForm({ ...agentForm, trustBoundary: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="public_dmz">Public / DMZ</option>
                    <option value="corporate_lan">Corporate LAN</option>
                    <option value="restricted_enclave">Restricted Enclave</option>
                    <option value="external_sink">External Sink</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={agentForm.canReceiveUntrustedInput}
                  onChange={(e) =>
                    setAgentForm({ ...agentForm, canReceiveUntrustedInput: e.target.checked })
                  }
                  className="accent-cyan-500 rounded"
                />
                <span className="text-slate-300 text-xs">
                  Agent can accept untrusted external inputs (prompts, webhooks, or emails)
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAgentModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold"
              >
                Save Agent
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Resource Modal */}
      {isResourceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleSaveResource}
            className="w-full max-w-lg bg-[#0b1021] border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingResource ? 'Edit Resource' : 'Add New Resource'}
              </h3>
              <button
                type="button"
                onClick={() => setIsResourceModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-mono text-[11px] mb-1">Resource ID</label>
                <input
                  type="text"
                  required
                  value={resForm.id}
                  onChange={(e) => setResForm({ ...resForm, id: e.target.value })}
                  disabled={Boolean(editingResource)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-mono text-[11px] mb-1">Resource Name</label>
                <input
                  type="text"
                  required
                  value={resForm.name}
                  onChange={(e) => setResForm({ ...resForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-mono text-[11px] mb-1">Type</label>
                  <select
                    value={resForm.type}
                    onChange={(e) => setResForm({ ...resForm, type: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="document">Document</option>
                    <option value="database">Database</option>
                    <option value="api">API Endpoint</option>
                    <option value="credentials">Credentials</option>
                    <option value="communication_channel">Communication Channel</option>
                    <option value="external_sink">External Sink</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-mono text-[11px] mb-1">Sensitivity Tier</label>
                  <select
                    value={resForm.sensitivity}
                    onChange={(e) => setResForm({ ...resForm, sensitivity: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="public">Public</option>
                    <option value="internal">Internal</option>
                    <option value="confidential">Confidential</option>
                    <option value="restricted">Restricted</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-mono text-[11px] mb-1">Data Classification</label>
                <input
                  type="text"
                  value={resForm.dataClassification}
                  onChange={(e) => setResForm({ ...resForm, dataClassification: e.target.value })}
                  placeholder="e.g. Employee SSN & Payroll"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <label className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={resForm.isExternalSink}
                  onChange={(e) => setResForm({ ...resForm, isExternalSink: e.target.checked })}
                  className="accent-rose-500 rounded"
                />
                <span className="text-slate-300 text-xs">
                  Mark as External Egress Sink (potential exfiltration destination)
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsResourceModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold"
              >
                Save Resource
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
