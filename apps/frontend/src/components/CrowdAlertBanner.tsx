import React from 'react';
import { CrowdDensity, StadiumNode } from '../types';

interface CrowdAlertBannerProps {
  densities: CrowdDensity[];
  nodes: StadiumNode[];
}

export const CrowdAlertBanner: React.FC<CrowdAlertBannerProps> = ({ densities, nodes }) => {
  const highZones = densities.filter(d => d.level === 'high');

  if (highZones.length === 0) {
    return null;
  }

  const names = highZones
    .map(hz => {
      const node = nodes.find(n => n.id === hz.nodeId);
      return node ? node.name : hz.nodeId;
    })
    .join(', ');

  return (
    <div className="bg-[#05070B] border-b border-fifa-gold/15 py-2 px-4 flex items-center justify-between shadow-inner font-mono-led" role="alert">
      <div className="flex items-center flex-shrink-0 mr-4">
        <span className="relative flex h-2.5 w-2.5 mr-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fifa-gold opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-fifa-gold"></span>
        </span>
        <span className="text-[10px] font-bold text-fifa-gold tracking-widest uppercase select-none">LIVE</span>
      </div>
      <div className="flex-1 min-w-0 overflow-hidden relative select-none">
        <div className="inline-block text-xs sm:text-sm text-fifa-gold tracking-widest whitespace-nowrap animate-marquee font-bold">
          HIGH SEVERITY ALERT :: HEAVILY CONGESTED AREAS: {names.toUpperCase()} :: REROUTING TRAFFIC TO AVOID THESE SECTORS :: PLEASE FOLLOW SIGNS
        </div>
      </div>
    </div>
  );
};

export default CrowdAlertBanner;
