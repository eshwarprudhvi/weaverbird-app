const request = require('supertest');
require('../setup');

// Mock workspace repository to bypass db lookups in middleware
jest.mock('../../src/modules/workspace/workspace.repository', () => ({
  findById: jest.fn().mockResolvedValue({ id: 'test-workspace', name: 'Test Workspace' }),
  getMember: jest.fn().mockResolvedValue({ role: 'admin' })
}));

const app = require('../../src/app');
const { db } = require('../../src/config/firebase');

describe('Catalog REST API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list catalog items successfully', async () => {
    const mockItems = [
      { id: '1', name: 'Item 1', price: '10' },
      { id: '2', name: 'Item 2', price: '20' }
    ];
    
    const mockSnap = {
      empty: false,
      docs: mockItems.map(item => ({
        id: item.id,
        data: () => ({ name: item.name, price: item.price })
      }))
    };
    
    db.get.mockResolvedValue(mockSnap);

    const response = await request(app)
      .get('/api/v1/catalog')
      .set('Authorization', 'Bearer valid-token')
      .set('x-workspace-id', 'test-workspace')
      .set('X-API-Version', '2');
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.items).toHaveLength(2);
    expect(response.body.meta.apiVersion).toBe(2);
  });

  it('should validate inputs during item creation', async () => {
    const response = await request(app)
      .post('/api/v1/catalog')
      .set('Authorization', 'Bearer valid-token')
      .set('x-workspace-id', 'test-workspace')
      .set('X-API-Version', '2')
      .send({
        // Missing name and price
      });
      
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
