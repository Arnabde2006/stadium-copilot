import { Router, Request, Response, NextFunction } from 'express';
import { reportIncident } from '../services/incidentService';
import { getIncidents } from '../data/incidentLog';
import crypto from 'crypto';

const router = Router();

// In-memory store for staff tokens: token -> expiresAt (timestamp)
const staffSessions = new Map<string, number>();

// Cleanup expired sessions periodically (every 1 hour)
setInterval(() => {
  const now = Date.now();
  for (const [token, expiresAt] of staffSessions.entries()) {
    if (expiresAt < now) {
      staffSessions.delete(token);
    }
  }
}, 60 * 60 * 1000);

/**
 * Middleware to verify staff access token passed via Authorization: Bearer <token>
 */
export function verifyStaffToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.slice(7).trim();
  const expiresAt = staffSessions.get(token);

  if (!expiresAt) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  if (expiresAt < Date.now()) {
    staffSessions.delete(token);
    return res.status(401).json({ error: 'Unauthorized: Token expired' });
  }

  next();
}

/**
 * POST /api/staff/auth
 * Expects { code: string } in body.
 * Verifies staff access code with constant-time comparison and returns a session token.
 */
router.post('/auth', (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (typeof code !== 'string') {
      return res.status(400).json({ error: 'Invalid request: code must be a string' });
    }

    const expectedCode = process.env.STAFF_ACCESS_CODE || 'demo-passcode';
    const secret = process.env.STAFF_TOKEN_SECRET || 'super-secret-token-key';

    // Prevent timing attacks by comparing HMAC hashes of unequal/arbitrary lengths in constant time.
    const hmacExpected = crypto.createHmac('sha256', secret).update(expectedCode).digest();
    const hmacActual = crypto.createHmac('sha256', secret).update(code).digest();

    if (!crypto.timingSafeEqual(hmacExpected, hmacActual)) {
      return res.status(401).json({ error: 'Incorrect passcode' });
    }

    // Generate random session token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresIn = 4 * 60 * 60; // 4 hours in seconds
    const expiresAt = Date.now() + expiresIn * 1000;

    staffSessions.set(token, expiresAt);

    return res.json({ token, expiresIn });
  } catch (error) {
    console.error('[StaffRoute] Auth error:', error);
    return res.status(500).json({ error: 'An unexpected internal error occurred' });
  }
});

/**
 * POST /api/staff/report
 * Expects { input: string } in body.
 * Parses free-text using Gemini/fallback and logs the incident report.
 */
router.post('/report', verifyStaffToken, async (req: Request, res: Response) => {
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
router.get('/reports', verifyStaffToken, (req: Request, res: Response) => {
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

