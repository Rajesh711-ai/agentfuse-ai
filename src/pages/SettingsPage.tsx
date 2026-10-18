/**
 * AgentFuse AI - Project Settings & Assessment Import/Export
 * Supports project renaming, duplication, persistent snapshots,
 * JSON schema validation on import, and exported assessment packages.
 */

import React, { useState, useRef } from 'react';
import {
  Settings,
  Download,
  Upload,
  Copy,
  FolderOpen,
  RotateCcw,
  Check,
  AlertTriangle,
  FileCode,
  FileCheck,
  Info,
  Shield,
  Layers,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { validateProjectSchema, ValidationResult } from '../core/schema-validator';
import { DEMO_PROJECT_ENTERPRISE } from '../core/sample-data';

export const SettingsPage: React.FC = () => {
  const {
    project,
    savedProjects,
    updateProject,
    resetToDemo,
    duplicateProject,
    loadProjectById,
  } = useProject();

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Import states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<ValidationResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updateProject({ ...project, name, description }, 'Updated Project Metadata');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agentfuse-assessment-${project.id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = validateProjectSchema(content);
      setImportResult(validation);

      if (validation.isValid && validation.sanitizedProject) {
        updateProject(validation.sanitizedProject, `Imported Project Assessment: ${validation.sanitizedProject.name}`);
      }
      setIsImporting(false);
    };
    reader.onerror = () => {
      setImportResult({
        isValid: false,
        errors: ['Failed to read selected file from filesystem.'],
        warnings: [],
      });
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <span>Project Workspace & Assessment I/O</span>
          </h1>
          <p className="text-xs text-slate-400">
            Export assessments for audit reporting or import external AI agent security topologies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={duplicateProject}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Copy className="w-3.5 h-3.5 text-cyan-400" />
            <span>Duplicate Project</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Assessment (JSON)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Project Metadata & Preset Switcher */}
        <div className="space-y-6">
          {/* Metadata Form */}
          <form
            onSubmit={handleSaveDetails}
            className="bg-[#0b1021] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-mono text-xs font-bold text-white uppercase">
                ACTIVE PROJECT SPECIFICATIONS
              </span>
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                SIMULATED DATASET
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-300 font-mono text-[11px] mb-1">
                  Project Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-mono text-[11px] mb-1">
                  Assessment Scope Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-400 font-mono text-[11px] pt-1">
                <div>
                  Project ID: <span className="text-slate-200">{project.id}</span>
                </div>
                <div>
                  Version: <span className="text-slate-200">{project.version}</span>
                </div>
                <div>
                  Agents: <span className="text-cyan-400 font-bold">{project.agents.length}</span>
                </div>
                <div>
                  Permissions: <span className="text-cyan-400 font-bold">{project.permissions.length}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {saveSuccess ? (
                <span className="text-emerald-400 font-mono text-xs flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Changes Saved
                </span>
              ) : (
                <span></span>
              )}
              <button
                type="submit"
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition"
              >
                Update Metadata
              </button>
            </div>
          </form>

          {/* Preset Assessment Loader */}
          <div className="bg-[#0b1021] border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl text-xs">
            <span className="font-mono text-xs font-bold text-slate-200 uppercase">
              PRELOADED SECURITY TOPOLOGY TEMPLATES
            </span>

            <div className="space-y-2">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Acme Corp Multi-Agent Mesh</div>
                  <div className="text-[11px] text-slate-400">
                    Canonical scenario: Email triage → Document parser → Workflow notifier exfiltration.
                  </div>
                </div>
                <button
                  onClick={resetToDemo}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold shrink-0 transition"
                >
                  Reload Demo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Schema Validator & Import */}
        <div className="space-y-6">
          {/* File Upload / Import Assessment */}
          <div className="bg-[#0b1021] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-mono text-xs font-bold text-white uppercase flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>IMPORT JSON ASSESSMENT</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">MAX 5 MB</span>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">
              Upload an AgentFuse security project JSON file. The system applies strict schema validation, type verification, and referential integrity checks. Malicious scripts or executable contents are neutralized.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 bg-slate-900/50 hover:bg-slate-900/80 rounded-xl p-6 text-center cursor-pointer transition space-y-2"
            >
              <Upload className="w-8 h-8 text-cyan-400 mx-auto" />
              <div className="font-semibold text-white">Click or drag JSON assessment file here</div>
              <div className="text-[11px] text-slate-400 font-mono">Accepts schema-compliant .json packages</div>
            </div>

            {/* Validation Outcome Report */}
            {importResult && (
              <div
                className={`p-4 rounded-xl border space-y-2 font-mono text-[11px] ${
                  importResult.isValid
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-800 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  {importResult.isValid ? (
                    <>
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      <span>Schema Validation Succeeded: Assessment Loaded</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Schema Validation Rejected: Invalid Payload</span>
                    </>
                  )}
                </div>

                {importResult.errors.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-rose-300">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}

                {importResult.warnings.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 text-amber-300">
                    {importResult.warnings.map((warn, i) => (
                      <li key={i}>Warning: {warn}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Documented JSON Schema Specification */}
          <div className="bg-[#0b1021] border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl text-xs">
            <span className="font-mono text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span>Documented JSON Import Schema</span>
            </span>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-300 max-h-48 overflow-y-auto leading-relaxed">
              <pre>{`{
  "id": "string (unique project id)",
  "name": "string (project title)",
  "agents": [
    {
      "id": "string",
      "name": "string",
      "trustLevel": "untrusted | low | medium | high | critical",
      "trustBoundary": "public_dmz | corporate_lan | restricted_enclave | external_sink",
      "canReceiveUntrustedInput": boolean,
      "tools": string[]
    }
  ],
  "resources": [
    {
      "id": "string",
      "name": "string",
      "type": "document | database | api | credentials | external_sink",
      "sensitivity": "public | internal | confidential | restricted",
      "isExternalSink": boolean
    }
  ],
  "permissions": [
    {
      "id": "string",
      "agentId": "string",
      "resourceId": "string",
      "action": "read | write | execute | share | delete | transmit",
      "scope": "scoped | unrestricted",
      "requiresApproval": boolean
    }
  ],
  "delegations": [
    {
      "id": "string",
      "sourceAgentId": "string",
      "targetAgentId": "string",
      "forwardContext": boolean,
      "requiresApproval": boolean
    }
  ]
}`}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
