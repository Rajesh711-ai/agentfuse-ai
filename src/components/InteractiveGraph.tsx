/**
 * AgentFuse AI - Interactive Security Graph Visualizer
 * High-performance interactive SVG canvas featuring:
 * - Trust Boundary Architectural Swimlanes
 * - Attack Path Pulsing Marching-Dash Highlighting
 * - Node Dragging & Repositioning
 * - Pan & Zoom with Minimap
 * - Reachability Heatmap & Neighbor Tracing
 * - Node and Edge Property Inspection
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Shield,
  Database,
  Cpu,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Lock,
  Unlock,
  AlertTriangle,
  Zap,
  Globe,
  Radio,
  FileText,
  Key,
} from 'lucide-react';
import { Agent, Permission, Resource, AgentDelegationLink, AttackPath, TrustBoundary } from '../core/types';
import { useProject } from '../context/ProjectContext';

interface NodePos {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
}

const BOUNDARY_CONFIG: Record<
  TrustBoundary,
  { name: string; color: string; bg: string; border: string; desc: string }
> = {
  public_dmz: {
    name: 'Public / DMZ Zone',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.04)',
    border: 'rgba(245, 158, 11, 0.25)',
    desc: 'Internet-facing ingestion boundary',
  },
  corporate_lan: {
    name: 'Corporate Internal Tier',
    color: '#06B6D4',
    bg: 'rgba(6, 182, 212, 0.04)',
    border: 'rgba(6, 182, 212, 0.25)',
    desc: 'Authorized internal processing mesh',
  },
  restricted_enclave: {
    name: 'Restricted High-Security Enclave',
    color: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.05)',
    border: 'rgba(236, 72, 153, 0.3)',
    desc: 'Protected sensitive records & keys',
  },
  external_sink: {
    name: 'External Egress Sink',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.05)',
    border: 'rgba(239, 68, 68, 0.35)',
    desc: 'Outbound external transmission targets',
  },
};

export const InteractiveGraph: React.FC<{
  height?: string;
  focusPath?: AttackPath | null;
  onSelectNode?: (nodeId: string, nodeType: 'agent' | 'resource') => void;
  onSelectEdge?: (edgeId: string, edgeType: 'delegation' | 'permission') => void;
}> = ({ height = 'calc(100vh - 210px)', focusPath, onSelectNode, onSelectEdge }) => {
  const {
    project,
    analysis,
    selectedNodeId,
    selectedEdgeId,
    setSelectedNodeId,
    setSelectedEdgeId,
    updateAgentPosition,
    updateResourcePosition,
  } = useProject();

  const containerRef = useRef<HTMLDivElement>(null);

  // Pan and Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Dragging node
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Filtering & View toggles
  const [searchTerm, setSearchTerm] = useState('');
  const [layoutMode, setLayoutMode] = useState<'swimlane' | 'organic'>('swimlane');
  const [selectedBoundaryFilter, setSelectedBoundaryFilter] = useState<string>('all');
  const [showOnlyRisky, setShowOnlyRisky] = useState(false);

  // Active highlighted path
  const activePath = focusPath || analysis.attackPaths.find((p) => p.id === analysis.attackPaths[0]?.id) || null;
  const pathNodeIds = useMemo(() => new Set(activePath ? activePath.nodeIds : []), [activePath]);
  const pathEdgeIds = useMemo(() => new Set(activePath ? activePath.edgeIds : []), [activePath]);

  // Compute node positions based on layout
  const nodePositions = useMemo(() => {
    const pos: Record<string, { x: number; y: number }> = {};

    if (layoutMode === 'swimlane') {
      // Group by boundary: DMZ -> Corporate -> Enclave / Sink
      const boundaryCols: Record<TrustBoundary, number> = {
        public_dmz: 140,
        corporate_lan: 480,
        restricted_enclave: 820,
        external_sink: 1160,
      };

      const boundaryRows: Record<TrustBoundary, number> = {
        public_dmz: 120,
        corporate_lan: 120,
        restricted_enclave: 120,
        external_sink: 120,
      };

      // Position agents
      project.agents.forEach((ag) => {
        if (ag.position) {
          pos[ag.id] = { ...ag.position };
        } else {
          const colX = boundaryCols[ag.trustBoundary] || 400;
          const rowY = boundaryRows[ag.trustBoundary];
          pos[ag.id] = { x: colX, y: rowY };
          boundaryRows[ag.trustBoundary] += 160;
        }
      });

      // Position resources
      project.resources.forEach((res) => {
        if (res.position) {
          pos[res.id] = { ...res.position };
        } else {
          const colX = boundaryCols[res.trustBoundary] || 800;
          const rowY = boundaryRows[res.trustBoundary];
          pos[res.id] = { x: colX, y: rowY };
          boundaryRows[res.trustBoundary] += 160;
        }
      });
    } else {
      // Fallback or custom coords
      project.agents.forEach((ag, idx) => {
        pos[ag.id] = ag.position || { x: 200 + (idx % 3) * 300, y: 150 + Math.floor(idx / 3) * 220 };
      });
      project.resources.forEach((res, idx) => {
        pos[res.id] = res.position || { x: 750 + (idx % 2) * 320, y: 120 + Math.floor(idx / 2) * 220 };
      });
    }

    return pos;
  }, [project, layoutMode]);

  // Handle Pan and Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(2.5, Math.max(0.4, prev * zoomFactor)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking canvas background
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'graph-canvas-bg') {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    } else if (draggingNodeId) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const mouseCanvasX = (e.clientX - containerRect.left - pan.x) / zoom;
      const mouseCanvasY = (e.clientY - containerRect.top - pan.y) / zoom;

      const newX = Math.round(mouseCanvasX - dragOffset.x);
      const newY = Math.round(mouseCanvasY - dragOffset.y);

      // Check if it's agent or resource
      if (project.agents.some((a) => a.id === draggingNodeId)) {
        updateAgentPosition(draggingNodeId, newX, newY);
      } else {
        updateResourcePosition(draggingNodeId, newX, newY);
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  const startDragNode = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const nodePos = nodePositions[nodeId] || { x: 0, y: 0 };
    const mouseCanvasX = (e.clientX - containerRect.left - pan.x) / zoom;
    const mouseCanvasY = (e.clientY - containerRect.top - pan.y) / zoom;

    setDraggingNodeId(nodeId);
    setDragOffset({
      x: mouseCanvasX - nodePos.x,
      y: mouseCanvasY - nodePos.y,
    });
  };

  // Filter entities
  const filteredAgents = useMemo(() => {
    return project.agents.filter((a) => {
      if (searchTerm && !a.name.toLowerCase().includes(searchTerm.toLowerCase()) && !a.id.includes(searchTerm)) {
        return false;
      }
      if (selectedBoundaryFilter !== 'all' && a.trustBoundary !== selectedBoundaryFilter) {
        return false;
      }
      if (showOnlyRisky && !pathNodeIds.has(a.id)) {
        return false;
      }
      return true;
    });
  }, [project.agents, searchTerm, selectedBoundaryFilter, showOnlyRisky, pathNodeIds]);

  const filteredResources = useMemo(() => {
    return project.resources.filter((r) => {
      if (searchTerm && !r.name.toLowerCase().includes(searchTerm.toLowerCase()) && !r.id.includes(searchTerm)) {
        return false;
      }
      if (selectedBoundaryFilter !== 'all' && r.trustBoundary !== selectedBoundaryFilter) {
        return false;
      }
      if (showOnlyRisky && !pathNodeIds.has(r.id)) {
        return false;
      }
      return true;
    });
  }, [project.resources, searchTerm, selectedBoundaryFilter, showOnlyRisky, pathNodeIds]);

  const fitToView = () => {
    setZoom(0.85);
    setPan({ x: 30, y: 40 });
  };

  // Helper for curved bezier SVG edge
  const makeEdgePath = (from: { x: number; y: number }, to: { x: number; y: number }, curveOffset = 0) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const cx1 = from.x + dx * 0.5;
    const cy1 = from.y + curveOffset;
    const cx2 = from.x + dx * 0.5;
    const cy2 = to.y - curveOffset;
    return `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
  };

  return (
    <div className="relative w-full rounded-xl border border-slate-800 bg-[#0a0f1d] overflow-hidden shadow-2xl flex flex-col" style={{ height }}>
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#0d1527]/90 border-b border-slate-800/80 backdrop-blur z-20 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-mono font-semibold text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 px-2.5 py-1 rounded">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>INTERACTIVE PERMISSION TOPOLOGY</span>
          </div>
          <span className="text-slate-500">|</span>
          <div className="text-slate-400">
            Agents: <span className="text-white font-mono">{filteredAgents.length}</span> / Resources:{' '}
            <span className="text-white font-mono">{filteredResources.length}</span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-2.5 py-1 bg-slate-900 border border-slate-700/80 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-36 sm:w-44"
            />
          </div>

          <select
            value={selectedBoundaryFilter}
            onChange={(e) => setSelectedBoundaryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 text-slate-300 py-1 px-2 rounded focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Zones</option>
            <option value="public_dmz">DMZ Zone</option>
            <option value="corporate_lan">Corporate LAN</option>
            <option value="restricted_enclave">Restricted Enclave</option>
            <option value="external_sink">External Sink</option>
          </select>

          <button
            onClick={() => setShowOnlyRisky(!showOnlyRisky)}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 border transition ${
              showOnlyRisky
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 font-semibold shadow-lg shadow-rose-950/50'
                : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
            title="Isolate nodes present in active attack path"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Risky Only</span>
          </button>

          <button
            onClick={() => setLayoutMode(layoutMode === 'swimlane' ? 'organic' : 'swimlane')}
            className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded flex items-center gap-1.5 transition"
            title="Toggle between Swimlane and Organic layout"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="capitalize">{layoutMode}</span>
          </button>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 p-0.5 rounded">
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z * 1.15))}
            className="p-1 hover:bg-slate-800 text-slate-300 rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z * 0.85))}
            className="p-1 hover:bg-slate-800 text-slate-300 rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={fitToView}
            className="p-1 hover:bg-slate-800 text-slate-300 rounded"
            title="Reset to Fit View"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <span className="px-1 text-[11px] font-mono text-cyan-400">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Main SVG Graph Surface */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="relative flex-1 w-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
      >
        <svg
          id="graph-canvas-bg"
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(30, 41, 59, 0.45) 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        >
          <defs>
            {/* Arrowhead markers */}
            <marker
              id="arrow-delegation"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#06B6D4" />
            </marker>

            <marker
              id="arrow-permission"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#A855F7" />
            </marker>

            <marker
              id="arrow-attack-path"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#EF4444" />
            </marker>

            {/* Glowing filters */}
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Canvas Transform Group */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Swimlane Background Zones */}
            {layoutMode === 'swimlane' && (
              <g className="swimlane-zones">
                {Object.entries(BOUNDARY_CONFIG).map(([boundaryKey, conf], idx) => {
                  const x = 50 + idx * 340;
                  return (
                    <g key={boundaryKey} transform={`translate(${x}, 40)`}>
                      <rect
                        width="300"
                        height="640"
                        rx="12"
                        fill={conf.bg}
                        stroke={conf.border}
                        strokeWidth="1.5"
                        strokeDasharray={boundaryKey === 'external_sink' ? '6 4' : 'none'}
                      />
                      <rect width="300" height="32" rx="12" fill={conf.border} />
                      <text
                        x="15"
                        y="20"
                        fill="#FFFFFF"
                        fontSize="11"
                        fontWeight="bold"
                        letterSpacing="0.05em"
                        fontFamily="monospace"
                      >
                        {conf.name.toUpperCase()}
                      </text>
                      <text x="15" y="48" fill={conf.color} fontSize="9" fontFamily="sans-serif">
                        {conf.desc}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* EDGES: 1. Delegations */}
            <g className="edges-delegations">
              {project.delegations.map((del) => {
                const srcPos = nodePositions[del.sourceAgentId];
                const tgtPos = nodePositions[del.targetAgentId];
                if (!srcPos || !tgtPos) return null;

                const isPathEdge = pathEdgeIds.has(del.id);
                const isSelected = selectedEdgeId === del.id;

                const start = { x: srcPos.x + 100, y: srcPos.y + 45 };
                const end = { x: tgtPos.x, y: tgtPos.y + 45 };
                const pathStr = makeEdgePath(start, end, 20);

                return (
                  <g
                    key={del.id}
                    onClick={() => {
                      setSelectedEdgeId(del.id);
                      onSelectEdge?.(del.id, 'delegation');
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Hover hit area */}
                    <path d={pathStr} stroke="transparent" strokeWidth="18" fill="none" />
                    {/* Visual Edge */}
                    <path
                      d={pathStr}
                      stroke={isPathEdge ? '#EF4444' : isSelected ? '#38BDF8' : '#0891B2'}
                      strokeWidth={isPathEdge ? 3.5 : isSelected ? 2.5 : 1.5}
                      strokeDasharray={isPathEdge ? '8 4' : '5 3'}
                      strokeOpacity={isPathEdge ? 1 : 0.7}
                      fill="none"
                      markerEnd={isPathEdge ? 'url(#arrow-attack-path)' : 'url(#arrow-delegation)'}
                      filter={isPathEdge ? 'url(#glow-red)' : undefined}
                      className={isPathEdge ? 'animate-[dash_1s_linear_infinite]' : ''}
                    />
                    {/* Delegation Type Label */}
                    <rect
                      x={(start.x + end.x) / 2 - 42}
                      y={(start.y + end.y) / 2 - 10}
                      width="84"
                      height="18"
                      rx="4"
                      fill="#0F172A"
                      stroke={isPathEdge ? '#EF4444' : '#0E7490'}
                      strokeWidth="1"
                    />
                    <text
                      x={(start.x + end.x) / 2}
                      y={(start.y + end.y) / 2 + 2}
                      textAnchor="middle"
                      fill={isPathEdge ? '#FCA5A5' : '#67E8F9'}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {del.forwardContext ? '⇶ ' : ''}{del.delegationType}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* EDGES: 2. Permissions */}
            <g className="edges-permissions">
              {project.permissions.map((perm) => {
                const agPos = nodePositions[perm.agentId];
                const resPos = nodePositions[perm.resourceId];
                if (!agPos || !resPos) return null;

                const isPathEdge = pathEdgeIds.has(perm.id);
                const isSelected = selectedEdgeId === perm.id;

                const start = { x: agPos.x + 100, y: agPos.y + 45 };
                const end = { x: resPos.x, y: resPos.y + 35 };
                const pathStr = makeEdgePath(start, end, -30);

                const actionColor =
                  perm.action === 'transmit'
                    ? '#EF4444'
                    : perm.action === 'read'
                    ? '#38BDF8'
                    : perm.action === 'write'
                    ? '#F59E0B'
                    : '#A855F7';

                return (
                  <g
                    key={perm.id}
                    onClick={() => {
                      setSelectedEdgeId(perm.id);
                      onSelectEdge?.(perm.id, 'permission');
                    }}
                    className="cursor-pointer group"
                  >
                    <path d={pathStr} stroke="transparent" strokeWidth="18" fill="none" />
                    <path
                      d={pathStr}
                      stroke={isPathEdge ? '#EF4444' : isSelected ? '#A855F7' : actionColor}
                      strokeWidth={isPathEdge ? 3.5 : isSelected ? 2.5 : 1.5}
                      strokeDasharray={perm.requiresApproval ? '4 2' : 'none'}
                      strokeOpacity={isPathEdge ? 1 : 0.75}
                      fill="none"
                      markerEnd={isPathEdge ? 'url(#arrow-attack-path)' : 'url(#arrow-permission)'}
                      filter={isPathEdge ? 'url(#glow-red)' : undefined}
                    />
                    {/* Action badge */}
                    <rect
                      x={(start.x + end.x) / 2 - 36}
                      y={(start.y + end.y) / 2 - 10}
                      width="72"
                      height="18"
                      rx="4"
                      fill="#0F172A"
                      stroke={isPathEdge ? '#EF4444' : actionColor}
                      strokeWidth="1"
                    />
                    <text
                      x={(start.x + end.x) / 2}
                      y={(start.y + end.y) / 2 + 3}
                      textAnchor="middle"
                      fill={isPathEdge ? '#FCA5A5' : '#E2E8F0'}
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {perm.action.toUpperCase()}
                      {perm.requiresApproval ? ' 🔒' : ''}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* NODES: Agents */}
            <g className="nodes-agents">
              {filteredAgents.map((ag) => {
                const pos = nodePositions[ag.id] || { x: 100, y: 100 };
                const isSelected = selectedNodeId === ag.id;
                const isPathNode = pathNodeIds.has(ag.id);

                return (
                  <g
                    key={ag.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onMouseDown={(e) => startDragNode(ag.id, e)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(ag.id);
                      onSelectNode?.(ag.id, 'agent');
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Glow outline if path or selected */}
                    {(isPathNode || isSelected) && (
                      <rect
                        x="-4"
                        y="-4"
                        width="218"
                        height="98"
                        rx="10"
                        fill="none"
                        stroke={isPathNode ? '#EF4444' : '#38BDF8'}
                        strokeWidth="2.5"
                        filter={isPathNode ? 'url(#glow-red)' : 'url(#glow-cyan)'}
                      />
                    )}

                    {/* Agent card body */}
                    <rect
                      width="210"
                      height="90"
                      rx="8"
                      fill="#0F172A"
                      stroke={
                        isPathNode
                          ? '#EF4444'
                          : isSelected
                          ? '#38BDF8'
                          : ag.canReceiveUntrustedInput
                          ? '#F59E0B'
                          : '#1E293B'
                      }
                      strokeWidth={isPathNode ? 2 : 1.5}
                      className="transition-all"
                    />

                    {/* Top Header bar with Trust badge */}
                    <path d="M 0 8 Q 0 0 8 0 L 202 0 Q 210 0 210 8 L 210 24 L 0 24 Z" fill="#1E293B" />

                    {/* Icon */}
                    <g transform="translate(8, 5)">
                      <circle cx="7" cy="7" r="6" fill="#06B6D4" fillOpacity="0.2" />
                      <Cpu size={12} color="#22D3EE" />
                    </g>

                    <text x="28" y="16" fill="#F8FAFC" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                      {ag.name.length > 22 ? ag.name.slice(0, 20) + '...' : ag.name}
                    </text>

                    {/* Trust level badge */}
                    <g transform="translate(148, 4)">
                      <rect
                        width="54"
                        height="15"
                        rx="3"
                        fill={
                          ag.trustLevel === 'untrusted'
                            ? '#7F1D1D'
                            : ag.trustLevel === 'low'
                            ? '#78350F'
                            : ag.trustLevel === 'medium'
                            ? '#0E7490'
                            : '#065F46'
                        }
                      />
                      <text x="27" y="11" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold">
                        {ag.trustLevel.toUpperCase()}
                      </text>
                    </g>

                    {/* Untrusted Intake indicator */}
                    {ag.canReceiveUntrustedInput && (
                      <g transform="translate(10, 32)">
                        <rect width="190" height="16" rx="3" fill="rgba(245, 158, 11, 0.15)" stroke="#D97706" strokeWidth="0.8" />
                        <text x="6" y="11" fill="#FCD34D" fontSize="8" fontWeight="bold">
                          ⚡ UNTRUSTED INPUT CHANNEL
                        </text>
                      </g>
                    )}

                    {/* Purpose brief */}
                    <text
                      x="10"
                      y={ag.canReceiveUntrustedInput ? 62 : 46}
                      fill="#94A3B8"
                      fontSize="9"
                      fontFamily="sans-serif"
                    >
                      {ag.purpose.length > 36 ? ag.purpose.slice(0, 34) + '...' : ag.purpose}
                    </text>

                    {/* Tools count & ID */}
                    <text
                      x="10"
                      y={ag.canReceiveUntrustedInput ? 78 : 72}
                      fill="#64748B"
                      fontSize="8"
                      fontFamily="monospace"
                    >
                      ID: {ag.id} | Tools: {ag.tools.length}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* NODES: Resources */}
            <g className="nodes-resources">
              {filteredResources.map((res) => {
                const pos = nodePositions[res.id] || { x: 600, y: 100 };
                const isSelected = selectedNodeId === res.id;
                const isPathNode = pathNodeIds.has(res.id);

                const sensColor =
                  res.sensitivity === 'restricted'
                    ? '#EF4444'
                    : res.sensitivity === 'confidential'
                    ? '#F59E0B'
                    : res.sensitivity === 'internal'
                    ? '#06B6D4'
                    : '#10B981';

                return (
                  <g
                    key={res.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onMouseDown={(e) => startDragNode(res.id, e)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(res.id);
                      onSelectNode?.(res.id, 'resource');
                    }}
                    className="cursor-pointer group"
                  >
                    {(isPathNode || isSelected) && (
                      <rect
                        x="-4"
                        y="-4"
                        width="218"
                        height="88"
                        rx="10"
                        fill="none"
                        stroke={isPathNode ? '#EF4444' : '#38BDF8'}
                        strokeWidth="2.5"
                        filter={isPathNode ? 'url(#glow-red)' : 'url(#glow-cyan)'}
                      />
                    )}

                    <rect
                      width="210"
                      height="80"
                      rx="8"
                      fill="#0F172A"
                      stroke={isPathNode ? '#EF4444' : isSelected ? '#38BDF8' : res.isExternalSink ? '#EF4444' : '#1E293B'}
                      strokeWidth={isPathNode ? 2 : 1.5}
                      strokeDasharray={res.isExternalSink ? '4 2' : 'none'}
                    />

                    {/* Header */}
                    <path d="M 0 8 Q 0 0 8 0 L 202 0 Q 210 0 210 8 L 210 22 L 0 22 Z" fill="#1E293B" />

                    <g transform="translate(8, 4)">
                      {res.isExternalSink ? (
                        <Globe size={13} color="#EF4444" />
                      ) : res.type === 'database' ? (
                        <Database size={13} color={sensColor} />
                      ) : res.type === 'credentials' ? (
                        <Key size={13} color="#F59E0B" />
                      ) : (
                        <FileText size={13} color={sensColor} />
                      )}
                    </g>

                    <text x="26" y="15" fill="#F8FAFC" fontSize="10" fontWeight="bold">
                      {res.name.length > 22 ? res.name.slice(0, 20) + '...' : res.name}
                    </text>

                    {/* Sensitivity tag */}
                    <g transform="translate(136, 4)">
                      <rect width="66" height="14" rx="3" fill={sensColor} fillOpacity="0.2" stroke={sensColor} strokeWidth="0.8" />
                      <text x="33" y="10" textAnchor="middle" fill={sensColor} fontSize="8" fontWeight="bold">
                        {res.sensitivity.toUpperCase()}
                      </text>
                    </g>

                    {/* Classification */}
                    <text x="10" y="42" fill="#94A3B8" fontSize="9" fontWeight="medium">
                      Class: {res.dataClassification}
                    </text>

                    {/* Sink / Destination Alert */}
                    {res.isExternalSink ? (
                      <g transform="translate(10, 52)">
                        <rect width="190" height="18" rx="3" fill="rgba(239, 68, 68, 0.2)" stroke="#EF4444" strokeWidth="0.8" />
                        <text x="6" y="12" fill="#FCA5A5" fontSize="8" fontWeight="bold">
                          ⚠ EXTERNAL EGRESS SINK DESTINATION
                        </text>
                      </g>
                    ) : (
                      <text x="10" y="62" fill="#64748B" fontSize="8" fontFamily="monospace">
                        Zone: {res.trustBoundary} | ID: {res.id}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </g>
        </svg>

        {/* Legend in bottom left */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 backdrop-blur text-[11px] shadow-xl pointer-events-auto">
          <div className="font-mono text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>GRAPH TOPOLOGY LEGEND</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
              <span>Untrusted Intake (DMZ)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-cyan-500"></span>
              <span>Internal Agent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-500"></span>
              <span>Restricted Asset / Sink</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-b-2 border-dashed border-cyan-400"></span>
              <span>Delegation Channel</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-purple-400"></span>
              <span>Permission Link</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-rose-500 animate-pulse"></span>
              <span>Risky Attack Path</span>
            </div>
          </div>
        </div>

        {/* Active Attack Path Banner if present */}
        {activePath && (
          <div className="absolute top-3 right-3 bg-rose-950/90 border border-rose-500/80 rounded-lg p-2.5 backdrop-blur max-w-sm shadow-xl text-xs pointer-events-auto">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="px-2 py-0.5 bg-rose-600 text-white font-bold font-mono rounded text-[10px]">
                {activePath.severity.toUpperCase()} RISK {activePath.riskScore}/100
              </span>
              <span className="text-rose-300 font-mono text-[10px]">{activePath.transitions.length} Transition Hops</span>
            </div>
            <div className="font-semibold text-rose-100 line-clamp-2">{activePath.title}</div>
            <div className="text-[11px] text-rose-300/80 mt-1 line-clamp-2">{activePath.narrative}</div>
          </div>
        )}
      </div>
    </div>
  );
};
