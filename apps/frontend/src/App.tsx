import React, { useState } from 'react';
import { useChat } from './hooks/useChat';
import { useReunite } from './hooks/useReunite';
import ChatWindow from './components/ChatWindow';
import StadiumMap from './components/StadiumMap';
import CrowdAlertBanner from './components/CrowdAlertBanner';
import AccessibilityToggle from './components/AccessibilityToggle';
import ReunitePanel from './components/ReunitePanel';
import StaffPanel from './components/StaffPanel';
import RouteSummary from './components/RouteSummary';
import { ChatBubbleLeftRightIcon, MapIcon, TrashIcon, UserGroupIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

export const App: React.FC = () => {
  const {
    messages,
    nodes,
    edges,
    densities,
    suggestedPath,
    congestionAlert,
    userLocation,
    setUserLocation,
    accessibilityMode,
    setAccessibilityMode,
    sendMessage,
    clearChat,
    isLoading,
    error,
  } = useChat();

  const {
    members,
    reuniteResult,
    isLoading: isReuniteLoading,
    error: reuniteError,
    addMember,
    removeMember,
    updateMember,
    findMeetup,
    clearReunite,
  } = useReunite();

  const [activeTab, setActiveTab] = useState<'chat' | 'reunite' | 'staff' | 'map'>('chat');

  return (
    <div className="flex flex-col h-screen w-screen bg-fifa-dark text-slate-100 font-sans">
      {/* Top Header Navigation */}
      <header className="bg-fifa-navy border-b border-slate-800/80 px-4 py-3 flex items-center justify-between flex-shrink-0 z-10 shadow-md">
        <div className="flex items-center gap-2.5">
          {/* Stylized Vector Stadium Logo */}
          <svg viewBox="0 0 100 100" className="h-5.5 w-5.5 text-fifa-gold flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
            <ellipse cx="50" cy="50" rx="42" ry="26" />
            <ellipse cx="50" cy="50" rx="26" ry="15" strokeDasharray="6 4" strokeWidth="4" />
            <circle cx="50" cy="50" r="5" fill="currentColor" />
          </svg>
          <div>
            <h1 className="text-base font-bold tracking-widest uppercase text-white font-display">Stadium Copilot</h1>
            <p className="text-[10px] text-fifa-gold font-semibold tracking-widest uppercase font-display">FIFA World Cup 2026</p>
          </div>
        </div>

        {/* Live Simulator Pulsing Heartbeat */}
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fifa-clear opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-fifa-clear"></span>
          </span>
          <span className="text-[9px] font-bold text-fifa-clear uppercase tracking-widest hidden sm:inline">Live Simulator Feed</span>
        </div>
      </header>

      {/* Dynamic Alerts Banner */}
      <CrowdAlertBanner densities={densities} nodes={nodes} />

      {/* Selector Toolbar (Aligned to 8px Spacing Grid) */}
      <div className="bg-fifa-navy/40 px-4 py-2 border-b border-slate-800/60 flex flex-wrap gap-4 items-center justify-between flex-shrink-0 text-xs text-slate-300">
        <div className="flex flex-wrap items-center gap-4">
          {/* Desktop Mode Switcher */}
          <div className="flex items-center gap-5 select-none">
            <button
              onClick={() => setActiveTab('chat')}
              className={`pb-1 px-1 text-[11px] font-display font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === 'chat'
                  ? 'border-fifa-clear text-slate-100'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Assistant
            </button>
            <button
              onClick={() => setActiveTab('reunite')}
              className={`pb-1 px-1 text-[11px] font-display font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === 'reunite'
                  ? 'border-fifa-clear text-slate-100'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Reunite
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`pb-1 px-1 text-[11px] font-display font-bold uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${
                activeTab === 'staff'
                  ? 'border-fifa-clear text-slate-100'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🛡️ Staff</span>
              <span className="text-[7.5px] font-sans bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded px-1 font-bold">
                OPS
              </span>
            </button>
          </div>

          {/* Start Location Dropdown (For Chat mode only) */}
          {activeTab === 'chat' && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-fifa-gold text-[10px] uppercase tracking-wider">Start Location:</span>
              <select
                value={userLocation}
                onChange={e => setUserLocation(e.target.value)}
                className="bg-slate-800 border border-slate-700/80 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-fifa-accent"
              >
                {nodes
                  .filter(n => n.type === 'section' || n.type === 'gate')
                  .map(n => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({n.type})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Accessibility Toggle */}
          <AccessibilityToggle
            enabled={accessibilityMode}
            onToggle={setAccessibilityMode}
          />
        </div>

        {/* Clear Action Button */}
        <div className="flex gap-4">
          {activeTab === 'reunite' && reuniteResult && (
            <button
              onClick={clearReunite}
              className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 hover:text-red-400 transition-colors uppercase tracking-wider"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              Clear Meetup
            </button>
          )}

          {activeTab === 'chat' && messages.length > 0 && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 hover:text-red-400 transition-colors uppercase tracking-wider"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              Clear Journey
            </button>
          )}
        </div>
      </div>

      {/* Main Screen Layout Container */}
      <main className="flex-1 overflow-hidden p-3 md:p-4 max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-4">
        {error && (
          <div className="bg-red-950/40 border border-red-500/20 text-red-200 text-xs px-4 py-2.5 rounded-lg w-full mb-3 self-start">
            {error}
          </div>
        )}

        {/* Left Column: Chat or Reunite Form */}
        <section
          className={`flex-1 flex flex-col h-full overflow-hidden ${
            activeTab === 'chat' || activeTab === 'reunite' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {activeTab === 'reunite' ? (
            <ReunitePanel
              nodes={nodes}
              members={members}
              reuniteResult={reuniteResult}
              isLoading={isReuniteLoading}
              error={reuniteError}
              accessibilityMode={accessibilityMode}
              onAddMember={addMember}
              onRemoveMember={removeMember}
              onUpdateMember={updateMember}
              onFindMeetup={findMeetup}
            />
          ) : activeTab === 'staff' ? (
            <StaffPanel />
          ) : (
            <ChatWindow
              messages={messages}
              nodes={nodes}
              onSendMessage={sendMessage}
              isLoading={isLoading}
            />
          )}
        </section>

        {/* Right Column: Stadium map visualization */}
        <section
          className={`flex-1 md:max-w-md lg:max-w-lg flex flex-col h-full overflow-hidden ${
            activeTab === 'map' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <RouteSummary
            suggestedPath={activeTab === 'reunite' ? [] : suggestedPath}
            congestionAlert={congestionAlert}
            nodes={nodes}
            edges={edges}
            reuniteResult={activeTab === 'reunite' ? reuniteResult : null}
          />
          <StadiumMap
            nodes={nodes}
            edges={edges}
            densities={densities}
            suggestedPath={activeTab === 'reunite' ? [] : suggestedPath}
            userLocation={userLocation}
            onSelectStartLocation={setUserLocation}
            reuniteResult={activeTab === 'reunite' ? reuniteResult : null}
          />
        </section>
      </main>

      {/* Bottom Switcher Navigation (Mobile Only) */}
      <nav className="bg-fifa-navy border-t border-slate-800/80 p-2 flex justify-around md:hidden flex-shrink-0 z-10">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === 'chat'
              ? 'text-fifa-clear bg-transparent font-semibold'
              : 'text-slate-500 hover:text-slate-400 font-normal'
          }`}
        >
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
          <span className="text-[10px] font-display uppercase tracking-wider">Assistant</span>
        </button>

        <button
          onClick={() => setActiveTab('reunite')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === 'reunite'
              ? 'text-fifa-clear bg-transparent font-semibold'
              : 'text-slate-500 hover:text-slate-400 font-normal'
          }`}
        >
          <UserGroupIcon className="h-5 w-5" />
          <span className="text-[10px] font-display uppercase tracking-wider">Reunite</span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === 'staff'
              ? 'text-amber-400 bg-transparent font-semibold'
              : 'text-slate-500 hover:text-slate-400 font-normal'
          }`}
        >
          <ShieldExclamationIcon className="h-5 w-5" />
          <span className="text-[10px] font-display uppercase tracking-wider">Staff</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === 'map'
              ? 'text-fifa-clear bg-transparent font-semibold'
              : 'text-slate-500 hover:text-slate-400 font-normal'
          }`}
        >
          <MapIcon className="h-5 w-5" />
          <span className="text-[10px] font-display uppercase tracking-wider font-semibold">Map</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
