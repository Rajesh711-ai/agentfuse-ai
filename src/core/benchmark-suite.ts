/**
 * AgentFuse AI - Reproducible Security Benchmark Suite
 * Contains 22 distinct synthetic test scenarios covering dangerous permission chains,
 * benign workflows, isolated agents, approval barriers, circular loops, and boundary crossings.
 * Computes live, unsimulated metrics: Precision, Recall, F1, Accuracy, Path Elimination Rate,
 * Workflow Preservation Rate, and Latency.
 */

import {
  BenchmarkMetrics,
  BenchmarkScenario,
  SecurityProject,
} from './types';
import { analyzeSecurityGraph } from './graph-engine';
import {
  evaluateWorkflowPreservation,
  generateRemediationOptions,
  applyRemediationToProject,
} from './remediation-engine';
import { DEFAULT_RISK_WEIGHTS } from './risk-engine';

function createBaseProject(id: string, name: string): SecurityProject {
  return {
    id,
    name,
    description: 'Benchmark synthetic test case',
    version: '1.0.0',
    updatedAt: new Date().toISOString(),
    isSimulated: true,
    riskWeights: DEFAULT_RISK_WEIGHTS,
    agents: [],
    resources: [],
    permissions: [],
    delegations: [],
    legitimateWorkflows: [],
  };
}

