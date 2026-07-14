import { GoogleGenerativeAI } from '@google/generative-ai';
import { EXTRACTION_SYSTEM_PROMPT, ASSISTANT_SYSTEM_PROMPT } from '../prompts/systemPrompt';
import { LLMAnalysis } from '../types';
import graphData from '../data/stadiumGraph.json';
import { getAllCrowdDensities } from '../data/crowdDensity';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Fallback local mockup for hackathon testing without an active Gemini API Key
 */
function getMockResponse(prompt: string, systemInstruction: string): string {
  if (systemInstruction.includes('precise stadium assistant query analyzer')) {
    const lower = prompt.toLowerCase();
    let destinationCategory: 'gate' | 'section' | 'restroom' | 'food' | 'exit' | null = null;
    let destinationNodeId: string | null = null;
    let detectedLanguage = 'en';

    if (lower.includes('baño') || lower.includes('bano') || lower.includes('toilet') || lower.includes('restroom') || lower.includes('wc') || lower.includes('restrooms') || lower.includes('bathroom') || lower.includes('bathrooms') || lower.includes('washroom')) {
      destinationCategory = 'restroom';
    } else if (lower.includes('taco') || lower.includes('burger') || lower.includes('food') || lower.includes('eat') || lower.includes('stall') || lower.includes('drink') || lower.includes('sips') || lower.includes('beer') || lower.includes('hungry')) {
      destinationCategory = 'food';
      if (lower.includes('taco')) destinationNodeId = 'food-stall-a';
      else if (lower.includes('burger') || lower.includes('barn')) destinationNodeId = 'food-stall-b';
      else if (lower.includes('drink') || lower.includes('sip') || lower.includes('coffee')) destinationNodeId = 'food-stall-c';
    } else if (lower.includes('gate') || lower.includes('entrance') || lower.includes('door')) {
      destinationCategory = 'gate';
      if (lower.includes('gate a')) destinationNodeId = 'gate-a';
      else if (lower.includes('gate b')) destinationNodeId = 'gate-b';
      else if (lower.includes('gate c')) destinationNodeId = 'gate-c';
      else if (lower.includes('gate d')) destinationNodeId = 'gate-d';
    } else if (lower.includes('exit')) {
      destinationCategory = 'exit';
      if (lower.includes('east')) destinationNodeId = 'exit-east';
      else if (lower.includes('west')) destinationNodeId = 'exit-west';
    } else if (lower.includes('section') || lower.includes('sec') || lower.includes('seating') || lower.includes('stand')) {
      destinationCategory = 'section';
      const secMatch = lower.match(/10[0-5]/);
      if (secMatch) destinationNodeId = `sec-${secMatch[0]}`;
    }

    if (lower.includes('dónde') || lower.includes('donde') || lower.includes('baño') || lower.includes('bano') || lower.includes('cómo') || lower.includes('como') || lower.includes('salida') || lower.includes('puerta')) {
      detectedLanguage = 'es';
    } else if (lower.includes('où') || lower.includes('toilette') || lower.includes('comment') || lower.includes('sortie') || lower.includes('porte')) {
      detectedLanguage = 'fr';
    }

    return JSON.stringify({
      destinationCategory,
      destinationNodeId,
      detectedLanguage
    });
  }

  // Parse path out of the generation prompt for mock responses
  const pathMatch = prompt.match(/Path: (.*)/);
  const pathText = pathMatch ? pathMatch[1] : 'unknown';
  const langMatch = prompt.match(/Language Code: (.*)/);
  const lang = langMatch ? langMatch[1].trim() : 'en';
  const warningMatch = prompt.match(/Warnings: (.*)/);
  const warningText = warningMatch ? warningMatch[1] : 'None';

  const isAccessibility = prompt.includes('Accessibility Mode: Active');

  if (lang === 'es') {
    let ans = `Para llegar a tu destino, sigue la ruta recomendada: ${pathText}.`;
    if (isAccessibility) {
      ans += ` Esta ruta es accesible y libre de escaleras.`;
    }
    if (warningText && warningText !== 'None') {
      ans += ` ¡Atención! ${warningText}. Evita las zonas congestionadas.`;
    } else {
      ans += ` La ruta está despejada y tiene baja afluencia.`;
    }
    return ans;
  } else if (lang === 'fr') {
    let ans = `Pour vous rendre à destination, veuillez suivre l'itinéraire recommandé: ${pathText}.`;
    if (isAccessibility) {
      ans += ` Cet itinéraire est accessible sans escaliers.`;
    }
    if (warningText && warningText !== 'None') {
      ans += ` Attention! ${warningText}. Veuillez contourner la zone encombrée.`;
    } else {
      ans += ` Le chemin est fluide et peu fréquenté en ce moment.`;
    }
    return ans;
  } else {
    let ans = `To reach your destination, follow the highlighted path: ${pathText}.`;
    if (isAccessibility) {
      ans += ` This route is step-free and avoids stairs.`;
    }
    if (warningText && warningText !== 'None') {
      ans += ` Warning: ${warningText}. Adjust your path accordingly.`;
    } else {
      ans += ` The path is clear and moving quickly.`;
    }
    return ans;
  }
}

