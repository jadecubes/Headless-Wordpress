import { ApiClient } from './helpers/api-client';

describe('Taxonomy API (Categories, Tags, Users)', () => {
  let client: ApiClient;
  let createdCategoryId: number;
  let createdTagId: number;

  beforeAll(async () => {
    client = new ApiClient();
    await client.authenticate();
  });

  afterAll(async () => {
    // Cleanup
    if (createdCategoryId) {
      try {
        await client.delete(`/wp/v2/categories/${createdCategoryId}`, {
          params: { force: true },
        });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    if (createdTagId) {
      try {
        await client.delete(`/wp/v2/tags/${createdTagId}`, {
          params: { force: true },
        });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('GET /wp/v2/categories - List Categories', () => {
    it('should return a list of categories', async () => {
      const response = await client.get('/wp/v2/categories');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should return category with proper fields', async () => {
      const response = await client.get('/wp/v2/categories', {
        params: { per_page: 1 },
      });

      if (response.data.length > 0) {
        const category = response.data[0];
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('slug');
        expect(category).toHaveProperty('description');
        expect(category).toHaveProperty('count');
        expect(category).toHaveProperty('link');
      }
    });

    it('should support search parameter', async () => {
      const response = await client.get('/wp/v2/categories', {
        params: { search: 'uncategorized' },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should support ordering', async () => {
      const response = await client.get('/wp/v2/categories', {
        params: { orderby: 'name', order: 'asc' },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('GET /wp/v2/categories/{id} - Get Single Category', () => {
    it('should return a single category by ID', async () => {
      const listResponse = await client.get('/wp/v2/categories', {
        params: { per_page: 1 },
      });

      if (listResponse.data.length > 0) {
        const categoryId = listResponse.data[0].id;
        const response = await client.get(`/wp/v2/categories/${categoryId}`);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('id', categoryId);
        expect(response.data).toHaveProperty('name');
        expect(response.data).toHaveProperty('slug');
      }
    });

    it('should return 404 for non-existent category', async () => {
      try {
        await client.get('/wp/v2/categories/999999');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('POST /wp/v2/categories - Create Category', () => {
    it('should create a new category with authentication', async () => {
      const newCategory = {
        name: 'Test Category from API',
        description: 'A test category',
      };

      const response = await client.post('/wp/v2/categories', newCategory);

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.name).toBe(newCategory.name);
      expect(response.data.description).toBe(newCategory.description);

      createdCategoryId = response.data.id;
    });

    it('should fail without authentication', async () => {
      const unauthClient = new ApiClient();

      try {
        await unauthClient.post('/wp/v2/categories', {
          name: 'Unauthorized Category',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('GET /wp/v2/tags - List Tags', () => {
    it('should return a list of tags', async () => {
      const response = await client.get('/wp/v2/tags');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should return tag with proper fields', async () => {
      const response = await client.get('/wp/v2/tags', {
        params: { per_page: 1 },
      });

      if (response.data.length > 0) {
        const tag = response.data[0];
        expect(tag).toHaveProperty('id');
        expect(tag).toHaveProperty('name');
        expect(tag).toHaveProperty('slug');
        expect(tag).toHaveProperty('description');
        expect(tag).toHaveProperty('count');
      }
    });

    it('should support pagination', async () => {
      const response = await client.get('/wp/v2/tags', {
        params: { per_page: 5 },
      });

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('x-wp-total');
    });
  });

  describe('GET /wp/v2/tags/{id} - Get Single Tag', () => {
    it('should return a single tag by ID', async () => {
      const listResponse = await client.get('/wp/v2/tags', {
        params: { per_page: 1 },
      });

      if (listResponse.data.length > 0) {
        const tagId = listResponse.data[0].id;
        const response = await client.get(`/wp/v2/tags/${tagId}`);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('id', tagId);
        expect(response.data).toHaveProperty('name');
      }
    });

    it('should return 404 for non-existent tag', async () => {
      try {
        await client.get('/wp/v2/tags/999999');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('POST /wp/v2/tags - Create Tag', () => {
    it('should create a new tag with authentication', async () => {
      const newTag = {
        name: 'Test Tag from API',
        description: 'A test tag',
      };

      const response = await client.post('/wp/v2/tags', newTag);

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.name).toBe(newTag.name);

      createdTagId = response.data.id;
    });
  });

  describe('GET /wp/v2/users - List Users', () => {
    it('should return a list of users', async () => {
      const response = await client.get('/wp/v2/users');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should return user with proper fields', async () => {
      const response = await client.get('/wp/v2/users', {
        params: { per_page: 1 },
      });

      if (response.data.length > 0) {
        const user = response.data[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('url');
        expect(user).toHaveProperty('description');
        expect(user).toHaveProperty('link');
        expect(user).toHaveProperty('slug');
        expect(user).toHaveProperty('avatar_urls');
        // Sensitive fields should not be exposed
        expect(user).not.toHaveProperty('email');
        expect(user).not.toHaveProperty('password');
      }
    });
  });

  describe('GET /wp/v2/users/{id} - Get Single User', () => {
    it('should return a single user by ID', async () => {
      const listResponse = await client.get('/wp/v2/users');

      if (listResponse.data.length > 0) {
        const userId = listResponse.data[0].id;
        const response = await client.get(`/wp/v2/users/${userId}`);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('id', userId);
        expect(response.data).toHaveProperty('name');
      }
    });
  });

  describe('GET /wp/v2/users/me - Get Current User', () => {
    it('should return current authenticated user', async () => {
      const response = await client.get('/wp/v2/users/me');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('name');
      expect(response.data).toHaveProperty('slug');
      // Note: email is not returned by /wp/v2/users/me endpoint for security reasons
    });

    it('should fail without authentication', async () => {
      const unauthClient = new ApiClient();

      try {
        await unauthClient.get('/wp/v2/users/me');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('GET /wp/v2/taxonomies - List Taxonomies', () => {
    it('should return available taxonomies', async () => {
      const response = await client.get('/wp/v2/taxonomies');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('category');
      expect(response.data).toHaveProperty('post_tag');
    });
  });

  describe('GET /wp/v2/types - List Post Types', () => {
    it('should return available post types', async () => {
      const response = await client.get('/wp/v2/types');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('post');
      expect(response.data).toHaveProperty('page');
    });
  });
});
