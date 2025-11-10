<div align="center">

# 🚀 Headless WordPress

**A modern headless CMS setup using WordPress as a backend with a custom React frontend**

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![WordPress](https://img.shields.io/badge/WordPress-6.x-21759B?logo=wordpress&logoColor=white)](https://wordpress.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Nginx](https://img.shields.io/badge/Nginx-Reverse%20Proxy-009639?logo=nginx&logoColor=white)](https://nginx.org/)

[![MariaDB](https://img.shields.io/badge/MariaDB-Database-003545?logo=mariadb&logoColor=white)](https://mariadb.org/)
[![Grafana](https://img.shields.io/badge/Grafana-Monitoring-F46800?logo=grafana&logoColor=white)](https://grafana.com/)
[![Loki](https://img.shields.io/badge/Loki-Logging-F46800?logo=grafana&logoColor=white)](https://grafana.com/loki)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/yourusername/Headless-Wordpress/graphs/commit-activity)

</div>

---

## Why Headless WordPress?

- **Decoupled Architecture** - Use WordPress solely as a content management backend via REST API
- **Modern Frontend** - Build with React and modern JavaScript frameworks for optimal performance
- **Scalability** - Scale frontend and backend independently based on your needs
- **Developer Experience** - Local development environment with Docker, HTTPS, and observability tools included
- **Flexibility** - Complete control over your frontend while leveraging WordPress's powerful content management

---

## Features

✨ **Complete Docker Setup** - Pre-configured Docker Compose with all services
🔒 **HTTPS in Development** - Local SSL certificates using mkcert
📊 **Observability Stack** - Integrated Grafana, Loki, and Promtail for monitoring
🔄 **Reverse Proxy** - Nginx reverse proxy with separate admin and API endpoints
🗄️ **Database Management** - Adminer included for easy database access
🚀 **Production-Ready** - Architecture designed for easy deployment to production

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed
- [mkcert](https://github.com/FiloSottile/mkcert) for local SSL certificates (optional, certs included)
- Make utility (usually pre-installed on Mac/Linux)

---

## Getting Started

### Quick Start

```bash
# Build the Docker images
make dev-build

# Start all services
make dev-up

# Stop all services
make dev-down
```

### Access Points

Once started, you can access:

- **Admin Portal**: https://admin.mycompany.local:8443
- **REST API**: https://api.mycompany.local:8443/wp-json
- **Frontend**: https://mycompany.local:8443 (proxied to localhost:3000 in dev)
- **Direct WordPress**: http://localhost:8080
- **Adminer (DB GUI)**: http://localhost:9091
- **Grafana**: http://localhost:3001

<img width="1721" height="999" alt="WordPress Admin Interface" src="https://github.com/user-attachments/assets/b73b31f6-9b19-4037-8844-3768bb542f88" />

---

## Architecture

The project uses a containerized microservices architecture. The following sequence diagram illustrates how different components interact in typical user scenarios:

```mermaid
sequenceDiagram
    autonumber
    participant Browser
    participant FrontendSPA as Frontend SPA<br/>(React)<br/>localhost:3000
    participant Nginx as Reverse Proxy<br/>(Nginx)<br/>:8443
    participant WordPress as WordPress<br/>(Apache + PHP)<br/>:8080
    participant DB as MariaDB<br/>Database<br/>:3306
    participant Promtail as Promtail<br/>(Log Shipper)
    participant Loki as Loki<br/>(Log Storage)<br/>:3100
    participant Grafana as Grafana<br/>(Dashboards)<br/>:3001
    participant Adminer as Adminer<br/>(DB GUI)<br/>:9091

    Note over Browser,Adminer: Docker Network (Bridge)

    rect rgb(230, 245, 255)
        Note over Browser,WordPress: Scenario 1: Admin Access WordPress Dashboard
        Browser->>Nginx: HTTPS GET https://admin.mycompany.local:8443/wp-admin
        Nginx->>Nginx: SSL termination (port 8443→443)
        Nginx->>WordPress: HTTP GET /wp-admin (port 80)
        WordPress->>DB: Query user credentials (port 3306)
        DB-->>WordPress: User data
        WordPress-->>Nginx: HTML response (WP Admin UI)
        Nginx-->>Browser: HTTPS response
        WordPress->>Promtail: Ship Apache/PHP logs
        Promtail->>Loki: Push logs (port 3100)
    end

    rect rgb(240, 255, 240)
        Note over Browser,WordPress: Scenario 2: Frontend Fetches Content via API
        Browser->>FrontendSPA: Visit https://mycompany.local:8443
        FrontendSPA->>Nginx: HTTPS GET https://api.mycompany.local:8443/wp-json/wp/v2/posts<br/>Origin: https://localhost:3000
        Nginx->>Nginx: SSL termination
        Nginx->>WordPress: HTTP GET /wp-json/wp/v2/posts
        WordPress->>WordPress: Check CORS headers<br/>(allowed origin: localhost:3000)
        WordPress->>DB: SELECT * FROM wp_posts
        DB-->>WordPress: Posts data (JSON)
        WordPress-->>Nginx: JSON response + CORS headers
        Nginx-->>FrontendSPA: HTTPS JSON response
        FrontendSPA->>FrontendSPA: Render posts in React
        FrontendSPA-->>Browser: Display content
        WordPress->>Promtail: Ship API request logs
        Promtail->>Loki: Push logs
    end

    rect rgb(255, 245, 230)
        Note over Browser,WordPress: Scenario 3: Authenticated API Request (Create Post)
        FrontendSPA->>Nginx: POST https://api.mycompany.local:8443/wp-json/jwt-auth/v1/token<br/>{username, password}
        Nginx->>WordPress: POST /jwt-auth/v1/token
        WordPress->>DB: Verify user credentials
        DB-->>WordPress: User authenticated
        WordPress-->>Nginx: 200 OK {token: "eyJhbGc..."}
        Nginx-->>FrontendSPA: JWT token

        FrontendSPA->>Nginx: POST https://api.mycompany.local:8443/wp-json/wp/v2/posts<br/>Authorization: Bearer eyJhbGc...<br/>{title, content}
        Nginx->>WordPress: POST /wp-json/wp/v2/posts
        WordPress->>WordPress: Validate JWT token
        WordPress->>DB: INSERT INTO wp_posts (title, content, ...)
        DB-->>WordPress: Post created (ID: 123)
        WordPress-->>Nginx: 201 Created {id: 123, ...}
        Nginx-->>FrontendSPA: Post created successfully
        WordPress->>Promtail: Ship logs
        Promtail->>Loki: Push logs
    end

    rect rgb(255, 240, 245)
        Note over Browser,DB: Scenario 4: Database Management via Adminer
        Browser->>Adminer: HTTP GET http://localhost:9091
        Adminer->>DB: Connect to MariaDB (port 3306)
        DB-->>Adminer: Connection established
        Adminer-->>Browser: Database UI
        Browser->>Adminer: SQL query: SELECT * FROM wp_posts
        Adminer->>DB: Execute query
        DB-->>Adminer: Query results
        Adminer-->>Browser: Display results
    end

    rect rgb(248, 248, 255)
        Note over Browser,Grafana: Scenario 5: Monitoring & Observability
        Browser->>Grafana: HTTP GET http://localhost:3001
        Grafana->>Loki: Query logs (port 3100)
        Loki-->>Grafana: Aggregated logs
        Grafana-->>Browser: Dashboard with logs/metrics
    end

    rect rgb(255, 250, 240)
        Note over Browser,WordPress: Scenario 6: Direct WordPress Access (Development)
        Browser->>WordPress: HTTP GET http://localhost:8080
        Note right of WordPress: Bypasses reverse proxy<br/>for debugging
        WordPress->>DB: Query data
        DB-->>WordPress: Response
        WordPress-->>Browser: WordPress site
    end
```

---

### Service Breakdown

| Service | Purpose | Port Mapping |
|---------|---------|-------------|
| **reverse-proxy** | Nginx reverse proxy with SSL termination | 8081→80, 8443→443 |
| **wordpress** | WordPress backend (Apache + PHP) | 8080→80 |
| **mariadb** | MySQL database | Internal 3306 |
| **adminer** | Database management UI | 9091→8080 |
| **promtail** | Log shipping agent | - |
| **loki** | Log aggregation and storage | Internal 3100 |
| **grafana** | Monitoring dashboards | 3001→3000 |
| **Frontend** | React SPA (development) | 3000 |

---

## Endpoint Reference

### WordPress Admin
- **URL**: https://admin.mycompany.local:8443
- **Purpose**: WordPress login and admin dashboard (no public site)
- **Direct Access**: http://localhost:8080 (bypasses reverse proxy)

### REST API
- **URL**: https://api.mycompany.local:8443/wp-json
- **Purpose**: WordPress REST API for headless CMS
- **CORS**: Configured to allow https://localhost:3000

### Frontend
- **URL**: https://mycompany.local:8443
- **Purpose**: React frontend application
- **Development**: Proxied to localhost:3000

---

## Development

### SSL Certificates

The project includes SSL certificates generated using [mkcert](https://github.com/FiloSottile/mkcert) for local development with HTTPS.

To regenerate certificates:

```bash
mkcert \
  -cert-file reverse-proxy/certs/certs/api.crt \
  -key-file  reverse-proxy/certs/private/api.key \
  "api.mycompany.local" "admin.mycompany.local" "localhost" "127.0.0.1" "::1"
```

### Environment Configuration

This is a complete development environment included in the repository. All configuration files are pre-configured for local development on Mac Silicon (also works on other platforms with Docker support).

### Monitoring & Logs

Access Grafana at http://localhost:3001 to view:
- Application logs (aggregated by Loki)
- Container metrics
- Custom dashboards

---

## Testing

The project includes a comprehensive API test suite covering all WordPress REST API endpoints.

### Test Flow Architecture

The following sequence diagram illustrates how the test infrastructure works:

```mermaid
sequenceDiagram
    autonumber
    participant GHA as GitHub Actions
    participant Make as Makefile
    participant Compose as Docker Compose
    participant DB as MariaDB Container
    participant WP as WordPress Container
    participant Setup as Setup Container
    participant Nginx as Reverse Proxy
    participant Tests as Jest Test Suite
    participant API as WordPress REST API

    Note over GHA,API: CI/CD Test Execution Flow

    GHA->>Make: make dev-build
    Make->>Compose: docker compose build
    Compose->>WP: Build WordPress image
    Compose->>Nginx: Build Nginx image

    GHA->>Make: make dev-up
    Make->>Compose: docker compose up -d
    Compose->>DB: Start MariaDB container
    activate DB
    DB->>DB: Initialize database
    DB->>DB: Health check (mariadb-admin ping)

    Compose->>WP: Start WordPress container
    activate WP
    WP->>DB: Connect to database (port 3306)
    WP->>WP: Initialize WordPress core
    WP->>WP: Load plugins (JWT Auth)
    WP->>WP: Load mu-plugins (headless-lockdown, rest-host)

    Compose->>Setup: Run setup container (one-time)
    activate Setup
    Setup->>WP: wp core install --url=...
    Setup->>WP: wp user create (if needed)
    Setup->>WP: wp plugin activate
    deactivate Setup

    Compose->>Nginx: Start reverse proxy
    activate Nginx
    Nginx->>Nginx: Load SSL certificates
    Nginx->>Nginx: Configure vhosts (admin, api)

    GHA->>GHA: Wait for WordPress (curl health check)
    GHA->>API: GET /wp-json/
    API-->>GHA: 200 OK (API ready)

    GHA->>Tests: npm ci (install dependencies)
    GHA->>Tests: npm run test:ci

    activate Tests
    Tests->>Tests: Load ApiClient helper
    Tests->>Tests: Load environment (.env.test)

    rect rgb(200, 220, 250)
        Note over Tests,API: Test Phase 1: Authentication
        Tests->>API: POST /jwt-auth/v1/token<br/>{username, password}
        API->>DB: Verify credentials
        DB-->>API: User found
        API-->>Tests: 200 OK {token, user_email}
        Tests->>Tests: Store JWT token
    end

    rect rgb(220, 250, 220)
        Note over Tests,API: Test Phase 2: CRUD Operations
        Tests->>API: GET /wp/v2/posts
        API->>DB: SELECT * FROM wp_posts
        DB-->>API: Posts data
        API-->>Tests: 200 OK [posts array]

        Tests->>API: POST /wp/v2/posts<br/>Authorization: Bearer {token}
        API->>API: Validate JWT token
        API->>DB: INSERT INTO wp_posts
        DB-->>API: Post created (ID: 123)
        API-->>Tests: 201 Created {post}

        Tests->>API: DELETE /wp/v2/posts/123?force=true<br/>Authorization: Bearer {token}
        API->>DB: DELETE FROM wp_posts WHERE ID=123
        DB-->>API: Post deleted
        API-->>Tests: 200 OK {deleted: true}
    end

    rect rgb(250, 220, 220)
        Note over Tests,API: Test Phase 3: Security & CORS
        Tests->>API: GET /wp/v2/posts<br/>Origin: https://localhost:3000
        API->>API: Check CORS headers
        API-->>Tests: 200 OK<br/>Access-Control-Allow-Origin: *

        Tests->>API: POST /wp/v2/posts<br/>(No Authorization header)
        API->>API: Check authentication
        API-->>Tests: 401 Unauthorized
    end

    deactivate Tests

    Tests-->>GHA: Test results + coverage
    GHA->>GHA: Upload coverage to Codecov
    GHA->>GHA: Upload artifacts

    alt Tests Failed
        GHA->>Compose: docker compose logs
        Compose-->>GHA: Container logs
    end

    GHA->>Make: make dev-down
    Make->>Compose: docker compose down
    Compose->>Nginx: Stop container
    deactivate Nginx
    Compose->>WP: Stop container
    deactivate WP
    Compose->>DB: Stop container
    deactivate DB
```

### Quick Test

```bash
# Run full test suite (builds, starts services, runs tests)
make test-full

# Or run tests against already running services
make test-install  # Install dependencies (first time only)
make test          # Run all tests
```

### Available Test Commands

| Command | Description |
|---------|-------------|
| `make test-full` | Complete test cycle: build → start → install → test |
| `make test-setup` | Build and start Docker services for testing |
| `make test-install` | Install test dependencies |
| `make test` | Run all API tests |
| `make test-watch` | Run tests in watch mode (auto-rerun on changes) |
| `make test-coverage` | Run tests with coverage report |
| `make test-ci` | Run tests in CI mode (for GitHub Actions) |
| `make test-clean` | Clean test artifacts and dependencies |

### Test Coverage

The test suite covers:

- ✅ **JWT Authentication** - Login, token validation, refresh
- ✅ **Posts API** - CRUD operations, pagination, search, filtering
- ✅ **Pages API** - CRUD operations, hierarchical pages
- ✅ **Media API** - List, get, filter by type
- ✅ **Taxonomy API** - Categories, tags, custom taxonomies
- ✅ **Users API** - List users, current user profile
- ✅ **CORS & Security** - Headers, authentication, error handling
- ✅ **API Discovery** - Root endpoint, namespaces, routes

For detailed testing documentation, see [`tests/README.md`](tests/README.md).

### CI/CD Integration

Tests run automatically on:
- ✓ Pull requests
- ✓ Pushes to main branch
- ✓ Manual workflow dispatch

View the workflow: [`.github/workflows/api-tests.yml`](.github/workflows/api-tests.yml)

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

When contributing:
1. Write tests for new features
2. Ensure all tests pass: `make test-full`
3. Update documentation as needed

---

## License

This project is licensed under the MIT License.

---

<div align="center">

**Built with ❤️ using WordPress, React, and Docker**

</div>



