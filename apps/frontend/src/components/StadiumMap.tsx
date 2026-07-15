import React, { useState, useEffect, useRef } from 'react';
import { StadiumNode, StadiumEdge, CrowdDensity, ReuniteResponse } from '../types';

interface StadiumMapProps {
  nodes: StadiumNode[];
  edges: StadiumEdge[];
  densities: CrowdDensity[];
  suggestedPath: string[];
  userLocation: string;
  onSelectStartLocation: (nodeId: string) => void;
  reuniteResult?: ReuniteResponse | null;
  activeTab?: string;
}

export const StadiumMap: React.FC<StadiumMapProps> = ({
  nodes,
  edges,
  densities,
  suggestedPath,
  userLocation,
  onSelectStartLocation,
  reuniteResult = null,
  activeTab
}) => {
  // Define ring groupings
  const RING1_NODES = ['sec-100', 'sec-101', 'sec-102', 'sec-103', 'sec-104', 'sec-105'];
  const RING2_NODES = ['food-stall-a', 'restroom-2', 'food-stall-b', 'restroom-3', 'food-stall-c', 'restroom-1'];
  const RING3_NODES = ['exit-east', 'gate-c', 'gate-d', 'exit-west', 'gate-a', 'gate-b'];

  // Zoom and pan state
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0
  });

  const touchRef = useRef({
    startDist: 0,
    startZoom: 1.0,
    isDragging: false,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0
  });

  const handleReset = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    handleReset();
  }, [activeTab]);

  const clampPan = (px: number, py: number, currentZoom: number) => {
    const width = 500 / currentZoom;
    const height = 500 / currentZoom;
    // Allow panning up to 100px beyond boundaries (margin)
    const minX = -100;
    const maxX = 500 - width + 100;
    const minY = -100;
    const maxY = 500 - height + 100;
    return {
      x: Math.max(minX, Math.min(maxX, px)),
      y: Math.max(minY, Math.min(maxY, py))
    };
  };

  // Zoom by mouse wheel
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const w = 500 / zoom;
    const h = 500 / zoom;
    const svgX = pan.x + (mx / rect.width) * w;
    const svgY = pan.y + (my / rect.height) * h;

    const zoomFactor = 1.1;
    let nextZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    nextZoom = Math.max(1.0, Math.min(4.0, nextZoom));

    const nextW = 500 / nextZoom;
    const nextH = 500 / nextZoom;

    const nextX = svgX - (mx / rect.width) * nextW;
    const nextY = svgY - (my / rect.height) * nextH;

    const clamped = clampPan(nextX, nextY, nextZoom);
    setZoom(nextZoom);
    setPan(clamped);
  };

  // Drag Panning
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Only left click
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragRef.current.isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    const w = 500 / zoom;
    const h = 500 / zoom;
    const svgDx = (dx / rect.width) * w;
    const svgDy = (dy / rect.height) * h;

    const nextX = dragRef.current.startPanX - svgDx;
    const nextY = dragRef.current.startPanY - svgDy;

    const clamped = clampPan(nextX, nextY, zoom);
    setPan(clamped);
  };

  const handleMouseUpOrLeave = () => {
    dragRef.current.isDragging = false;
  };

  // Touch handlers for mobile pan & pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchRef.current = {
        startDist: 0,
        startZoom: zoom,
        isDragging: true,
        startX: t.clientX,
        startY: t.clientY,
        startPanX: pan.x,
        startPanY: pan.y
      };
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

      const mx = (t1.clientX + t2.clientX) / 2 - rect.left;
      const my = (t1.clientY + t2.clientY) / 2 - rect.top;

      const w = 500 / zoom;
      const h = 500 / zoom;
      const svgX = pan.x + (mx / rect.width) * w;
      const svgY = pan.y + (my / rect.height) * h;

      touchRef.current = {
        startDist: dist,
        startZoom: zoom,
        isDragging: false,
        startX: svgX,
        startY: svgY,
        startPanX: mx,
        startPanY: my
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.touches.length === 1 && touchRef.current.isDragging) {
      const t = e.touches[0];
      const dx = t.clientX - touchRef.current.startX;
      const dy = t.clientY - touchRef.current.startY;

      const w = 500 / zoom;
      const h = 500 / zoom;
      const svgDx = (dx / rect.width) * w;
      const svgDy = (dy / rect.height) * h;

      const nextX = touchRef.current.startPanX - svgDx;
      const nextY = touchRef.current.startPanY - svgDy;
      const clamped = clampPan(nextX, nextY, zoom);
      setPan(clamped);
    } else if (e.touches.length === 2 && touchRef.current.startDist > 0) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

      const ratio = dist / touchRef.current.startDist;
      let nextZoom = touchRef.current.startZoom * ratio;
      nextZoom = Math.max(1.0, Math.min(4.0, nextZoom));

      const nextW = 500 / nextZoom;
      const nextH = 500 / nextZoom;

      const mx = (t1.clientX + t2.clientX) / 2 - rect.left;
      const my = (t1.clientY + t2.clientY) / 2 - rect.top;

      const svgX = touchRef.current.startX;
      const svgY = touchRef.current.startY;

      let nextX = svgX - (mx / rect.width) * nextW;
      let nextY = svgY - (my / rect.height) * nextH;

      const clamped = clampPan(nextX, nextY, nextZoom);
      setZoom(nextZoom);
      setPan(clamped);
    }
  };

  const handleTouchEnd = () => {
    touchRef.current.isDragging = false;
    touchRef.current.startDist = 0;
  };

  // Zoom buttons helper
  const handleButtonZoom = (zoomIn: boolean) => {
    const zoomFactor = 1.3;
    let nextZoom = zoomIn ? zoom * zoomFactor : zoom / zoomFactor;
    nextZoom = Math.max(1.0, Math.min(4.0, nextZoom));

    const w = 500 / zoom;
    const h = 500 / zoom;

    const svgX = pan.x + w / 2;
    const svgY = pan.y + h / 2;

    const nextW = 500 / nextZoom;
    const nextH = 500 / nextZoom;

    const nextX = svgX - nextW / 2;
    const nextY = svgY - nextH / 2;

    const clamped = clampPan(nextX, nextY, nextZoom);
    setZoom(nextZoom);
    setPan(clamped);
  };

  // Programmatically calculate node coordinates for concentric circular rings
  const getCustomNodeCoords = (nodeId: string): { x: number; y: number } => {
    const cx = 250;
    const cy = 250;
    
    const R1 = 90; // Ring 1: Seating sections (descaled to prevent label clipping)
    const R2 = 140; // Ring 2: Food stalls & restrooms (descaled)
    const R3 = 195; // Ring 3: Gates & exits (descaled)
    
    const calcCoords = (radius: number, index: number, total: number, angleOffsetDeg: number) => {
      const angleRad = ((index * (360 / total) + angleOffsetDeg) * Math.PI) / 180;
      return {
        x: Math.round(cx + radius * Math.cos(angleRad)),
        y: Math.round(cy + radius * Math.sin(angleRad))
      };
    };

    const idx1 = RING1_NODES.indexOf(nodeId);
    if (idx1 !== -1) {
      return calcCoords(R1, idx1, RING1_NODES.length, -90);
    }

    const idx2 = RING2_NODES.indexOf(nodeId);
    if (idx2 !== -1) {
      return calcCoords(R2, idx2, RING2_NODES.length, -90);
    }

    const idx3 = RING3_NODES.indexOf(nodeId);
    if (idx3 !== -1) {
      return calcCoords(R3, idx3, RING3_NODES.length, 0);
    }

    return { x: cx, y: cy };
  };

  const mappedNodes = nodes.map(n => ({
    ...n,
    ...getCustomNodeCoords(n.id)
  }));

  // Helper to push text labels radially outward from node positions to avoid overlapping edges
  const getLabelCoords = (node: StadiumNode): { x: number; y: number } => {
    if (node.type === 'section') {
      return { x: node.x, y: node.y + 3 }; // Centered inside section box
    }
    const dx = node.x - 250;
    const dy = node.y - 250;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const offset = 35; // Increased from 20 to 35 to provide clearance from status badge
    
    return {
      x: Math.round(250 + (distance + offset) * Math.cos(angle)),
      y: Math.round(250 + (distance + offset) * Math.sin(angle) + 3)
    };
  };

  // Utility: Check if a node is in the suggested path
  const isNodeInPath = (nodeId: string) => suggestedPath.includes(nodeId);

  // Utility: Check if an edge is traversed in the suggested path
  const isEdgeInPath = (from: string, to: string) => {
    if (suggestedPath.length < 2) return false;
    for (let i = 0; i < suggestedPath.length - 1; i++) {
      const pFrom = suggestedPath[i];
      const pTo = suggestedPath[i + 1];
      if ((pFrom === from && pTo === to) || (pFrom === to && pTo === from)) {
        return true;
      }
    }
    return false;
  };

  const isEdgeInMemberPath = (from: string, to: string, path: string[]) => {
    if (path.length < 2) return false;
    for (let i = 0; i < path.length - 1; i++) {
      const pFrom = path[i];
      const pTo = path[i + 1];
      if ((pFrom === from && pTo === to) || (pFrom === to && pTo === from)) {
        return true;
      }
    }
    return false;
  };

  const memberColors = ['#F2B441', '#F4F1EA', '#8B5CF6', '#EC4899']; // Gold, Chalk White, Purple, Pink

  // Get color coding based on density
  const getDensityColor = (nodeId: string) => {
    const data = densities.find(d => d.nodeId === nodeId);
    if (!data) return 'var(--fifa-clear)'; // default clear turf-green
    if (data.level === 'high') return 'var(--fifa-congested)'; // congested red
    if (data.level === 'medium') return 'var(--fifa-moderate)'; // moderate gold
    return 'var(--fifa-clear)'; // clear turf-green
  };

  const handleKeyDown = (e: React.KeyboardEvent, nodeId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectStartLocation(nodeId);
    }
  };

  // Node symbols or styles depending on node type
  const renderNodeShape = (node: StadiumNode) => {
    const color = getDensityColor(node.id);
    const isStart = node.id === userLocation;
    const isEnd = suggestedPath.length > 0 && node.id === suggestedPath[suggestedPath.length - 1];
    const isPathNode = isNodeInPath(node.id);

    // Apply colorblind-safe diagonal hatch pattern for congested nodes
    const data = densities.find(d => d.nodeId === node.id);
    const isCongested = data?.level === 'high';
    const nodeFill = isCongested ? 'url(#hatch-congested)' : color;

    // Dynamic ring stroke styling for active route (No default blue)
    const ringStyle = isStart
      ? 'stroke-[var(--fifa-moderate)] stroke-[3] animate-pulse'
      : isEnd
      ? 'stroke-[var(--fifa-clear)] stroke-[3] animate-bounce'
      : isPathNode
      ? 'stroke-white stroke-[1.5]'
      : 'stroke-slate-700/60 stroke-[1]';

    const hoverStyle = 'cursor-pointer hover:scale-115 hover:brightness-125 hover:stroke-white hover:stroke-[2] font-semibold outline-none';
    const nonInteractiveStyle = 'transition-all duration-300';

    switch (node.type) {
      case 'gate':
        return (
          <rect
            x={node.x - 12}
            y={node.y - 12}
            width={24}
            height={24}
            rx={4}
            fill={nodeFill}
            stroke={isCongested ? 'var(--fifa-congested)' : undefined}
            className={`transition-all duration-300 ${ringStyle} ${hoverStyle}`}
            tabIndex={0}
            aria-label={`Gate ${node.name}`}
            onKeyDown={(e) => handleKeyDown(e, node.id)}
            onClick={() => onSelectStartLocation(node.id)}
          />
        );
      case 'exit':
        return (
          <polygon
            points={`${node.x},${node.y - 14} ${node.x + 14},${node.y} ${node.x},${node.y + 14} ${node.x - 14},${node.y}`}
            fill={nodeFill}
            stroke={isCongested ? 'var(--fifa-congested)' : undefined}
            className={`${nonInteractiveStyle} ${ringStyle}`}
            aria-label={`Exit ${node.name}`}
          />
        );
      case 'restroom':
        return (
          <circle
            cx={node.x}
            cy={node.y}
            r={10}
            fill={nodeFill}
            stroke={isCongested ? 'var(--fifa-congested)' : undefined}
            className={`${nonInteractiveStyle} ${ringStyle}`}
            aria-label={`Restroom ${node.name}`}
          />
        );
      case 'food':
        return (
          <circle
            cx={node.x}
            cy={node.y}
            r={11}
            fill={nodeFill}
            stroke={isCongested ? 'var(--fifa-congested)' : undefined}
            className={`${nonInteractiveStyle} ${ringStyle}`}
            aria-label={`Food Stall ${node.name}`}
          />
        );
      default: // section
        return (
          <rect
            x={node.x - 15}
            y={node.y - 10}
            width={30}
            height={20}
            rx={3}
            fill={nodeFill}
            stroke={isCongested ? 'var(--fifa-congested)' : undefined}
            className={`transition-all duration-300 ${ringStyle} ${hoverStyle}`}
            tabIndex={0}
            aria-label={`Section ${node.name}`}
            onKeyDown={(e) => handleKeyDown(e, node.id)}
            onClick={() => onSelectStartLocation(node.id)}
          />
        );
    }
  };

  const renderCongestionBadge = (node: StadiumNode) => {
    const data = densities.find(d => d.nodeId === node.id);
    const level = data ? data.level : 'low';
    
    let badgeX = node.x + 16;
    let badgeY = node.y - 16;
    if (node.type === 'section') {
      badgeX = node.x + 20;
      badgeY = node.y - 15;
    }
    
    if (level === 'low') {
      return (
        <g className="select-none pointer-events-none">
          <circle
            cx={badgeX}
            cy={badgeY}
            r={9}
            fill="var(--fifa-clear)"
            stroke="#121826"
            strokeWidth={1.5}
          />
          <text
            x={badgeX}
            y={badgeY + 3.5}
            textAnchor="middle"
            fill="#E8E6E0"
            className="font-sans font-bold text-[10px]"
          >
            ✓
          </text>
        </g>
      );
    }
    
    const badgeBg = level === 'medium' ? 'var(--fifa-moderate)' : 'var(--fifa-congested)';
    
    return (
      <g className="select-none pointer-events-none">
        <polygon
          points={`${badgeX},${badgeY - 10} ${badgeX + 11},${badgeY + 8} ${badgeX - 11},${badgeY + 8}`}
          fill={badgeBg}
          stroke="#121826"
          strokeWidth={1.5}
        />
        <text
          x={badgeX}
          y={badgeY + 5}
          textAnchor="middle"
          fill="#E8E6E0"
          className="font-sans font-bold text-[10px]"
        >
          !
        </text>
      </g>
    );
  };

  const renderLegendIcon = (type: 'clear' | 'moderate' | 'congested') => {
    if (type === 'clear') {
      return (
        <svg width="18" height="18" className="inline-block mr-1">
          <circle cx="9" cy="9" r="8" fill="var(--fifa-clear)" stroke="#121826" strokeWidth={1} />
          <text x="9" y="12" textAnchor="middle" fill="#E8E6E0" className="font-sans font-bold text-[10px]">✓</text>
        </svg>
      );
    }
    const bg = type === 'moderate' ? 'var(--fifa-moderate)' : 'var(--fifa-congested)';
    return (
      <svg width="18" height="18" className="inline-block mr-1">
        <polygon points="9,1 18,16 0,16" fill={bg} stroke="#121826" strokeWidth={1} />
        <text x="9" y="13" textAnchor="middle" fill="#E8E6E0" className="font-sans font-bold text-[10px]">!</text>
      </svg>
    );
  };

  return (
    <div className="relative w-full flex-1 min-h-0 bg-fifa-navy border border-slate-800/80 rounded-xl p-4 shadow-inner flex flex-col items-center overflow-hidden">
      <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-400 mb-3 px-1 select-none">
        <span className="flex flex-wrap items-center gap-2 tracking-wider uppercase text-slate-400">
          <span className="flex items-center gap-1">
            {renderLegendIcon('clear')} Clear
          </span>
          <span className="flex items-center gap-1 ml-1.5">
            {renderLegendIcon('moderate')} Moderate
          </span>
          <span className="flex items-center gap-1 ml-1.5">
            {renderLegendIcon('congested')} Congested
          </span>
        </span>
        <span className="text-fifa-gold uppercase tracking-wider font-semibold">Click node to change Start Position</span>
      </div>

      <div className="relative w-full flex-1 min-h-0 flex justify-center items-center bg-fifa-dark/30 rounded-lg p-2 border border-slate-900/60 overflow-hidden">
        {/* Floating Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-10 select-none">
          <button
            onClick={() => handleButtonZoom(true)}
            className="w-8 h-8 rounded-lg bg-fifa-card hover:bg-fifa-elevated border border-slate-700/80 text-white font-bold flex items-center justify-center shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-fifa-clear text-sm"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => handleButtonZoom(false)}
            className="w-8 h-8 rounded-lg bg-fifa-card hover:bg-fifa-elevated border border-slate-700/80 text-white font-bold flex items-center justify-center shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-fifa-clear text-sm"
            title="Zoom Out"
          >
            −
          </button>
          <button
            onClick={handleReset}
            className="px-2 py-1.5 rounded-lg bg-fifa-card hover:bg-fifa-elevated border border-slate-700/80 text-xs text-white font-medium flex items-center justify-center shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-fifa-clear"
            title="Reset View"
          >
            Reset
          </button>
        </div>

        <svg
          viewBox={`${pan.x} ${pan.y} ${500 / zoom} ${500 / zoom}`}
          className={`h-full w-auto max-w-full aspect-square select-none ${
            zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
          }`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <defs>
            <style>{`
              @keyframes march {
                to {
                  stroke-dashoffset: -20;
                }
              }
              .marching-ants {
                stroke-dasharray: 8, 4;
                animation: march 1s linear infinite;
              }
            `}</style>
            {/* Colorblind-Safe Diagonal Hatching Pattern for Congested Zones */}
            <pattern id="hatch-congested" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <rect width="10" height="10" fill="var(--fifa-congested)" fillOpacity="0.25" />
              <line x1="0" y1="0" x2="0" y2="10" stroke="var(--fifa-congested)" strokeWidth="2.5" />
            </pattern>
          </defs>
          {/* Turf Green Soccer Pitch Center Field (Precisely Centered) */}
          {/* Outer Boundary */}
          <rect x={185} y={205} width={130} height={90} fill="var(--fifa-clear)" fillOpacity="0.4" stroke="#F4F1EA" strokeWidth="1.5" strokeOpacity="0.25" rx="3" />
          {/* Center Circle & Line */}
          <circle cx={250} cy={250} r={20} fill="none" stroke="#F4F1EA" strokeWidth="1.5" strokeOpacity="0.25" />
          <line x1={250} y1={205} x2={250} y2={295} stroke="#F4F1EA" strokeWidth="1.5" strokeOpacity="0.25" />
          <circle cx={250} cy={250} r={1.5} fill="#F4F1EA" fillOpacity="0.25" />
          
          {/* Left Goal Area & Penalty Box */}
          <rect x={185} y={227.5} width={15} height={45} fill="none" stroke="#F4F1EA" strokeWidth="1.5" strokeOpacity="0.25" />
          <rect x={185} y={240} width={5} height={20} fill="none" stroke="#F4F1EA" strokeWidth="1.5" strokeOpacity="0.25" />
          <path d="M 200,240 A 10,10 0 0,1 200,260" fill="none" stroke="#F4F1EA" strokeWidth="1.5" strokeOpacity="0.25" />
          
          {/* Right Goal Area & Penalty Box */}
          <rect x={300} y={227.5} width={15} height={45} fill="none" stroke="#F4F1EA" strokeWidth="1.5" strokeOpacity="0.25" />
          <rect x={310} y={240} width={5} height={20} fill="none" stroke="#F4F1EA" strokeWidth="1.5" strokeOpacity="0.25" />
          <path d="M 300,240 A 10,10 0 0,0 300,260" fill="none" stroke="#F4F1EA" strokeWidth="1.5" strokeOpacity="0.25" />

          {/* Graph Edges / Concourse walkways */}
          {edges.map((edge, idx) => {
            const fromNode = mappedNodes.find(n => n.id === edge.from);
            const toNode = mappedNodes.find(n => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            if (reuniteResult) {
              const activeMemberRoutes = reuniteResult.members.map((m, mIdx) => ({
                color: memberColors[mIdx % memberColors.length],
                active: isEdgeInMemberPath(edge.from, edge.to, m.route)
              })).filter(r => r.active);

              return (
                <g key={`edge-group-${idx}`}>
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke="#475569"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    className="opacity-15"
                  />
                  {activeMemberRoutes.map((mr, mrIdx) => (
                    <line
                      key={`mr-edge-${mrIdx}`}
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                      stroke={mr.color}
                      strokeWidth={3}
                      strokeLinecap="round"
                      className="marching-ants"
                    />
                  ))}
                </g>
              );
            }

            const activePath = isEdgeInPath(edge.from, edge.to);

            return (
              <g key={`edge-group-${idx}`}>
                {activePath && (
                  // Pulse glowing outline path
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke="var(--fifa-moderate)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className="opacity-40 blur-[2px]"
                  />
                )}
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={activePath ? 'var(--fifa-moderate)' : '#475569'}
                  strokeWidth={activePath ? 3.5 : 1.5}
                  strokeLinecap="round"
                  className={activePath ? 'marching-ants' : 'opacity-25'}
                />
              </g>
            );
          })}

          {/* Graph Nodes */}
          {mappedNodes.map(node => {
            const isStart = node.id === userLocation;
            const isEnd = suggestedPath.length > 0 && node.id === suggestedPath[suggestedPath.length - 1];
            const isMeetupPoint = reuniteResult && node.id === reuniteResult.meetupNode;

            return (
              <g key={`node-${node.id}`} className="transition-transform duration-200">
                {/* Glowing halo for start and end pins */}
                {(isStart || isEnd || isMeetupPoint) && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isMeetupPoint ? 20 : isStart ? 18 : 15}
                    fill="none"
                    stroke={isMeetupPoint ? 'var(--fifa-moderate)' : isStart ? 'var(--fifa-moderate)' : 'var(--fifa-clear)'}
                    strokeWidth={isMeetupPoint ? 3.5 : 2.5}
                    className="animate-ping opacity-75"
                  />
                )}

                {/* Node Shape */}
                {renderNodeShape(node)}

                {/* Colorblind-Safe Congestion Badge */}
                {renderCongestionBadge(node)}

                {/* Node Text Label Background Pill Chip for non-section nodes */}
                {node.type !== 'section' && (() => {
                  const labelText = node.name.split(' (')[0];
                  return (
                    <rect
                      x={getLabelCoords(node).x - (labelText.length * 3.5 + 6)}
                      y={getLabelCoords(node).y - 9}
                      width={labelText.length * 7 + 12}
                      height={14}
                      rx={4}
                      fill="var(--surface-card)"
                      stroke="var(--surface-elevated)"
                      strokeWidth={1}
                      className="opacity-90 shadow-sm"
                    />
                  );
                })()}

                {/* Node Text Label (Shifted radially outward for clear readability) */}
                <text
                  x={getLabelCoords(node).x}
                  y={getLabelCoords(node).y}
                  textAnchor="middle"
                  fill={node.type === 'section' ? '#F4F1EA' : 'var(--text-primary)'}
                  className="select-none pointer-events-none font-sans uppercase font-bold tracking-wider text-map-label"
                  style={node.type === 'section' ? { textShadow: '0 1px 2px rgba(10, 15, 26, 0.95), 0 0 1px rgba(10, 15, 26, 0.95)' } : undefined}
                >
                  {node.type === 'section' ? node.name.replace('Section ', '') : node.name.split(' (')[0]}
                </text>

                {/* Star Pin at group meetup point coordinate */}
                {isMeetupPoint && (
                  <g transform={`translate(${node.x}, ${node.y - 14})`}>
                    <text
                      textAnchor="middle"
                      className="text-xs select-none pointer-events-none filter drop-shadow animate-bounce"
                    >
                      ⭐
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default StadiumMap;
