import React, { useState, useEffect, useRef } from 'react';
import { useStaffReports } from '../hooks/useStaffReports';
import { 
  ShieldExclamationIcon, 
  HeartIcon, 
  UsersIcon, 
  WrenchScrewdriverIcon, 
  ExclamationCircleIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { MicrophoneIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';

function formatRelativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return '1 hour ago';
  if (hours < 24) return `${hours} hours ago`;
  return new Date(dateString).toLocaleDateString();
}

export const StaffPanel: React.FC = () => {
  const { incidents, isLoading, error, reportIncident } = useStaffReports();
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [relativeTimes, setRelativeTimes] = useState<Record<string, string>>({});

  // Web Speech API Integration
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(prev => `${prev} ${transcript}`.trim());
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [SpeechRecognition]);

  // Keep relative times updated
  useEffect(() => {
    const updateTimes = () => {
      const times: Record<string, string> = {};
      incidents.forEach(inc => {
        times[inc.id] = formatRelativeTime(inc.timestamp);
      });
      setRelativeTimes(times);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 15000); // update every 15s
    return () => clearInterval(interval);
  }, [incidents]);

  const toggleListening = (): void => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not fully supported in this browser. Please type your report.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    try {
      await reportIncident(inputValue);
      setInputValue('');
    } catch (err) {
      // hook logs error
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'medical':
        return <HeartIcon className="h-5 w-5 text-red-400" />;
      case 'security':
        return <ShieldExclamationIcon className="h-5 w-5 text-amber-400" />;
      case 'crowding':
        return <UsersIcon className="h-5 w-5 text-blue-400" />;
      case 'facility':
        return <WrenchScrewdriverIcon className="h-5 w-5 text-teal-400" />;
      default:
        return <ExclamationCircleIcon className="h-5 w-5 text-slate-400" />;
    }
  };

  const getUrgencyBadgeClasses = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-fifa-congested/20 text-fifa-congested border border-fifa-congested/30';
      case 'medium':
        return 'bg-fifa-moderate/20 text-fifa-moderate border border-fifa-moderate/30';
      default:
        return 'bg-fifa-clear/20 text-fifa-clear border border-fifa-clear/30';
    }
  };

  return (
    <div className="flex flex-col h-full bg-fifa-dark/10 rounded-xl border border-slate-700/45 overflow-hidden shadow-md">
      {/* Panel Header */}
      <div className="bg-slate-800/40 px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldExclamationIcon className="h-5 w-5 text-fifa-gold" />
          <span className="font-display font-bold text-xs uppercase tracking-widest text-slate-200">Operations Command</span>
        </div>
        <span className="font-display bg-amber-500/10 text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest">
          Internal Tool
        </span>
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-4 border-b border-slate-800/80 bg-fifa-navy/20 space-y-3">
        <h3 className="font-display text-xs font-bold text-fifa-gold uppercase tracking-widest">Log Real-time Incident</h3>
        
        {error && (
          <div className="bg-red-950/30 border border-red-500/20 text-red-200 text-[11px] px-3 py-2 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 rounded-xl border flex-shrink-0 transition-all duration-300 ${
              isListening
                ? 'bg-red-600 border-red-500 text-white animate-pulse'
                : 'bg-slate-800 border-slate-700/80 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
            title={isListening ? 'Stop Speech Listening' : 'Use Microphone Speech Input'}
          >
            <MicrophoneIcon className="h-4.5 w-4.5" />
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder={isListening ? 'Listening to speech...' : 'E.g., Spill near Section 104 restroom...'}
            disabled={isListening || isLoading}
            className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-fifa-accent focus:ring-1 focus:ring-fifa-accent/30 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="p-2.5 rounded-xl bg-fifa-blue hover:bg-fifa-accent text-white flex-shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            {isLoading ? (
              <span className="block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <PaperAirplaneIcon className="h-4.5 w-4.5" />
            )}
          </button>
        </div>
      </form>

      {/* Incident list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display text-xs font-bold text-slate-400 uppercase tracking-widest">Live Incident Feed</h3>
          <span className="text-[10px] text-slate-500 font-medium">Total: {incidents.length}</span>
        </div>

        {incidents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 select-none opacity-50">
            <span className="text-2xl">📋</span>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">No Incidents Logged</p>
            <p className="text-[10px] text-slate-500 max-w-[200px]">Use the input above to report crowds, medical alerts, or facility concerns.</p>
          </div>
        ) : (
          incidents.map(inc => (
            <div 
              key={inc.id} 
              className="bg-slate-800/35 border border-slate-700/30 rounded-xl p-3.5 hover:bg-slate-800/50 hover:border-slate-700/60 transition-all shadow-sm flex flex-col gap-2.5"
            >
              {/* Category, Urgency, Timestamp Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(inc.category)}
                  <span className="font-display text-[10px] font-bold uppercase tracking-widest text-slate-300">
                    {inc.category}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`font-display text-[9px] font-extrabold uppercase px-2 py-0.5 rounded tracking-widest ${getUrgencyBadgeClasses(inc.urgency)}`}>
                    {inc.urgency}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {relativeTimes[inc.id] || 'just now'}
                  </span>
                </div>
              </div>

              {/* Location Badge */}
              <div className="flex items-center gap-1.5 text-xs text-fifa-gold font-medium">
                <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{inc.location}</span>
              </div>

              {/* Summary */}
              <p className="text-xs text-slate-200 leading-relaxed font-normal">
                {inc.summary}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StaffPanel;
