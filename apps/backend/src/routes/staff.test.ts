import request from 'supertest';
import app from '../app';

describe('Staff Incident API Smoke Tests', () => {
  let authToken = '';

  beforeAll(async () => {
    // Authenticate first using the default demo passcode
    const res = await request(app)
      .post('/api/staff/auth')
      .send({ code: 'demo-passcode' });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    authToken = res.body.token;
  });

  it('should return 401 Unauthorized if token is missing or invalid', async () => {
    const res = await request(app)
      .post('/api/staff/report')
      .send({ input: 'test' });
    expect(res.status).toBe(401);
  });

  it('should successfully log a new incident report and return the structured report structure when authenticated', async () => {
    const input = 'There is a facility issue, a water leak in Restroom 2 concourse';
    const res = await request(app)
      .post('/api/staff/report')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ input });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('category');
    expect(res.body).toHaveProperty('location');
    expect(res.body).toHaveProperty('urgency');
    expect(res.body).toHaveProperty('summary');
    expect(res.body).toHaveProperty('rawInput');
    expect(res.body).toHaveProperty('timestamp');

    expect(res.body.rawInput).toBe(input);
    expect(res.body.category).toBe('facility');
    expect(res.body.location).toBe('Restroom 2');
    expect(res.body.urgency).toBe('medium');
  });

  it('should retrieve all logged incidents sorted by date when authenticated', async () => {
    const res = await request(app)
      .get('/api/staff/reports')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    
    const report = res.body[0];
    expect(report).toHaveProperty('id');
    expect(report).toHaveProperty('category');
    expect(report).toHaveProperty('location');
    expect(report).toHaveProperty('urgency');
    expect(report).toHaveProperty('timestamp');
  });

  it('should return 400 bad request if input is missing or empty when authenticated', async () => {
    const res = await request(app)
      .post('/api/staff/report')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

