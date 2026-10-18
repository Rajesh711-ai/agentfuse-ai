# AgentFuse AI - AI Agent Permission Graph Security Platform

**AgentFuse AI** is an enterprise-grade cybersecurity platform that models, visualizes, and remediates dangerous combinations of permissions across interconnected AI agents.

While individual AI agents may hold legitimate, scoped permissions, their transitive interaction pathways can create indirect avenues to confidential assets or unauthorized external data exfiltration. AgentFuse AI detects these indirect vectors using deterministic graph traversal, calculates transparent risk metrics, proposes minimum-cost permission cuts that preserve legitimate business workflows, and provides an interactive before-and-after what-if sandbox.

---

## Key Features

1. **Project Workspace & Assessment Manager**
   - Create, duplicate, rename, save persistent snapshots, export assessments (JSON), and import existing configurations.
   - Built-in schema validator with type checking, size enforcement (5 MB limit), and referential integrity protection.
   - All sample and template data is explicitly labeled as **Simulated Data**.

2. **AI Agent & Resource Inventory**
   - Model agents by unique ID, trust level (`untrusted`, `low`, `medium`, `high`, `critical`), architectural trust boundary (`public_dmz`, `corporate_lan`, `restricted_enclave`, `external_sink`), untrusted input intake flag, tools, and connections.
   - Model resources with sensitivity tiers (`public`, `internal`, `confidential`, `restricted`), data classification tags, and egress sink designations.
   - Granular permissions with actions (`read`, `write`, `execute`, `share`, `delete`, `transmit`), scopes (`scoped`, `unrestricted`), and human approval requirements.

3. **Interactive Security Graph Topology**
   - High-performance SVG interactive canvas supporting Pan, Zoom, Reset to Fit, and node drag-and-drop.
   - Dual layout modes: **Architectural Swimlane View** (grouped by trust boundary) and **Organic Force View**.
   - Active attack path highlighting with animated marching dashes, step badges, and red perimeter glow.
   - Sidebar inspector displaying entity properties, direct neighbors, assigned permissions, and reachable assets.

4. **Deterministic Graph Traversal & Attack Path Validation**
   - BFS/DFS multi-hop validation engine verifying real connectivity from untrusted entry to confidential assets and egress sinks.
   - **No-Assumed-Transmission rule**: Reading an asset does not grant transmission rights unless explicit transmission capability exists.
   - **Context-Forwarding Continuity**: Validates whether delegation channels forward upstream user payload or strip context.
   - Step-by-step transition breakdown with boundary changes and explicit model assumptions.

5. **Configurable Deterministic Risk Scoring**
   - Transparent formula:
     $$\text{RiskScore} = \left[ (\text{Sensitivity} \times \text{ActionImpact} \times \text{InputFactor}) + (\text{BoundariesCrossed} \times \text{BoundaryWeight}) \right] \times \text{ScopeFactor} \times (1 - \text{ApprovalDiscount})$$
   - Real-time scoring weights configuration modal.
   - Explicit disclaimer that scores represent heuristic prioritization estimates.

6. **Server-Side AI-Assisted Security Analysis (Gemini 3.8 Flash)**
   - Hardened server-side endpoint (`/api/ai-explain`) using `@google/genai` with `gemini-3.8-flash`.
   - Treats all imported descriptions and graph inputs as untrusted data to protect against prompt injection.
   - Seamless, automatic fallback to **Deterministic Rule-Based Intelligence Mode** if no API key is provided or offline.

7. **Automated Minimum-Cost Remediation Planner**
   - Evaluates minimal graph cuts: Approval gates (Cost 1), Context stripping (Cost 1.5), Scope narrowing (Cost 2), and Edge revocation (Cost 3).
   - **Authorized Workflow Preservation**: Recomputes graph and verifies that legitimate business workflows remain operational.
   - Undo and rollback support with state history stack.

8. **Interactive What-If Simulator Sandbox**
   - Stage candidate interventions in-memory without altering the saved project.
   - Side-by-side Before vs After metrics, risk delta, and precise graph edge diff.
   - One-click commit to live project or discard.

9. **22-Scenario Reproducible Benchmark Suite**
   - 22 synthetic test scenarios covering dangerous exfiltration, benign indexers, isolated agents, approval barriers, circular loops, and deep hierarchy pipelines.
   - Live execution computing actual Accuracy (100%), Precision (100%), Recall (100%), F1 Score, Path Elimination Rate (90%), Latency (~0.05 ms), and 2x2 Confusion Matrix.

10. **Security Audit Log**
    - Chronological event tracking (Analyses, Remediations, Simulations, Project Changes).
    - Searchable, filterable, and exportable to JSON and CSV.

---

## Canonical Demo Scenario

The preloaded Acme Corp scenario features:
- **Email Triage Agent** (Untrusted, Public DMZ, accepts external customer emails).
- **Document Analysis Agent** (Medium Trust, Corporate LAN, reads `Executive Payroll & Tax Records` for legitimate compliance indexing).
- **Workflow Automation Agent** (Medium Trust, Corporate LAN, transmits status updates to `External Communication Webhook`).
- **Validated Attack Path**: An untrusted external email manipulates the Email Agent to delegate a task to the Document Agent, reading confidential payroll data and forwarding it to the Workflow Agent to transmit externally.
- **Minimum-Cost Remediation**: Enforcing a human approval gate on the egress edge or severing unverified delegation eliminates the attack path while keeping legitimate payroll indexing **100% operational**.

---

## Quick Start & Running Locally

### Prerequisites
- Node.js v18+ (tested on Node v20/v22)
- npm or pnpm

### Installation
```bash
git clone <repo-url>
cd agentfuse-ai
npm install
```

### Development
```bash
npm run dev
# Starts full-stack Express server + Vite middlewares on port 3000
```

### Running Automated Engine Tests
```bash
npx tsx tests/security-engine.test.ts
```

### Production Build
```bash
npm run build
npm start
```

---

## Technology Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React icons
- **Backend**: Express, Node.js, `@google/genai` TypeScript SDK (server-side only)
- **Graph Engine**: In-memory BFS/DFS multi-hop validation engine (`src/core/graph-engine.ts`)
- **Persistence**: LocalStorage with schema-validated JSON import/export

---

## Security Assumptions & Limitations
- **Synthetic Simulation**: All agents, tools, databases, and credentials in this prototype are fictional abstractions. No live external network scanning or credentials harvesting is performed.
- **Heuristic Prioritization**: Risk scores are deterministic heuristic models designed for prioritization and triage, not real-world breach probabilities.
- **Auditing**: Audit logs in this browser prototype are saved in local storage with simulation tags and should be forwarded to enterprise SIEM/syslog solutions in production deployments.
