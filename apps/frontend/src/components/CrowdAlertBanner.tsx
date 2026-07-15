import React from 'react';
import { CrowdDensity, StadiumNode, IncidentReport } from '../types';

interface CrowdAlertBannerProps {
  densities: CrowdDensity[];
  nodes: StadiumNode[];
  activeAlerts?: IncidentReport[];
}

export const CrowdAlertBanner: React.FC<CrowdAlertBannerProps> = ({
  densities,
  nodes,
  activeAlerts = [],
}) => {
  const highZones = densities.filter(d => d.level === 'high');
  const staffAlerts = activeAlerts;

  const segments: string[] = [];

  // 1. Add staff alerts
  if (staffAlerts.length > 0) {
    staffAlerts.forEach(alert => {
      segments.push(`OPS ALERT: ${alert.summary.toUpperCase()} (LOCATION: ${alert.location.toUpperCase()})`);
    });
  }

  // 2. Add congestion alerts
  if (highZones.length > 0) {
    const names = highZones
      .map(hz => {
        const node = nodes.find(n => n.id === hz.nodeId);
        return node ? node.name : hz.nodeId;
      })
      .join(', ');
    segments.push(`HIGH CONGESTION DETECTED: HEAVILY CONGESTED AREAS: ${names.toUpperCase()} :: REROUTING TRAFFIC TO AVOID THESE SECTORS`);
  }

  const hasAlerts = segments.length > 0;
  
  // Decide theme colors based on state
  const isEmergency = staffAlerts.length > 0;
  const dotColorClass = isEmergency ? 'bg-red-500' : hasAlerts ? 'bg-fifa-gold' : 'bg-fifa-clear';
  const pingColorClass = isEmergency ? 'bg-red-500' : hasAlerts ? 'bg-fifa-gold' : 'bg-fifa-clear';
  const labelTextColorClass = isEmergency ? 'text-red-500' : hasAlerts ? 'text-fifa-gold' : 'text-fifa-clear';
  const borderThemeClass = isEmergency ? 'border-red-500/25' : hasAlerts ? 'border-fifa-gold/15' : 'border-fifa-clear/15';
  const marqueeTextColorClass = isEmergency ? 'text-red-400' : hasAlerts ? 'text-fifa-gold' : 'text-slate-300';
  
  const statusLabel = isEmergency ? 'EMERGENCY' : hasAlerts ? 'CONGESTION' : 'STATUS';

  const tickerText = hasAlerts
    ? segments.join(' :: ')
    : 'ALL SYSTEMS OPERATIONAL · WELCOME TO STADIUM COPILOT · ENJOY THE MATCH · SEAMLESS ROUTING ACTIVE';

  return (
    <div className={`bg-[#05070B] border-b ${borderThemeClass} py-2 px-4 flex items-center justify-between shadow-inner font-mono-led transition-colors duration-300`} role="alert">
      <div className="flex items-center flex-shrink-0 mr-4">
        <span className="relative flex h-2.5 w-2.5 mr-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pingColorClass} opacity-75`}></span>
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotColorClass}`}></span>
        </span>
        <span className={`text-xs font-extrabold ${labelTextColorClass} tracking-widest uppercase select-none`}>
          {statusLabel}
        </span>
      </div>
      <div className="flex-1 min-w-0 overflow-hidden relative select-none">
        <div className={`inline-block text-sm ${marqueeTextColorClass} tracking-widest whitespace-nowrap animate-marquee font-bold`}>
          {tickerText}
        </div>
      </div>
    </div>
  );
};

export default CrowdAlertBanner;

