import React from 'react';
import { StadiumNode, StadiumEdge, CrowdDensity, ReuniteResponse } from '../types';

interface StadiumMapProps {
  nodes: StadiumNode[];
  edges: StadiumEdge[];
  densities: CrowdDensity[];
  suggestedPath: string[];
  userLocation: string;
  onSelectStartLocation: (nodeId: string) => void;
  reuniteResult?: ReuniteResponse | null;
}

export const StadiumMap: React.FC<StadiumMapProps> = ({
  nodes,
  edges,
  densities,
  suggestedPath,
  userLocation,
  onSelectStartLocation,
  reuniteResult = null
}) => {
  // Define ring groupings
  const RING1_NODES = ['sec-100', 'sec-101', 'sec-102', 'sec-103', 'sec-104', 'sec-105'];
  const RING2_NODES = ['food-stall-a', 'restroom-2', 'food-stall-b', 'restroom-3', 'food-stall-c', 'restroom-1'];
  const RING3_NODES = ['exit-east', 'gate-c', 'gate-d', 'exit-west', 'gate-a', 'gate-b'];

  // Programmatically calculate node coordinates for concentric circular rings
  const getCustomNodeCoords = (nodeId: string): { x: number; y: number } => {
    const cx = 250;
    const cy = 250;
    
    const R1 = 100; // Ring 1: Seating sections
    const R2 = 160; // Ring 2: Food stalls & restrooms
    const R3 = 220; // Ring 3: Gates & exits
    
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
    const offset = 24; // Push outward by 24px
    
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
    if (!data) return '#228557'; // default clear turf-green
    if (data.level === 'high') return '#C93B3B'; // congested red
    if (data.level === 'medium') return '#D99B26'; // moderate gold
    return '#228557'; // clear turf-green
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
      ? 'stroke-[#D99B26] stroke-[3] animate-pulse'
      : isEnd
      ? 'stroke-[#228557] stroke-[3] animate-bounce'
      : isPathNode
      ? 'stroke-white stroke-[1.5]'
      : 'stroke-slate-700/60 stroke-[1]';

    const hoverStyle = 'cursor-pointer hover:scale-115 hover:brightness-125 hover:stroke-white hover:stroke-[2] font-semibold outline-none';

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
            stroke={isCongested ? '#C93B3B' : undefined}
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
            stroke={isCongested ? '#C93B3B' : undefined}
            className={`transition-all duration-300 ${ringStyle} ${hoverStyle}`}
            tabIndex={0}
            aria-label={`Exit ${node.name}`}
            onKeyDown={(e) => handleKeyDown(e, node.id)}
            onClick={() => onSelectStartLocation(node.id)}
          />
        );
      case 'restroom':
        return (
          <circle
            cx={node.x}
            cy={node.y}
            r={10}
            fill={nodeFill}
            stroke={isCongested ? '#C93B3B' : undefined}
            className={`transition-all duration-300 ${ringStyle} ${hoverStyle}`}
            tabIndex={0}
            aria-label={`Restroom ${node.name}`}
            onKeyDown={(e) => handleKeyDown(e, node.id)}
            onClick={() => onSelectStartLocation(node.id)}
          />
        );
      case 'food':
        return (
          <circle
            cx={node.x}
            cy={node.y}
            r={11}
            fill={nodeFill}
            stroke={isCongested ? '#C93B3B' : undefined}
            className={`transition-all duration-300 ${ringStyle} ${hoverStyle}`}
            tabIndex={0}
            aria-label={`Food Stall ${node.name}`}
            onKeyDown={(e) => handleKeyDown(e, node.id)}
            onClick={() => onSelectStartLocation(node.id)}
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
            stroke={isCongested ? '#C93B3B' : undefined}
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
    
    let badgeX = node.x + 11;
    let badgeY = node.y - 11;
    if (node.type === 'section') {
      badgeX = node.x + 15;
      badgeY = node.y - 10;
    } else if (node.type === 'gate' || node.type === 'exit') {
      badgeX = node.x + 12;
      badgeY = node.y - 12;
    }
    
    let symbol = '✓';
    let badgeBg = '#228557'; // Turf Green Clear
    if (level === 'medium') {
      symbol = '▲';
      badgeBg = '#D99B26'; // Gold
    } else if (level === 'high') {
      symbol = '⚠';
      badgeBg = '#C93B3B'; // Red
    }
    
    return (
      <g className="select-none pointer-events-none">
        <circle
          cx={badgeX}
          cy={badgeY}
          r={6.5}
          fill={badgeBg}
          stroke="#121826"
          strokeWidth={1}
        />
        <text
          x={badgeX}
          y={badgeY + 2}
          textAnchor="middle"
          fill="#E8E6E0"
          className="font-sans font-bold text-[6.5px]"
        >
          {symbol}
        </text>
      </g>
    );
  };

  return (
    <div className="relative w-full bg-fifa-navy border border-slate-800/80 rounded-xl p-4 shadow-inner flex flex-col items-center">
      {/* SVG Path Animations */}
      <svg className="hidden">
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
            <rect width="10" height="10" fill="#C93B3B" fillOpacity="0.25" />
            <line x1="0" y1="0" x2="0" y2="10" stroke="#C93B3B" strokeWidth="2.5" />
          </pattern>
        </defs>
      </svg>

      <div className="w-full flex justify-between items-center text-[10px] sm:text-xs text-slate-400 mb-3 px-1 select-none">
        <span className="flex items-center gap-2 font-display text-[9px] tracking-wider uppercase text-slate-400">
          <span className="flex items-center gap-1">
            <span className="flex items-center justify-center w-3.5 h-3.5 bg-fifa-clear text-[7.5px] text-white font-bold rounded-sm">✓</span> Clear
          </span>
          <span className="flex items-center gap-1 ml-1.5">
            <span className="flex items-center justify-center w-3.5 h-3.5 bg-fifa-moderate text-[7.5px] text-white font-bold rounded-sm">▲</span> Moderate
          </span>
          <span className="flex items-center gap-1 ml-1.5">
            <span className="flex items-center justify-center w-3.5 h-3.5 bg-fifa-congested text-[7.5px] text-white font-bold rounded-sm">⚠</span> Congested
          </span>
        </span>
        <span className="text-fifa-gold font-display text-[9px] uppercase tracking-wider font-semibold">Click node to change Start Position</span>
      </div>

      <div className="w-full overflow-auto flex justify-center bg-fifa-dark/30 rounded-lg p-2 border border-slate-900/60">
        <svg viewBox="0 0 500 500" className="w-full max-w-[450px] aspect-square">
          {/* Turf Green Soccer Pitch Center Field (Precisely Centered) */}
          {/* Outer Boundary */}
          <rect x={185} y={205} width={130} height={90} fill="#228557" fillOpacity="0.4" stroke="#F4F1EA" strokeWidth="1.5" strokeOpacity="0.25" rx="3" />
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
                    stroke="#D99B26"
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
                  stroke={activePath ? '#D99B26' : '#475569'}
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
                    stroke={isMeetupPoint ? '#D99B26' : isStart ? '#D99B26' : '#228557'}
                    strokeWidth={isMeetupPoint ? 3.5 : 2.5}
                    className="animate-ping opacity-75"
                  />
                )}

                {/* Node Shape */}
                {renderNodeShape(node)}

                {/* Colorblind-Safe Congestion Badge */}
                {renderCongestionBadge(node)}

                {/* Node Text Label (Shifted radially outward for clear readability) */}
                <text
                  x={getLabelCoords(node).x}
                  y={getLabelCoords(node).y}
                  textAnchor="middle"
                  fill={node.type === 'section' ? '#F4F1EA' : '#8B93A7'}
                  className={`select-none pointer-events-none font-display uppercase font-bold tracking-wider ${
                    node.type === 'section' ? 'text-[9px]' : 'text-[7.5px]'
                  }`}
                  style={{ textShadow: '0 1px 2px rgba(10, 15, 26, 0.95), 0 0 1px rgba(10, 15, 26, 0.95)' }}
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
