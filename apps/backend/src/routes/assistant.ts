import { Router, Request, Response } from 'express';
import { extractIntent, generateGuidance } from '../services/llmService';
import { findRoute } from '../services/routingService';
import { getAllCrowdDensities } from '../data/crowdDensity';
import graphData from '../data/stadiumGraph.json';

const router = Router();

/**
 * GET /api/assistant/graph
 * Serves the stadium layout structure and coordinate mapping for visual renderings
 */
router.get('/graph', (req: Request, res: Response) => {
  return res.json(graphData);
});

/**
 * GET /api/assistant/density
 * Serves the live crowd density values for map updates
 */
router.get('/density', (req: Request, res: Response) => {
  return res.json(getAllCrowdDensities());
});

/**
 * POST /api/assistant/query
 * Core endpoint for processing user queries, determining routes, and querying Gemini for guidance.
 */
router.post('/query', async (req: Request, res: Response) => {
  try {
    const { query, userLocation, accessibilityMode } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query must be a non-empty string' });
    }

    const startNode = userLocation || 'sec-100';

    // Step 1: Detect language & extract target destination from the user query
    const analysis = await extractIntent(query);
    const { destinationCategory, destinationNodeId, detectedLanguage } = analysis;

    let suggestedPath: string[] = [];
    let congestionAlert: string | undefined = undefined;
    let answer = '';

    // Step 2: Compute path if destination could be inferred
    const target = destinationNodeId || destinationCategory;
    const startNodeObj = graphData.nodes.find(n => n.id === startNode);
    const isAlreadyAtCategory = startNodeObj && startNodeObj.type === destinationCategory;
    
    // If it's a generic category search and the user is already at that category, treat it as ambiguous/null route.
    const shouldFindRoute = target && !(isAlreadyAtCategory && !destinationNodeId);
    const route = shouldFindRoute ? findRoute(startNode, target, !!accessibilityMode) : null;

    if (route) {
      suggestedPath = route.path;
      if (route.warnings.length > 0) {
        congestionAlert = route.warnings.join('. ');
      }

      // Step 3: Let Gemini draft the guidance using the route detail
      answer = await generateGuidance(
        query,
        startNode,
        route.path,
        route.totalWeight,
        route.warnings,
        detectedLanguage,
        !!accessibilityMode
      );
    } else {
      // General response or route not resolved
      const densities = getAllCrowdDensities();
      const highCongestion = densities.filter(d => d.level === 'high');
      const mediumCongestion = densities.filter(d => d.level === 'medium');

      const highNames = highCongestion
        .map(d => graphData.nodes.find(n => n.id === d.nodeId)?.name || d.nodeId);
      const mediumNames = mediumCongestion
        .map(d => graphData.nodes.find(n => n.id === d.nodeId)?.name || d.nodeId);

      const alerts: string[] = [];
      const promptWarnings: string[] = [];

      if (highNames.length > 0) {
        alerts.push(`Heavy congestion detected at: ${highNames.join(', ')}`);
        highNames.forEach(name => promptWarnings.push(`${name} is heavily congested`));
      }
      if (mediumNames.length > 0) {
        alerts.push(`Moderate congestion detected at: ${mediumNames.join(', ')}`);
        mediumNames.forEach(name => promptWarnings.push(`${name} is experiencing moderate congestion`));
      }

      if (alerts.length > 0) {
        congestionAlert = alerts.join('. ');
      }

      answer = await generateGuidance(
        query,
        startNode,
        [],
        0,
        promptWarnings,
        detectedLanguage,
        !!accessibilityMode
      );
    }

    return res.json({
      answer,
      detectedLanguage,
      suggestedPath,
      congestionAlert
    });
  } catch (error) {
    console.error('[AssistantRoute] Failed to process assistant query:', error);
    return res.status(500).json({ error: 'An unexpected internal error occurred' });
  }
});

export default router;
