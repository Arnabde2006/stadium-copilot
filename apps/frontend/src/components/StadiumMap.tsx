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
  // Map node coordinates to a concentric radial stadium layout
  const getCustomNodeCoords = (nodeId: string): { x: number; y: number } => {
    const cx = 250;
    const cy = 250;
    
    switch (nodeId) {
      // Ring 1 (Sections, Radius 105)
      case 'sec-100': return { x: cx, y: cy - 105 }; // -90 deg
      case 'sec-101': return { x: cx + 91, y: cy - 53 }; // -30 deg
      case 'sec-102': return { x: cx + 91, y: cy + 53 }; // 30 deg
      case 'sec-103': return { x: cx, y: cy + 105 }; // 90 deg
      case 'sec-104': return { x: cx - 91, y: cy + 53 }; // 150 deg
      case 'sec-105': return { x: cx - 91, y: cy - 53 }; // 210 deg

      // Ring 2 (Food/Restrooms, Radius 165)
      case 'food-stall-a': return { x: cx, y: cy - 165 }; // -90 deg
      case 'restroom-2':   return { x: cx + 143, y: cy - 83 }; // -30 deg
      case 'food-stall-b': return { x: cx + 143, y: cy + 83 }; // 30 deg
      case 'restroom-3':   return { x: cx, y: cy + 165 }; // 90 deg
      case 'food-stall-c': return { x: cx - 143, y: cy + 83 }; // 150 deg
      case 'restroom-1':   return { x: cx - 143, y: cy - 83 }; // 210 deg

      // Ring 3 (Gates/Exits, Radius 225)
      case 'exit-east': return { x: cx + 225, y: cy }; // 0 deg
      case 'gate-c':    return { x: cx + 113, y: cy + 195 }; // 60 deg
      case 'gate-d':    return { x: cx - 113, y: cy + 195 }; // 120 deg
      case 'exit-west': return { x: cx - 225, y: cy }; // 180 deg
      case 'gate-a':    return { x: cx - 113, y: cy - 195 }; // 240 deg
      case 'gate-b':    return { x: cx + 113, y: cy - 195 }; // 300 deg

      default:
        return { x: cx, y: cy };
    }
  };

  const mappedNodes = nodes.map(n => ({
    ...n,
    ...getCustomNodeCoords(n.id)
  }));

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

  const memberColors = ['#F2B441', '#3B82F6', '#8B5CF6', '#EC4899']; // Gold, Blue, Purple, Pink

  // Get color coding based on density
  const getDensityColor = (nodeId: string) => {
    const data = densities.find(d => d.nodeId === nodeId);
    if (!data) return '#1B6E4A'; // default clear turf-green
    if (data.level === 'high') return '#E23B3B'; // congested red
    if (data.level === 'medium') return '#F2B441'; // moderate gold
    return '#1B6E4A'; // clear turf-green
  };

  // Node symbols or styles depending on node type
  const renderNodeShape = (node: StadiumNode) => {
    const color = getDensityColor(node.id);
    const isStart = node.id === userLocation;
    const isEnd = suggestedPath.length > 0 && node.id === suggestedPath[suggestedPath.length - 1];
    const isPathNode = isNodeInPath(node.id);

    // Dynamic ring stroke styling for active route
    const ringStyle = isStart
      ? 'stroke-[#F2B441] stroke-[3] animate-pulse'
      : isEnd
      ? 'stroke-blue-400 stroke-[3] animate-bounce'
      : isPathNode
      ? 'stroke-white stroke-[1.5]'
      : 'stroke-slate-700/60 stroke-[1]';

    switch (node.type) {
      case 'gate':
        return (
          <rect
            x={node.x - 12}
            y={node.y - 12}
            width={24}
            height={24}
            rx={4}
            fill={color}
            className={`cursor-pointer transition-all duration-300 ${ringStyle} hover:scale-125`}
            onClick={() => onSelectStartLocation(node.id)}
          />
        );
      case 'exit':
        return (
          <polygon
            points={`${node.x},${node.y - 14} ${node.x + 14},${node.y} ${node.x},${node.y + 14} ${node.x - 14},${node.y}`}
            fill={color}
            className={`cursor-pointer transition-all duration-300 ${ringStyle} hover:scale-125`}
            onClick={() => onSelectStartLocation(node.id)}
          />
        );
      case 'restroom':
        return (
          <circle
            cx={node.x}
            cy={node.y}
            r={10}
            fill={color}
            className={`cursor-pointer transition-all duration-300 ${ringStyle} hover:scale-125`}
            onClick={() => onSelectStartLocation(node.id)}
          />
        );
      case 'food':
        return (
          <circle
            cx={node.x}
            cy={node.y}
            r={11}
            fill={color}
            className={`cursor-pointer transition-all duration-300 ${ringStyle} hover:scale-125`}
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
            fill={color}
            className={`cursor-pointer transition-all duration-300 ${ringStyle} hover:scale-125`}
            onClick={() => onSelectStartLocation(node.id)}
          />
        );
    }
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
        </defs>
      </svg>

      <div className="w-full flex justify-between items-center text-[10px] sm:text-xs text-slate-400 mb-3 px-1">
        <span className="flex items-center gap-1.5 font-display text-[9px] tracking-wider uppercase text-slate-400">
          <span className="inline-block w-2.5 h-2.5 bg-fifa-clear rounded-sm"></span> Clear
          <span className="inline-block w-2.5 h-2.5 bg-fifa-moderate rounded-sm ml-1"></span> Moderate
          <span className="inline-block w-2.5 h-2.5 bg-fifa-congested rounded-sm ml-1"></span> Congested
        </span>
        <span className="text-fifa-gold font-display text-[9px] uppercase tracking-wider font-semibold">Click node to change Start Position</span>
      </div>

      <div className="w-full overflow-auto flex justify-center bg-fifa-dark/30 rounded-lg p-2 border border-slate-900/60">
        <svg viewBox="0 0 500 500" className="w-full max-w-[450px] aspect-square">
          {/* Turf Green Soccer Pitch Center Field */}
          {/* Outer Boundary */}
          <rect x={185} y={205} width={130} height={90} fill="#1B6E4A" fillOpacity="0.4" stroke="#F4F1EA" strokeWidth="1.5" strokeOpacity="0.25" rx="3" />
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
                    stroke="#F2B441"
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
                  stroke={activePath ? '#F2B441' : '#475569'}
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
                    stroke={isMeetupPoint ? '#F2B441' : isStart ? '#F2B441' : '#3B82F6'}
                    strokeWidth={isMeetupPoint ? 3.5 : 2.5}
                    className="animate-ping opacity-75"
                  />
                )}

                {/* Node Shape */}
                {renderNodeShape(node)}

                {/* Node Text Label */}
                <text
                  x={node.x}
                  y={node.type === 'section' ? node.y + 4 : node.y + 18}
                  textAnchor="middle"
                  fill={node.type === 'section' ? '#F4F1EA' : '#8B93A7'}
                  className={`select-none pointer-events-none font-display uppercase font-bold tracking-wider ${
                    node.type === 'section' ? 'text-[9px]' : 'text-[7.5px]'
                  }`}
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
