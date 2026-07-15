import React from 'react';

interface AccessibilityToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const AccessibilityToggle: React.FC<AccessibilityToggleProps> = ({ enabled, onToggle }) => {
  return (
    <div className="flex items-center gap-3 bg-slate-800/40 border border-slate-700/60 rounded-lg px-3 py-1.5 hover:bg-slate-800/60 transition-all select-none">
      <div className="flex flex-col">
        <span className="text-xs font-bold text-slate-200 tracking-wide uppercase flex items-center gap-1">
          <span>♿</span> Step-free &amp; <span>🎧</span> Low-stim
        </span>
        <span className="text-xs text-slate-400 leading-tight">Avoids stairs &amp; noise</span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onToggle(!enabled)}
        className={`relative inline-flex h-4.5 w-8 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          enabled ? 'bg-fifa-clear' : 'bg-slate-600'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
            enabled ? 'translate-x-3.5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export default AccessibilityToggle;
