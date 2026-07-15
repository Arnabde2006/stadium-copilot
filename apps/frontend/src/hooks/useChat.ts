import { useState, useEffect } from 'react';
import { Message, StadiumNode, StadiumEdge, CrowdDensity, IncidentReport } from '../types';
import { fetchGraph, fetchDensities, queryAssistant, fetchActiveAlerts } from '../lib/api';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [nodes, setNodes] = useState<StadiumNode[]>([]);
  const [edges, setEdges] = useState<StadiumEdge[]>([]);
  const [densities, setDensities] = useState<CrowdDensity[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<IncidentReport[]>([]);
  const [suggestedPath, setSuggestedPath] = useState<string[]>([]);
  const [congestionAlert, setCongestionAlert] = useState<string | undefined>(undefined);
  const [userLocation, setUserLocation] = useState<string>('sec-100'); // Default start location
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [accessibilityMode, setAccessibilityMode] = useState<boolean>(false);

  // Load the static stadium graph geometry structure on mount
  useEffect(() => {
    async function loadGraphSpec() {
      try {
        const graph = await fetchGraph();
        setNodes(graph.nodes);
        setEdges(graph.edges);
      } catch (err) {
        console.error('Failed to load stadium graph specs:', err);
        setError('Failed to configure stadium maps.');
      }
    }
    loadGraphSpec();
  }, []);

  // Poll the backend simulator for live crowd density and active alerts updates every 5 seconds
  useEffect(() => {
    async function pullDensitiesAndAlerts() {
      try {
        const [densityData, alertData] = await Promise.all([
          fetchDensities(),
          fetchActiveAlerts().catch(() => [] as IncidentReport[])
        ]);
        setDensities(densityData);
        setActiveAlerts(alertData);
      } catch (err) {
        console.error('Error fetching live crowd/alert simulation data:', err);
      }
    }

    pullDensitiesAndAlerts(); // Immediate fetch
    const timer = setInterval(pullDensitiesAndAlerts, 5000);
    return () => clearInterval(timer);
  }, []);

  // Dispatch text query to backend API
  const sendMessage = async (text: string): Promise<void> => {
    if (!text.trim()) return;

    // Append user message locally
    const userMsg: Message = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await queryAssistant(text, userLocation, accessibilityMode);

      // Extract route paths and alerts for maps
      if (response.suggestedPath && response.suggestedPath.length > 0) {
        setSuggestedPath(response.suggestedPath);
      }
      setCongestionAlert(response.congestionAlert);

      const botMsg: Message = {
        id: `bot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender: 'bot',
        text: response.answer,
        timestamp: new Date(),
        detectedLanguage: response.detectedLanguage,
        suggestedPath: response.suggestedPath,
        congestionAlert: response.congestionAlert,
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Query assistant call failed:', err);

      const errMessage: Message = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: 'Sorry, I failed to fetch recommendations from stadium operations. Please verify connectivity and try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = (): void => {
    setMessages([]);
    setSuggestedPath([]);
    setCongestionAlert(undefined);
  };

  return {
    messages,
    nodes,
    edges,
    densities,
    activeAlerts,
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
  };
}
