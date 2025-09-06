# Headless-Wordpress
```mermaid
flowchart LR
  %% ===== Groups =====
  subgraph DevHost["Developer Laptop"]
    direction TB

    subgraph DockerNet["Docker network (bridge)"]
      direction LR

      %% Reverse proxy (one container, two vhosts)
      RP["reverse-proxy (nginx)\nAdmin vhost: admin.mycompany.local:8443\nAPI vhost:  api.mycompany.local:8443\nHost:8081→80, 8443→443"]

      %% App tier
      WP["wordpress (apache+php)\nHost:8080→80"]
      DB["mariadb (database)\ninternal:3306"]

      ADM["adminer (DB GUI)\nHost:9091→8080"]

      %% Observability
      PR["promtail (log shipper)"]
      LO["loki (log store)\ninternal:3100"]
      GR["grafana (dashboards)\nHost:3001→3000"]

      %% Internal links
      RP -- "HTTP 80 / HTTPS 443" --> WP
      WP -- "MySQL 3306" --> DB
      ADM -- "MySQL 3306" --> DB
      PR -- "pushes logs" --> LO
      GR -- "reads" --> LO
    end

    FE["Frontend SPA (dev)\nlocalhost:3000"]
    Browser["Browser"]
  end

  %% ===== External browsing paths =====
  Browser -- "https://admin.mycompany.local:8443\n(Admin UI → /wp-admin)" --> RP
  Browser -- "http://localhost:8080 (direct dev)" --> WP
  Browser -- "http://localhost:9091" --> ADM
  Browser -- "http://localhost:3001" --> GR
  Browser -- "http://localhost:3000" --> FE

  %% ===== Frontend → API (CORS) =====
  FE -- "fetch: https://api.mycompany.local:8443/wp-json/*\n(CORS allowed origin = https://localhost:3000)" --> RP
  RP -- "/wp-json proxied to →" --> WP

  %% ===== Classes for coloring =====
  classDef observability fill:#e8f4ff,stroke:#6aa8ff,color:#0b3d91;
  class PR,LO,GR observability;

  classDef appdb fill:#fff7e6,stroke:#ffb84d,color:#7a3d00;
  class WP,DB appdb;

  classDef frontend fill:#e8ffe8,stroke:#5abf5a,color:#0b4d0b;
  class FE frontend;

```

## How to Run Headless Wordpress?
In the environment where Docker Desktop is installed, execute commands below to launch. Commands work correctly on Mac Silicon.

```
# Commands to launch
make dev-build
make dev-up

# Commands to terminate
make dev-down
```
You can get the portal in ```https://admin.mycompany.local:8443``` after you launch the website.

<img width="1721" height="999" alt="image" src="https://github.com/user-attachments/assets/b73b31f6-9b19-4037-8844-3768bb542f88" />

## Who is Which
- https://admin.mycompany.local:8443 → always show the WP login/admin (no public site)
- https://api.mycompany.local:8443 → WP REST API only
- https://mycompany.local:8443 → React front-end (proxied to localhost:3000 in dev)


## Notes
- Certificate and key in the repository are self-signed.
- It's the development environment included in the repository.