/**
 * Internal execution method with fallback model check
 */
async function generateWithFallback(systemInstruction: string, prompt: string, responseMimeType?: string): Promise<string> {
  if (!genAI) {
    return getMockResponse(prompt, systemInstruction);
  }

  const primaryModel = 'gemini-3.5-flash';
  const fallbackModel = 'gemini-flash-latest';

  const config: any = {
    model: primaryModel,
    systemInstruction,
  };

  if (responseMimeType) {
    config.generationConfig = { responseMimeType };
  }

  try {
    const modelInstance = genAI.getGenerativeModel(config);
    const result = await modelInstance.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error(`Gemini Primary Model (${primaryModel}) failed, attempting fallback...`, error);
    try {
      config.model = fallbackModel;
      const modelInstance = genAI.getGenerativeModel(config);
      const result = await modelInstance.generateContent(prompt);
      return result.response.text();
    } catch (fallbackError) {
      console.error(`Gemini Fallback Model (${fallbackModel}) failed. Using local mockup.`, fallbackError);
      return getMockResponse(prompt, systemInstruction);
    }
  }
}

/**
 * Step 1: Analyze user query and extract navigation metadata
 */
export async function extractIntent(query: string): Promise<LLMAnalysis> {
  const prompt = `User Query: "${query}"`;
  try {
    const responseText = await generateWithFallback(EXTRACTION_SYSTEM_PROMPT, prompt, 'application/json');
    // Ensure standard JSON formatting (remove potential markdown wrappers)
    const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned) as LLMAnalysis;
  } catch (err) {
    console.error('[LLMService] Intent extraction JSON parse failed. Falling back.', err);
    return JSON.parse(getMockResponse(prompt, EXTRACTION_SYSTEM_PROMPT)) as LLMAnalysis;
  }
}

/**
 * Step 3: Formulate human-readable guidance text in user's detected language
 */
export async function generateGuidance(
  query: string,
  startNodeId: string,
  pathNodes: string[],
  totalTime: number,
  warnings: string[],
  langCode: string,
  accessibilityMode: boolean = false
): Promise<string> {
  // Format graph and routing context to ground the LLM
  const crowdDensities = getAllCrowdDensities();
  const pathNames = pathNodes.map(id => {
    const node = graphData.nodes.find(n => n.id === id);
    return node ? `${node.name} (${node.type})` : id;
  }).join(' ➔ ');

  const prompt = `
Context Details:
- User is at Node ID: ${startNodeId}
- User's Original Query: "${query}"
- Language Code: ${langCode}
- Recommended Path: ${pathNames}
- Estimated Walk Time: ${Math.round(totalTime)} seconds
- Accessibility Mode: ${accessibilityMode ? 'Active (Step-free / stairs avoided & low stimulation concourses preferred)' : 'Inactive'}
- Warnings: ${warnings.length > 0 ? warnings.join(', ') : 'None'}
- Full Stadium Crowd State:
${JSON.stringify(crowdDensities.map(c => ({ id: c.nodeId, level: c.level, density: c.density })), null, 2)}

Formulate a concise response in the requested language (Language Code: ${langCode}). Explain the recommended path and clearly warn them about any busy areas. Keep the response to 2-3 sentences max.
`;

  return generateWithFallback(ASSISTANT_SYSTEM_PROMPT, prompt);
}
