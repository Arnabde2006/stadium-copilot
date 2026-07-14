import request from 'supertest';
import app from '../app';

describe('Reunite Group API Smoke Tests', () => {
  it('should calculate the optimal meetup point and route members successfully', async () => {
    const res = await request(app)
      .post('/api/assistant/reunite')
      .send({
        members: [
          { id: 'm1', name: 'Alice', location: 'sec-100', locale: 'en' },
          { id: 'm2', name: 'Bob', location: 'sec-103', locale: 'es' },
          { id: 'm3', name: 'Charlie', location: 'gate-b', locale: 'fr' }
        ],
        accessibilityMode: false
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('meetupNode');
    expect(res.body).toHaveProperty('members');
    expect(Array.isArray(res.body.members)).toBe(true);
    expect(res.body.members.length).toBe(3);

    res.body.members.forEach((member: any) => {
      expect(member).toHaveProperty('id');
      expect(member).toHaveProperty('answer');
      expect(member).toHaveProperty('detectedLanguage');
      expect(member).toHaveProperty('route');
      expect(member).toHaveProperty('etaSeconds');
      expect(Array.isArray(member.route)).toBe(true);
      expect(member.route.length).toBeGreaterThan(0);
    });
  });
});
