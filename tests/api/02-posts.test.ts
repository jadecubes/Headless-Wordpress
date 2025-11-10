import { ApiClient } from './helpers/api-client';

describe('Posts API', () => {
  let client: ApiClient;
  let createdPostId: number;

  beforeAll(async () => {
    client = new ApiClient();
    // Authenticate for protected endpoints
    await client.authenticate();
  });

  afterAll(async () => {
    // Clean up: delete created post if exists
    if (createdPostId) {
      try {
        await client.delete(`/wp/v2/posts/${createdPostId}`, {
          params: { force: true },
        });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('GET /wp/v2/posts - List Posts', () => {
    it('should return a list of posts', async () => {
      const response = await client.get('/wp/v2/posts');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should respect per_page parameter', async () => {
      const response = await client.get('/wp/v2/posts', {
        params: { per_page: 5 },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeLessThanOrEqual(5);
    });

    it('should support pagination', async () => {
      const response = await client.get('/wp/v2/posts', {
        params: { per_page: 2, page: 1 },
      });

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('x-wp-total');
      expect(response.headers).toHaveProperty('x-wp-totalpages');
    });

    it('should embed related resources with _embed parameter', async () => {
      const response = await client.get('/wp/v2/posts', {
        params: { per_page: 1, _embed: true },
      });

      expect(response.status).toBe(200);
      if (response.data.length > 0) {
        expect(response.data[0]).toHaveProperty('_embedded');
      }
    });

    it('should support search parameter', async () => {
      const response = await client.get('/wp/v2/posts', {
        params: { search: 'test' },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should support orderby and order parameters', async () => {
      const response = await client.get('/wp/v2/posts', {
        params: { orderby: 'date', order: 'desc' },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('GET /wp/v2/posts/{id} - Get Single Post', () => {
    it('should return a single post by ID', async () => {
      // First get a list to have a valid ID
      const listResponse = await client.get('/wp/v2/posts', {
        params: { per_page: 1 },
      });

      if (listResponse.data.length > 0) {
        const postId = listResponse.data[0].id;
        const response = await client.get(`/wp/v2/posts/${postId}`);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('id', postId);
        expect(response.data).toHaveProperty('title');
        expect(response.data).toHaveProperty('content');
        expect(response.data).toHaveProperty('excerpt');
        expect(response.data).toHaveProperty('author');
        expect(response.data).toHaveProperty('date');
        expect(response.data).toHaveProperty('modified');
        expect(response.data).toHaveProperty('slug');
        expect(response.data).toHaveProperty('status');
        expect(response.data).toHaveProperty('type');
        expect(response.data).toHaveProperty('link');
      }
    });

    it('should return 404 for non-existent post', async () => {
      try {
        await client.get('/wp/v2/posts/999999');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data).toHaveProperty('code');
        expect(error.response.data.code).toContain('rest_post_invalid_id');
      }
    });
  });

  describe('POST /wp/v2/posts - Create Post', () => {
    it('should create a new post with authentication', async () => {
      const newPost = {
        title: 'Test Post from API',
        content: 'This is a test post created via API',
        status: 'draft',
      };

      const response = await client.post('/wp/v2/posts', newPost);

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.title.rendered).toBe(newPost.title);
      expect(response.data.status).toBe('draft');

      // Store ID for cleanup
      createdPostId = response.data.id;
    });

    it('should fail to create post without authentication', async () => {
      const unauthClient = new ApiClient();

      try {
        await unauthClient.post('/wp/v2/posts', {
          title: 'Unauthorized Post',
          content: 'This should fail',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should validate required fields', async () => {
      try {
        await client.post('/wp/v2/posts', {
          // Missing title and content
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        // WordPress might allow empty posts in some cases, so check for 4xx
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe('PUT /wp/v2/posts/{id} - Update Post', () => {
    it('should update an existing post', async () => {
      // Create a post first
      const createResponse = await client.post('/wp/v2/posts', {
        title: 'Post to Update',
        content: 'Original content',
        status: 'draft',
      });

      const postId = createResponse.data.id;

      // Update the post
      const updateResponse = await client.put(`/wp/v2/posts/${postId}`, {
        title: 'Updated Post Title',
        content: 'Updated content',
      });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data.id).toBe(postId);
      expect(updateResponse.data.title.rendered).toBe('Updated Post Title');

      // Cleanup
      await client.delete(`/wp/v2/posts/${postId}`, {
        params: { force: true },
      });
    });

    it('should fail to update non-existent post', async () => {
      try {
        await client.put('/wp/v2/posts/999999', {
          title: 'Updated Title',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('DELETE /wp/v2/posts/{id} - Delete Post', () => {
    it('should move post to trash', async () => {
      // Create a post to delete
      const createResponse = await client.post('/wp/v2/posts', {
        title: 'Post to Delete',
        content: 'This will be deleted',
        status: 'draft',
      });

      const postId = createResponse.data.id;

      // Delete (move to trash)
      const deleteResponse = await client.delete(`/wp/v2/posts/${postId}`);

      expect(deleteResponse.status).toBe(200);
      // WordPress returns the full post object when trashing (not a deleted response)
      expect(deleteResponse.data).toHaveProperty('status', 'trash');
      expect(deleteResponse.data).toHaveProperty('id', postId);

      // Permanently delete
      await client.delete(`/wp/v2/posts/${postId}`, {
        params: { force: true },
      });
    });

    it('should permanently delete post with force parameter', async () => {
      // Create a post to delete
      const createResponse = await client.post('/wp/v2/posts', {
        title: 'Post to Force Delete',
        content: 'This will be permanently deleted',
        status: 'draft',
      });

      const postId = createResponse.data.id;

      // Force delete
      const deleteResponse = await client.delete(`/wp/v2/posts/${postId}`, {
        params: { force: true },
      });

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.data).toHaveProperty('deleted', true);
    });

    it('should fail to delete without authentication', async () => {
      const unauthClient = new ApiClient();

      try {
        await unauthClient.delete('/wp/v2/posts/1');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });
});
