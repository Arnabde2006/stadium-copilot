import { updateCrowdDensity } from '../data/crowdDensity';
import graphData from '../data/stadiumGraph.json';

let intervalId: NodeJS.Timeout | null = null;

/**
 * Randomly updates densities for all nodes, making sure at least one node is spiked
 * to High Congestion so pathfinding has to route around it.
 */
function simulateStep(): void {
  graphData.nodes.forEach(node => {
    const roll = Math.random();
    let newDensity = 0.15;

    if (roll < 0.65) {
      // Low: 65% chance
      newDensity = 0.05 + Math.random() * 0.25;
    } else if (roll < 0.88) {
      // Medium: 23% chance
      newDensity = 0.35 + Math.random() * 0.35;
    } else {
      // High: 12% chance
      newDensity = 0.75 + Math.random() * 0.23;
    }

    updateCrowdDensity(node.id, newDensity);
  });

  // Force at least one critical section or entrance to spike to High (0.80+) 
  // to ensure routing changes are noticeable
  const spikeTargets = ['gate-c', 'gate-a', 'sec-102', 'sec-104', 'restroom-2'];
  const randomTarget = spikeTargets[Math.floor(Math.random() * spikeTargets.length)];
  updateCrowdDensity(randomTarget, 0.82 + Math.random() * 0.17);

  console.log(`[CrowdSimulator] Live density update processed. Node '${randomTarget}' spiked.`);
}

export function startCrowdSimulation(intervalMs: number = 8000): void {
  if (intervalId) return;

  simulateStep(); // Initial run
  intervalId = setInterval(() => {
    simulateStep();
  }, intervalMs);

  console.log(`[CrowdSimulator] Simulation started. Updating every ${intervalMs / 1000} seconds.`);
}

export function stopCrowdSimulation(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[CrowdSimulator] Simulation stopped.');
  }
}
