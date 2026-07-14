import React from 'react';
import { Message, StadiumNode } from '../types';
import LanguageBadge from './LanguageBadge';
import { AlertCircle } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  nodes: StadiumNode[];
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, nodes }) => {
  const isBot = message.sender === 'bot';

  const getNodeName = (nodeId: string): string => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? node.name : nodeId;
  };

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4 w-full`}>
      <div className="flex gap-2 max-w-[85%] sm:max-w-[75%]">
        {isBot && (
          <div className="w-8 h-8 rounded-full bg-fifa-card flex items-center justify-center text-sm shadow-md border border-fifa-gold/25 select-none flex-shrink-0">
            🤖
          </div>
        )}
        <div className="flex flex-col gap-1">
          {isBot && message.detectedLanguage && (
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Stadium Copilot</span>
              <LanguageBadge code={message.detectedLanguage} />
            </div>
          )}

          <div
            className={`rounded-2xl px-4 py-3 text-base shadow-md leading-relaxed ${
              isBot
                ? 'bg-fifa-card text-[#E8E6E0] border border-slate-850/60 rounded-tl-none font-medium'
                : 'bg-[#1B6E4A] text-[#E8E6E0] rounded-tr-none font-medium'
            }`}
          >
            <p className="whitespace-pre-wrap">{message.text}</p>

            {isBot && message.congestionAlert && (
              <div className="mt-2 bg-red-950/40 border border-red-500/20 rounded-lg p-2 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-[11px] text-red-200 leading-snug">
                  {message.congestionAlert}
                </span>
              </div>
            )}

            {isBot && message.suggestedPath && message.suggestedPath.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-slate-700/50">
                <span className="text-[10px] text-fifa-gold font-bold uppercase tracking-wider block mb-1">
                  🗺️ Calculated Route:
                </span>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-300 bg-fifa-dark/50 px-2 py-1.5 rounded border border-slate-800">
                  {message.suggestedPath.map((pathNodeId, index) => (
                    <React.Fragment key={`path-bubble-${index}`}>
                      <span className="font-semibold text-white">
                        {getNodeName(pathNodeId)}
                      </span>
                      {index < (message.suggestedPath?.length || 0) - 1 && (
                        <span className="text-fifa-gold px-0.5">➔</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>

          <span className={`text-[10px] text-slate-500 mt-0.5 ${isBot ? 'text-left' : 'text-right'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
