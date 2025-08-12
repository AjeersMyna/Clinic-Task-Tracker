const request = require('supertest');
const app = require('../server.js'); // Assuming your main server file is named server.js

describe('Server Endpoints', () => {
  it('should return a 404 for a non-existent route', async () => {
    const res = await request(app).get('/api/non-existent-route');
    expect(res.statusCode).toEqual(404);
  });
});