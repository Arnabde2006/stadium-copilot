import React from 'react';
import { StadiumNode, StadiumEdge, ReuniteResponse } from '../types';

interface RouteSummaryProps {
  suggestedPath: string[];
  congestionAlert?: string;
  nodes: StadiumNode[];
  edges: StadiumEdge[];
  reuniteResult?: ReuniteResponse | null;
}

export const RouteSummary: React.FC<RouteSummaryProps> = ({
  suggestedPath,
  congestionAlert,
  nodes,
  edges,
  reuniteResult = null
}) => {
  const hasChatPath = suggestedPath && suggestedPath.length >= 2;
  const hasReunitePath = reuniteResult && reuniteResult.meetupNode;

  if (!hasChatPath && !hasReunitePath) {
    return null;
  }

  const getNodeName = (nodeId: string): string => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? node.name : nodeId;
  };

  let destination = '';
  let durationText = '';
  const alertText = congestionAlert || '';

  if (hasReunitePath && reuniteResult) {
    destination = getNodeName(reuniteResult.meetupNode);
    const maxEta = Math.max(...reuniteResult.members.map(m => m.etaSeconds), 0);
    const mins = Math.ceil(maxEta / 60);
    durationText = `${mins} min${mins > 1 ? 's' : ''} (Max Group ETA)`;
  } else if (hasChatPath) {
    const destNodeId = suggestedPath[suggestedPath.length - 1];
    destination = getNodeName(destNodeId);
    
    // Sum base weights of the edges in the path
    let totalSeconds = 0;
    for (let i = 0; i < suggestedPath.length - 1; i++) {
      const from = suggestedPath[i];
      const to = suggestedPath[i + 1];
      const edge = edges.find(
        e => (e.from === from && e.to === to) || (e.from === to && e.to === from)
      );
      if (edge) {
        totalSeconds += edge.baseWeight;
      }
    }
    const mins = Math.ceil(totalSeconds / 60);
    durationText = `${mins} min${mins > 1 ? 's' : ''} walk`;
  }

  return (
    <div className="mb-3 bg-fifa-navy border-l-4 border-l-fifa-gold border border-slate-800 rounded-r-lg p-3 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 select-none">
      <div className="flex flex-col">
        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Route Destination</span>
        <span className="text-sm font-bold text-slate-100 uppercase tracking-wider">
          {destination}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Est. Walking Time</span>
        <span className="text-xs font-bold text-fifa-gold">
          {durationText}
        </span>
      </div>
      {alertText && (
        <div className="flex-1 sm:max-w-xs md:max-w-md flex flex-col bg-fifa-dark/50 border border-fifa-gold/10 px-2.5 py-1.5 rounded">
          <span className="text-xs text-fifa-gold font-bold uppercase tracking-widest">Route Advisory</span>
          <span className="text-xs text-slate-300 leading-normal" title={alertText}>
            {alertText}
          </span>
        </div>
      )}
    </div>
  );
};

export default RouteSummary;
