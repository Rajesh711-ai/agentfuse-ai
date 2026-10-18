/**
 * AgentFuse AI - Application Sidebar Navigation
 * Provides quick access to all 10 required cybersecurity analysis views.
 */

import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  Share2,
  AlertOctagon,
  Wrench,
  SlidersHorizontal,
  TestTube2,
  ScrollText,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';

export interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
}) => {
  const { analysis, isSimulating } = useProject();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Overview Dashboard',
      shortLabel: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'inventory',
      label: 'Agent Inventory',
      shortLabel: 'Inventory',
      icon: Cpu,
      badge: analysis.agentCount.toString(),
    },
    {
      id: 'graph',
      label: 'Interactive Graph',
      shortLabel: 'Graph',
      icon: Share2,
      badge: null,
    },
    {
      id: 'findings',
      label: 'Findings & Attack Paths',
      shortLabel: 'Findings',
      icon: AlertOctagon,
      badge: analysis.attackPaths.length > 0 ? analysis.attackPaths.length.toString() : null,
      badgeVariant: analysis.attackPaths.length > 0 ? 'danger' : 'neutral',
    },
    {
      id: 'remediation',
      label: 'Remediation Planner',
      shortLabel: 'Remediate',
      icon: Wrench,
      badge: analysis.attackPaths.length > 0 ? 'Ready' : null,
      badgeVariant: 'cyan',
    },
    {
      id: 'simulator',
      label: 'What-If Simulator',
      shortLabel: 'Simulator',
      icon: SlidersHorizontal,
      badge: isSimulating ? 'Active' : null,
      badgeVariant: 'warning',
    },
    {
      id: 'benchmark',
      label: 'Benchmark Suite',
      shortLabel: 'Benchmark',
      icon: TestTube2,
      badge: '22 Tests',
      badgeVariant: 'neutral',
    },
    {
      id: 'audit',
      label: 'Security Audit Log',
      shortLabel: 'Audit Log',
      icon: ScrollText,
      badge: null,
    },
    {
      id: 'settings',
      label: 'Project & Import/Export',
      shortLabel: 'Settings',
      icon: Settings,
      badge: null,
    },
    {
      id: 'help',
      label: 'Help & Model Specs',
      shortLabel: 'Help',
      icon: HelpCircle,
      badge: null,
    },
  ];

  return (
    <aside
      className={`relative flex flex-col bg-[#0b1021] border-r border-slate-800/90 transition-all duration-200 z-20 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Navigation list */}
      <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
          {!collapsed ? 'Security Workspaces' : 'Nav'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/70 to-slate-900 border border-cyan-500/40 text-cyan-300 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition ${
                  isActive ? 'text-cyan-400 scale-110' : 'text-slate-400 group-hover:text-cyan-400'
                }`}
              />
              {!collapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}

              {/* Badge if present */}
              {!collapsed && item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                    item.badgeVariant === 'danger'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800/80 animate-pulse'
                      : item.badgeVariant === 'warning'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : item.badgeVariant === 'cyan'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Active Indicator bar */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-cyan-400 rounded-r"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / Collapse Toggle */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        {!collapsed && (
          <div className="mb-2 px-2 py-1.5 rounded bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400">
            <div className="flex items-center justify-between font-mono text-[10px] text-slate-500 mb-1">
              <span>ACTIVE MODEL</span>
              <span className="text-emerald-400">DETERMINISTIC</span>
            </div>
            <div className="truncate text-slate-300">Acme Multi-Agent Mesh</div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs border border-slate-800 transition"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Collapse Sidebar</span>}
        </button>
      </div>
    </aside>
  );
};
