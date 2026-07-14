import graphDataRaw from '../data/stadiumGraph.json';
import { getCrowdDensity } from '../data/crowdDensity';
import { StadiumNode, StadiumGraph } from '../types';

const graphData = graphDataRaw as StadiumGraph;

interface Neighbor {
  nodeId: string;
  baseWeight: number;
  stepFree: boolean;
  lowStimulation: boolean;
}

const adjacencyList: Map<string, Neighbor[]> = new Map();

// Initialize the adjacency list
graphData.nodes.forEach(node => {
  adjacencyList.set(node.id, []);
});

graphData.edges.forEach(edge => {
  const neighborsFrom = adjacencyList.get(edge.from) || [];
  neighborsFrom.push({
    nodeId: edge.to,
    baseWeight: edge.baseWeight,
    stepFree: edge.stepFree,
    lowStimulation: edge.lowStimulation
  });
  adjacencyList.set(edge.from, neighborsFrom);

  const neighborsTo = adjacencyList.get(edge.to) || [];
  neighborsTo.push({
    nodeId: edge.from,
    baseWeight: edge.baseWeight,
    stepFree: edge.stepFree,
    lowStimulation: edge.lowStimulation
  });
  adjacencyList.set(edge.to, neighborsTo);
});

/**
 * Calculates the dynamic edge weight including congestion penalties
 */
export function getDynamicWeight(
  fromId: string,
  toId: string,
  baseWeight: number,
  lowStimulation: boolean = true,
  accessibilityMode: boolean = false
): number {
  const crowd = getCrowdDensity(toId);
  let penalty = 0;

  if (crowd.level === 'high') {
    // 2.0x base weight penalty for highly congested zones
    penalty = baseWeight * 2.0;
  } else if (crowd.level === 'medium') {
    // 0.5x base weight penalty for medium congested zones
    penalty = baseWeight * 0.5;
  }

  let accPenalty = 0;
  if (accessibilityMode && !lowStimulation) {
    // 20% penalty on noisy concourses
    accPenalty = baseWeight * 0.20;
  }

  return baseWeight + penalty + accPenalty;
}

export interface RouteResult {
  path: string[];
  totalWeight: number; // dynamically weighted path time in seconds
  warnings: string[];
}

/**
 * Finds the shortest path using Dijkstra's algorithm from a starting location.
 * The destination can be a specific nodeId (e.g. 'gate-a') or a category type (e.g. 'restroom').
 */
export function findRoute(
  startNodeId: string,
  destination: string,
  accessibilityMode: boolean = false
): RouteResult | null {
  const startNodeExists = graphData.nodes.some(n => n.id === startNodeId);
  if (!startNodeExists) {
    return null;
  }

  const isMatch = (node: StadiumNode): boolean => {
    return node.id === destination || node.type === destination;
  };

  const distances: Map<string, number> = new Map();
  const previous: Map<string, string | null> = new Map();
  const unvisited: Set<string> = new Set();

  graphData.nodes.forEach(node => {
    distances.set(node.id, Infinity);
    previous.set(node.id, null);
    unvisited.add(node.id);
  });

  distances.set(startNodeId, 0);
  let targetNodeId: string | null = null;

  while (unvisited.size > 0) {
    // Find the unvisited node with the smallest distance
    let minNodeId: string | null = null;
    let minDistance = Infinity;

    unvisited.forEach(nodeId => {
      const dist = distances.get(nodeId)!;
      if (dist < minDistance) {
        minDistance = dist;
        minNodeId = nodeId;
      }
    });

    if (minNodeId === null || minDistance === Infinity) {
      break; // Remaining nodes are unreachable
    }

    const currentNodeId = minNodeId;
    unvisited.delete(currentNodeId);

    const currentNode = graphData.nodes.find(n => n.id === currentNodeId)!;
    if (isMatch(currentNode)) {
      targetNodeId = currentNodeId;
      break;
    }

    const neighbors = adjacencyList.get(currentNodeId) || [];
    for (const neighbor of neighbors) {
      if (!unvisited.has(neighbor.nodeId)) {
        continue;
      }

      // Step-free routing: ignore stairs-only paths when accessibilityMode is active
      if (accessibilityMode && !neighbor.stepFree) {
        continue;
      }

      const weight = getDynamicWeight(
        currentNodeId,
        neighbor.nodeId,
        neighbor.baseWeight,
        neighbor.lowStimulation,
        accessibilityMode
      );
      const altDistance = minDistance + weight;

      if (altDistance < distances.get(neighbor.nodeId)!) {
        distances.set(neighbor.nodeId, altDistance);
        previous.set(neighbor.nodeId, currentNodeId);
      }
    }
  }

  if (!targetNodeId) {
    return null;
  }

  // Reconstruct path
  const path: string[] = [];
  let current: string | null = targetNodeId;
  while (current !== null) {
    path.unshift(current);
    current = previous.get(current) ?? null;
  }

  // Generate warnings for high congestion zones traversed
  const warnings: string[] = [];
  path.forEach(nodeId => {
    const crowd = getCrowdDensity(nodeId);
    if (crowd.level === 'high') {
      const node = graphData.nodes.find(n => n.id === nodeId);
      if (node) {
        warnings.push(`${node.name} is heavily congested`);
      }
    }
  });

  return {
    path,
    totalWeight: distances.get(targetNodeId)!,
    warnings
  };
}