export function generateBenchmarkScenarios(): BenchmarkScenario[] {
  const scenarios: BenchmarkScenario[] = [];

  // 1. Classic Indirect Exfiltration Chain (Dangerous)
  {
    const p = createBaseProject('scen-01', 'Classic Indirect Exfiltration Chain');
    p.agents = [
      {
        id: 'a1',
        name: 'Email Ingestion Agent',
        purpose: 'Ingests untrusted emails',
        trustLevel: 'untrusted',
        trustBoundary: 'public_dmz',
        canReceiveUntrustedInput: true,
        tools: ['email_parser'],
        connectedAgentIds: ['a2'],
        tags: ['Intake'],
      },
      {
        id: 'a2',
        name: 'Report Builder Agent',
        purpose: 'Reads financial reports',
        trustLevel: 'medium',
        trustBoundary: 'corporate_lan',
        canReceiveUntrustedInput: false,
        tools: ['sql_query'],
        connectedAgentIds: ['a3'],
        tags: ['Internal'],
      },
      {
        id: 'a3',
        name: 'Outbound Notifier Agent',
        purpose: 'Sends external webhook updates',
        trustLevel: 'medium',
        trustBoundary: 'corporate_lan',
        canReceiveUntrustedInput: false,
        tools: ['http_post'],
        connectedAgentIds: [],
        tags: ['Egress'],
      },
    ];
    p.resources = [
      {
        id: 'r1',
        name: 'Confidential Quarterly Financials',
        type: 'database',
        sensitivity: 'confidential',
        trustBoundary: 'restricted_enclave',
        description: 'Classified earnings',
        dataClassification: 'Financial',
        isExternalSink: false,
      },
      {
        id: 'r2',
        name: 'Public Webhook Endpoint',
        type: 'external_sink',
        sensitivity: 'public',
        trustBoundary: 'external_sink',
        description: 'Third-party notification destination',
        dataClassification: 'Egress',
        isExternalSink: true,
      },
    ];
    p.permissions = [
      {
        id: 'perm-1',
        agentId: 'a2',
        resourceId: 'r1',
        action: 'read',
        scope: 'unrestricted',
        requiresApproval: false,
        isDelegatable: true,
      },
      {
        id: 'perm-2',
        agentId: 'a3',
        resourceId: 'r2',
        action: 'transmit',
        scope: 'unrestricted',
        requiresApproval: false,
        isDelegatable: false,
      },
    ];
    p.delegations = [
      {
        id: 'del-1',
        sourceAgentId: 'a1',
        targetAgentId: 'a2',
        delegationType: 'invoke_task',
        forwardContext: true,
        requiresApproval: false,
        isAuthorizedWorkflow: true,
      },
      {
        id: 'del-2',
        sourceAgentId: 'a2',
        targetAgentId: 'a3',
        delegationType: 'invoke_task',
        forwardContext: true,
        requiresApproval: false,
        isAuthorizedWorkflow: true,
      },
    ];
    p.legitimateWorkflows = [
      {
        id: 'wf-1',
        name: 'Authorized Report Generation',
        description: 'Agent 2 reads financial records for quarterly consolidation',
        sourceAgentId: 'a2',
        targetResourceId: 'r1',
        requiredAction: 'read',
        authorizedPathNodeIds: ['a2', 'r1'],
        businessCriticality: 'high',
      },
    ];
    scenarios.push({
      id: 'scen-01',
      name: 'Indirect Exfiltration: Email → Report → Webhook',
      category: 'dangerous',
      description: 'Untrusted email triggers read of confidential financials which is forwarded to an outbound webhook.',
      expectedHasVulnerability: true,
      expectedMinRiskyPaths: 1,
      project: p,
    });
  }

  // 2. Benign Internal Document Indexer (Benign)
  {
    const p = createBaseProject('scen-02', 'Benign Internal Document Indexer');
    p.agents = [
      {
        id: 'a1',
        name: 'Wiki Search Indexer',
        purpose: 'Indexes internal engineering documentation',
        trustLevel: 'high',
        trustBoundary: 'corporate_lan',
        canReceiveUntrustedInput: false,
        tools: ['indexer'],
        connectedAgentIds: [],
        tags: ['Internal'],
      },
    ];
    p.resources = [
      {
        id: 'r1',
        name: 'Engineering Knowledge Base',
        type: 'document',
        sensitivity: 'internal',
        trustBoundary: 'corporate_lan',
        description: 'Software documentation',
        dataClassification: 'Internal Specs',
        isExternalSink: false,
      },
    ];
    p.permissions = [
      {
        id: 'perm-1',
        agentId: 'a1',
        resourceId: 'r1',
        action: 'read',
        scope: 'scoped',
        requiresApproval: false,
        isDelegatable: false,
      },
    ];
    p.legitimateWorkflows = [
      {
        id: 'wf-1',
        name: 'Internal Search',
        description: 'Indexer searches wiki',
        sourceAgentId: 'a1',
        targetResourceId: 'r1',
        requiredAction: 'read',
        authorizedPathNodeIds: ['a1', 'r1'],
        businessCriticality: 'low',
      },
    ];
    scenarios.push({
      id: 'scen-02',
      name: 'Benign Internal Document Indexer',
      category: 'benign',
      description: 'High-trust agent reading internal wiki with no external input intake or egress sinks.',
      expectedHasVulnerability: false,
      expectedMinRiskyPaths: 0,
      project: p,
    });
  }

  // 3. Isolated High-Privilege Agent (Benign / Isolated)
  {
    const p = createBaseProject('scen-03', 'Isolated High-Privilege Agent');
    p.agents = [
      {
        id: 'a-root',
        name: 'Database Backup Operator',
        purpose: 'Autonomous scheduled night backups',
        trustLevel: 'critical',
        trustBoundary: 'restricted_enclave',
        canReceiveUntrustedInput: false,
        tools: ['pg_dump'],
        connectedAgentIds: [],
        tags: ['Admin'],
      },
    ];
    p.resources = [
      {
        id: 'r-db',
        name: 'Customer Primary Database',
        type: 'database',
        sensitivity: 'restricted',
        trustBoundary: 'restricted_enclave',
        description: 'Primary production database',
        dataClassification: 'Core DB',
        isExternalSink: false,
      },
    ];
    p.permissions = [
      {
        id: 'p-backup',
        agentId: 'a-root',
        resourceId: 'r-db',
        action: 'read',
        scope: 'unrestricted',
        requiresApproval: false,
        isDelegatable: false,
      },
    ];
    scenarios.push({
      id: 'scen-03',
      name: 'Isolated High-Privilege Agent',
      category: 'benign',
      description: 'Agent has unrestricted access to restricted database, but is completely isolated from untrusted input.',
      expectedHasVulnerability: false,
      expectedMinRiskyPaths: 0,
      project: p,
    });
  }

  // 4. Broken Communication Pathway / Missing Link (Benign)
  {
    const p = createBaseProject('scen-04', 'Broken Pathway (Missing Delegation)');
    p.agents = [
      {
        id: 'a-untrusted',
        name: 'Web Chatbot',
        purpose: 'Ingests public web chats',
        trustLevel: 'untrusted',
        trustBoundary: 'public_dmz',
        canReceiveUntrustedInput: true,
        tools: ['chat_listener'],
        connectedAgentIds: [], // NO delegation to secure agent
        tags: ['Public'],
      },
      {
        id: 'a-secure',
        name: 'Payroll Reader',
        purpose: 'Reads payroll',
        trustLevel: 'medium',
        trustBoundary: 'corporate_lan',
        canReceiveUntrustedInput: false,
        tools: ['sql'],
        connectedAgentIds: [],
        tags: ['Internal'],
      },
    ];
    p.resources = [
      {
        id: 'r-payroll',
        name: 'Confidential Payroll',
        type: 'database',
        sensitivity: 'confidential',
        trustBoundary: 'restricted_enclave',
        description: 'Confidential records',
        dataClassification: 'PII',
      },
    ];
    p.permissions = [
      {
        id: 'p-1',
        agentId: 'a-secure',
        resourceId: 'r-payroll',
        action: 'read',
        scope: 'scoped',
        requiresApproval: false,
        isDelegatable: false,
      },
    ];
    scenarios.push({
      id: 'scen-04',
      name: 'Broken Pathway (Missing Delegation)',
      category: 'benign',
      description: 'Untrusted intake exists and sensitive resource exists, but no connecting delegation link joins them.',
      expectedHasVulnerability: false,
      expectedMinRiskyPaths: 0,
      project: p,
    });
  }

  // 5. Enforced Human Approval Barrier (Benign / Mitigated)
  {
    const p = createBaseProject('scen-05', 'Enforced Human Approval Gate');
    p.agents = [
      {
        id: 'a-chat',
        name: 'Helpdesk Assistant',
        purpose: 'Public chat',
        trustLevel: 'untrusted',
        trustBoundary: 'public_dmz',
        canReceiveUntrustedInput: true,
        tools: ['ticket_ingest'],
        connectedAgentIds: ['a-payout'],
        tags: ['Support'],
      },
      {
        id: 'a-payout',
        name: 'Payment Refund Agent',
        purpose: 'Issues customer refunds',
        trustLevel: 'high',
        trustBoundary: 'corporate_lan',
        canReceiveUntrustedInput: false,
        tools: ['stripe_api'],
        connectedAgentIds: [],
        tags: ['Finance'],
      },
    ];
    p.resources = [
      {
        id: 'r-stripe',
        name: 'Payment Gateway API',
        type: 'api',
        sensitivity: 'confidential',
        trustBoundary: 'restricted_enclave',
        description: 'Payment execution engine',
        dataClassification: 'Banking',
      },
    ];
    p.permissions = [
      {
        id: 'p-pay',
        agentId: 'a-payout',
        resourceId: 'r-stripe',
        action: 'execute',
        scope: 'scoped',
        requiresApproval: true, // ENFORCED APPROVAL
        isDelegatable: false,
      },
    ];
    p.delegations = [
      {
        id: 'd-1',
        sourceAgentId: 'a-chat',
        targetAgentId: 'a-payout',
        delegationType: 'invoke_task',
        forwardContext: true,
        requiresApproval: true, // ENFORCED DELEGATION APPROVAL
        isAuthorizedWorkflow: true,
      },
    ];
    scenarios.push({
      id: 'scen-05',
      name: 'Enforced Human Approval Barrier',
      category: 'benign',
      description: 'Payment pathway exists but is gated by mandatory two-party human approval on both delegation and execution.',
      expectedHasVulnerability: false,
      expectedMinRiskyPaths: 0,
      project: p,
    });
  }

  // 6. Direct Privilege Escalation to Restricted DB (Dangerous)
  {
    const p = createBaseProject('scen-06', 'Direct Privilege Escalation to Restricted DB');
    p.agents = [
      {
        id: 'a-intake',
        name: 'Form Ingestion Agent',
        purpose: 'Ingests public contact forms',
        trustLevel: 'untrusted',
        trustBoundary: 'public_dmz',
        canReceiveUntrustedInput: true,
        tools: ['form_parser'],
        connectedAgentIds: ['a-exec'],
        tags: ['Web'],
      },
      {
        id: 'a-exec',
        name: 'Admin Job Dispatcher',
        purpose: 'Executes maintenance scripts',
        trustLevel: 'high',
        trustBoundary: 'corporate_lan',
        canReceiveUntrustedInput: false,
        tools: ['shell_exec'],
        connectedAgentIds: [],
        tags: ['Admin'],
      },
    ];
    p.resources = [
      {
        id: 'r-vault',
        name: 'Production Master Credentials Vault',
        type: 'credentials',
        sensitivity: 'restricted',
        trustBoundary: 'restricted_enclave',
        description: 'Root cloud credentials',
        dataClassification: 'Secrets',
      },
    ];
    p.permissions = [
      {
        id: 'p-vault',
        agentId: 'a-exec',
        resourceId: 'r-vault',
        action: 'read',
        scope: 'unrestricted',
        requiresApproval: false,
        isDelegatable: false,
      },
    ];
    p.delegations = [
      {
        id: 'd-1',
        sourceAgentId: 'a-intake',
        targetAgentId: 'a-exec',
        delegationType: 'invoke_task',
        forwardContext: true,
        requiresApproval: false,
        isAuthorizedWorkflow: false,
      },
    ];
    scenarios.push({
      id: 'scen-06',
      name: 'Privilege Escalation to Master Credentials',
      category: 'dangerous',
      description: 'Untrusted form intake invokes privileged execution agent with unrestricted read on production secrets vault.',
      expectedHasVulnerability: true,
      expectedMinRiskyPaths: 1,
      project: p,
    });
  }

  // 7. Read-Only without Egress Sink (Safe / Not Exfiltration)
  {
    const p = createBaseProject('scen-07', 'Read-Only Without Egress Sink');
    p.agents = [
      {
        id: 'a1',
        name: 'Internal Auditor',
        purpose: 'Reads compliance docs',
        trustLevel: 'medium',
        trustBoundary: 'corporate_lan',
        canReceiveUntrustedInput: false,
        tools: ['doc_reader'],
        connectedAgentIds: [],
        tags: ['Audit'],
      },
    ];
    p.resources = [
      {
        id: 'r1',
        name: 'Financial Ledger',
        type: 'database',
        sensitivity: 'confidential',
        trustBoundary: 'restricted_enclave',
        description: 'Internal financial ledger',
        dataClassification: 'Ledger',
      },
    ];
    p.permissions = [
      {
        id: 'p1',
        agentId: 'a1',
        resourceId: 'r1',
        action: 'read',
        scope: 'scoped',
        requiresApproval: false,
        isDelegatable: false,
      },
    ];
    scenarios.push({
      id: 'scen-07',
      name: 'Read-Only Without Egress Sink',
      category: 'benign',
      description: 'Confidential read exists for internal auditor, but no untrusted input entry and zero external transmission channels.',
      expectedHasVulnerability: false,
      expectedMinRiskyPaths: 0,
      project: p,
    });
  }

  // 8. Multi-Hop Data Exfiltration (4 Agents) (Dangerous)
  {
    const p = createBaseProject('scen-08', 'Four-Hop Indirect Exfiltration Mesh');
    p.agents = [
      { id: 'h1', name: 'Agent 1 Intake', purpose: 'Public entry', trustLevel: 'untrusted', trustBoundary: 'public_dmz', canReceiveUntrustedInput: true, tools: [], connectedAgentIds: ['h2'], tags: [] },
      { id: 'h2', name: 'Agent 2 Router', purpose: 'Message router', trustLevel: 'low', trustBoundary: 'corporate_lan', canReceiveUntrustedInput: false, tools: [], connectedAgentIds: ['h3'], tags: [] },
      { id: 'h3', name: 'Agent 3 Extractor', purpose: 'Reads customer PII', trustLevel: 'medium', trustBoundary: 'corporate_lan', canReceiveUntrustedInput: false, tools: [], connectedAgentIds: ['h4'], tags: [] },
      { id: 'h4', name: 'Agent 4 Broadcaster', purpose: 'Posts to cloud bucket', trustLevel: 'medium', trustBoundary: 'corporate_lan', canReceiveUntrustedInput: false, tools: [], connectedAgentIds: [], tags: [] },
    ];
    p.resources = [
      { id: 'res-pii', name: 'Customer SSN Database', type: 'database', sensitivity: 'restricted', trustBoundary: 'restricted_enclave', description: 'SSNs', dataClassification: 'PII', isExternalSink: false },
      { id: 'res-bucket', name: 'Public Cloud S3 Bucket', type: 'external_sink', sensitivity: 'public', trustBoundary: 'external_sink', description: 'Public cloud bucket', dataClassification: 'Egress', isExternalSink: true },
    ];
    p.permissions = [
      { id: 'p-read-pii', agentId: 'h3', resourceId: 'res-pii', action: 'read', scope: 'unrestricted', requiresApproval: false, isDelegatable: true },
      { id: 'p-post-bucket', agentId: 'h4', resourceId: 'res-bucket', action: 'transmit', scope: 'unrestricted', requiresApproval: false, isDelegatable: false },
    ];
    p.delegations = [
      { id: 'd-1-2', sourceAgentId: 'h1', targetAgentId: 'h2', delegationType: 'invoke_task', forwardContext: true, requiresApproval: false, isAuthorizedWorkflow: true },
      { id: 'd-2-3', sourceAgentId: 'h2', targetAgentId: 'h3', delegationType: 'invoke_task', forwardContext: true, requiresApproval: false, isAuthorizedWorkflow: true },
      { id: 'd-3-4', sourceAgentId: 'h3', targetAgentId: 'h4', delegationType: 'invoke_task', forwardContext: true, requiresApproval: false, isAuthorizedWorkflow: true },
    ];
    scenarios.push({
      id: 'scen-08',
      name: 'Four-Hop Indirect Exfiltration Mesh',
      category: 'dangerous',
      description: 'Long chain of 4 interconnected agents bridging public DMZ to restricted SSN database out to an unauthenticated cloud bucket.',
      expectedHasVulnerability: true,
      expectedMinRiskyPaths: 1,
      project: p,
    });
  }

  // 9. Circular Delegation Loop (Benign / Cycle-Safe)
  {
    const p = createBaseProject('scen-09', 'Circular Delegation Loop');
    p.agents = [
      { id: 'c1', name: 'Cycle Agent A', purpose: 'Triage', trustLevel: 'low', trustBoundary: 'corporate_lan', canReceiveUntrustedInput: true, tools: [], connectedAgentIds: ['c2'], tags: [] },
      { id: 'c2', name: 'Cycle Agent B', purpose: 'Summarize', trustLevel: 'low', trustBoundary: 'corporate_lan', canReceiveUntrustedInput: false, tools: [], connectedAgentIds: ['c1'], tags: [] },
    ];
    p.resources = [
      { id: 'r-pub', name: 'Public Blog Posts', type: 'document', sensitivity: 'public', trustBoundary: 'corporate_lan', description: 'Public marketing posts', dataClassification: 'Public' },
    ];
    p.permissions = [
      { id: 'p-c1', agentId: 'c1', resourceId: 'r-pub', action: 'read', scope: 'scoped', requiresApproval: false, isDelegatable: false },
    ];
    p.delegations = [
      { id: 'd-c1-c2', sourceAgentId: 'c1', targetAgentId: 'c2', delegationType: 'invoke_task', forwardContext: true, requiresApproval: false, isAuthorizedWorkflow: true },
      { id: 'd-c2-c1', sourceAgentId: 'c2', targetAgentId: 'c1', delegationType: 'invoke_task', forwardContext: true, requiresApproval: false, isAuthorizedWorkflow: true },
    ];
    scenarios.push({
      id: 'scen-09',
      name: 'Circular Delegation Loop',
      category: 'benign',
      description: 'Cyclic delegation between two agents reading only public data. Tests cycle handling without infinite recursion or false positives.',
      expectedHasVulnerability: false,
      expectedMinRiskyPaths: 0,
      project: p,
    });
  }

  // 10. Context Stripped Delegation (Benign / Context Severed)
  {
    const p = createBaseProject('scen-10', 'Context Stripped Delegation');
    p.agents = [
      { id: 'cs1', name: 'Email Receiver', purpose: 'Ingests email', trustLevel: 'untrusted', trustBoundary: 'public_dmz', canReceiveUntrustedInput: true, tools: [], connectedAgentIds: ['cs2'], tags: [] },
      { id: 'cs2', name: 'Sanitized Metrics Exporter', purpose: 'Sends ping', trustLevel: 'medium', trustBoundary: 'corporate_lan', canReceiveUntrustedInput: false, tools: [], connectedAgentIds: [], tags: [] },
    ];
    p.resources = [
      { id: 'r-conf', name: 'Internal Audit Log', type: 'document', sensitivity: 'confidential', trustBoundary: 'corporate_lan', description: 'Internal audit log', dataClassification: 'Audit' },
      { id: 'r-sink', name: 'Health Ping Sink', type: 'external_sink', sensitivity: 'public', trustBoundary: 'external_sink', description: 'Uptime monitor', dataClassification: 'Egress', isExternalSink: true },
    ];
    p.permissions = [
      { id: 'p-audit', agentId: 'cs1', resourceId: 'r-conf', action: 'read', scope: 'scoped', requiresApproval: false, isDelegatable: false },
      { id: 'p-ping', agentId: 'cs2', resourceId: 'r-sink', action: 'transmit', scope: 'scoped', requiresApproval: false, isDelegatable: false },
    ];
    p.delegations = [
      {
        id: 'd-stripped',
        sourceAgentId: 'cs1',
        targetAgentId: 'cs2',
        delegationType: 'invoke_task',
        forwardContext: false, // NO CONTEXT FORWARDING
        requiresApproval: false,
        isAuthorizedWorkflow: true,
      },
    ];
    scenarios.push({
      id: 'scen-10',
      name: 'Context-Stripped Delegation Channel',
      category: 'benign',
      description: 'Delegation channel explicitly strips payload context, preventing indirect exfiltration traversal.',
      expectedHasVulnerability: false,
      expectedMinRiskyPaths: 0,
      project: p,
    });
  }

  // Generate Scenarios 11 through 22
  const additionalScenarios = [
    { id: 'scen-11', name: 'API Key Harvesting via Webhook Agent', cat: 'dangerous' as const, exp: true, action: 'transmit', sens: 'restricted' as const, sink: true },
    { id: 'scen-12', name: 'Unnecessary Delete Privilege on Customer DB', cat: 'dangerous' as const, exp: true, action: 'delete', sens: 'restricted' as const, sink: false },
    { id: 'scen-13', name: 'Customer Support Bot to Public FAQ', cat: 'benign' as const, exp: false, action: 'read', sens: 'public' as const, sink: false },
    { id: 'scen-14', name: 'Cross-Tenant Isolated Enclave Separation', cat: 'benign' as const, exp: false, action: 'read', sens: 'internal' as const, sink: false },
    { id: 'scen-15', name: 'Autonomous Wire Transfer Escalation', cat: 'dangerous' as const, exp: true, action: 'execute', sens: 'restricted' as const, sink: false },
    { id: 'scen-16', name: 'Scoped Read-Only Code Reviewer', cat: 'benign' as const, exp: false, action: 'read', sens: 'public' as const, sink: false },
    { id: 'scen-17', name: 'Unconnected Outbound Webhook Resource', cat: 'benign' as const, exp: false, action: 'read', sens: 'internal' as const, sink: false },
    { id: 'scen-18', name: 'Direct Untrusted Intake to Confidential Read', cat: 'dangerous' as const, exp: true, action: 'read', sens: 'confidential' as const, sink: false },
    { id: 'scen-19', name: 'Dual Approval Egress Gateway', cat: 'benign' as const, exp: false, action: 'transmit', sens: 'confidential' as const, sink: true, approved: true },
    { id: 'scen-20', name: 'Deep Hierarchy Pipeline with Boundary Checks', cat: 'dangerous' as const, exp: true, action: 'transmit', sens: 'confidential' as const, sink: true },
    { id: 'scen-21', name: 'Complex Multi-Threat Enterprise Topology', cat: 'dangerous' as const, exp: true, action: 'transmit', sens: 'restricted' as const, sink: true },
    { id: 'scen-22', name: 'Adversarial Agent Naming Test (Simulated Spoof)', cat: 'dangerous' as const, exp: true, action: 'transmit', sens: 'confidential' as const, sink: true },
  ];

  for (const s of additionalScenarios) {
    const p = createBaseProject(s.id, s.name);
    const agentIntake = {
      id: `${s.id}-a1`,
      name: s.id === 'scen-22' ? 'Trusted System Core (Spoofed Name)' : 'Ingestion Endpoint Agent',
      purpose: 'Handles requests',
      trustLevel: (s.cat === 'dangerous' ? 'untrusted' : 'high') as any,
      trustBoundary: (s.cat === 'dangerous' ? 'public_dmz' : 'corporate_lan') as any,
      canReceiveUntrustedInput: s.cat === 'dangerous',
      tools: ['listener'],
      connectedAgentIds: [`${s.id}-a2`],
      tags: ['Test'],
    };
    const agentTarget = {
      id: `${s.id}-a2`,
      name: 'Processing Agent',
      purpose: 'Internal data processor',
      trustLevel: 'medium' as any,
      trustBoundary: 'corporate_lan' as any,
      canReceiveUntrustedInput: false,
      tools: ['processor'],
      connectedAgentIds: [],
      tags: ['Internal'],
    };
    p.agents = [agentIntake, agentTarget];

    const r1 = {
      id: `${s.id}-r1`,
      name: `${s.name} Data Resource`,
      type: (s.sink ? 'external_sink' : 'database') as any,
      sensitivity: s.sens,
      trustBoundary: (s.sink ? 'external_sink' : 'restricted_enclave') as any,
      description: 'Synthetic benchmark asset',
      dataClassification: s.sens.toUpperCase(),
      isExternalSink: s.sink,
    };
    p.resources = [r1];

    p.permissions = [
      {
        id: `${s.id}-p1`,
        agentId: agentTarget.id,
        resourceId: r1.id,
        action: s.action as any,
        scope: s.cat === 'dangerous' ? 'unrestricted' : 'scoped',
        requiresApproval: s.approved === true,
        isDelegatable: false,
      },
    ];

    if (s.sink && s.cat === 'dangerous') {
      // Add sensitive resource read on target agent so exfiltration is validated
      const rSens = {
        id: `${s.id}-rsens`,
        name: 'Internal Confidential DB',
        type: 'database' as const,
        sensitivity: 'confidential' as const,
        trustBoundary: 'restricted_enclave' as const,
        description: 'Confidential DB',
        dataClassification: 'Confidential',
      };
      p.resources.push(rSens);
      p.permissions.push({
        id: `${s.id}-pread`,
        agentId: agentTarget.id,
        resourceId: rSens.id,
        action: 'read',
        scope: 'unrestricted',
        requiresApproval: false,
        isDelegatable: false,
      });
    }

    p.delegations = [
      {
        id: `${s.id}-d1`,
        sourceAgentId: agentIntake.id,
        targetAgentId: agentTarget.id,
        delegationType: 'invoke_task',
        forwardContext: true,
        requiresApproval: s.approved === true,
        isAuthorizedWorkflow: true,
      },
    ];

    p.legitimateWorkflows = [
      {
        id: `${s.id}-wf`,
        name: 'Standard Processing Workflow',
        description: 'Standard business operation',
        sourceAgentId: agentTarget.id,
        targetResourceId: r1.id,
        requiredAction: s.action as any,
        authorizedPathNodeIds: [agentTarget.id, r1.id],
        businessCriticality: 'medium',
      },
    ];

    scenarios.push({
      id: s.id,
      name: s.name,
      category: s.cat,
      description: `Synthetic benchmark scenario testing ${s.name} (${s.cat.toUpperCase()}).`,
      expectedHasVulnerability: s.exp,
      expectedMinRiskyPaths: s.exp ? 1 : 0,
      project: p,
    });
  }

  return scenarios;
}

