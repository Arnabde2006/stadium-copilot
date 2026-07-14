import graphDataRaw from '../data/stadiumGraph.json';
import { findRoute } from './routingService';
import { StadiumGraph } from '../types';

const graphData = graphDataRaw as StadiumGraph;

interface Member {
  id: string;
  location: string;
}

interface MemberRouteResult {
  id: string;
  path: string[];
  etaSeconds: number;
}

export interface MeetupResult {
  meetupNode: string;
  members: MemberRouteResult[];
}

/**
 * Minimax optimization search for a group meetup point.
 * Selects the node that minimizes the maximum individual travel time.
 * Breaks ties by selecting the node with the minimum sum of total travel times.
 */
export function findMeetupPoint(
  members: Member[],
  accessibilityMode: boolean = false
): MeetupResult | null {
  if (members.length === 0) {
    return null;
  }

  let bestNodeId: string | null = null;
  let bestMaxTime = Infinity;
  let bestSumTime = Infinity;
  let bestRoutes: MemberRouteResult[] = [];

  for (const candidate of graphData.nodes) {
    const candidateId = candidate.id;
    let currentMaxTime = -1;
    let currentSumTime = 0;
    const currentRoutes: MemberRouteResult[] = [];
    let isReachable = true;

    for (const member of members) {
      // Find shortest path from member location to candidate node
      const route = findRoute(member.location, candidateId, accessibilityMode);
      if (!route) {
        isReachable = false;
        break;
      }

      currentRoutes.push({
        id: member.id,
        path: route.path,
        etaSeconds: Math.round(route.totalWeight)
      });

      currentMaxTime = Math.max(currentMaxTime, route.totalWeight);
      currentSumTime += route.totalWeight;
    }

    if (!isReachable) {
      continue;
    }

    // Minimax comparison with float tolerance tie breaking
    const isBetter =
      currentMaxTime < bestMaxTime ||
      (Math.abs(currentMaxTime - bestMaxTime) < 0.001 && currentSumTime < bestSumTime);

    if (isBetter) {
      bestMaxTime = currentMaxTime;
      bestSumTime = currentSumTime;
      bestNodeId = candidateId;
      bestRoutes = currentRoutes;
    }
  }

  if (!bestNodeId) {
    return null;
  }

  return {
    meetupNode: bestNodeId,
    members: bestRoutes
  };
}
