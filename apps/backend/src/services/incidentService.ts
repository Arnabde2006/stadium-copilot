import { GoogleGenerativeAI } from '@google/generative-ai';
import { STAFF_SYSTEM_PROMPT } from '../prompts/staffSystemPrompt';
import { IncidentReport } from '../types';
import { addIncident } from '../data/incidentLog';
import graphData from '../data/stadiumGraph.json';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Heuristics-based fallback parser for offline mode or test scenarios
 */
function getMockIncidentReport(input: string): Omit<IncidentReport, 'id' | 'timestamp'> {
  const lower = input.toLowerCase();
  
  // 1. Determine Category
  let category: IncidentReport['category'] = 'other';
  if (lower.includes('medical') || lower.includes('injury') || lower.includes('hurt') || lower.includes('blood') || lower.includes('pain') || lower.includes('doctor') || lower.includes('ambulance') || lower.includes('sick')) {
    category = 'medical';
  } else if (lower.includes('crowd') || lower.includes('full') || lower.includes('busy') || lower.includes('congest') || lower.includes('packed') || lower.includes('congestion')) {
    category = 'crowding';
  } else if (lower.includes('fight') || lower.includes('theft') || lower.includes('steal') || lower.includes('suspicious') || lower.includes('danger') || lower.includes('weapon') || lower.includes('security') || lower.includes('police') || lower.includes('cops')) {
    category = 'security';
  } else if (lower.includes('facility') || lower.includes('water') || lower.includes('broken') || lower.includes('leak') || lower.includes('spill') || lower.includes('toilet') || lower.includes('light') || lower.includes('electricity') || lower.includes('pipe') || lower.includes('trash') || lower.includes('garbage')) {
    category = 'facility';
  }

  // 2. Determine Location matching graph nodes
  let location = 'Unknown Location';
  for (const node of graphData.nodes) {
    if (lower.includes(node.name.toLowerCase()) || lower.includes(node.id.toLowerCase())) {
      location = node.name;
      break;
    }
  }
  
  // Custom aliases if not exact
  if (location === 'Unknown Location') {
    if (lower.includes('taco')) location = 'Taco Corner (Food Stall A)';
    else if (lower.includes('burger')) location = 'Burger Barn (Food Stall B)';
    else if (lower.includes('sips') || lower.includes('coffee') || lower.includes('drink')) location = 'Pitchside Sips (Food Stall C)';
  }

  // 3. Determine Urgency (Injury/danger/weapon always high)
  let urgency: IncidentReport['urgency'] = 'low';
  if (lower.includes('injury') || lower.includes('hurt') || lower.includes('bleeding') || lower.includes('fight') || lower.includes('danger') || lower.includes('weapon') || lower.includes('emergency') || lower.includes('heart') || lower.includes('security')) {
    urgency = 'high';
  } else if (lower.includes('broken') || lower.includes('leak') || lower.includes('spill') || lower.includes('crowd') || lower.includes('overflow') || lower.includes('full')) {
    urgency = 'medium';
  }

  // 4. Formulate Summary
  let summary = `Reported ${category} issue at ${location}.`;
  if (input.length > 5) {
    const trimmedInput = input.trim();
    const finalPeriod = trimmedInput.endsWith('.') ? '' : '.';
    summary = trimmedInput.substring(0, 60) + (trimmedInput.length > 60 ? '...' : '') + finalPeriod;
  }

  return {
    category,
    location,
    urgency,
    summary,
    rawInput: input
  };
}

/**
 * Primary worker function using Gemini with robust fallbacks
 */
async function parseWithFallback(prompt: string): Promise<Omit<IncidentReport, 'id' | 'timestamp'>> {
  if (!genAI) {
    return getMockIncidentReport(prompt);
  }

  const primaryModel = 'gemini-3.5-flash';
  const fallbackModel = 'gemini-flash-latest';

  const config: any = {
    model: primaryModel,
    systemInstruction: STAFF_SYSTEM_PROMPT,
    generationConfig: { responseMimeType: 'application/json' }
  };

  try {
    const modelInstance = genAI.getGenerativeModel(config);
    const result = await modelInstance.generateContent(`Staff Input: "${prompt}"`);
    const text = result.response.text();
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error(`Gemini Primary Model (${primaryModel}) failed for staff processing, trying fallback...`, error);
    try {
      config.model = fallbackModel;
      const modelInstance = genAI.getGenerativeModel(config);
      const result = await modelInstance.generateContent(`Staff Input: "${prompt}"`);
      const text = result.response.text();
      const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (fallbackError) {
      console.error(`Gemini Fallback Model (${fallbackModel}) failed. Using local mockup.`, fallbackError);
      return getMockIncidentReport(prompt);
    }
  }
}

/**
 * Processes a raw free-text report, logs it in memory, and returns the result.
 */
export async function reportIncident(input: string): Promise<IncidentReport> {
  const structuredData = await parseWithFallback(input);
  
  const incident: IncidentReport = {
    id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    category: structuredData.category || 'other',
    location: structuredData.location || 'Unknown Location',
    urgency: structuredData.urgency || 'low',
    summary: structuredData.summary || 'Incident reported.',
    rawInput: input,
    timestamp: new Date().toISOString()
  };

  addIncident(incident);
  return incident;
}
