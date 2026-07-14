import { Router, Request, Response } from 'express';
import { findMeetupPoint } from '../services/groupService';
import { generateGuidance } from '../services/llmService';
import { getCrowdDensity } from '../data/crowdDensity';
import graphData from '../data/stadiumGraph.json';

const router = Router();

/**
 * POST /api/assistant/reunite
 * Group meetup route finding optimal minimax meetup node and generating individual guides.
 */
router.post('/reunite', async (req: Request, res: Response) => {
  try {
    const { members, accessibilityMode } = req.body;

    if (!members || !Array.isArray(members) || members.length < 2) {
      return res.status(400).json({ error: 'Reunite mode requires an array of at least 2 members' });
    }

    // Call minimax optimizer
    const meetupResult = findMeetupPoint(members, !!accessibilityMode);
    if (!meetupResult) {
      return res.status(500).json({ error: 'Could not resolve a suitable meetup point' });
    }

    const meetupNodeObj = graphData.nodes.find(n => n.id === meetupResult.meetupNode);
    const meetupNodeName = meetupNodeObj ? meetupNodeObj.name : meetupResult.meetupNode;

    // Parallelize translation/generation prompts for all members
    const memberResponses = await Promise.all(
      meetupResult.members.map(async mRoute => {
        const inputData = members.find(m => m.id === mRoute.id)!;
        const locale = inputData.locale || 'en';

        // Recalculate node warnings along this individual path
        const warnings: string[] = [];
        mRoute.path.forEach(nodeId => {
          const crowd = getCrowdDensity(nodeId);
          if (crowd.level === 'high') {
            const node = graphData.nodes.find(n => n.id === nodeId);
            if (node) {
              warnings.push(`${node.name} is heavily congested`);
            }
          }
        });

        // Form query text grounded on member names and targets
        const query = inputData.name
          ? `How do I meet up with my group? My name is ${inputData.name} and the calculated meeting point is ${meetupNodeName}.`
          : `How do I meet up with my group? The meeting point is ${meetupNodeName}.`;

        const answer = await generateGuidance(
          query,
          inputData.location,
          mRoute.path,
          mRoute.etaSeconds,
          warnings,
          locale,
          !!accessibilityMode
        );

        return {
          id: mRoute.id,
          answer,
          detectedLanguage: locale,
          route: mRoute.path,
          etaSeconds: mRoute.etaSeconds
        };
      })
    );

    return res.json({
      meetupNode: meetupResult.meetupNode,
      members: memberResponses
    });
  } catch (error) {
    console.error('[ReuniteRoute] Failed to process group meetup:', error);
    return res.status(500).json({ error: 'An unexpected internal error occurred during group routing' });
  }
});

export default router;
