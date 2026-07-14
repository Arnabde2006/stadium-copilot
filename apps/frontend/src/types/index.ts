export interface StadiumNode {
  id: string;
  name: string;
  type: 'gate' | 'section' | 'restroom' | 'food' | 'exit';
  description?: string;
  x: number;
  y: number;
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

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  detectedLanguage?: string;
  suggestedPath?: string[];
  congestionAlert?: string;
}

export interface QueryResponse {
  answer: string;
  detectedLanguage: string;
  suggestedPath: string[];
  congestionAlert?: string;
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
