import React from 'react';

interface LanguageBadgeProps {
  code: string;
}

export const LanguageBadge: React.FC<LanguageBadgeProps> = ({ code }) => {
  const codeLower = code.toLowerCase();
  
  const mapping: { [key: string]: { label: string; flag: string } } = {
    en: { label: 'English', flag: '🇬🇧' },
    es: { label: 'Español', flag: '🇪🇸' },
    fr: { label: 'Français', flag: '🇫🇷' },
    de: { label: 'Deutsch', flag: '🇩🇪' },
    pt: { label: 'Português', flag: '🇵🇹' }
  };

  const resolved = mapping[codeLower] || { label: `Lang: ${code.toUpperCase()}`, flag: '🌐' };

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-fifa-navy text-fifa-gold border border-fifa-gold/20 shadow-sm" title="AI Language Detection">
      <span>{resolved.flag}</span>
      <span className="opacity-90">{resolved.label}</span>
    </span>
  );
};

export default LanguageBadge;
