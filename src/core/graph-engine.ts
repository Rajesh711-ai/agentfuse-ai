/**
 * AgentFuse AI - Real Graph Traversal & Attack Path Validation Engine
 * Implements deterministic BFS/DFS pathfinding with multi-hop validation:
 * - Untrusted Input Entry validation
 * - Agent-to-Agent Delegation (context forwarding checks)
 * - Explicit Permission Verification (no assumed transmission capabilities)
 * - Trust Boundary Transition Tracking
 * - Approval Gate Enforcement checks
 */

import {
  Agent,
  AgentDelegationLink,
  AttackPath,
  PathTransition,
  Permission,
  PermissionAction,
  Resource,
  SecurityProject,
} from './types';
import { calculatePathRisk } from './risk-engine';

export interface GraphAnalysisResult {
  attackPaths: AttackPath[];
  agentCount: number;
  resourceCount: number;
  permissionCount: number;
  delegationCount: number;
  reachableResourcesByAgent: Record<string, string[]>;
  boundaryCrossingCount: number;
  analysisDurationMs: number;
  summary: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
}

/**
 * Validates whether an agent chain has an unbroken route to a target action/resource.
 */
export function analyzeSecurityGraph(project: SecurityProject): GraphAnalysisResult {
  const startTime = performance.now();
  const { agents, resources, permissions, delegations, riskWeights } = project;

  const agentMap = new Map<string, Agent>(agents.map((a) => [a.id, a]));
  const resourceMap = new Map<string, Resource>(resources.map((r) => [r.id, r]));

  // Index permissions by agent
  const permsByAgent = new Map<string, Permission[]>();
  for (const perm of permissions) {
    const list = permsByAgent.get(perm.agentId) || [];
    list.push(perm);
    permsByAgent.set(perm.agentId, list);
  }

  // Index delegations by source agent
  const delegationsBySource = new Map<string, AgentDelegationLink[]>();
  for (const del of delegations) {
    const list = delegationsBySource.get(del.sourceAgentId) || [];
    list.push(del);
    delegationsBySource.set(del.sourceAgentId, list);
  }

  // Track reachable resources for each agent
  const reachableResourcesByAgent: Record<string, string[]> = {};
  for (const agent of agents) {
    const reachable = new Set<string>();
    // Direct permissions
    const directPerms = permsByAgent.get(agent.id) || [];
    for (const p of directPerms) {
      reachable.add(p.resourceId);
    }
    // Traverse delegation
    const visitedAgents = new Set<string>([agent.id]);
    const queue = [agent.id];
    while (queue.length > 0) {
      const currAgentId = queue.shift()!;
      const outgoing = delegationsBySource.get(currAgentId) || [];
      for (const d of outgoing) {
        if (!visitedAgents.has(d.targetAgentId)) {
          visitedAgents.add(d.targetAgentId);
          queue.push(d.targetAgentId);
          const targetPerms = permsByAgent.get(d.targetAgentId) || [];
          for (const tp of targetPerms) {
            reachable.add(tp.resourceId);
          }
        }
      }
    }
    reachableResourcesByAgent[agent.id] = Array.from(reachable);
  }

  const detectedPaths: AttackPath[] = [];
  let pathIdCounter = 1;

  // Identify untrusted entry agents
  const entryAgents = agents.filter(
    (a) => a.canReceiveUntrustedInput || a.trustLevel === 'untrusted' || a.trustLevel === 'low'
  );

  // We look for two primary dangerous patterns:
  // PATTERN 1: Data Exfiltration Chain (Untrusted Input -> Agent -> Access Sensitive Resource -> Transmit to External Sink)
  // PATTERN 2: Direct Unauthorized Access / Escalation (Untrusted Input -> Delegation Chain -> Access Restricted/Confidential Resource or High-Impact Action without Approval)

  for (const entryAgent of entryAgents) {
    // DFS through delegation graph to track full agent chains
    interface AgentChainHop {
      agent: Agent;
      delegationLink?: AgentDelegationLink;
    }

    const maxDepth = 6;
    const findAgentChains = (
      current: Agent,
      chain: AgentChainHop[],
      visited: Set<string>
    ): AgentChainHop[][] => {
      if (chain.length >= maxDepth) return [chain];
      const results: AgentChainHop[][] = [chain];
      const outgoing = delegationsBySource.get(current.id) || [];

      for (const d of outgoing) {
        if (!visited.has(d.targetAgentId)) {
          const targetAgent = agentMap.get(d.targetAgentId);
          if (targetAgent) {
            const nextVisited = new Set(visited);
            nextVisited.add(targetAgent.id);
            const subChains = findAgentChains(
              targetAgent,
              [...chain, { agent: targetAgent, delegationLink: d }],
              nextVisited
            );
            results.push(...subChains);
          }
        }
      }
      return results;
    };

    const allChains = findAgentChains(entryAgent, [{ agent: entryAgent }], new Set([entryAgent.id]));

    // Evaluate each chain for combined permission vulnerabilities
    for (const chain of allChains) {
      const agentIdsInChain = chain.map((h) => h.agent.id);

      // Check if any agent in chain has READ access to sensitive data
      for (let readIdx = 0; readIdx < chain.length; readIdx++) {
        const readerHop = chain[readIdx];
        const readerPerms = permsByAgent.get(readerHop.agent.id) || [];

        for (const readPerm of readerPerms) {
          const sensitiveRes = resourceMap.get(readPerm.resourceId);
          if (!sensitiveRes) continue;

          const isSensitive =
            sensitiveRes.sensitivity === 'confidential' || sensitiveRes.sensitivity === 'restricted';

          // PATTERN 1: Can this read data reach an External Sink?
          // The data can reach any agent downstream in the chain that received context
          for (let transmitIdx = readIdx; transmitIdx < chain.length; transmitIdx++) {
            const transmitterHop = chain[transmitIdx];
            
            // Check context forwarding continuity from reader to transmitter
            let contextContinuous = true;
            for (let k = readIdx; k < transmitIdx; k++) {
              const link = chain[k + 1].delegationLink;
              if (!link || !link.forwardContext) {
                contextContinuous = false;
                break;
              }
            }

            if (!contextContinuous) continue;

            const transmitterPerms = permsByAgent.get(transmitterHop.agent.id) || [];
            for (const transPerm of transmitterPerms) {
              const sinkRes = resourceMap.get(transPerm.resourceId);
              if (!sinkRes) continue;

              const isTransmitSink =
                (transPerm.action === 'transmit' || transPerm.action === 'share') &&
                (sinkRes.isExternalSink || sinkRes.trustBoundary === 'external_sink' || sinkRes.type === 'external_sink' || sinkRes.type === 'communication_channel');

              if (isSensitive && isTransmitSink) {
                // We have a VALIDATED exfiltration attack path!
                const pathKey = `${entryAgent.id}->${readerHop.agent.id}->${readPerm.resourceId}->${transmitterHop.agent.id}->${transPerm.resourceId}`;
                
                // Avoid duplicates
                if (detectedPaths.some((p) => p.id.includes(pathKey))) continue;

                // Build transitions
                const transitions: PathTransition[] = [];
                let step = 1;

                // 1. Untrusted intake
                transitions.push({
                  step: step++,
                  fromId: 'external_actor',
                  fromName: 'Untrusted External Actor / Input',
                  fromType: 'external_input',
                  toId: entryAgent.id,
                  toName: entryAgent.name,
                  toType: 'agent',
                  transitionType: 'untrusted_intake',
                  description: `Agent [${entryAgent.name}] ingests untrusted external inputs (prompts, webhook, or email).`,
                  boundaryCrossed: entryAgent.trustBoundary !== 'public_dmz',
                  fromBoundary: 'public_internet',
                  toBoundary: entryAgent.trustBoundary,
                  requiresApproval: false,
                  isEnforcedApproval: false,
                  isValidated: true,
                  assumption: 'Attacker injects prompt directives or commands via unvalidated input channel.',
                });

                // 2. Delegation hops to reader
                for (let h = 0; h < readIdx; h++) {
                  const src = chain[h].agent;
                  const tgt = chain[h + 1].agent;
                  const link = chain[h + 1].delegationLink!;
                  transitions.push({
                    step: step++,
                    fromId: src.id,
                    fromName: src.name,
                    fromType: 'agent',
                    toId: tgt.id,
                    toName: tgt.name,
                    toType: 'agent',
                    transitionType: 'agent_delegation',
                    description: `[${src.name}] delegates task to [${tgt.name}] (${link.delegationType}) with context forwarding.`,
                    boundaryCrossed: src.trustBoundary !== tgt.trustBoundary,
                    fromBoundary: src.trustBoundary,
                    toBoundary: tgt.trustBoundary,
                    requiresApproval: link.requiresApproval,
                    isEnforcedApproval: link.requiresApproval,
                    isValidated: true,
                    assumption: `Autonomous delegation link '${link.id}' executes without explicit operator veto.`,
                  });
                }

                // 3. Read sensitive resource
                transitions.push({
                  step: step++,
                  fromId: readerHop.agent.id,
                  fromName: readerHop.agent.name,
                  fromType: 'agent',
                  toId: sensitiveRes.id,
                  toName: sensitiveRes.name,
                  toType: 'resource',
                  transitionType: 'permission_access',
                  permissionAction: readPerm.action,
                  permissionId: readPerm.id,
                  description: `[${readerHop.agent.name}] uses granted permission to ${readPerm.action.toUpperCase()} sensitive asset '${sensitiveRes.name}'.`,
                  boundaryCrossed: readerHop.agent.trustBoundary !== sensitiveRes.trustBoundary,
                  fromBoundary: readerHop.agent.trustBoundary,
                  toBoundary: sensitiveRes.trustBoundary,
                  requiresApproval: readPerm.requiresApproval,
                  isEnforcedApproval: readPerm.requiresApproval,
                  isValidated: true,
                  assumption: `Permission [${readPerm.id}] allows ${readPerm.scope} access to classified ${sensitiveRes.dataClassification} data.`,
                });

                // 4. Delegation hops from reader to transmitter (if different)
                for (let h = readIdx; h < transmitIdx; h++) {
                  const src = chain[h].agent;
                  const tgt = chain[h + 1].agent;
                  const link = chain[h + 1].delegationLink!;
                  transitions.push({
                    step: step++,
                    fromId: src.id,
                    fromName: src.name,
                    fromType: 'agent',
                    toId: tgt.id,
                    toName: tgt.name,
                    toType: 'agent',
                    transitionType: 'agent_delegation',
                    description: `[${src.name}] forwards sensitive data payload downstream to [${tgt.name}].`,
                    boundaryCrossed: src.trustBoundary !== tgt.trustBoundary,
                    fromBoundary: src.trustBoundary,
                    toBoundary: tgt.trustBoundary,
                    requiresApproval: link.requiresApproval,
                    isEnforcedApproval: link.requiresApproval,
                    isValidated: true,
                    assumption: `Inter-agent protocol forwards unencrypted payload buffer without content sanitization.`,
                  });
                }

                // 5. Exfiltration to sink
                transitions.push({
                  step: step++,
                  fromId: transmitterHop.agent.id,
                  fromName: transmitterHop.agent.name,
                  fromType: 'agent',
                  toId: sinkRes.id,
                  toName: sinkRes.name,
                  toType: 'resource',
                  transitionType: 'data_exfiltration',
                  permissionAction: transPerm.action,
                  permissionId: transPerm.id,
                  description: `[${transmitterHop.agent.name}] transmits sensitive payload out through [${sinkRes.name}].`,
                  boundaryCrossed: transmitterHop.agent.trustBoundary !== sinkRes.trustBoundary,
                  fromBoundary: transmitterHop.agent.trustBoundary,
                  toBoundary: sinkRes.trustBoundary,
                  requiresApproval: transPerm.requiresApproval,
                  isEnforcedApproval: transPerm.requiresApproval,
                  isValidated: true,
                  assumption: `Permission [${transPerm.id}] lacks egress data loss prevention (DLP) or human sign-off.`,
                });

                const boundariesCrossedCount = transitions.filter((t) => t.boundaryCrossed).length;
                const hasEnforcedApproval = transitions.some((t) => t.isEnforcedApproval);
                const isUnrestrictedScope = readPerm.scope === 'unrestricted' || transPerm.scope === 'unrestricted';

                const risk = calculatePathRisk({
                  sensitivity: sensitiveRes.sensitivity,
                  action: 'transmit',
                  hasUntrustedInput: true,
                  boundariesCrossedCount,
                  isUnrestrictedScope,
                  hasEnforcedApproval,
                  pathLength: transitions.length,
                  weights: riskWeights,
                });

                const nodeIds = Array.from(
                  new Set([
                    entryAgent.id,
                    ...chain.slice(0, transmitIdx + 1).map((h) => h.agent.id),
                    sensitiveRes.id,
                    sinkRes.id,
                  ])
                );

                const edgeIds = [
                  ...chain.slice(0, transmitIdx).map((h) => h.delegationLink?.id).filter(Boolean) as string[],
                  readPerm.id,
                  transPerm.id,
                ];

                detectedPaths.push({
                  id: `path-exfil-${pathIdCounter++}`,
                  title: `Indirect Data Exfiltration: [${entryAgent.name}] → [${sensitiveRes.name}] → [${sinkRes.name}]`,
                  category: 'Exfiltration',
                  severity: risk.severity,
                  riskScore: risk.score,
                  entryAgentId: entryAgent.id,
                  targetResourceId: sinkRes.id,
                  targetAction: transPerm.action,
                  nodeIds,
                  edgeIds,
                  transitions,
                  riskBreakdown: risk.factors,
                  narrative: `An untrusted actor can manipulate [${entryAgent.name}] to trigger task delegation through [${readerHop.agent.name}], which accesses ${sensitiveRes.sensitivity} resource '${sensitiveRes.name}', forwarding the payload to [${transmitterHop.agent.name}] to transmit via '${sinkRes.name}'.`,
                  prerequisites: [
                    `Untrusted input channel active on [${entryAgent.name}]`,
                    `Delegation links without data payload inspection`,
                    `Unrestricted read permission on [${sensitiveRes.name}]`,
                    `External transmission permission without human approval gate`,
                  ],
                  impactAssessment: `Potential loss of ${sensitiveRes.dataClassification} records through indirect exfiltration, violating confidentiality boundaries and regulatory mandates.`,
                });
              }
            }
          }
        }
      }
    }

    // Now evaluate Privilege Escalation only for sensitive resources not already exfiltrated
    const exfiltratedResourceIds = new Set(
      detectedPaths.filter((p) => p.entryAgentId === entryAgent.id && p.category === 'Exfiltration').map((p) => p.nodeIds).flat()
    );

    for (const chain of allChains) {
      for (let readIdx = 1; readIdx < chain.length; readIdx++) {
        const readerHop = chain[readIdx];
        const readerPerms = permsByAgent.get(readerHop.agent.id) || [];

        for (const readPerm of readerPerms) {
          const sensitiveRes = resourceMap.get(readPerm.resourceId);
          if (!sensitiveRes) continue;

          const isSensitive =
            sensitiveRes.sensitivity === 'confidential' || sensitiveRes.sensitivity === 'restricted';

          if (isSensitive && !readPerm.requiresApproval && !exfiltratedResourceIds.has(sensitiveRes.id)) {
            const pathKey = `unauth-access-${entryAgent.id}->${readerHop.agent.id}->${sensitiveRes.id}`;
            if (!detectedPaths.some((p) => p.id.includes(pathKey) || p.narrative.includes(pathKey))) {
              const transitions: PathTransition[] = [];
              let step = 1;

              transitions.push({
                step: step++,
                fromId: 'external_actor',
                fromName: 'Untrusted External Actor / Input',
                fromType: 'external_input',
                toId: entryAgent.id,
                toName: entryAgent.name,
                toType: 'agent',
                transitionType: 'untrusted_intake',
                description: `Untrusted prompt/input ingested by low-trust agent [${entryAgent.name}].`,
                boundaryCrossed: entryAgent.trustBoundary !== 'public_dmz',
                fromBoundary: 'public_internet',
                toBoundary: entryAgent.trustBoundary,
                requiresApproval: false,
                isEnforcedApproval: false,
                isValidated: true,
                assumption: 'Attacker leverages agent instruction ambiguity or prompt injection.',
              });

              for (let h = 0; h < readIdx; h++) {
                const src = chain[h].agent;
                const tgt = chain[h + 1].agent;
                const link = chain[h + 1].delegationLink!;
                transitions.push({
                  step: step++,
                  fromId: src.id,
                  fromName: src.name,
                  fromType: 'agent',
                  toId: tgt.id,
                  toName: tgt.name,
                  toType: 'agent',
                  transitionType: 'agent_delegation',
                  description: `Privilege escalation hop: [${src.name}] delegates action to higher-trust [${tgt.name}].`,
                  boundaryCrossed: src.trustBoundary !== tgt.trustBoundary,
                  fromBoundary: src.trustBoundary,
                  toBoundary: tgt.trustBoundary,
                  requiresApproval: link.requiresApproval,
                  isEnforcedApproval: link.requiresApproval,
                  isValidated: true,
                  assumption: 'No role-based boundary validation between requesting agent and executing agent.',
                });
              }

              transitions.push({
                step: step++,
                fromId: readerHop.agent.id,
                fromName: readerHop.agent.name,
                fromType: 'agent',
                toId: sensitiveRes.id,
                toName: sensitiveRes.name,
                toType: 'resource',
                transitionType: 'permission_access',
                permissionAction: readPerm.action,
                permissionId: readPerm.id,
                description: `[${readerHop.agent.name}] executes ${readPerm.action.toUpperCase()} on '${sensitiveRes.name}'.`,
                boundaryCrossed: readerHop.agent.trustBoundary !== sensitiveRes.trustBoundary,
                fromBoundary: readerHop.agent.trustBoundary,
                toBoundary: sensitiveRes.trustBoundary,
                requiresApproval: readPerm.requiresApproval,
                isEnforcedApproval: readPerm.requiresApproval,
                isValidated: true,
                assumption: `Permission granted without requiring human-in-the-loop review.`,
              });

              const boundariesCrossedCount = transitions.filter((t) => t.boundaryCrossed).length;
              const hasEnforcedApproval = transitions.some((t) => t.isEnforcedApproval);

              const risk = calculatePathRisk({
                sensitivity: sensitiveRes.sensitivity,
                action: readPerm.action,
                hasUntrustedInput: true,
                boundariesCrossedCount,
                isUnrestrictedScope: readPerm.scope === 'unrestricted',
                hasEnforcedApproval,
                pathLength: transitions.length,
                weights: riskWeights,
              });

              const nodeIds = Array.from(
                new Set([
                  entryAgent.id,
                  ...chain.slice(0, readIdx + 1).map((h) => h.agent.id),
                  sensitiveRes.id,
                ])
              );

              const edgeIds = [
                ...chain.slice(0, readIdx).map((h) => h.delegationLink?.id).filter(Boolean) as string[],
                readPerm.id,
              ];

              detectedPaths.push({
                id: `path-privesc-${pathIdCounter++}`,
                title: `Indirect Privilege Escalation: [${entryAgent.name}] → [${sensitiveRes.name}] (${readPerm.action})`,
                category: 'Privilege Escalation',
                severity: risk.severity,
                riskScore: risk.score,
                entryAgentId: entryAgent.id,
                targetResourceId: sensitiveRes.id,
                targetAction: readPerm.action,
                nodeIds,
                edgeIds,
                transitions,
                riskBreakdown: risk.factors,
                narrative: `Untrusted agent [${entryAgent.name}] escalates privilege through delegation chain ending at [${readerHop.agent.name}], gaining unauthorized ${readPerm.action} access to ${sensitiveRes.sensitivity} asset '${sensitiveRes.name}' (${pathKey}).`,
                prerequisites: [
                  `Untrusted intake enabled on [${entryAgent.name}]`,
                  `Unrestricted inter-agent task delegation`,
                  `Lack of caller authentication on [${readerHop.agent.name}]`,
                ],
                impactAssessment: `Unauthorized access and exposure of internal ${sensitiveRes.dataClassification} records.`,
              });
            }
          }
        }
      }
    }
  }

  // Sort paths by risk score descending
  detectedPaths.sort((a, b) => b.riskScore - a.riskScore);

  const duration = Math.round(performance.now() - startTime);

  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;

  for (const p of detectedPaths) {
    if (p.severity === 'Critical') criticalCount++;
    else if (p.severity === 'High') highCount++;
    else if (p.severity === 'Medium') mediumCount++;
    else lowCount++;
  }

  return {
    attackPaths: detectedPaths,
    agentCount: agents.length,
    resourceCount: resources.length,
    permissionCount: permissions.length,
    delegationCount: delegations.length,
    reachableResourcesByAgent,
    boundaryCrossingCount: detectedPaths.reduce(
      (sum, p) => sum + p.transitions.filter((t) => t.boundaryCrossed).length,
      0
    ),
    analysisDurationMs: duration,
    summary: {
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
    },
  };
}
