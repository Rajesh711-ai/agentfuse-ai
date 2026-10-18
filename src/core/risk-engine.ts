/**
 * AgentFuse AI - Deterministic Security Risk Engine
 * Implements a transparent, deterministic risk model based on documented factors:
 * - Resource Sensitivity
 * - Action Impact Severity
 * - Untrusted Input Reachability
 * - Cross-Boundary Transitions
 * - Scope Breadth
 * - Enforced Human Approval Gates
 */

import {
  AttackPath,
  PermissionAction,
  ResourceSensitivity,
  RiskWeights,
} from './types';

export const DEFAULT_RISK_WEIGHTS: RiskWeights = {
  sensitivityMultiplier: {
    public: 10,
    internal: 35,
    confidential: 75,
    restricted: 100,
  },
  actionImpactMultiplier: {
    read: 0.55,
    share: 0.75,
    write: 0.85,
    delete: 0.95,
    execute: 0.90,
    transmit: 1.0,
  },
  untrustedInputWeight: 1.25,
  boundaryCrossWeight: 12.0, // Points per boundary crossed
  unrestrictedScopeWeight: 1.2,
  approvalMitigationDiscount: 0.65, // 65% discount if an approval gate is enforced
};

export interface RiskCalculationResult {
  score: number; // 0 - 100
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  factors: {
    sensitivityFactor: number;
    actionImpactFactor: number;
    reachabilityFactor: number;
    trustBoundariesCrossedFactor: number;
    scopeFactor: number;
    approvalMitigation: number;
    rawScore: number;
    formulaExplanation: string;
  };
}

export function calculatePathRisk(params: {
  sensitivity: ResourceSensitivity;
  action: PermissionAction;
  hasUntrustedInput: boolean;
  boundariesCrossedCount: number;
  isUnrestrictedScope: boolean;
  hasEnforcedApproval: boolean;
  pathLength: number;
  weights?: RiskWeights;
}): RiskCalculationResult {
  const w = params.weights || DEFAULT_RISK_WEIGHTS;

  const sensitivityScore = w.sensitivityMultiplier[params.sensitivity] || 35;
  const actionFactor = w.actionImpactMultiplier[params.action] || 0.6;
  
  // Base raw value from sensitivity * action
  let baseScore = sensitivityScore * actionFactor;

  // Untrusted input amplifier: untrusted input entry directly primes LLM manipulation / indirect prompt injection
  const reachabilityMultiplier = params.hasUntrustedInput ? w.untrustedInputWeight : 0.85;
  baseScore *= reachabilityMultiplier;

  // Boundary crossing penalty: traversing zones (e.g., DMZ -> Restricted -> Sink) adds friction and architectural exposure
  const boundaryBonus = params.boundariesCrossedCount * w.boundaryCrossWeight;
  let totalScore = baseScore + boundaryBonus;

  // Scope amplifier
  if (params.isUnrestrictedScope) {
    totalScore *= w.unrestrictedScopeWeight;
  }

  // Approval discount: if genuine verified human approval is required, risk is substantially mitigated
  let approvalFactor = 1.0;
  if (params.hasEnforcedApproval) {
    approvalFactor = 1.0 - w.approvalMitigationDiscount;
    totalScore *= approvalFactor;
  }

  // Attenuation for long paths (each hop adds slight operational friction/drop-off, but doesn't eliminate risk)
  if (params.pathLength > 3) {
    totalScore *= Math.max(0.75, 1 - (params.pathLength - 3) * 0.05);
  }

  // Clamp strictly to 0 - 100
  const finalScore = Math.min(100, Math.max(5, Math.round(totalScore)));

  let severity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
  if (finalScore >= 80) severity = 'Critical';
  else if (finalScore >= 60) severity = 'High';
  else if (finalScore >= 40) severity = 'Medium';

  const explanation = `Score = [Sensitivity(${sensitivityScore}) × Action(${actionFactor}) × InputFactor(${reachabilityMultiplier.toFixed(2)}) + Boundaries(${params.boundariesCrossedCount} × ${w.boundaryCrossWeight})] × Scope(${params.isUnrestrictedScope ? w.unrestrictedScopeWeight : 1.0}) × Approval(${approvalFactor.toFixed(2)}) = ${finalScore.toFixed(1)}/100`;

  return {
    score: finalScore,
    severity,
    factors: {
      sensitivityFactor: sensitivityScore,
      actionImpactFactor: actionFactor,
      reachabilityFactor: reachabilityMultiplier,
      trustBoundariesCrossedFactor: boundaryBonus,
      scopeFactor: params.isUnrestrictedScope ? w.unrestrictedScopeWeight : 1.0,
      approvalMitigation: approvalFactor,
      rawScore: totalScore,
      formulaExplanation: explanation,
    },
  };
}
