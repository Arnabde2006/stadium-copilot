import { Router, Request, Response } from 'express';
import { reportIncident } from '../services/incidentService';
import { getIncidents } from '../data/incidentLog';

const router = Router();

/**
 * POST /api/staff/report
 * Expects { input: string } in body.
 * Parses free-text using Gemini/fallback and logs the incident report.
 */
router.post('/report', async (req: Request, res: Response) => {
  try {
    const { input } = req.body;
    
    if (!input || typeof input !== 'string') {
      return res.status(400).json({ error: 'Input must be a non-empty string' });
    }

    const report = await reportIncident(input);
    return res.json(report);
  } catch (error) {
    console.error('[StaffRoute] Failed to process staff incident report:', error);
    return res.status(500).json({ error: 'An unexpected internal error occurred' });
  }
});

/**
 * GET /api/staff/reports
 * Returns all logged incidents, sorted by timestamp (most recent first).
 */
router.get('/reports', (req: Request, res: Response) => {
  try {
    const incidents = getIncidents();
    // Sort in-place/copy by date descending (most recent first)
    const sorted = [...incidents].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    return res.json(sorted);
  } catch (error) {
    console.error('[StaffRoute] Failed to retrieve incidents:', error);
    return res.status(500).json({ error: 'An unexpected internal error occurred' });
  }
});

export default router;
