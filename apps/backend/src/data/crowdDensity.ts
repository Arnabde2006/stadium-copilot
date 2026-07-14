import { CrowdDensity } from '../types';
import graphData from './stadiumGraph.json';

// Initialize all nodes to a default low density
export const crowdDensityMap: Map<string, CrowdDensity> = new Map(
  graphData.nodes.map(node => [
    node.id,
    {
      nodeId: node.id,
      density: 0.15,
      level: 'low'
    }
  ])
);

export function getCrowdDensity(nodeId: string): CrowdDensity {
  const density = crowdDensityMap.get(nodeId);
  if (!density) {
    return { nodeId, density: 0.0, level: 'low' };
  }
  return density;
}

export function getAllCrowdDensities(): CrowdDensity[] {
  return Array.from(crowdDensityMap.values());
}

export function updateCrowdDensity(nodeId: string, densityValue: number): void {
  const rounded = Math.max(0, Math.min(1, Math.round(densityValue * 100) / 100));
  let level: 'low' | 'medium' | 'high' = 'low';
  
  if (rounded > 0.7) {
    level = 'high';
  } else if (rounded > 0.35) {
    level = 'medium';
  }

  crowdDensityMap.set(nodeId, {
    nodeId,
    density: rounded,
    level
  });
}
