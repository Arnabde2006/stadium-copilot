import { StadiumGraph, CrowdDensity, QueryResponse, ReuniteMemberInput, ReuniteResponse } from '../types';

const API_PREFIX = '/api/assistant';

/**
 * Fetch the static stadium nodes and edge layout
 */
export async function fetchGraph(): Promise<StadiumGraph> {
  const response = await fetch(`${API_PREFIX}/graph`);
  if (!response.ok) {
    throw new Error('Could not retrieve stadium graph specifications');
  }
  return response.json();
}

/**
 * Fetch dynamic live crowd density details from the simulation store
 */
export async function fetchDensities(): Promise<CrowdDensity[]> {
  const response = await fetch(`${API_PREFIX}/density`);
  if (!response.ok) {
    throw new Error('Could not retrieve live crowd congestion densities');
  }
  return response.json();
}

/**
 * Submit a navigation/assistance query to the assistant
 */
export async function queryAssistant(
  query: string,
  userLocation?: string,
  accessibilityMode?: boolean
): Promise<QueryResponse> {
  const response = await fetch(`${API_PREFIX}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, userLocation, accessibilityMode }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || 'Failed to generate assistance guidance');
  }
  return response.json();
}

/**
 * Submit group reunion request to locate optimum minimax meetup coordinate
 */
export async function reuniteMembers(
  members: ReuniteMemberInput[],
  accessibilityMode?: boolean
): Promise<ReuniteResponse> {
  const response = await fetch(`${API_PREFIX}/reunite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ members, accessibilityMode }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || 'Failed to process group reunite meetup');
  }
  return response.json();
}
