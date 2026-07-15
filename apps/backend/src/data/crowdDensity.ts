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

// Track the timestamp of the last manual/interval update
let lastManualUpdateTime = 0;

/**
 * A deterministic pseudo-random generator seeded by a string.
 * Returns a value between 0 and 1.
 */
function seedRandom(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
}

/**
 * Computes deterministic density values based on the current 10-second time bucket
 * to simulate dynamic crowd movements state-free.
 */
function getDynamicDensity(nodeId: string): CrowdDensity {
  const timeBucket = Math.floor(Date.now() / 10000); // 10-second window
  const roll = seedRandom(`${nodeId}_${timeBucket}`);
  let density = 0.15;

  if (roll < 0.65) {
    // Low: 65% chance
    const noise = seedRandom(`${nodeId}_${timeBucket}_noise`);
    density = 0.05 + noise * 0.25;
  } else if (roll < 0.88) {
    // Medium: 23% chance
    const noise = seedRandom(`${nodeId}_${timeBucket}_noise`);
    density = 0.35 + noise * 0.35;
  } else {
    // High: 12% chance
    const noise = seedRandom(`${nodeId}_${timeBucket}_noise`);
    density = 0.75 + noise * 0.23;
  }

  // Force at least one critical section or entrance to spike to High (0.80+)
  const spikeTargets = ['gate-c', 'gate-a', 'sec-102', 'sec-104', 'restroom-2'];
  const spikeIndex = Math.floor(seedRandom(`spike_${timeBucket}`) * spikeTargets.length);
  const spikedTarget = spikeTargets[spikeIndex];

  if (nodeId === spikedTarget) {
    const noise = seedRandom(`${nodeId}_${timeBucket}_spike_noise`);
    density = 0.82 + noise * 0.17;
  }

  const rounded = Math.max(0, Math.min(1, Math.round(density * 100) / 100));
  let level: 'low' | 'medium' | 'high' = 'low';
  
  if (rounded > 0.7) {
    level = 'high';
  } else if (rounded > 0.35) {
    level = 'medium';
  }

  return {
    nodeId,
    density: rounded,
    level
  };
}

export function getCrowdDensity(nodeId: string): CrowdDensity {
  // If the simulation is running (updated within last 20s), use the map
  if (Date.now() - lastManualUpdateTime < 20000) {
    const density = crowdDensityMap.get(nodeId);
    if (density) return density;
  }
  return getDynamicDensity(nodeId);
}

export function getAllCrowdDensities(): CrowdDensity[] {
  // If the simulation is running (updated within last 20s), use the map
  if (Date.now() - lastManualUpdateTime < 20000) {
    return Array.from(crowdDensityMap.values());
  }
  return graphData.nodes.map(node => getDynamicDensity(node.id));
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
  lastManualUpdateTime = Date.now();
}

