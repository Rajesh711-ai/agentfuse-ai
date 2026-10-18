/**
 * AgentFuse AI - Main Application Entry & Page Router
 * Integrates all 10 security workspaces, state context, modals,
 * and live graph traversal analytics.
 */

import React, { useState } from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { GraphPage } from './pages/GraphPage';
import { FindingsPage } from './pages/FindingsPage';
import { RemediationPage } from './pages/RemediationPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { BenchmarkPage } from './pages/BenchmarkPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpPage } from './pages/HelpPage';
import { FindingDetailModal } from './components/FindingDetailModal';
import { RiskWeightsModal } from './components/RiskWeightsModal';
import { AttackPath } from './core/types';

const MainAppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modal states
  const [inspectedFinding, setInspectedFinding] = useState<AttackPath | null>(null);
  const [isWeightsModalOpen, setIsWeightsModalOpen] = useState(false);

  const handleInspectPath = (path: AttackPath) => {
    setInspectedFinding(path);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenWeightsModal={() => setIsWeightsModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[#070b14]">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onSelectTab={setCurrentTab}
              onInspectPath={handleInspectPath}
            />
          )}

          {currentTab === 'inventory' && <InventoryPage />}

          {currentTab === 'graph' && (
            <GraphPage
              onInspectPath={handleInspectPath}
              onOpenRemediate={() => setCurrentTab('remediation')}
            />
          )}

          {currentTab === 'findings' && (
            <FindingsPage
              onInspectPath={handleInspectPath}
              onOpenRemediate={() => setCurrentTab('remediation')}
              onOpenSimulator={() => setCurrentTab('simulator')}
            />
          )}

          {currentTab === 'remediation' && (
            <RemediationPage
              onOpenSimulator={() => setCurrentTab('simulator')}
            />
          )}

          {currentTab === 'simulator' && (
            <SimulatorPage
              onOpenFindings={() => setCurrentTab('findings')}
            />
          )}

          {currentTab === 'benchmark' && <BenchmarkPage />}

          {currentTab === 'audit' && <AuditLogPage />}

          {currentTab === 'settings' && <SettingsPage />}

          {currentTab === 'help' && (
            <HelpPage onOpenWeightsModal={() => setIsWeightsModalOpen(true)} />
          )}
        </main>
      </div>

      {/* Finding Detail Evidence Modal */}
      {inspectedFinding && (
        <FindingDetailModal
          path={inspectedFinding}
          onClose={() => setInspectedFinding(null)}
          onSelectRemediate={() => {
            setInspectedFinding(null);
            setCurrentTab('remediation');
          }}
          onSelectSimulate={() => {
            setInspectedFinding(null);
            setCurrentTab('simulator');
          }}
        />
      )}

      {/* Risk Scoring Weights Configuration Modal */}
      <RiskWeightsModal
        isOpen={isWeightsModalOpen}
        onClose={() => setIsWeightsModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ProjectProvider>
      <MainAppContent />
    </ProjectProvider>
  );
}
