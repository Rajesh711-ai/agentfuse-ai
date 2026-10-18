/**
 * AgentFuse AI - Top Navigation Bar
 * Features real-time simulation banner, project selector, quick analysis runner,
 * undo/redo controls, and simulated environment provenance badges.
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  Play,
  RotateCcw,
  Undo2,
  Redo2,
  Save,
  CheckCircle2,
  FolderOpen,
  Sparkles,
  AlertTriangle,
  Radio,
  FileCode,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';

export const Navbar: React.FC<{
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenWeightsModal?: () => void;
}> = ({ currentTab, onSelectTab, onOpenWeightsModal }) => {
  const {
    project,
    savedProjects,
    analysis,
    canUndo,
    canRedo,
    undo,
    redo,
    resetToDemo,
    saveCurrentProject,
    isSimulating,
    activeSimulationRemediation,
    discardSimulation,
    commitSimulation,
  } = useProject();

  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [analyzingState, setAnalyzingState] = useState(false);

  const handleRunAnalysis = () => {
    setAnalyzingState(true);
    setTimeout(() => {
      setAnalyzingState(false);
    }, 450);
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#090d19]/95 border-b border-slate-800 backdrop-blur-md">
      {/* Simulation Banner if in What-If mode */}
      {isSimulating && activeSimulationRemediation && (
        <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 border-b border-amber-500/50 px-4 py-1.5 flex items-center justify-between text-xs text-amber-200 animate-pulse">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-400" />
            <span className="font-bold tracking-wider uppercase font-mono">
              [WHAT-IF SANDBOX ACTIVE]
            </span>
            <span>
              Simulating: <strong className="text-white">{activeSimulationRemediation.title}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={commitSimulation}
              className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-[11px] shadow transition"
            >
              Apply to Project
            </button>
            <button
              onClick={discardSimulation}
              className="px-2.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded text-[11px] transition"
            >
              Discard Simulation
            </button>
          </div>
        </div>
      )}

      <div className="px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand & Project Info */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-white text-base">
                  Agent<span className="text-cyan-400">Fuse</span>
                </span>
                <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
                  AI
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                GRAPH SECURITY ENGINE v1.2
              </div>
            </div>
          </div>

          <div className="hidden md:block h-6 w-px bg-slate-800"></div>

          {/* Active Project Pill */}
          <div className="relative hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-700/80 rounded-lg text-xs">
              <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
              <div className="max-w-[200px] truncate text-slate-200 font-medium">
                {project.name}
              </div>
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-mono bg-amber-950/70 border border-amber-800/80 text-amber-300">
                SIMULATED DATA
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right actions */}
        <div className="flex items-center gap-2.5">
          {/* Undo / Redo */}
          <div className="flex items-center bg-slate-900/80 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={undo}
              disabled={!canUndo}
              title="Undo Project Edit"
              className={`p-1.5 rounded ${
                canUndo ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              title="Redo Project Edit"
              className={`p-1.5 rounded ${
                canRedo ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Reset Demo button */}
          <button
            onClick={resetToDemo}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg transition"
            title="Reload fictional canonical enterprise scenario"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Demo</span>
          </button>

          {/* Run Security Analysis button */}
          <button
            onClick={handleRunAnalysis}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)] transition transform active:scale-95"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${analyzingState ? 'animate-spin' : ''}`} />
            <span>{analyzingState ? 'Analyzing Graph...' : 'Run Analysis'}</span>
          </button>

          {/* Findings alert indicator */}
          <div
            onClick={() => onSelectTab('findings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold cursor-pointer transition ${
              analysis.attackPaths.length > 0
                ? 'bg-rose-950/60 border-rose-600/70 text-rose-300 hover:bg-rose-900/60 shadow-lg shadow-rose-950/40'
                : 'bg-emerald-950/60 border-emerald-600/70 text-emerald-300'
            }`}
          >
            {analysis.attackPaths.length > 0 ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>
                  {analysis.attackPaths.length} {analysis.attackPaths.length === 1 ? 'PATH' : 'PATHS'} DETECTED
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>GRAPH SECURED</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
