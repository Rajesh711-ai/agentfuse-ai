/**
 * AgentFuse AI - Core Security Data Models & Type Definitions
 * Represents agents, resources, permissions, delegations, attack paths, and remediations.
 */

export type TrustLevel = 'untrusted' | 'low' | 'medium' | 'high' | 'critical';

export type TrustBoundary = 
  | 'public_dmz'          // External/Public internet facing
  | 'corporate_lan'        // Standard internal corporate zone
  | 'restricted_enclave'  // Isolated high-security data tier
  | 'external_sink';       // Third-party external endpoints, webhooks, cloud storage

export type ResourceType = 
  | 'document'
  | 'database'
  | 'api'
  | 'credentials'
  | 'communication_channel'
  | 'external_sink';

export type ResourceSensitivity = 
  | 'public' 
  | 'internal' 
  | 'confidential' 
  | 'restricted';

export type PermissionAction = 
  | 'read' 
  | 'write' 
  | 'execute' 
  | 'share' 
  | 'delete' 
  | 'transmit';

export type PermissionScope = 'scoped' | 'unrestricted';

export interface Agent {
  id: string;
  name: string;
  purpose: string;
  trustLevel: TrustLevel;
  trustBoundary: TrustBoundary;
  canReceiveUntrustedInput: boolean;
  tools: string[];
  connectedAgentIds: string[]; // Agents this agent is allowed to invoke/delegate to
  tags: string[];
  position?: { x: number; y: number };
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  sensitivity: ResourceSensitivity;
  trustBoundary: TrustBoundary;
  description: string;
  dataClassification: string;
  isExternalSink?: boolean; // Can exfiltrate or send data outside
  position?: { x: number; y: number };
}

export interface Permission {
  id: string;
  agentId: string;
  resourceId: string;
  action: PermissionAction;
  scope: PermissionScope;
  requiresApproval: boolean;
  isDelegatable: boolean;
}

export interface AgentDelegationLink {
  id: string;
  sourceAgentId: string;
  targetAgentId: string;
  delegationType: 'invoke_task' | 'pass_data' | 'autonomous_handshake';
  forwardContext: boolean; // Forwards user payload or sensitive context
  requiresApproval: boolean;
  isAuthorizedWorkflow: boolean;
}

export interface LegitimateWorkflow {
  id: string;
  name: string;
  description: string;
  sourceAgentId: string;
  targetResourceId: string;
  requiredAction: PermissionAction;
  authorizedPathNodeIds: string[];
  businessCriticality: 'low' | 'medium' | 'high' | 'critical';
}

export interface RiskWeights {
  sensitivityMultiplier: {
    public: number;
    internal: number;
    confidential: number;
    restricted: number;
  };
  actionImpactMultiplier: {
    read: number;
    write: number;
    execute: number;
    share: number;
    delete: number;
    transmit: number;
  };
  untrustedInputWeight: number;
  boundaryCrossWeight: number;
  unrestrictedScopeWeight: number;
  approvalMitigationDiscount: number; // e.g. 0.6 reduces risk by 60% if approved
}

export interface PathTransition {
  step: number;
  fromId: string;
  fromName: string;
  fromType: 'agent' | 'resource' | 'external_input';
  toId: string;
  toName: string;
  toType: 'agent' | 'resource';
  transitionType: 'untrusted_intake' | 'agent_delegation' | 'permission_access' | 'data_exfiltration';
  description: string;
  permissionAction?: PermissionAction;
  permissionId?: string;
  boundaryCrossed: boolean;
  fromBoundary: string;
  toBoundary: string;
  requiresApproval: boolean;
  isEnforcedApproval: boolean;
  isValidated: boolean;
  assumption: string;
}

export interface AttackPath {
  id: string;
  title: string;
  category: 'Exfiltration' | 'Privilege Escalation' | 'Unauthorized Modification' | 'Secret Harvesting' | 'Cross-Boundary Leak';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  riskScore: number; // 0 to 100
  entryAgentId: string;
  targetResourceId: string;
  targetAction: PermissionAction;
  nodeIds: string[];
  edgeIds: string[];
  transitions: PathTransition[];
  riskBreakdown: {
    sensitivityFactor: number;
    actionImpactFactor: number;
    reachabilityFactor: number;
    trustBoundariesCrossedFactor: number;
    scopeFactor: number;
    approvalMitigation: number;
    rawScore: number;
    formulaExplanation: string;
  };
  narrative: string;
  prerequisites: string[];
  impactAssessment: string;
}

export interface RemediationOption {
  id: string;
  title: string;
  description: string;
  type: 'revoke_permission' | 'narrow_scope' | 'add_approval_gate' | 'sever_delegation' | 'restrict_transmission';
  targetEntityType: 'permission' | 'delegation' | 'agent';
  targetEntityId: string;
  cost: number; // 1 = Low friction (e.g. approval gate), 2 = Medium (narrow scope), 3 = High (revoke)
  eliminatesAttackPathIds: string[];
  preservesLegitimateWorkflows: boolean;
  brokenWorkflowIds: string[];
  changesSummary: string;
}

export interface SecurityProject {
  id: string;
  name: string;
  description: string;
  version: string;
  updatedAt: string;
  isSimulated: boolean;
  agents: Agent[];
  resources: Resource[];
  permissions: Permission[];
  delegations: AgentDelegationLink[];
  legitimateWorkflows: LegitimateWorkflow[];
  riskWeights: RiskWeights;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  category: 'analysis' | 'remediation' | 'project' | 'simulation' | 'benchmark';
  action: string;
  details: string;
  user: string;
  isSimulated: boolean;
}

export interface BenchmarkScenario {
  id: string;
  name: string;
  category: 'dangerous' | 'benign' | 'edge_case';
  description: string;
  expectedHasVulnerability: boolean;
  expectedMinRiskyPaths?: number;
  project: SecurityProject;
}

export interface BenchmarkMetrics {
  totalScenarios: number;
  scenariosRun: number;
  dangerousDetected: number;
  benignCorrectlyPassed: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  accuracy: number;
  f1Score: number;
  attackPathEliminationRate: number;
  workflowPreservationRate: number;
  averagePermissionsChanged: number;
  averageAnalysisLatencyMs: number;
}
