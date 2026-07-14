export interface StadiumNode {
  id: string;
  name: string;
  type: 'gate' | 'section' | 'restroom' | 'food' | 'exit';
  description?: string;
  x: number; // SVG X coordinate
  y: number; // SVG Y coordinate
}

export interface StadiumEdge {
  from: string;
  to: string;
  baseWeight: number;
  stepFree: boolean;
  lowStimulation: boolean;
}

export interface StadiumGraph {
  nodes: StadiumNode[];
  edges: StadiumEdge[];
}

export type CongestionLevel = 'low' | 'medium' | 'high';

export interface CrowdDensity {
  nodeId: string;
  density: number; // 0.0 to 1.0
  level: CongestionLevel;
}

export interface QueryRequest {
  query: string;
  userLocation?: string;
  accessibilityMode?: boolean;
}

export interface QueryResponse {
  answer: string;
  detectedLanguage: string;
  suggestedPath: string[]; // array of node IDs
  congestionAlert?: string;
}

export interface LLMAnalysis {
  destinationCategory: 'gate' | 'section' | 'restroom' | 'food' | 'exit' | null;
  destinationNodeId: string | null;
  detectedLanguage: string;
}

export interface ReuniteMemberInput {
  id: string;
  name: string;
  location: string;
  locale?: string;
}

export interface ReuniteMemberResult {
  id: string;
  answer: string;
  detectedLanguage: string;
  route: string[];
  etaSeconds: number;
}

export interface ReuniteResponse {
  meetupNode: string;
  members: ReuniteMemberResult[];
}

export interface IncidentReport {
  id: string;
  category: 'crowding' | 'medical' | 'security' | 'facility' | 'other';
  location: string;
  urgency: 'low' | 'medium' | 'high';
  summary: string;
  rawInput: string;
  timestamp: string;
}
