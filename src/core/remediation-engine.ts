/**
 * AgentFuse AI - Automated Minimum-Cost Remediation Planner
 * Computes optimal graph cut interventions to eliminate attack paths while
 * strictly preserving legitimate business workflows.
 */

import {
  AgentDelegationLink,
  AttackPath,
  LegitimateWorkflow,
  Permission,
  RemediationOption,
  SecurityProject,
} from './types';
import { analyzeSecurityGraph } from './graph-engine';

/**
 * Checks whether all specified legitimate workflows remain operational in the given project.
 */
export function evaluateWorkflowPreservation(
  project: SecurityProject
): { allPreserved: boolean; brokenWorkflowIds: string[]; preservedWorkflowIds: string[] } {
  const brokenWorkflowIds: string[] = [];
  const preservedWorkflowIds: string[] = [];

  const agentMap = new Map(project.agents.map((a) => [a.id, a]));
  const delegationsBySource = new Map<string, AgentDelegationLink[]>();
  for (const del of project.delegations) {
    const list = delegationsBySource.get(del.sourceAgentId) || [];
    list.push(del);
    delegationsBySource.set(del.sourceAgentId, list);
  }

  const permsByAgent = new Map<string, Permission[]>();
  for (const p of project.permissions) {
    const list = permsByAgent.get(p.agentId) || [];
    list.push(p);
    permsByAgent.set(p.agentId, list);
  }

  for (const wf of project.legitimateWorkflows) {
    // Check if source agent can reach targetResourceId with requiredAction
    let workflowSatisfied = false;

    // Direct check
    const directPerms = permsByAgent.get(wf.sourceAgentId) || [];
    if (directPerms.some((p) => p.resourceId === wf.targetResourceId && p.action === wf.requiredAction)) {
      workflowSatisfied = true;
    } else {
      // Check via authorized delegation paths
      const visited = new Set<string>([wf.sourceAgentId]);
      const queue = [wf.sourceAgentId];

      while (queue.length > 0 && !workflowSatisfied) {
        const curr = queue.shift()!;
        const outgoing = delegationsBySource.get(curr) || [];
        for (const link of outgoing) {
          if (!visited.has(link.targetAgentId)) {
            visited.add(link.targetAgentId);
            const targetPerms = permsByAgent.get(link.targetAgentId) || [];
            if (targetPerms.some((p) => p.resourceId === wf.targetResourceId && p.action === wf.requiredAction)) {
              workflowSatisfied = true;
              break;
            }
            queue.push(link.targetAgentId);
          }
        }
      }
    }

    if (workflowSatisfied) {
      preservedWorkflowIds.push(wf.id);
    } else {
      brokenWorkflowIds.push(wf.id);
    }
  }

  return {
    allPreserved: brokenWorkflowIds.length === 0,
    brokenWorkflowIds,
    preservedWorkflowIds,
  };
}

/**
 * Creates an in-memory clone of a SecurityProject with a proposed remediation applied.
 */
export function applyRemediationToProject(
  project: SecurityProject,
  remediation: RemediationOption
): SecurityProject {
  const cloned: SecurityProject = JSON.parse(JSON.stringify(project));

  if (remediation.targetEntityType === 'permission') {
    if (remediation.type === 'revoke_permission') {
      cloned.permissions = cloned.permissions.filter((p) => p.id !== remediation.targetEntityId);
    } else if (remediation.type === 'add_approval_gate') {
      cloned.permissions = cloned.permissions.map((p) =>
        p.id === remediation.targetEntityId ? { ...p, requiresApproval: true } : p
      );
    } else if (remediation.type === 'narrow_scope') {
      cloned.permissions = cloned.permissions.map((p) =>
        p.id === remediation.targetEntityId ? { ...p, scope: 'scoped' } : p
      );
    }
  } else if (remediation.targetEntityType === 'delegation') {
    if (remediation.type === 'sever_delegation') {
      cloned.delegations = cloned.delegations.filter((d) => d.id !== remediation.targetEntityId);
    } else if (remediation.type === 'add_approval_gate') {
      cloned.delegations = cloned.delegations.map((d) =>
        d.id === remediation.targetEntityId ? { ...d, requiresApproval: true } : d
      );
    } else if (remediation.type === 'restrict_transmission') {
      cloned.delegations = cloned.delegations.map((d) =>
        d.id === remediation.targetEntityId ? { ...d, forwardContext: false } : d
      );
    }
  }

  return cloned;
}

