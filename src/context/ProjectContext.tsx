/**
 * AgentFuse AI - Project State & Assessment Context
 * Manages active project, graph analysis cache, undo/redo history,
 * active path inspection, and simulation staging.
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Agent,
  AttackPath,
  LegitimateWorkflow,
  Permission,
  RemediationOption,
  Resource,
  SecurityProject,
} from '../core/types';
import { DEMO_PROJECT_ENTERPRISE } from '../core/sample-data';
import { analyzeSecurityGraph, GraphAnalysisResult } from '../core/graph-engine';
import { appendAuditLog } from '../core/audit-logger';
import { applyRemediationToProject } from '../core/remediation-engine';

const STORAGE_PROJECT_KEY = 'agentfuse_active_project_v1';
const STORAGE_PROJECTS_LIST_KEY = 'agentfuse_saved_projects_list_v1';

interface ProjectContextType {
  project: SecurityProject;
  savedProjects: Array<{ id: string; name: string; updatedAt: string; agentCount: number }>;
  analysis: GraphAnalysisResult;
  selectedPathId: string | null;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  canUndo: boolean;
  canRedo: boolean;
  isSimulating: boolean;
  simulatedProject: SecurityProject | null;
  activeSimulationRemediation: RemediationOption | null;
  // Actions
  setSelectedPathId: (id: string | null) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  updateProject: (newProject: SecurityProject, actionNote?: string) => void;
  resetToDemo: () => void;
  createNewProject: (name: string, description?: string) => void;
  loadProjectById: (id: string) => void;
  saveCurrentProject: () => void;
  duplicateProject: () => void;
  undo: () => void;
  redo: () => void;
  applyRemediation: (remediation: RemediationOption) => void;
  startSimulation: (remediation: RemediationOption) => void;
  discardSimulation: () => void;
  commitSimulation: () => void;
  updateAgentPosition: (agentId: string, x: number, y: number) => void;
  updateResourcePosition: (resourceId: string, x: number, y: number) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [project, setProject] = useState<SecurityProject>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROJECT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.agents && parsed.resources) return parsed;
      }
    } catch (e) {
      console.warn('Could not read cached project', e);
    }
    return DEMO_PROJECT_ENTERPRISE;
  });

  const [savedProjectsList, setSavedProjectsList] = useState<
    Array<{ id: string; name: string; updatedAt: string; agentCount: number }>
  >(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROJECTS_LIST_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: DEMO_PROJECT_ENTERPRISE.id,
        name: DEMO_PROJECT_ENTERPRISE.name,
        updatedAt: DEMO_PROJECT_ENTERPRISE.updatedAt,
        agentCount: DEMO_PROJECT_ENTERPRISE.agents.length,
      },
    ];
  });

  // Undo / Redo history stacks
  const [history, setHistory] = useState<SecurityProject[]>([]);
  const [future, setFuture] = useState<SecurityProject[]>([]);

  // Selection states
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Simulation staging states
  const [simulatedProject, setSimulatedProject] = useState<SecurityProject | null>(null);
  const [activeSimulationRemediation, setActiveSimulationRemediation] = useState<RemediationOption | null>(null);

  // Re-run graph analysis whenever active project (or simulated project) changes
  const activeEffectiveProject = simulatedProject || project;
  const analysis = useMemo(() => {
    return analyzeSecurityGraph(activeEffectiveProject);
  }, [activeEffectiveProject]);

  // Persist project changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROJECT_KEY, JSON.stringify(project));
      // Also update saved list metadata
      setSavedProjectsList((prev) => {
        const index = prev.findIndex((p) => p.id === project.id);
        const item = {
          id: project.id,
          name: project.name,
          updatedAt: project.updatedAt,
          agentCount: project.agents.length,
        };
        const next = index >= 0 ? [...prev] : [...prev, item];
        if (index >= 0) next[index] = item;
        localStorage.setItem(STORAGE_PROJECTS_LIST_KEY, JSON.stringify(next));
        return next;
      });
    } catch (e) {
      console.error(e);
    }
  }, [project]);

  const updateProject = useCallback(
    (newProj: SecurityProject, actionNote?: string) => {
      setHistory((prev) => [...prev.slice(-15), project]);
      setFuture([]);
      const updated = {
        ...newProj,
        updatedAt: new Date().toISOString(),
      };
      setProject(updated);
      appendAuditLog({
        category: 'project',
        action: actionNote || 'Project Updated',
        details: `Modified project configuration for [${updated.name}]. Agents: ${updated.agents.length}, Permissions: ${updated.permissions.length}`,
        user: 'security-analyst',
      });
    },
    [project]
  );

  const resetToDemo = useCallback(() => {
    setHistory((prev) => [...prev, project]);
    setFuture([]);
    setProject(DEMO_PROJECT_ENTERPRISE);
    setSimulatedProject(null);
    setActiveSimulationRemediation(null);
    setSelectedPathId(null);
    appendAuditLog({
      category: 'project',
      action: 'Project Reset to Demo',
      details: 'Restored canonical Acme Corp Multi-Agent simulated architecture.',
      user: 'security-analyst',
    });
  }, [project]);

  const createNewProject = useCallback(
    (name: string, description: string = '') => {
      const newProj: SecurityProject = {
        id: `proj-${Date.now()}`,
        name,
        description,
        version: '1.0.0',
        updatedAt: new Date().toISOString(),
        isSimulated: true,
        riskWeights: project.riskWeights,
        agents: [],
        resources: [],
        permissions: [],
        delegations: [],
        legitimateWorkflows: [],
      };
      setHistory([]);
      setFuture([]);
      setProject(newProj);
      setSimulatedProject(null);
      setActiveSimulationRemediation(null);
      appendAuditLog({
        category: 'project',
        action: 'Created Blank Project Workspace',
        details: `Created new empty security assessment project: "${name}".`,
        user: 'security-analyst',
      });
    },
    [project.riskWeights]
  );

  const loadProjectById = useCallback(
    (id: string) => {
      if (id === DEMO_PROJECT_ENTERPRISE.id) {
        resetToDemo();
        return;
      }
      try {
        const raw = localStorage.getItem(`agentfuse_proj_${id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          setHistory((prev) => [...prev, project]);
          setFuture([]);
          setProject(parsed);
          setSimulatedProject(null);
          setActiveSimulationRemediation(null);
          appendAuditLog({
            category: 'project',
            action: 'Project Loaded',
            details: `Loaded project [${parsed.name}].`,
            user: 'security-analyst',
          });
        }
      } catch (err) {
        console.error(err);
      }
    },
    [project, resetToDemo]
  );

  const saveCurrentProject = useCallback(() => {
    try {
      localStorage.setItem(`agentfuse_proj_${project.id}`, JSON.stringify(project));
      appendAuditLog({
        category: 'project',
        action: 'Project Saved Snapshot',
        details: `Saved persistent snapshot of project [${project.name}].`,
        user: 'security-analyst',
      });
    } catch (e) {
      console.error(e);
    }
  }, [project]);

  const duplicateProject = useCallback(() => {
    const dupe: SecurityProject = {
      ...JSON.parse(JSON.stringify(project)),
      id: `proj-dupe-${Date.now()}`,
      name: `${project.name} (Copy)`,
      updatedAt: new Date().toISOString(),
    };
    updateProject(dupe, 'Project Duplicated');
  }, [project, updateProject]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [project, ...f]);
    setProject(prev);
    appendAuditLog({
      category: 'project',
      action: 'Undo Action',
      details: 'Reverted to previous project state revision.',
      user: 'security-analyst',
    });
  }, [history, project]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setHistory((h) => [...h, project]);
    setProject(next);
    appendAuditLog({
      category: 'project',
      action: 'Redo Action',
      details: 'Reapplied forward project state revision.',
      user: 'security-analyst',
    });
  }, [future, project]);

  const applyRemediation = useCallback(
    (rem: RemediationOption) => {
      const updated = applyRemediationToProject(project, rem);
      updateProject(
        updated,
        `Applied Remediation: ${rem.title} (${rem.changesSummary})`
      );
      appendAuditLog({
        category: 'remediation',
        action: 'Applied Remediation Cut',
        details: `${rem.title} - Cost: ${rem.cost}. Eliminated paths: ${rem.eliminatesAttackPathIds.join(', ') || 'N/A'}.`,
        user: 'remediation-planner',
      });
    },
    [project, updateProject]
  );

  const startSimulation = useCallback(
    (rem: RemediationOption) => {
      const simulated = applyRemediationToProject(project, rem);
      setSimulatedProject(simulated);
      setActiveSimulationRemediation(rem);
      appendAuditLog({
        category: 'simulation',
        action: 'What-If Simulation Staged',
        details: `Staged sandbox what-if trial for '${rem.title}'. Saved project is unchanged.`,
        user: 'what-if-simulator',
      });
    },
    [project]
  );

  const discardSimulation = useCallback(() => {
    setSimulatedProject(null);
    setActiveSimulationRemediation(null);
    appendAuditLog({
      category: 'simulation',
      action: 'What-If Simulation Discarded',
      details: 'Discarded simulated intervention without project mutation.',
      user: 'what-if-simulator',
    });
  }, []);

  const commitSimulation = useCallback(() => {
    if (simulatedProject && activeSimulationRemediation) {
      updateProject(
        simulatedProject,
        `Committed What-If Simulation: ${activeSimulationRemediation.title}`
      );
      setSimulatedProject(null);
      setActiveSimulationRemediation(null);
      appendAuditLog({
        category: 'remediation',
        action: 'What-If Simulation Committed',
        details: `Promoted tested simulation '${activeSimulationRemediation.title}' into permanent project graph.`,
        user: 'security-analyst',
      });
    }
  }, [simulatedProject, activeSimulationRemediation, updateProject]);

  const updateAgentPosition = useCallback((agentId: string, x: number, y: number) => {
    setProject((prev) => ({
      ...prev,
      agents: prev.agents.map((a) => (a.id === agentId ? { ...a, position: { x, y } } : a)),
    }));
  }, []);

  const updateResourcePosition = useCallback((resourceId: string, x: number, y: number) => {
    setProject((prev) => ({
      ...prev,
      resources: prev.resources.map((r) => (r.id === resourceId ? { ...r, position: { x, y } } : r)),
    }));
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        project: activeEffectiveProject,
        savedProjects: savedProjectsList,
        analysis,
        selectedPathId,
        selectedNodeId,
        selectedEdgeId,
        canUndo: history.length > 0,
        canRedo: future.length > 0,
        isSimulating: Boolean(simulatedProject),
        simulatedProject,
        activeSimulationRemediation,
        setSelectedPathId,
        setSelectedNodeId,
        setSelectedEdgeId,
        updateProject,
        resetToDemo,
        createNewProject,
        loadProjectById,
        saveCurrentProject,
        duplicateProject,
        undo,
        redo,
        applyRemediation,
        startSimulation,
        discardSimulation,
        commitSimulation,
        updateAgentPosition,
        updateResourcePosition,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
