import React, { useState, useEffect, useRef } from 'react';
import { StadiumNode, ReuniteMemberInput, ReuniteResponse } from '../types';
import { PlusIcon, TrashIcon, UserGroupIcon, MapPinIcon, MicrophoneIcon } from '@heroicons/react/24/outline';

interface ReunitePanelProps {
  nodes: StadiumNode[];
  members: ReuniteMemberInput[];
  reuniteResult: ReuniteResponse | null;
  isLoading: boolean;
  error: string | null;
  accessibilityMode: boolean;
  onAddMember: () => void;
  onRemoveMember: (id: string) => void;
  onUpdateMember: (id: string, updates: Partial<ReuniteMemberInput>) => void;
  onFindMeetup: (accessibilityMode: boolean) => void;
}

export const ReunitePanel: React.FC<ReunitePanelProps> = ({
  nodes,
  members,
  reuniteResult,
  isLoading,
  error,
  accessibilityMode,
  onAddMember,
  onRemoveMember,
  onUpdateMember,
  onFindMeetup,
}) => {
  const nodeOptions = nodes.filter(n => n.type === 'section' || n.type === 'gate');

  const getNodeName = (nodeId: string): string => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? node.name : nodeId;
  };

  // Web Speech API Integration for Group Members
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const [listeningState, setListeningState] = useState<{ memberId: string; field: 'name' | 'location' } | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        if (!listeningState) return;
        const transcript = event.results[0][0].transcript;
        const normalized = transcript.toLowerCase().trim();
        const { memberId, field } = listeningState;

        if (field === 'name') {
          // Set Name from transcript
          onUpdateMember(memberId, { name: transcript });
        } else if (field === 'location') {
          // Select closest location
          const match = nodeOptions.find(opt => {
            const optName = opt.name.toLowerCase();
            return optName.includes(normalized) || normalized.includes(optName);
          });
          if (match) {
            onUpdateMember(memberId, { location: match.id });
          } else {
            // Number fallbacks
            const numMatch = normalized.replace(/\s+/g, '');
            const matchByNum = nodeOptions.find(opt => {
              const optName = opt.name.toLowerCase().replace(/\s+/g, '');
              return optName.includes(numMatch) || numMatch.includes(optName);
            });
            if (matchByNum) {
              onUpdateMember(memberId, { location: matchByNum.id });
            }
          }
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setListeningState(null);
      };

      rec.onend = () => {
        setListeningState(null);
      };

      recognitionRef.current = rec;
    }
  }, [SpeechRecognition, listeningState]);

  const toggleListening = (memberId: string, field: 'name' | 'location'): void => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not fully supported in this browser. Please type.');
      return;
    }

    if (listeningState && listeningState.memberId === memberId && listeningState.field === field) {
      recognitionRef.current.stop();
    } else {
      if (listeningState) {
        recognitionRef.current.stop();
      }
      setListeningState({ memberId, field });
      recognitionRef.current.start();
    }
  };

  const locales = [
    { code: 'en', label: 'English (EN)' },
    { code: 'es', label: 'Español (ES)' },
    { code: 'fr', label: 'Français (FR)' }
  ];

  return (
    <div className="flex flex-col h-full bg-fifa-dark/10 rounded-xl border border-slate-700/40 p-4 space-y-4 shadow-md overflow-hidden">
      {/* Title block */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 flex-shrink-0">
        <UserGroupIcon className="h-5 w-5 text-fifa-gold animate-pulse" />
        <div>
          <h2 className="font-display font-bold text-xs sm:text-sm tracking-widest uppercase text-white">Reunite Group Meetup</h2>
          <p className="text-[9px] sm:text-[10px] text-slate-400">Locates optimal center-point based on walking times</p>
        </div>
      </div>

      {/* Forms inputs list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {members.map((m, index) => (
          <div
            key={m.id}
            className="bg-fifa-navy/40 border border-slate-850 rounded-lg p-3 flex flex-col gap-2 relative transition-all"
          >
            <div className="flex justify-between items-center">
              <span className="font-display text-[10px] font-bold text-fifa-gold uppercase tracking-widest">
                👤 Member {index + 1}
              </span>
              {members.length > 2 && (
                <button
                  type="button"
                  onClick={() => onRemoveMember(m.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors p-0.5"
                  title="Remove Group Member"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Member Name with Voice Mic Button */}
              <div className="flex gap-1.5 items-center">
                <input
                  type="text"
                  value={m.name}
                  onChange={e => onUpdateMember(m.id, { name: e.target.value })}
                  placeholder="Name"
                  className="flex-1 bg-fifa-card border border-slate-800 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1B6E4A]"
                />
                <button
                  type="button"
                  onClick={() => toggleListening(m.id, 'name')}
                  className={`p-1.5 rounded border transition-colors flex-shrink-0 focus:outline-none ${
                    listeningState?.memberId === m.id && listeningState?.field === 'name'
                      ? 'bg-red-650 border-red-500 text-white animate-pulse'
                      : 'bg-fifa-card border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Speak Name"
                >
                  <MicrophoneIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Member Current Location with Voice Mic Button */}
              <div className="flex gap-1.5 items-center">
                <select
                  value={m.location}
                  onChange={e => onUpdateMember(m.id, { location: e.target.value })}
                  className="flex-1 bg-fifa-card border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#1B6E4A]"
                >
                  {nodeOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => toggleListening(m.id, 'location')}
                  className={`p-1.5 rounded border transition-colors flex-shrink-0 focus:outline-none ${
                    listeningState?.memberId === m.id && listeningState?.field === 'location'
                      ? 'bg-red-650 border-red-500 text-white animate-pulse'
                      : 'bg-fifa-card border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Speak Location"
                >
                  <MicrophoneIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Language Selection */}
              <select
                value={m.locale || 'en'}
                onChange={e => onUpdateMember(m.id, { locale: e.target.value })}
                className="bg-fifa-card border border-slate-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#1B6E4A]"
              >
                {locales.map(l => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}

        {members.length < 4 && (
          <button
            type="button"
            onClick={onAddMember}
            className="w-full border border-dashed border-slate-800 hover:border-slate-650 hover:bg-slate-800/10 rounded-lg py-2 flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white transition-all select-none"
          >
            <PlusIcon className="h-4 w-4" />
            Add Group Member
          </button>
        )}

        {error && (
          <div className="text-[11px] text-red-400 bg-red-950/20 border border-red-500/20 px-3 py-2 rounded">
            {error}
          </div>
        )}

        <button
          type="button"
          disabled={isLoading}
          onClick={() => onFindMeetup(accessibilityMode)}
          className="w-full bg-[#1B6E4A] hover:bg-[#228557] text-[#E8E6E0] py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 shadow-sm flex items-center justify-center gap-1.5 select-none"
        >
          {isLoading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Calculating Minimax Meeting Point...
            </>
          ) : (
            <>
              <MapPinIcon className="h-4 w-4" />
              Calculate Meetup Location
            </>
          )}
        </button>
      </div>

      {/* Meeting outcomes list */}
      {reuniteResult && (
        <div className="mt-1 bg-fifa-navy/30 border border-slate-800 rounded-xl p-3 space-y-3 flex-shrink-0 max-h-[180px] overflow-y-auto">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
            <span className="text-base select-none">⭐</span>
            <div>
              <h3 className="font-display font-bold text-[10px] uppercase tracking-widest text-fifa-gold">
                Optimized Meetup Location:
              </h3>
              <p className="text-xs font-bold text-white">
                {getNodeName(reuniteResult.meetupNode)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {reuniteResult.members.map(res => {
              const mInput = members.find(m => m.id === res.id);
              const name = mInput?.name || `Member ${res.id}`;
              const startName = mInput ? getNodeName(mInput.location) : 'unknown';

              return (
                <div key={res.id} className="bg-slate-900/40 border border-slate-800/50 rounded-lg p-2.5 text-[11px] space-y-1.5">
                  <div className="flex justify-between items-center font-bold text-[10px] tracking-wide uppercase">
                    <span className="text-white">{name} ({startName})</span>
                    <span className="text-fifa-yellow">{res.etaSeconds}s ETA</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-2 rounded border border-slate-800/20">
                    {res.answer}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReunitePanel;
