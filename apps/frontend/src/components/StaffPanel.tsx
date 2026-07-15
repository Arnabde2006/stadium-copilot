import React, { useState, useEffect, useRef } from 'react';
import { useStaffReports } from '../hooks/useStaffReports';
import { useStaffAuth } from '../hooks/useStaffAuth';
import {
  Shield,
  Heart,
  Users,
  Wrench,
  AlertCircle,
  MapPin,
  Mic,
  Send
} from 'lucide-react';

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
  const { token, isAuthenticated, login, logout } = useStaffAuth();
  const { incidents, isLoading, error, reportIncident } = useStaffReports(token);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [relativeTimes, setRelativeTimes] = useState<Record<string, string>>({});

  // Passcode entry form state
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim() || isAuthenticating) return;
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      await login(passcode);
    } catch (err: any) {
      setAuthError(err.message || 'Incorrect passcode');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'medical':
        return <Heart className="h-5 w-5 text-red-400" />;
      case 'security':
        return <Shield className="h-5 w-5 text-amber-400" />;
      case 'crowding':
        return <Users className="h-5 w-5 text-fifa-gold" />;
      case 'facility':
        return <Wrench className="h-5 w-5 text-teal-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-slate-400" />;
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

  // Filter incidents for high urgency and logged in last 15 minutes
  const activeStaffAlerts = incidents.filter(inc => {
    if (inc.urgency !== 'high') return false;
    const elapsedMinutes = (Date.now() - new Date(inc.timestamp).getTime()) / 60000;
    return elapsedMinutes <= 15;
  });

  if (!isAuthenticated) {
    const demoHint = import.meta.env.VITE_STAFF_DEMO_CODE_HINT;
    return (
      <div className="flex flex-col h-full bg-fifa-dark/10 rounded-xl border border-slate-700/45 overflow-hidden shadow-md">
        {/* Panel Header */}
        <div className="bg-slate-800/40 px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-fifa-gold" />
            <span className="font-bold text-xs uppercase tracking-widest text-slate-200">Operations Command</span>
          </div>
          <span className="bg-amber-500/10 text-amber-400 text-xs font-bold px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest">
            Restricted
          </span>
        </div>

        {/* Passcode Form */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-fifa-navy/10 relative">
          <div className="w-full max-w-sm bg-fifa-card/65 backdrop-blur-md border border-slate-800/70 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-fifa-gold/10 text-fifa-gold rounded-full border border-fifa-gold/20">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 tracking-wide">Staff Authentication</h3>
              <p className="text-xs text-slate-400 max-w-[280px] mx-auto">
                Access is restricted to authorized venue staff. Please enter the operations passcode.
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Passcode</label>
                <input
                  type="password"
                  value={passcode}
                  onChange={e => setPasscode(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-fifa-dark border border-slate-800/80 rounded-xl px-4 py-2.5 text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-fifa-accent"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="bg-red-950/30 border border-red-500/20 text-red-200 text-xs px-3 py-2.5 rounded-lg flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!passcode.trim() || isAuthenticating}
                className="w-full py-2.5 rounded-xl bg-fifa-blue hover:bg-fifa-accent text-white font-bold transition-all disabled:opacity-40 shadow-sm flex items-center justify-center gap-2"
              >
                {isAuthenticating ? (
                  <span className="block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Verify Passcode</span>
                )}
              </button>
            </form>

            {demoHint && (
              <div className="text-xs text-slate-500 bg-slate-800/20 border border-slate-800/40 p-2.5 rounded-xl text-center">
                For demo purposes: <code className="text-fifa-gold font-bold bg-black/10 px-1 py-0.5 rounded">{demoHint}</code>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-fifa-dark/10 rounded-xl border border-slate-700/45 overflow-hidden shadow-md">
      {/* Panel Header */}
      <div className="bg-slate-800/40 px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-fifa-gold" />
          <span className="font-bold text-xs uppercase tracking-widest text-slate-200">Operations Command</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-amber-500/10 text-amber-400 text-xs font-bold px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest">
            Internal Tool
          </span>
          <button
            onClick={logout}
            className="text-xs font-bold text-slate-400 hover:text-red-400 transition-colors uppercase tracking-wider"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-4 border-b border-slate-800/80 bg-fifa-navy/20 space-y-3">
        <h3 className="text-xs font-bold text-fifa-gold uppercase tracking-widest">Log Real-time Incident</h3>
        
        {error && (
          <div className="bg-red-950/30 border border-red-500/20 text-red-200 text-xs px-3 py-2 rounded">
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
            <Mic className="h-4.5 w-4.5" />
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder={isListening ? 'Listening to speech...' : 'E.g., Spill near Section 104 restroom...'}
            disabled={isListening || isLoading}
            className="flex-1 bg-fifa-card border border-slate-800/80 rounded-xl px-4 py-2.5 text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-fifa-accent disabled:opacity-50 font-normal"
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="p-2.5 rounded-xl bg-fifa-blue hover:bg-fifa-accent text-white flex-shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            {isLoading ? (
              <span className="block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4.5 w-4.5" />
            )}
          </button>
        </div>
      </form>

      {/* Incident list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Active Emergency Alerts Section */}
        {activeStaffAlerts.length > 0 && (
          <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl space-y-2 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">Active Emergency Alerts ({activeStaffAlerts.length})</h4>
            </div>
            <div className="space-y-2">
              {activeStaffAlerts.map(alert => (
                <div key={alert.id} className="bg-red-950/30 p-2.5 rounded-lg border border-red-900/20 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-300 uppercase tracking-wide flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                      {alert.category.toUpperCase()} :: {alert.location}
                    </span>
                    <span className="text-xs text-red-400">{relativeTimes[alert.id] || 'just now'}</span>
                  </div>
                  <p className="text-sm text-red-200 leading-relaxed font-normal bg-red-950/20 p-2 rounded border border-red-900/10">
                    {alert.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-1 select-none">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Incident Feed</h3>
          <span className="text-xs text-slate-500 font-medium">Total: {incidents.length}</span>
        </div>

        {incidents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 select-none opacity-50">
            <span className="text-2xl">📋</span>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">No Incidents Logged</p>
            <p className="text-xs text-slate-500 max-w-[200px]">Use the input above to report crowds, medical alerts, or facility concerns.</p>
          </div>
        ) : (
          incidents.map(inc => (
            <div 
              key={inc.id} 
              className="bg-fifa-card border border-slate-800/80 rounded-xl p-4 hover:bg-slate-800/25 hover:border-slate-800 transition-all shadow-sm flex flex-col gap-2.5"
            >
              {/* Category, Urgency, Timestamp Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(inc.category)}
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
                    {inc.category}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded tracking-widest ${getUrgencyBadgeClasses(inc.urgency)}`}>
                    {inc.urgency}
                  </span>
                  <span className="text-xs text-slate-500">
                    {relativeTimes[inc.id] || 'just now'}
                  </span>
                </div>
              </div>

              {/* Location Badge */}
              <div className="flex items-center gap-1.5 text-xs text-fifa-gold font-medium">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{inc.location}</span>
              </div>

              {/* Summary */}
              <p className="text-base text-[#E8E6E0] leading-relaxed font-normal bg-fifa-dark/30 p-2.5 rounded border border-slate-850/50">
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
