import React from 'react';

export const EMERGENCY_INFO = {
  primary: '911',
  secondary: 'Stadium Security: Ext. 4357',
};

export const EmergencyFooter: React.FC = () => {
  return (
    <footer className="w-full py-2.5 px-4 bg-fifa-navy border-t border-slate-800/80 text-center flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-6 text-xs text-slate-400 select-none z-10 flex-shrink-0">
      <div className="flex items-center gap-1.5 font-medium">
        <span className="text-red-500">🚨</span>
        <span>For emergencies: <strong className="text-red-500 font-extrabold">{EMERGENCY_INFO.primary}</strong></span>
      </div>
      <span className="hidden sm:inline text-slate-650">|</span>
      <div className="flex items-center gap-1.5 font-medium">
        <span>Stadium Security & Assistance Hotline: <strong className="text-slate-200 font-extrabold">{EMERGENCY_INFO.secondary}</strong></span>
      </div>
    </footer>
  );
};

export default EmergencyFooter;