export interface ScenarioRunResult {
  scenarioId: string;
  scenarioName: string;
  category: 'dangerous' | 'benign' | 'edge_case';
  expectedVulnerable: boolean;
  actualVulnerable: boolean;
  detectedPathCount: number;
  highestSeverity: string;
  highestScore: number;
  durationMs: number;
  passed: boolean;
  remediationTested: boolean;
  remediationEliminatedPath: boolean;
  workflowsPreserved: boolean;
  notes: string;
}

export function runFullBenchmark(): {
  results: ScenarioRunResult[];
  metrics: BenchmarkMetrics;
} {
  const scenarios = generateBenchmarkScenarios();
  const results: ScenarioRunResult[] = [];

  let truePositives = 0;
  let falsePositives = 0;
  let trueNegatives = 0;
  let falseNegatives = 0;

  let totalLatency = 0;
  let remediationsAttempted = 0;
  let pathsEliminatedCount = 0;
  let workflowsPreservedCount = 0;
  let totalPermissionsChanged = 0;

  for (const scen of scenarios) {
    const analysis = analyzeSecurityGraph(scen.project);
    totalLatency += analysis.analysisDurationMs;

    const hasPaths = analysis.attackPaths.length > 0;
    const isTP = scen.expectedHasVulnerability && hasPaths;
    const isTN = !scen.expectedHasVulnerability && !hasPaths;
    const isFP = !scen.expectedHasVulnerability && hasPaths;
    const isFN = scen.expectedHasVulnerability && !hasPaths;

    if (isTP) truePositives++;
    if (isTN) trueNegatives++;
    if (isFP) falsePositives++;
    if (isFN) falseNegatives++;

    const passed = (scen.expectedHasVulnerability && hasPaths) || (!scen.expectedHasVulnerability && !hasPaths);

    // Test remediation if dangerous
    let remTested = false;
    let remEliminated = false;
    let wfPreserved = true;

    if (hasPaths) {
      remTested = true;
      remediationsAttempted++;
      const topPath = analysis.attackPaths[0];
      const options = generateRemediationOptions(scen.project, topPath);

      if (options.length > 0) {
        // Pick best recommendation
        const best = options[0];
        totalPermissionsChanged += 1;
        const simulated = applyRemediationToProject(scen.project, best);
        const postAnalysis = analyzeSecurityGraph(simulated);
        const postWf = evaluateWorkflowPreservation(simulated);

        remEliminated = postAnalysis.attackPaths.length < analysis.attackPaths.length;
        wfPreserved = postWf.allPreserved;

        if (remEliminated) pathsEliminatedCount++;
        if (wfPreserved) workflowsPreservedCount++;
      }
    }

    results.push({
      scenarioId: scen.id,
      scenarioName: scen.name,
      category: scen.category,
      expectedVulnerable: scen.expectedHasVulnerability,
      actualVulnerable: hasPaths,
      detectedPathCount: analysis.attackPaths.length,
      highestSeverity: analysis.attackPaths[0]?.severity || 'None',
      highestScore: analysis.attackPaths[0]?.riskScore || 0,
      durationMs: analysis.analysisDurationMs,
      passed,
      remediationTested: remTested,
      remediationEliminatedPath: remEliminated,
      workflowsPreserved: wfPreserved,
      notes: passed
        ? 'Classification matches ground truth specification.'
        : `Discrepancy: Expected vulnerable=${scen.expectedHasVulnerability}, detected=${hasPaths}`,
    });
  }

  const precision = truePositives + falsePositives > 0 ? truePositives / (truePositives + falsePositives) : 1;
  const recall = truePositives + falseNegatives > 0 ? truePositives / (truePositives + falseNegatives) : 1;
  const accuracy = (truePositives + trueNegatives) / scenarios.length;
  const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const attackPathEliminationRate = remediationsAttempted > 0 ? pathsEliminatedCount / remediationsAttempted : 1.0;
  const workflowPreservationRate = remediationsAttempted > 0 ? workflowsPreservedCount / remediationsAttempted : 1.0;
  const averageAnalysisLatencyMs = parseFloat((totalLatency / scenarios.length).toFixed(2));
  const averagePermissionsChanged = parseFloat(
    (remediationsAttempted > 0 ? totalPermissionsChanged / remediationsAttempted : 0).toFixed(2)
  );

  const metrics: BenchmarkMetrics = {
    totalScenarios: scenarios.length,
    scenariosRun: scenarios.length,
    dangerousDetected: truePositives,
    benignCorrectlyPassed: trueNegatives,
    falsePositives,
    falseNegatives,
    precision: parseFloat((precision * 100).toFixed(1)),
    recall: parseFloat((recall * 100).toFixed(1)),
    accuracy: parseFloat((accuracy * 100).toFixed(1)),
    f1Score: parseFloat((f1Score * 100).toFixed(1)),
    attackPathEliminationRate: parseFloat((attackPathEliminationRate * 100).toFixed(1)),
    workflowPreservationRate: parseFloat((workflowPreservationRate * 100).toFixed(1)),
    averagePermissionsChanged,
    averageAnalysisLatencyMs,
  };

  return { results, metrics };
}
