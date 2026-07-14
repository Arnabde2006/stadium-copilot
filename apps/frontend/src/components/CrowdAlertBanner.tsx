import React from 'react';
import { CrowdDensity, StadiumNode } from '../types';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

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
    <div className="bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white px-4 py-2.5 flex items-center shadow-md border-b border-red-500/30" role="alert">
      <ExclamationTriangleIcon className="h-5 w-5 mr-3 flex-shrink-0 text-yellow-300 animate-bounce" />
      <div className="text-xs sm:text-sm font-medium tracking-wide truncate">
        <span className="font-bold uppercase tracking-wider bg-red-800 text-[10px] px-1.5 py-0.5 rounded mr-2">Live Alert</span>
        Heavily congested: <span className="font-semibold text-yellow-200">{names}</span>. Avoiding these zones in route calculations.
      </div>
    </div>
  );
};

export default CrowdAlertBanner;
