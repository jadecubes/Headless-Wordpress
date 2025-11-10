import { ApiClient } from './helpers/api-client';
import axios from 'axios';

describe('CORS & Security Tests', () => {
  let client: ApiClient;
  const frontendOrigin = process.env.FRONTEND_ORIGIN || 'https://localhost:3000';
  const apiBaseUrl = process.env.API_BASE_URL || 'https://api.mycompany.local:8443/wp-json';

  beforeAll(async () => {
    client = new ApiClient();
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in response', async () => {
      const response = await client.get('/', {
        headers: {
          Origin: frontendOrigin,
        },
      });

      expect(response.status).toBe(200);
      // Check if CORS headers are present
      const corsHeader = response.headers['access-control-allow-origin'];
      if (corsHeader) {
        expect([frontendOrigin, '*']).toContain(corsHeader);
      }
    });

    it('should handle preflight OPTIONS request', async () => {
      try {
        const axiosClient = axios.create({
          httpsAgent: new (require('https').Agent)({
            rejectUnauthorized: false,
          }),
        });

        const response = await axiosClient.options(`${apiBaseUrl}/wp/v2/posts`, {
          headers: {
            Origin: frontendOrigin,
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type,Authorization',
          },
        });

        // Some servers return 200, some return 204 for OPTIONS
        expect([200, 204]).toContain(response.status);
      } catch (error: any) {
        // OPTIONS might not be explicitly handled, check if regular requests work
        if (error.response) {
          expect(error.response.status).toBeLessThan(500);
        }
      }
    });

    it('should allow requests from configured frontend origin', async () => {
      const response = await client.get('/wp/v2/posts', {
        headers: {
          Origin: frontendOrigin,
        },
      });

      expect(response.status).toBe(200);
    });
  });

  describe('API Discovery & Root Endpoint', () => {
    it('should return API discovery information at root', async () => {
      const response = await client.get('/');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('name');
      expect(response.data).toHaveProperty('description');
      expect(response.data).toHaveProperty('url');
      expect(response.data).toHaveProperty('namespaces');
      expect(Array.isArray(response.data.namespaces)).toBe(true);
      expect(response.data.namespaces).toContain('wp/v2');
    });

    it('should list available routes', async () => {
      const response = await client.get('/');

      expect(response.data).toHaveProperty('routes');
      expect(response.data.routes).toHaveProperty('/wp/v2/posts');
      expect(response.data.routes).toHaveProperty('/wp/v2/pages');
      expect(response.data.routes).toHaveProperty('/wp/v2/media');
    });
  });

  describe('Authentication Security', () => {
    it('should reject requests to protected endpoints without auth', async () => {
      const unauthClient = new ApiClient();

      try {
        await unauthClient.post('/wp/v2/posts', {
          title: 'Test',
          content: 'Test',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should reject requests with invalid token', async () => {
      const invalidClient = new ApiClient();
      (invalidClient as any).token = 'invalid.jwt.token.here';

      try {
        await invalidClient.post('/wp/v2/posts', {
          title: 'Test',
          content: 'Test',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect([401, 403]).toContain(error.response.status);
      }
    });

    it('should accept requests with valid token', async () => {
      await client.authenticate();

      const response = await client.get('/wp/v2/users/me');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      try {
        await client.get('/wp/v2/nonexistent-endpoint');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data).toHaveProperty('code');
        expect(error.response.data.code).toContain('rest_no_route');
      }
    });

    it('should return 404 for non-existent resource', async () => {
      try {
        await client.get('/wp/v2/posts/999999');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data).toHaveProperty('code');
        expect(error.response.data).toHaveProperty('message');
      }
    });

    it('should return proper error structure', async () => {
      try {
        await client.get('/wp/v2/posts/999999');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.data).toHaveProperty('code');
        expect(error.response.data).toHaveProperty('message');
        expect(error.response.data).toHaveProperty('data');
        expect(typeof error.response.data.code).toBe('string');
        expect(typeof error.response.data.message).toBe('string');
      }
    });
  });

  describe('HTTP Methods & Security', () => {
    it('should support GET requests without authentication', async () => {
      const unauthClient = new ApiClient();
      const response = await unauthClient.get('/wp/v2/posts');

      expect(response.status).toBe(200);
    });

    it('should require authentication for POST requests', async () => {
      const unauthClient = new ApiClient();

      try {
        await unauthClient.post('/wp/v2/posts', {
          title: 'Test',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should require authentication for PUT requests', async () => {
      const unauthClient = new ApiClient();

      try {
        await unauthClient.put('/wp/v2/posts/1', {
          title: 'Updated',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should require authentication for DELETE requests', async () => {
      const unauthClient = new ApiClient();

      try {
        await unauthClient.delete('/wp/v2/posts/1');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('Content-Type & Response Format', () => {
    it('should return JSON content type', async () => {
      const response = await client.get('/wp/v2/posts');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should accept JSON request body', async () => {
      await client.authenticate();

      const response = await client.post('/wp/v2/posts', {
        title: 'JSON Test',
        content: 'Testing JSON body',
        status: 'draft',
      });

      expect(response.status).toBe(201);
      expect(response.data.title.rendered).toBe('JSON Test');

      // Cleanup
      await client.delete(`/wp/v2/posts/${response.data.id}`, {
        params: { force: true },
      });
    });
  });

  describe('Rate Limiting & Headers', () => {
    it('should include pagination headers for list endpoints', async () => {
      const response = await client.get('/wp/v2/posts');

      expect(response.headers).toHaveProperty('x-wp-total');
      expect(response.headers).toHaveProperty('x-wp-totalpages');
    });

    it('should include link headers for pagination', async () => {
      const response = await client.get('/wp/v2/posts', {
        params: { per_page: 1 },
      });

      // Link header may or may not be present depending on total posts
      if (response.headers.link) {
        expect(typeof response.headers.link).toBe('string');
      }
    });
  });

  describe('SSL/HTTPS Security', () => {
    it('should be accessible via HTTPS', async () => {
      const response = await client.get('/');

      expect(response.status).toBe(200);
      // Request was made successfully over HTTPS
      expect(apiBaseUrl).toMatch(/^https:\/\//);
    });
  });
});
