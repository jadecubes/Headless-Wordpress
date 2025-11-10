# API Tests for Headless WordPress

Comprehensive API test suite for the WordPress REST API endpoints used in this headless WordPress project.

## Setup

### Prerequisites

- Node.js 18+ and npm
- Docker services running (see main README)

### Installation

```bash
cd tests
npm install
```

### Configuration

Copy `.env.test` and modify if needed:

```bash
# The default configuration should work with the Docker setup
# No changes needed unless you modified the Docker configuration
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Specific Test File

```bash
npm test -- 01-jwt-auth.test.ts
```

## Test Structure

```
tests/
├── api/
│   ├── helpers/
│   │   └── api-client.ts          # Shared API client helper
│   ├── 01-jwt-auth.test.ts        # JWT authentication tests
│   ├── 02-posts.test.ts           # Posts CRUD tests
│   ├── 03-pages-media.test.ts     # Pages and media tests
│   ├── 04-taxonomy.test.ts        # Categories, tags, users tests
│   └── 05-cors-security.test.ts   # CORS and security tests
├── package.json
├── jest.config.js
├── tsconfig.json
└── .env.test
```

## Test Coverage

### 1. JWT Authentication (`01-jwt-auth.test.ts`)
- ✅ Login with valid credentials
- ✅ Invalid username/password handling
- ✅ Token validation
- ✅ Token structure verification

### 2. Posts API (`02-posts.test.ts`)
- ✅ List posts with pagination
- ✅ Get single post
- ✅ Create post (authenticated)
- ✅ Update post (authenticated)
- ✅ Delete post (authenticated)
- ✅ Query parameters (_embed, search, orderby)

### 3. Pages & Media API (`03-pages-media.test.ts`)
- ✅ List pages
- ✅ Get single page
- ✅ Create/update/delete pages
- ✅ List media items
- ✅ Get single media
- ✅ Filter media by type

### 4. Taxonomy API (`04-taxonomy.test.ts`)
- ✅ Categories (list, get, create)
- ✅ Tags (list, get, create)
- ✅ Users (list, get, current user)
- ✅ Taxonomies and post types discovery

### 5. CORS & Security (`05-cors-security.test.ts`)
- ✅ CORS headers validation
- ✅ Preflight OPTIONS requests
- ✅ Authentication security
- ✅ Error handling
- ✅ HTTP methods authorization
- ✅ Content-Type validation

## CI/CD Integration

Tests are automatically run on:
- Pull requests
- Pushes to main branch
- Manual workflow dispatch

See `.github/workflows/api-tests.yml` for the GitHub Actions configuration.

## Troubleshooting

### SSL Certificate Errors

If you see SSL/certificate errors, ensure:
1. Docker services are running
2. You've added the local domain to `/etc/hosts`:
   ```
   127.0.0.1 api.mycompany.local admin.mycompany.local
   ```

### Connection Refused

Make sure all Docker services are running:
```bash
make dev-up
```

### Authentication Failures

Verify the test credentials in `.env.test` match your WordPress admin credentials.

## Writing New Tests

Use the `ApiClient` helper class for consistency:

```typescript
import { ApiClient } from './helpers/api-client';

describe('My New Test', () => {
  let client: ApiClient;

  beforeAll(async () => {
    client = new ApiClient();
    await client.authenticate(); // If auth needed
  });

  it('should do something', async () => {
    const response = await client.get('/wp/v2/endpoint');
    expect(response.status).toBe(200);
  });
});
```

## Contributing

When adding new features to the WordPress API:
1. Add corresponding tests
2. Run the full test suite
3. Update this README if needed
