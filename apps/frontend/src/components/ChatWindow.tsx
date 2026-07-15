import React, { useState, useRef, useEffect } from 'react';
import { Message, StadiumNode } from '../types';
import MessageBubble from './MessageBubble';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { Send, Mic, MicOff, MessageSquare, Map } from 'lucide-react';

interface ChatWindowProps {
  messages: Message[];
  nodes: StadiumNode[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  nodes,
  onSendMessage,
  isLoading,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const baseInputRef = useRef('');

  // Consume shared speech recognition hook with interim updates
  const { isListening, toggleListening, isSupported } = useVoiceInput(
    (text) => {
      setInputValue(_ => {
        const updated = `${baseInputRef.current} ${text}`.trim();
        baseInputRef.current = updated;
        return updated;
      });
    },
    (text) => {
      setInputValue(`${baseInputRef.current} ${text}`.trim());
    }
  );

  // Keep track of input value before speech session started
  useEffect(() => {
    if (isListening) {
      baseInputRef.current = inputValue;
    }
  }, [isListening]);

  const handleSend = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const chips = [
    { label: 'Section 103 Route', text: 'Show me the fastest route to Section 103' },
    { label: 'Restrooms & Food near Section 102', text: 'Where is the nearest food and restroom to Section 102?' },
    { label: 'Step-Free Gate A Route', text: 'Step-free route from Gate A to Section 104' },
    { label: 'Noise alert zones', text: 'Which areas are currently loud or congested?' },
  ];

  return (
    <div className="flex flex-col h-full bg-fifa-dark/10 rounded-xl border border-slate-700/45 overflow-hidden shadow-md">
      {/* Scrollable messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-fifa-navy border border-fifa-gold/30 flex items-center justify-center shadow-md">
              <Map className="h-6 w-6 text-fifa-gold" strokeWidth={1.75} />
            </div>
            <h3 className="font-display font-bold text-fifa-gold text-base tracking-widest uppercase">Stadium Copilot Active</h3>
            <p className="text-xs text-slate-400 max-w-[280px] leading-relaxed">
              Ask navigation questions in any language. I will guide you along routes that avoid congested crowd zones.
            </p>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} nodes={nodes} />
          ))
        )}

        {/* Loading bot indicator */}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-fifa-navy flex items-center justify-center border border-fifa-gold/20 flex-shrink-0 select-none">
                <MessageSquare className="h-4 w-4 text-fifa-gold" strokeWidth={1.75} />
              </div>
              <div className="bg-fifa-navy text-slate-400 rounded-2xl rounded-tl-none px-4 py-2.5 text-sm border border-slate-700/20 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {messages.length < 3 && (
        <div className="p-3 border-t border-slate-800/80 bg-fifa-navy/20 flex flex-wrap gap-2">
          {chips.map((c, index) => (
            <button
              key={`chip-${index}`}
              onClick={() => onSendMessage(c.text)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-transparent hover:bg-fifa-clear/10 text-slate-300 hover:text-white border border-slate-700 hover:border-fifa-clear/40 transition-all select-none flex items-center gap-1.5"
            >
              <MessageSquare className="h-3.5 w-3.5 text-fifa-gold flex-shrink-0" strokeWidth={1.75} />
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input controls form */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800/80 bg-fifa-navy/50 flex gap-2 items-center">
        <button
          type="button"
          disabled={!isSupported}
          onClick={toggleListening}
          className={`p-2.5 rounded-xl border flex-shrink-0 transition-all duration-300 ${
            !isSupported
              ? 'opacity-40 cursor-not-allowed bg-slate-850 border-slate-800 text-slate-550'
              : isListening
              ? 'bg-red-650 border-red-500 text-white animate-pulse'
              : 'bg-slate-800 border-slate-700/80 text-slate-400 hover:bg-slate-700 hover:text-white'
          }`}
          title={
            !isSupported
              ? 'Speech Recognition is not supported in this browser'
              : isListening
              ? 'Stop Speech Listening'
              : 'Use Microphone Speech Input'
          }
        >
          {isListening ? (
            <MicOff className="h-4.5 w-4.5" strokeWidth={1.75} />
          ) : (
            <Mic className="h-4.5 w-4.5" strokeWidth={1.75} />
          )}
        </button>

        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder={
            !isSupported
              ? 'Speech input not supported. Please type...'
              : isListening
              ? 'Listening to speech...'
              : 'Type or ask a question...'
          }
          disabled={isListening}
          className="flex-1 bg-fifa-card border border-slate-800 rounded-xl px-4 py-2.5 text-base text-[#E8E6E0] placeholder-slate-500 focus:outline-none focus:border-[#1B6E4A] disabled:opacity-50 font-normal"
        />

        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="p-2.5 rounded-xl bg-[#1B6E4A] hover:bg-[#228557] text-[#E8E6E0] flex-shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          <Send className="h-4.5 w-4.5" strokeWidth={1.75} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
