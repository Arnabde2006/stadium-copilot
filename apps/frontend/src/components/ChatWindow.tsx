import React, { useState, useRef, useEffect } from 'react';
import { Message, StadiumNode } from '../types';
import MessageBubble from './MessageBubble';
import { PaperAirplaneIcon, MicrophoneIcon } from '@heroicons/react/24/solid';

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
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const toggleListening = (): void => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not fully supported in this browser. Please type your query.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

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
    { text: 'Where is the nearest restroom?', label: '🚻 Find Restroom' },
    { text: '¿Dónde está el baño?', label: '🇪🇸 ¿Dónde está el baño?' },
    { text: 'How do I get to Gate C?', label: '🚪 Route to Gate C' },
    { text: 'Find Taco Corner', label: '🌮 Taco Stall' },
    { text: 'Où est la sortie ouest?', label: '🇫🇷 Sortie Ouest' },
  ];

  return (
    <div className="flex flex-col h-full bg-fifa-dark/10 rounded-xl border border-slate-700/45 overflow-hidden shadow-md">
      {/* Scrollable messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-fifa-navy border border-fifa-gold/30 flex items-center justify-center text-xl shadow-md">
              🏟️
            </div>
            <h3 className="font-bold text-fifa-gold text-base tracking-wide">Stadium Copilot Active</h3>
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
              <div className="w-8 h-8 rounded-full bg-fifa-navy flex items-center justify-center text-sm border border-fifa-gold/20 flex-shrink-0 select-none">
                🤖
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
              className="text-[10px] font-semibold px-2.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 hover:border-slate-500 transition-all select-none"
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Input controls form */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800/80 bg-fifa-navy/50 flex gap-2 items-center">
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
          placeholder={isListening ? 'Listening to speech...' : 'Type or ask a question...'}
          disabled={isListening}
          className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-fifa-accent focus:ring-1 focus:ring-fifa-accent/30 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="p-2.5 rounded-xl bg-fifa-blue hover:bg-fifa-accent text-white flex-shrink-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          <PaperAirplaneIcon className="h-4.5 w-4.5" />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
