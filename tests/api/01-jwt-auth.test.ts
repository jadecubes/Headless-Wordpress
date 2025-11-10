import { ApiClient } from './helpers/api-client';

describe('JWT Authentication API', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient();
  });

  describe('POST /jwt-auth/v1/token - Login', () => {
    it('should successfully authenticate with valid credentials', async () => {
      const response = await client.post('/jwt-auth/v1/token', {
        username: process.env.WP_TEST_USERNAME,
        password: process.env.WP_TEST_PASSWORD,
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('user_email');
      expect(response.data).toHaveProperty('user_nicename');
      expect(response.data).toHaveProperty('user_display_name');
      expect(typeof response.data.token).toBe('string');
      expect(response.data.token.length).toBeGreaterThan(0);
    });

    it('should fail with invalid username', async () => {
      try {
        await client.post('/jwt-auth/v1/token', {
          username: 'invaliduser123',
          password: process.env.WP_TEST_PASSWORD,
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(403);
        expect(error.response.data).toHaveProperty('code');
        expect(error.response.data.code).toMatch(/invalid/i);
      }
    });

    it('should fail with invalid password', async () => {
      try {
        await client.post('/jwt-auth/v1/token', {
          username: process.env.WP_TEST_USERNAME,
          password: 'wrongpassword123',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(403);
        expect(error.response.data).toHaveProperty('code');
      }
    });

    it('should fail with missing credentials', async () => {
      try {
        await client.post('/jwt-auth/v1/token', {});
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe('POST /jwt-auth/v1/token/validate - Validate Token', () => {
    it('should validate a valid JWT token', async () => {
      // First, get a valid token
      const token = await client.authenticate();

      const response = await client.post('/jwt-auth/v1/token/validate');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('code');
      expect(response.data.code).toBe('jwt_auth_valid_token');
    });

    it('should reject request without token', async () => {
      try {
        await client.post('/jwt-auth/v1/token/validate');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });

    it('should reject invalid token', async () => {
      // Manually set an invalid token
      const invalidClient = new ApiClient();
      (invalidClient as any).token = 'invalid.jwt.token';

      try {
        await invalidClient.post('/jwt-auth/v1/token/validate');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe('Token Structure', () => {
    it('should return JWT token in correct format', async () => {
      const response = await client.post('/jwt-auth/v1/token', {
        username: process.env.WP_TEST_USERNAME,
        password: process.env.WP_TEST_PASSWORD,
      });

      const token = response.data.token;

      // JWT tokens have 3 parts separated by dots
      const parts = token.split('.');
      expect(parts.length).toBe(3);

      // Each part should be base64 encoded
      parts.forEach((part: string) => {
        expect(part.length).toBeGreaterThan(0);
        // Should not contain spaces or special characters except base64
        expect(part).toMatch(/^[A-Za-z0-9_-]+$/);
      });
    });

    it('should return consistent user data', async () => {
      const response = await client.post('/jwt-auth/v1/token', {
        username: process.env.WP_TEST_USERNAME,
        password: process.env.WP_TEST_PASSWORD,
      });

      expect(response.data.user_email).toBe(process.env.WP_TEST_EMAIL);
      expect(response.data.user_nicename).toBeTruthy();
      expect(response.data.user_display_name).toBeTruthy();
    });
  });
});
