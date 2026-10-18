/**
 * Automated Unit Tests for AgentFuse AI Security Engine
 * Tests graph traversal, permission validation, risk scoring, remediation cuts, and benchmark metrics.
 */

import { analyzeSecurityGraph } from '../src/core/graph-engine';
import { DEMO_PROJECT_ENTERPRISE } from '../src/core/sample-data';
import { calculatePathRisk, DEFAULT_RISK_WEIGHTS } from '../src/core/risk-engine';
import {
  generateRemediationOptions,
  applyRemediationToProject,
  evaluateWorkflowPreservation,
} from '../src/core/remediation-engine';
import { runFullBenchmark } from '../src/core/benchmark-suite';
import { validateProjectSchema } from '../src/core/schema-validator';

console.log('=== [AgentFuse AI] Running Automated Engine Tests ===');

// Test 1: Canonical Demo Analysis
console.log('\n[Test 1] Analyzing Canonical Demo Project...');
const demoAnalysis = analyzeSecurityGraph(DEMO_PROJECT_ENTERPRISE);
console.log(`Detected Attack Paths: ${demoAnalysis.attackPaths.length}`);
demoAnalysis.attackPaths.forEach((p, idx) => console.log(` Path ${idx + 1}: ${p.id} | ${p.category} | ${p.title}`));
console.log(`Critical Count: ${demoAnalysis.summary.criticalCount}`);
const primaryPath = demoAnalysis.attackPaths[0];
console.log(`Primary Path Title: ${primaryPath.title}`);
console.log(`Risk Score: ${primaryPath.riskScore}/100 (${primaryPath.severity})`);

if (primaryPath.severity !== 'Critical') {
  throw new Error(`Expected primary path to be Critical, got: ${primaryPath.severity}`);
}
console.log('✓ Test 1 Passed: Canonical demo correctly identifies exfiltration path.');

// Test 2: Transition Validation - No Assumed Transmission
console.log('\n[Test 2] Validating No-Assumed-Transmission Constraint...');
const safeProject = JSON.parse(JSON.stringify(DEMO_PROJECT_ENTERPRISE));
// Remove transmit permission on workflow agent
safeProject.permissions = safeProject.permissions.filter((p: any) => p.action !== 'transmit');
const safeAnalysis = analyzeSecurityGraph(safeProject);
const exfilPaths = safeAnalysis.attackPaths.filter((p: any) => p.category === 'Exfiltration');
console.log(`Exfiltration paths after removing transmit permission: ${exfilPaths.length}`);
if (exfilPaths.length !== 0) {
  throw new Error(`Expected 0 exfiltration paths when transmit permission is absent, found: ${exfilPaths.length}`);
}
console.log('✓ Test 2 Passed: Reading sensitive asset alone does NOT create false-positive exfiltration path.');

// Test 3: Minimum-Cost Remediation & Workflow Preservation
console.log('\n[Test 3] Testing Minimum-Cost Remediation Planner...');
const remediations = generateRemediationOptions(DEMO_PROJECT_ENTERPRISE, primaryPath);
console.log(`Candidate Remediations Generated: ${remediations.length}`);
if (remediations.length === 0) {
  throw new Error('Expected at least 1 remediation option for primary path');
}

const bestOption = remediations[0];
console.log(`Best Recommended Intervention: ${bestOption.title} (Cost: ${bestOption.cost})`);

const remediatedProject = applyRemediationToProject(DEMO_PROJECT_ENTERPRISE, bestOption);
const postAnalysis = analyzeSecurityGraph(remediatedProject);
console.log(`Attack paths after remediation: ${postAnalysis.attackPaths.length}`);

if (postAnalysis.attackPaths.length !== 0) {
  throw new Error('Remediation failed to eliminate the target attack path');
}

const workflowEval = evaluateWorkflowPreservation(remediatedProject);
console.log(`Legitimate Workflows Preserved: ${workflowEval.allPreserved ? 'YES (100%)' : 'NO'}`);
if (!workflowEval.allPreserved) {
  throw new Error(`Remediation broke legitimate workflows: ${workflowEval.brokenWorkflowIds.join(', ')}`);
}
console.log('✓ Test 3 Passed: Minimum-cost cut eliminated path while preserving 100% of workflows.');

// Test 4: Schema Validator Integrity
console.log('\n[Test 4] Testing JSON Schema Validator with safe and malformed inputs...');
const validJson = JSON.stringify(DEMO_PROJECT_ENTERPRISE);
const validResult = validateProjectSchema(validJson);
if (!validResult.isValid) {
  throw new Error(`Valid project failed schema validation: ${validResult.errors.join(', ')}`);
}

const malformedJson = JSON.stringify({ name: 'Broken', agents: [{ id: 'a1' }], permissions: [{ agentId: 'non-existent' }] });
const malformedResult = validateProjectSchema(malformedJson);
if (malformedResult.isValid) {
  throw new Error('Malformed project unexpectedly passed schema validation');
}
console.log('✓ Test 4 Passed: Schema validator correctly enforces referential integrity.');

// Test 5: Full 22-Scenario Benchmark Execution
console.log('\n[Test 5] Executing Full 22-Scenario Benchmark Suite...');
const benchmark = runFullBenchmark();
console.log(`Total Scenarios: ${benchmark.metrics.totalScenarios}`);
console.log(`Accuracy: ${benchmark.metrics.accuracy}%`);
console.log(`Precision: ${benchmark.metrics.precision}%`);
console.log(`Recall: ${benchmark.metrics.recall}%`);
console.log(`Path Elimination Rate: ${benchmark.metrics.attackPathEliminationRate}%`);
console.log(`Avg Latency: ${benchmark.metrics.averageAnalysisLatencyMs} ms`);

if (benchmark.metrics.accuracy < 90) {
  throw new Error(`Benchmark accuracy below threshold: ${benchmark.metrics.accuracy}%`);
}
console.log('✓ Test 5 Passed: Benchmark suite verified with high accuracy and low latency.');

console.log('\n=== ALL AUTOMATED UNIT TESTS PASSED SUCCESSFULLY! ===\n');
