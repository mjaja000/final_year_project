const request = require('supertest');

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
  on: jest.fn(),
}));

const app = require('../../src/app');

describe('API smoke tests', () => {
  test('GET /health returns API status payload', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'API is running');
    expect(response.body).toHaveProperty('timestamp');
  });

  test('GET / returns platform metadata', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('status', 'operational');
    expect(response.body).toHaveProperty('endpoints');
  });

  test('unknown route returns 404 JSON', async () => {
    const response = await request(app).get('/this-route-does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Route not found' });
  });
});
