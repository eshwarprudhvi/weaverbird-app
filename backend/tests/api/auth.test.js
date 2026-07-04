const request = require('supertest');
const express = require('express');

// We need to mock firebase-admin before requiring app
require('../setup');
const app = require('../../src/app');

describe('Auth Middleware', () => {
  it('should return 401 Unauthorized if no token is provided', async () => {
    // Assuming /api/v1/workspace/profile requires auth
    const response = await request(app).get('/api/v1/workspace/profile');
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('should return 400 Bad Request if workspace ID is missing but token is provided', async () => {
    const response = await request(app)
      .get('/api/v1/workspace/profile')
      .set('Authorization', 'Bearer valid-token');
    
    // Auth passes, but requireWorkspace middleware fails
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/workspace id/i);
  });
});
