/**
 * AgentFuse AI - Security Project Schema Validator
 * Validates imported project JSON files for schema conformance, valid UUID/IDs,
 * referential integrity (foreign keys), size limits, and sanitizes untrusted input.
 */

import { SecurityProject } from './types';
import { DEFAULT_RISK_WEIGHTS } from './risk-engine';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedProject?: SecurityProject;
}

const MAX_JSON_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB limit
const MAX_ENTITIES_COUNT = 500;

export function validateProjectSchema(rawContent: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!rawContent || typeof rawContent !== 'string') {
    return { isValid: false, errors: ['Input payload is empty or not a string.'], warnings };
  }

  if (rawContent.length > MAX_JSON_SIZE_BYTES) {
    return {
      isValid: false,
      errors: [`File size (${(rawContent.length / 1024 / 1024).toFixed(2)} MB) exceeds maximum allowed limit of 5 MB.`],
      warnings,
    };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawContent);
  } catch (err: any) {
    return {
      isValid: false,
      errors: [`Invalid JSON format: ${err.message}`],
      warnings,
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { isValid: false, errors: ['Root JSON structure must be an object.'], warnings };
  }

  // Validate Project Metadata
  if (typeof parsed.name !== 'string' || parsed.name.trim().length === 0) {
    errors.push("Missing or invalid 'name' field in project metadata.");
  }

  const validTrustLevels = new Set(['untrusted', 'low', 'medium', 'high', 'critical']);
  const validTrustBoundaries = new Set(['public_dmz', 'corporate_lan', 'restricted_enclave', 'external_sink']);
  const validResourceTypes = new Set(['document', 'database', 'api', 'credentials', 'communication_channel', 'external_sink']);
  const validSensitivities = new Set(['public', 'internal', 'confidential', 'restricted']);
  const validActions = new Set(['read', 'write', 'execute', 'share', 'delete', 'transmit']);
  const validScopes = new Set(['scoped', 'unrestricted']);

  // Validate Agents
  if (!Array.isArray(parsed.agents)) {
    errors.push("Field 'agents' must be an array.");
  } else if (parsed.agents.length > MAX_ENTITIES_COUNT) {
    errors.push(`Agents count (${parsed.agents.length}) exceeds safety limit of ${MAX_ENTITIES_COUNT}.`);
  }

  const agentIds = new Set<string>();
  const agents = Array.isArray(parsed.agents) ? parsed.agents : [];

  agents.forEach((ag: any, idx: number) => {
    if (!ag || typeof ag !== 'object') {
      errors.push(`Agent at index ${idx} is not an object.`);
      return;
    }
    if (typeof ag.id !== 'string' || !ag.id.trim()) {
      errors.push(`Agent at index ${idx} has missing or empty 'id'.`);
    } else {
      if (agentIds.has(ag.id)) {
        errors.push(`Duplicate agent ID detected: '${ag.id}'.`);
      }
      agentIds.add(ag.id);
    }
    if (typeof ag.name !== 'string' || !ag.name.trim()) {
      errors.push(`Agent '${ag.id || idx}' has missing or empty 'name'.`);
    }
    if (!validTrustLevels.has(ag.trustLevel)) {
      warnings.push(`Agent '${ag.id}' has unrecognized trustLevel '${ag.trustLevel}', defaulting to 'medium'.`);
      ag.trustLevel = 'medium';
    }
    if (!validTrustBoundaries.has(ag.trustBoundary)) {
      warnings.push(`Agent '${ag.id}' has unrecognized trustBoundary '${ag.trustBoundary}', defaulting to 'corporate_lan'.`);
      ag.trustBoundary = 'corporate_lan';
    }
    ag.canReceiveUntrustedInput = Boolean(ag.canReceiveUntrustedInput);
    ag.tools = Array.isArray(ag.tools) ? ag.tools.map(String) : [];
    ag.connectedAgentIds = Array.isArray(ag.connectedAgentIds) ? ag.connectedAgentIds.map(String) : [];
    ag.tags = Array.isArray(ag.tags) ? ag.tags.map(String) : [];
  });

  // Validate Resources
  if (!Array.isArray(parsed.resources)) {
    errors.push("Field 'resources' must be an array.");
  }
  const resourceIds = new Set<string>();
  const resources = Array.isArray(parsed.resources) ? parsed.resources : [];

  resources.forEach((res: any, idx: number) => {
    if (!res || typeof res !== 'object') {
      errors.push(`Resource at index ${idx} is not an object.`);
      return;
    }
    if (typeof res.id !== 'string' || !res.id.trim()) {
      errors.push(`Resource at index ${idx} has missing or empty 'id'.`);
    } else {
      if (resourceIds.has(res.id)) {
        errors.push(`Duplicate resource ID detected: '${res.id}'.`);
      }
      resourceIds.add(res.id);
    }
    if (typeof res.name !== 'string' || !res.name.trim()) {
      errors.push(`Resource '${res.id || idx}' has missing or empty 'name'.`);
    }
    if (!validResourceTypes.has(res.type)) {
      warnings.push(`Resource '${res.id}' has unrecognized type '${res.type}', defaulting to 'document'.`);
      res.type = 'document';
    }
    if (!validSensitivities.has(res.sensitivity)) {
      warnings.push(`Resource '${res.id}' has unrecognized sensitivity '${res.sensitivity}', defaulting to 'internal'.`);
      res.sensitivity = 'internal';
    }
    if (!validTrustBoundaries.has(res.trustBoundary)) {
      res.trustBoundary = 'corporate_lan';
    }
    res.isExternalSink = Boolean(res.isExternalSink || res.type === 'external_sink');
  });

  // Validate Permissions and Referential Integrity
  if (!Array.isArray(parsed.permissions)) {
    errors.push("Field 'permissions' must be an array.");
  }
  const permissions = Array.isArray(parsed.permissions) ? parsed.permissions : [];
  permissions.forEach((perm: any, idx: number) => {
    if (!perm || typeof perm !== 'object') {
      errors.push(`Permission at index ${idx} is not an object.`);
      return;
    }
    if (!perm.id) perm.id = `perm-${idx + 1}`;
    if (!agentIds.has(perm.agentId)) {
      errors.push(`Permission '${perm.id}' references non-existent agentId '${perm.agentId}'.`);
    }
    if (!resourceIds.has(perm.resourceId)) {
      errors.push(`Permission '${perm.id}' references non-existent resourceId '${perm.resourceId}'.`);
    }
    if (!validActions.has(perm.action)) {
      errors.push(`Permission '${perm.id}' has invalid action '${perm.action}'. Allowed: ${Array.from(validActions).join(', ')}`);
    }
    if (!validScopes.has(perm.scope)) {
      perm.scope = 'scoped';
    }
    perm.requiresApproval = Boolean(perm.requiresApproval);
    perm.isDelegatable = Boolean(perm.isDelegatable);
  });

  // Validate Delegations
  const delegations = Array.isArray(parsed.delegations) ? parsed.delegations : [];
  delegations.forEach((del: any, idx: number) => {
    if (!del.id) del.id = `del-${idx + 1}`;
    if (!agentIds.has(del.sourceAgentId)) {
      errors.push(`Delegation '${del.id}' references non-existent sourceAgentId '${del.sourceAgentId}'.`);
    }
    if (!agentIds.has(del.targetAgentId)) {
      errors.push(`Delegation '${del.id}' references non-existent targetAgentId '${del.targetAgentId}'.`);
    }
    del.forwardContext = del.forwardContext !== false;
    del.requiresApproval = Boolean(del.requiresApproval);
  });

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  const sanitized: SecurityProject = {
    id: typeof parsed.id === 'string' && parsed.id ? parsed.id : `proj-${Date.now()}`,
    name: String(parsed.name).slice(0, 100),
    description: String(parsed.description || 'Imported security assessment').slice(0, 500),
    version: String(parsed.version || '1.0.0'),
    updatedAt: new Date().toISOString(),
    isSimulated: true, // Always enforce simulated label for imported assessments
    agents,
    resources,
    permissions,
    delegations,
    legitimateWorkflows: Array.isArray(parsed.legitimateWorkflows) ? parsed.legitimateWorkflows : [],
    riskWeights: parsed.riskWeights || DEFAULT_RISK_WEIGHTS,
  };

  return {
    isValid: true,
    errors: [],
    warnings,
    sanitizedProject: sanitized,
  };
}