/**
 * Generates all feasible candidate mitigations for an attack path, tests them deterministically,
 * and ranks them by lowest disruption cost and workflow preservation.
 */
export function generateRemediationOptions(
  project: SecurityProject,
  path: AttackPath
): RemediationOption[] {
  const candidates: RemediationOption[] = [];

  // Extract relevant permissions and delegations in this attack path
  const relevantPermissionIds = path.transitions
    .map((t) => t.permissionId)
    .filter(Boolean) as string[];

  const relevantDelegationIds = path.edgeIds.filter((eId) =>
    project.delegations.some((d) => d.id === eId)
  );

  // 1. Permission-level interventions
  for (const permId of relevantPermissionIds) {
    const perm = project.permissions.find((p) => p.id === permId);
    if (!perm) continue;

    const agent = project.agents.find((a) => a.id === perm.agentId);
    const res = project.resources.find((r) => r.id === perm.resourceId);

    // Option A: Require Human Approval Gate (Lowest disruption cost = 1)
    if (!perm.requiresApproval) {
      candidates.push({
        id: `rem-approval-${perm.id}`,
        title: `Enforce Approval Gate on [${agent?.name ?? perm.agentId}] → ${perm.action.toUpperCase()} '${res?.name ?? perm.resourceId}'`,
        description: `Require cryptographic or verified operator sign-off before allowing ${perm.action} action on '${res?.name}'. Autonomous exfiltration or unauthorized access is blocked at the boundary.`,
        type: 'add_approval_gate',
        targetEntityType: 'permission',
        targetEntityId: perm.id,
        cost: 1,
        eliminatesAttackPathIds: [],
        preservesLegitimateWorkflows: true,
        brokenWorkflowIds: [],
        changesSummary: `Set requiresApproval=true on permission ${perm.id} (${agent?.name} → ${res?.name})`,
      });
    }

    // Option B: Narrow Scope (Cost = 2)
    if (perm.scope === 'unrestricted') {
      candidates.push({
        id: `rem-scope-${perm.id}`,
        title: `Narrow Scope of [${agent?.name ?? perm.agentId}] on '${res?.name ?? perm.resourceId}'`,
        description: `Restrict permission scope from unrestricted tenant-wide to specific designated subfolder/context only.`,
        type: 'narrow_scope',
        targetEntityType: 'permission',
        targetEntityId: perm.id,
        cost: 2,
        eliminatesAttackPathIds: [],
        preservesLegitimateWorkflows: true,
        brokenWorkflowIds: [],
        changesSummary: `Set scope='scoped' on permission ${perm.id}`,
      });
    }

    // Option C: Revoke Permission entirely (Cost = 3 - highest friction)
    candidates.push({
      id: `rem-revoke-${perm.id}`,
      title: `Revoke ${perm.action.toUpperCase()} Permission from [${agent?.name ?? perm.agentId}] on '${res?.name ?? perm.resourceId}'`,
      description: `Completely sever permission ${perm.id}. Eliminates access entirely. May break legitimate workflows relying on this resource.`,
      type: 'revoke_permission',
      targetEntityType: 'permission',
      targetEntityId: perm.id,
      cost: 3,
      eliminatesAttackPathIds: [],
      preservesLegitimateWorkflows: true,
      brokenWorkflowIds: [],
      changesSummary: `Delete permission ${perm.id} (${agent?.name} → ${res?.name})`,
    });
  }

  // 2. Delegation-level interventions
  for (const delId of relevantDelegationIds) {
    const del = project.delegations.find((d) => d.id === delId);
    if (!del) continue;

    const src = project.agents.find((a) => a.id === del.sourceAgentId);
    const tgt = project.agents.find((a) => a.id === del.targetAgentId);

    // Option D: Restrict Context Forwarding / Data Transmission (Cost = 1.5)
    if (del.forwardContext) {
      candidates.push({
        id: `rem-context-${del.id}`,
        title: `Disable Context Forwarding: [${src?.name}] → [${tgt?.name}]`,
        description: `Prevent raw user payload and upstream memory buffers from forwarding from [${src?.name}] into [${tgt?.name}]. Eliminates indirect prompt injection payload traversal.`,
        type: 'restrict_transmission',
        targetEntityType: 'delegation',
        targetEntityId: del.id,
        cost: 1.5,
        eliminatesAttackPathIds: [],
        preservesLegitimateWorkflows: true,
        brokenWorkflowIds: [],
        changesSummary: `Set forwardContext=false on delegation link ${del.id}`,
      });
    }

    // Option E: Require Approval for Delegation (Cost = 1)
    if (!del.requiresApproval) {
      candidates.push({
        id: `rem-del-approval-${del.id}`,
        title: `Enforce Approval Gate on Delegation: [${src?.name}] → [${tgt?.name}]`,
        description: `Autonomous task hand-off between [${src?.name}] and [${tgt?.name}] must be confirmed by an authorized human operator.`,
        type: 'add_approval_gate',
        targetEntityType: 'delegation',
        targetEntityId: del.id,
        cost: 1,
        eliminatesAttackPathIds: [],
        preservesLegitimateWorkflows: true,
        brokenWorkflowIds: [],
        changesSummary: `Set requiresApproval=true on delegation link ${del.id}`,
      });
    }

    // Option F: Sever Delegation Link (Cost = 3)
    candidates.push({
      id: `rem-sever-${del.id}`,
      title: `Sever Delegation Pathway: [${src?.name}] → [${tgt?.name}]`,
      description: `Completely remove communication and task delegation channel between [${src?.name}] and [${tgt?.name}].`,
      type: 'sever_delegation',
      targetEntityType: 'delegation',
      targetEntityId: del.id,
      cost: 3,
      eliminatesAttackPathIds: [],
      preservesLegitimateWorkflows: true,
      brokenWorkflowIds: [],
      changesSummary: `Remove delegation link ${del.id} (${src?.name} ↛ ${tgt?.name})`,
    });
  }

  // 3. Deterministically evaluate each candidate: recompute graph & test workflows
  const validatedRemediations: RemediationOption[] = [];

  for (const cand of candidates) {
    const simulatedProject = applyRemediationToProject(project, cand);
    const postAnalysis = analyzeSecurityGraph(simulatedProject);
    const workflowCheck = evaluateWorkflowPreservation(simulatedProject);

    // Check if the specific path was eliminated or mitigated
    const pathStillPresent = postAnalysis.attackPaths.some((p) => {
      // If it has identical nodes and action
      return (
        p.entryAgentId === path.entryAgentId &&
        p.targetResourceId === path.targetResourceId &&
        p.targetAction === path.targetAction
      );
    });

    cand.preservesLegitimateWorkflows = workflowCheck.allPreserved;
    cand.brokenWorkflowIds = workflowCheck.brokenWorkflowIds;

    // Track which attack paths this intervention eliminates
    const originalPathIds = [path.id];
    if (!pathStillPresent) {
      cand.eliminatesAttackPathIds = originalPathIds;
      validatedRemediations.push(cand);
    }
  }

  // Sort candidates:
  // First, those that preserve ALL legitimate workflows.
  // Second, by lowest cost (minimum-cost cut).
  validatedRemediations.sort((a, b) => {
    if (a.preservesLegitimateWorkflows && !b.preservesLegitimateWorkflows) return -1;
    if (!a.preservesLegitimateWorkflows && b.preservesLegitimateWorkflows) return 1;
    return a.cost - b.cost;
  });

  return validatedRemediations;
}
