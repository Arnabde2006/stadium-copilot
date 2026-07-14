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

  const memberColors = ['#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899']; // Amber, Blue, Purple, Pink

  // Get color color coding based on density
  const getDensityColor = (nodeId: string) => {
    const data = densities.find(d => d.nodeId === nodeId);
    if (!data) return '#10B981'; // default clear green
    if (data.level === 'high') return '#EF4444'; // congested red
    if (data.level === 'medium') return '#F59E0B'; // moderate amber
    return '#10B981'; // clear green
  };

  // Node symbols or styles depending on node type
  const renderNodeShape = (node: StadiumNode) => {
    const color = getDensityColor(node.id);
    const isStart = node.id === userLocation;
    const isEnd = suggestedPath.length > 0 && node.id === suggestedPath[suggestedPath.length - 1];
    const isPathNode = isNodeInPath(node.id);

    // Dynamic ring stroke styling for active route
    const ringStyle = isStart
      ? 'stroke-fifa-yellow stroke-[3] animate-pulse'
      : isEnd
      ? 'stroke-blue-400 stroke-[3] animate-bounce'
      : isPathNode
      ? 'stroke-white stroke-[1.5]'
      : 'stroke-slate-600 stroke-[1]';

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
    <div className="relative w-full bg-fifa-navy border border-slate-700/50 rounded-xl p-4 shadow-inner flex flex-col items-center">
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
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 bg-fifa-clear rounded-sm"></span> Low
          <span className="inline-block w-2.5 h-2.5 bg-fifa-moderate rounded-sm ml-1"></span> Med
          <span className="inline-block w-2.5 h-2.5 bg-fifa-congested rounded-sm ml-1"></span> High
        </span>
        <span className="text-fifa-gold font-medium">Click node to change Start Position</span>
      </div>

      <div className="w-full overflow-auto flex justify-center bg-fifa-dark/30 rounded-lg p-2 border border-slate-800">
        <svg viewBox="0 0 500 500" className="w-full max-w-[450px] aspect-square">
          {/* Ambient Pitch Field Outline in Center */}
          <rect x={180} y={200} width={140} height={100} fill="none" stroke="#ffffff10" strokeWidth="2" rx="4" />
          <circle cx={250} cy={250} r={25} fill="none" stroke="#ffffff10" strokeWidth="2" />
          <line x1={250} y1={200} x2={250} y2={300} stroke="#ffffff10" strokeWidth="2" />

          {/* Graph Edges */}
          {edges.map((edge, idx) => {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);
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
                    className="opacity-20"
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
                    stroke="#FFD700"
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
                  stroke={activePath ? '#FFD700' : '#475569'}
                  strokeWidth={activePath ? 3.5 : 1.5}
                  strokeLinecap="round"
                  className={activePath ? 'marching-ants' : 'opacity-40'}
                />
              </g>
            );
          })}

          {/* Graph Nodes */}
          {nodes.map(node => {
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
                    stroke={isMeetupPoint ? '#FFD700' : isStart ? '#FFD700' : '#3B82F6'}
                    strokeWidth={isMeetupPoint ? 3.5 : 2.5}
                    className="animate-ping opacity-75"
                  />
                )}

                {/* Node Shape */}
                {renderNodeShape(node)}

                {/* Node Text Label */}
                <text
                  x={node.x}
                  y={node.type === 'section' ? node.y + 4 : node.y + 20}
                  textAnchor="middle"
                  fill={node.type === 'section' ? '#ffffff' : '#94A3B8'}
                  className={`select-none pointer-events-none font-bold ${
                    node.type === 'section' ? 'text-[9px]' : 'text-[8px]'
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
