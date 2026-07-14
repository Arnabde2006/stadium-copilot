import request from 'supertest';
import app from './app';

describe('Stadium Copilot API Smoke Tests', () => {
  it('should fetch the stadium graph structure', async () => {
    const res = await request(app).get('/api/assistant/graph');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('nodes');
    expect(res.body).toHaveProperty('edges');
    expect(res.body.nodes.length).toBeGreaterThan(0);
  });

  it('should fetch current crowd density levels', async () => {
    const res = await request(app).get('/api/assistant/density');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('nodeId');
    expect(res.body[0]).toHaveProperty('density');
    expect(res.body[0]).toHaveProperty('level');
  });

  it('should process routing queries successfully', async () => {
    const res = await request(app)
      .post('/api/assistant/query')
      .send({ query: 'Where is the nearest restroom?', userLocation: 'sec-100' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('answer');
    expect(res.body).toHaveProperty('detectedLanguage');
    expect(res.body).toHaveProperty('suggestedPath');
    expect(Array.isArray(res.body.suggestedPath)).toBe(true);
  });
});
