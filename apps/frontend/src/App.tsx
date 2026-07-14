import React, { useState } from 'react';
import { useChat } from './hooks/useChat';
import { useReunite } from './hooks/useReunite';
import ChatWindow from './components/ChatWindow';
import StadiumMap from './components/StadiumMap';
import CrowdAlertBanner from './components/CrowdAlertBanner';
import AccessibilityToggle from './components/AccessibilityToggle';
import ReunitePanel from './components/ReunitePanel';
import { ChatBubbleLeftRightIcon, MapIcon, TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export const App: React.FC = () => {
  const {
    messages,
    nodes,
    edges,
    densities,
    suggestedPath,
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

  const [activeTab, setActiveTab] = useState<'chat' | 'reunite' | 'map'>('chat');

  return (
    <div className="flex flex-col h-screen w-screen bg-fifa-dark text-slate-100 font-sans">
      {/* Top Header Navigation */}
      <header className="bg-fifa-navy border-b border-slate-800/80 px-4 py-3 flex items-center justify-between flex-shrink-0 z-10 shadow-md">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🏟️</span>
          <div>
            <h1 className="text-sm font-extrabold tracking-wider uppercase text-white">Stadium Copilot</h1>
            <p className="text-[10px] text-fifa-gold font-semibold tracking-wider uppercase">FIFA World Cup 2026</p>
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

      {/* Selector Toolbar */}
      <div className="bg-fifa-navy/40 px-4 py-2.5 border-b border-slate-800/60 flex flex-wrap gap-3 items-center justify-between flex-shrink-0 text-xs text-slate-300">
        <div className="flex flex-wrap items-center gap-4">
          {/* Desktop Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-800/60 p-0.5 rounded border border-slate-700/60 shadow-inner">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all select-none ${
                activeTab === 'chat' ? 'bg-fifa-blue text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Assistant
            </button>
            <button
              onClick={() => setActiveTab('reunite')}
              className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all select-none ${
                activeTab === 'reunite' ? 'bg-fifa-blue text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Reunite
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
              ? 'text-fifa-gold bg-fifa-dark/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Assistant</span>
        </button>

        <button
          onClick={() => setActiveTab('reunite')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === 'reunite'
              ? 'text-fifa-gold bg-fifa-dark/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserGroupIcon className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Reunite</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === 'map'
              ? 'text-fifa-gold bg-fifa-dark/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapIcon className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Stadium Map</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
