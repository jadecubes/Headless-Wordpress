import { ApiClient } from './helpers/api-client';

describe('Pages & Media API', () => {
  let client: ApiClient;
  let createdPageId: number;

  beforeAll(async () => {
    client = new ApiClient();
    await client.authenticate();
  });

  afterAll(async () => {
    // Cleanup
    if (createdPageId) {
      try {
        await client.delete(`/wp/v2/pages/${createdPageId}`, {
          params: { force: true },
        });
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('GET /wp/v2/pages - List Pages', () => {
    it('should return a list of pages', async () => {
      const response = await client.get('/wp/v2/pages');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should respect per_page parameter', async () => {
      const response = await client.get('/wp/v2/pages', {
        params: { per_page: 3 },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeLessThanOrEqual(3);
    });

    it('should support search parameter', async () => {
      const response = await client.get('/wp/v2/pages', {
        params: { search: 'privacy' },
      });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should return page headers with pagination info', async () => {
      const response = await client.get('/wp/v2/pages');

      expect(response.headers).toHaveProperty('x-wp-total');
      expect(response.headers).toHaveProperty('x-wp-totalpages');
    });
  });

  describe('GET /wp/v2/pages/{id} - Get Single Page', () => {
    it('should return a single page by ID', async () => {
      const listResponse = await client.get('/wp/v2/pages', {
        params: { per_page: 1 },
      });

      if (listResponse.data.length > 0) {
        const pageId = listResponse.data[0].id;
        const response = await client.get(`/wp/v2/pages/${pageId}`);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('id', pageId);
        expect(response.data).toHaveProperty('title');
        expect(response.data).toHaveProperty('content');
        expect(response.data).toHaveProperty('slug');
        expect(response.data).toHaveProperty('status');
        expect(response.data.type).toBe('page');
      }
    });

    it('should return 404 for non-existent page', async () => {
      try {
        await client.get('/wp/v2/pages/999999');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('POST /wp/v2/pages - Create Page', () => {
    it('should create a new page with authentication', async () => {
      const newPage = {
        title: 'Test Page from API',
        content: 'This is a test page created via API',
        status: 'draft',
      };

      const response = await client.post('/wp/v2/pages', newPage);

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.title.rendered).toBe(newPage.title);
      expect(response.data.status).toBe('draft');
      expect(response.data.type).toBe('page');

      createdPageId = response.data.id;
    });

    it('should fail without authentication', async () => {
      const unauthClient = new ApiClient();

      try {
        await unauthClient.post('/wp/v2/pages', {
          title: 'Unauthorized Page',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('PUT /wp/v2/pages/{id} - Update Page', () => {
    it('should update an existing page', async () => {
      const createResponse = await client.post('/wp/v2/pages', {
        title: 'Page to Update',
        content: 'Original content',
        status: 'draft',
      });

      const pageId = createResponse.data.id;

      const updateResponse = await client.put(`/wp/v2/pages/${pageId}`, {
        title: 'Updated Page Title',
      });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data.id).toBe(pageId);
      expect(updateResponse.data.title.rendered).toBe('Updated Page Title');

      await client.delete(`/wp/v2/pages/${pageId}`, {
        params: { force: true },
      });
    });
  });

  describe('DELETE /wp/v2/pages/{id} - Delete Page', () => {
    it('should permanently delete page with force parameter', async () => {
      const createResponse = await client.post('/wp/v2/pages', {
        title: 'Page to Delete',
        status: 'draft',
      });

      const pageId = createResponse.data.id;

      const deleteResponse = await client.delete(`/wp/v2/pages/${pageId}`, {
        params: { force: true },
      });

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.data).toHaveProperty('deleted', true);
    });
  });

  describe('GET /wp/v2/media - List Media', () => {
    it('should return a list of media items', async () => {
      const response = await client.get('/wp/v2/media');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should return media with proper fields', async () => {
      const response = await client.get('/wp/v2/media', {
        params: { per_page: 1 },
      });

      if (response.data.length > 0) {
        const media = response.data[0];
        expect(media).toHaveProperty('id');
        expect(media).toHaveProperty('title');
        expect(media).toHaveProperty('source_url');
        expect(media).toHaveProperty('mime_type');
        expect(media).toHaveProperty('media_type');
        expect(media).toHaveProperty('media_details');
      }
    });

    it('should filter by media_type', async () => {
      const response = await client.get('/wp/v2/media', {
        params: { media_type: 'image' },
      });

      expect(response.status).toBe(200);
      response.data.forEach((media: any) => {
        expect(media.media_type).toBe('image');
      });
    });

    it('should filter by mime_type', async () => {
      const response = await client.get('/wp/v2/media', {
        params: { mime_type: 'image/jpeg' },
      });

      expect(response.status).toBe(200);
      if (response.data.length > 0) {
        response.data.forEach((media: any) => {
          expect(media.mime_type).toBe('image/jpeg');
        });
      }
    });
  });

  describe('GET /wp/v2/media/{id} - Get Single Media', () => {
    it('should return a single media item by ID', async () => {
      const listResponse = await client.get('/wp/v2/media', {
        params: { per_page: 1 },
      });

      if (listResponse.data.length > 0) {
        const mediaId = listResponse.data[0].id;
        const response = await client.get(`/wp/v2/media/${mediaId}`);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('id', mediaId);
        expect(response.data).toHaveProperty('source_url');
        expect(response.data).toHaveProperty('media_details');
      }
    });

    it('should return 404 for non-existent media', async () => {
      try {
        await client.get('/wp/v2/media/999999');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });
});
