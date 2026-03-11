# Packages, Dependencies & Technology Reference

> Complete reference of every package, dependency, install command, and technology used in the CMS platform.

---

## Table of Contents

- [Monorepo Install Commands](#monorepo-install-commands)
- [Technology Stack Summary](#technology-stack-summary)
- [Root Dependencies](#root-dependencies)
- [Shared Packages (packages/*)](#shared-packages)
- [Microservices (apps/*)](#microservices)
- [Frontend (frontend/admin)](#frontend)
- [Infrastructure & DevOps](#infrastructure--devops)
- [All npm Packages Used](#all-npm-packages-used)

---

## Monorepo Install Commands

```powershell
# ─── PREREQUISITES ───────────────────────────────────────────
npm install -g pnpm@9                  # Install pnpm package manager

# ─── INSTALL ALL DEPENDENCIES ────────────────────────────────
pnpm install                           # Install everything across all workspaces

# ─── BUILD ───────────────────────────────────────────────────
pnpm turbo build                       # Build all packages in dependency order
pnpm turbo build --filter=@cms/auth    # Build a single package

# ─── DEVELOPMENT ─────────────────────────────────────────────
pnpm dev                               # Start all services in dev mode (hot reload)
cd apps/auth-service && pnpm dev       # Start single service
cd frontend/admin && pnpm dev          # Start frontend only

# ─── LINT & TEST ─────────────────────────────────────────────
pnpm turbo lint                        # Lint all workspaces
pnpm turbo test                        # Run all tests

# ─── DATABASE ────────────────────────────────────────────────
npx ts-node scripts/migrations/001_initial_schema.ts   # Run migrations
npx ts-node scripts/seeds/001_initial_data.ts          # Seed data

# ─── DOCKER ──────────────────────────────────────────────────
docker-compose up -d                   # Start everything
docker-compose up -d postgres redis elasticsearch  # Infrastructure only
docker-compose down                    # Stop everything
docker-compose down -v                 # Stop + delete volumes (DESTRUCTIVE)
docker-compose build                   # Rebuild all images
docker-compose logs -f api-gateway     # View service logs

# ─── CLEAN ───────────────────────────────────────────────────
pnpm run clean                         # Remove all node_modules
pnpm store prune                       # Clean pnpm cache

# ─── ADD DEPENDENCIES ───────────────────────────────────────
pnpm add <pkg> --filter @cms/config    # Add to specific package
pnpm add -D <pkg> -w                   # Add devDep to root
pnpm add <pkg> --filter auth-service   # Add to specific service
```

---

## Technology Stack Summary

### Backend

| Technology        | Version | Purpose                                 |
| ----------------- | ------- | --------------------------------------- |
| Node.js           | ≥ 20    | JavaScript runtime                       |
| TypeScript        | 5.4     | Type-safe JavaScript                     |
| Fastify           | 4.x     | HTTP framework (all microservices)       |
| Knex.js           | 3.x     | SQL query builder & migrations          |
| PostgreSQL        | 16      | Primary relational database              |
| Redis             | 7       | Caching, sessions, rate limiting         |
| Elasticsearch     | 8.12    | Full-text search                         |
| Kafka             | Latest  | Event streaming (optional)               |
| Pino              | 9.x     | Structured JSON logging                  |
| Zod               | 3.x     | Runtime schema validation                |
| Argon2            | 0.40    | Password hashing (Argon2id)              |
| jsonwebtoken      | 9.x     | JWT creation & verification              |
| Nodemailer        | 6.x     | Email sending                            |
| Sharp             | 0.33    | Image processing & variants              |
| AWS SDK v3        | 3.x     | S3 compatible object storage             |
| OpenAI            | 4.x     | AI content generation (GPT-4o-mini)      |
| OpenTelemetry     | 0.49    | Distributed tracing                      |
| Speakeasy         | 2.x     | TOTP 2FA support                         |
| Handlebars        | 4.x     | Email template rendering                 |

### Frontend

| Technology        | Version | Purpose                                 |
| ----------------- | ------- | --------------------------------------- |
| React             | 18      | UI framework                             |
| Vite              | 5       | Build tool & dev server                  |
| TypeScript        | 5.4     | Type-safe JavaScript                     |
| TailwindCSS       | 3       | Utility-first CSS                        |
| React Router      | 6       | Client-side routing                      |
| React Query       | 5       | Server state management & caching        |
| Zustand           | 4       | Client state management                  |
| React Hook Form   | 7       | Form management                          |
| Zod               | 3       | Schema validation                        |
| Axios             | 1       | HTTP client                              |
| Recharts          | 2       | Charts & data visualization              |
| dnd-kit           | 6       | Drag-and-drop (block editor)             |
| Lucide React      | 0.344   | Icons                                    |
| date-fns          | 3       | Date formatting                          |

### DevOps

| Technology        | Version | Purpose                                 |
| ----------------- | ------- | --------------------------------------- |
| Docker            | 24+     | Containerization                         |
| Docker Compose    | 2.x     | Multi-container orchestration            |
| Kubernetes        | 1.28+   | Production orchestration                 |
| Nginx             | Alpine  | Frontend reverse proxy                   |
| GitHub Actions    | —       | CI/CD pipelines                          |
| Turborepo         | 2.x     | Monorepo build orchestration             |
| pnpm              | 9.x     | Package manager                          |

---

## Root Dependencies

The root `package.json` manages the monorepo workspace configuration and shared dev tooling.

```json
{
  "name": "cms-platform",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*",
    "frontend/*",
    "plugins/*"
  ]
}
```

### Root devDependencies

| Package               | Purpose                              |
| --------------------- | ------------------------------------ |
| `typescript`          | TypeScript compiler                  |
| `turbo`               | Monorepo build system                |
| `ts-node`             | TypeScript execution for scripts     |
| `@types/node`         | Node.js type definitions             |
| `eslint`              | Code linting                         |
| `prettier`            | Code formatting                      |

```powershell
# These are installed automatically with `pnpm install`
# To add more root dev dependencies:
pnpm add -D <package> -w
```

---

## Shared Packages

14 shared library packages under `packages/`. All services depend on these.

### @cms/config

**Purpose:** Centralized, Zod-validated environment configuration  
**Path:** `packages/config/`

| Dependency | Purpose               |
| ---------- | --------------------- |
| `zod`      | Schema validation     |
| `dotenv`   | .env file loading     |

```powershell
pnpm add zod dotenv --filter @cms/config
```

---

### @cms/errors

**Purpose:** Typed error hierarchy (NotFoundError, ValidationError, UnauthorizedError, etc.)  
**Path:** `packages/errors/`

| Dependency   | Purpose          |
| ------------ | ---------------- |
| (no runtime) | Pure TypeScript  |

```powershell
# No runtime dependencies — only TypeScript types
```

---

### @cms/logger

**Purpose:** Structured JSON logging with Pino  
**Path:** `packages/logger/`

| Dependency    | Purpose               |
| ------------- | --------------------- |
| `pino`        | Fast JSON logger      |
| `pino-pretty` | Dev-mode pretty print |

```powershell
pnpm add pino pino-pretty --filter @cms/logger
```

---

### @cms/database

**Purpose:** Knex.js PostgreSQL client, migration runner, pagination helpers  
**Path:** `packages/database/`

| Dependency | Purpose             |
| ---------- | ------------------- |
| `knex`     | SQL query builder   |
| `pg`       | PostgreSQL driver   |

```powershell
pnpm add knex pg --filter @cms/database
```

---

### @cms/security

**Purpose:** Argon2id hashing, AES-256-GCM encryption, JWT helpers, API key generation  
**Path:** `packages/security/`

| Dependency       | Purpose                  |
| ---------------- | ------------------------ |
| `argon2`         | Password hashing         |
| `jsonwebtoken`   | JWT sign/verify          |
| `uuid`           | UUID generation          |
| `@types/jsonwebtoken` | TypeScript types    |

```powershell
pnpm add argon2 jsonwebtoken uuid --filter @cms/security
pnpm add -D @types/jsonwebtoken --filter @cms/security
```

---

### @cms/validation

**Purpose:** Zod schemas for all entities (users, content, tenants, media, etc.)  
**Path:** `packages/validation/`

| Dependency | Purpose             |
| ---------- | ------------------- |
| `zod`      | Schema validation   |

```powershell
pnpm add zod --filter @cms/validation
```

---

### @cms/messaging

**Purpose:** EventBus for pub/sub communication between services  
**Path:** `packages/messaging/`

| Dependency       | Purpose                        |
| ---------------- | ------------------------------ |
| `eventemitter2`  | Enhanced event emitter         |
| `kafkajs`        | Kafka client (optional)        |

```powershell
pnpm add eventemitter2 kafkajs --filter @cms/messaging
```

---

### @cms/cache

**Purpose:** Redis cache manager (get/set/invalidate, JSON serialization, TTL, pattern delete)  
**Path:** `packages/cache/`

| Dependency | Purpose         |
| ---------- | --------------- |
| `redis`    | Redis client    |

```powershell
pnpm add redis --filter @cms/cache
```

---

### @cms/auth

**Purpose:** JWT authentication middleware, RBAC permission checks, API key auth  
**Path:** `packages/auth/`

| Dependency     | Purpose             |
| -------------- | ------------------- |
| `jsonwebtoken` | JWT verification    |

```powershell
pnpm add jsonwebtoken --filter @cms/auth
```

---

### @cms/rate-limit

**Purpose:** Sliding window rate limiter using Redis  
**Path:** `packages/rate-limit/`

| Dependency | Purpose         |
| ---------- | --------------- |
| `redis`    | Redis client    |

```powershell
pnpm add redis --filter @cms/rate-limit
```

---

### @cms/utils

**Purpose:** Utility functions: UUID, slugify, sanitize HTML, retry, chunk, pagination  
**Path:** `packages/utils/`

| Dependency   | Purpose             |
| ------------ | ------------------- |
| `uuid`       | UUID generation     |
| `slugify`    | URL slug generation |
| `sanitize-html` | HTML sanitization |

```powershell
pnpm add uuid slugify sanitize-html --filter @cms/utils
pnpm add -D @types/uuid @types/sanitize-html --filter @cms/utils
```

---

### @cms/plugin-sdk

**Purpose:** Plugin manifest types, lifecycle hooks, plugin manager  
**Path:** `packages/plugin-sdk/`

| Dependency   | Purpose          |
| ------------ | ---------------- |
| (no runtime) | Pure TypeScript  |

---

### @cms/feature-flags

**Purpose:** Feature flag evaluation engine with percentage, user-targeting, and group rules  
**Path:** `packages/feature-flags/`

| Dependency   | Purpose          |
| ------------ | ---------------- |
| (no runtime) | Pure TypeScript  |

---

### @cms/observability

**Purpose:** OpenTelemetry tracing, Prometheus metrics exporter  
**Path:** `packages/observability/`

| Dependency                          | Purpose                |
| ----------------------------------- | ---------------------- |
| `@opentelemetry/api`                | OTel API               |
| `@opentelemetry/sdk-node`           | OTel Node SDK          |
| `@opentelemetry/auto-instrumentations-node` | Auto instrumentation |
| `@opentelemetry/exporter-prometheus`| Prometheus metrics     |
| `prom-client`                       | Prometheus client      |

```powershell
pnpm add @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-prometheus prom-client --filter @cms/observability
```

---

## Microservices

15 microservices + 1 API gateway under `apps/`. Each follows the same structure:

```
apps/<service-name>/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts     # Fastify server setup
    └── routes.ts    # Route definitions
```

### Common dependencies (all services share these)

| Dependency         | Purpose                      |
| ------------------ | ---------------------------- |
| `fastify`          | HTTP framework               |
| `@fastify/cors`    | CORS support                 |
| `@fastify/helmet`  | Security headers             |
| `@cms/config`      | Environment config           |
| `@cms/logger`      | Structured logging           |
| `@cms/database`    | PostgreSQL access            |
| `@cms/errors`      | Error types                  |
| `@cms/auth`        | JWT middleware               |
| `@cms/validation`  | Request validation           |
| `@cms/cache`       | Redis caching                |
| `@cms/messaging`   | Event publishing             |

---

### API Gateway (apps/api-gateway)

**Port:** 3000

| Dependency                 | Purpose                    |
| -------------------------- | -------------------------- |
| `fastify`                  | HTTP framework             |
| `@fastify/http-proxy`      | Reverse proxy to services  |
| `@fastify/cors`            | CORS                       |
| `@fastify/helmet`          | Security headers           |
| `@fastify/rate-limit`      | Rate limiting              |
| `@fastify/swagger`         | Swagger documentation      |
| `@fastify/swagger-ui`      | Swagger UI                 |
| `@cms/config`              | Configuration              |
| `@cms/logger`              | Logging                    |
| `@cms/rate-limit`          | Redis rate limiter         |
| `@cms/observability`       | Metrics & tracing          |

```powershell
pnpm add fastify @fastify/http-proxy @fastify/cors @fastify/helmet @fastify/rate-limit @fastify/swagger @fastify/swagger-ui --filter api-gateway
```

---

### Auth Service (apps/auth-service)

**Port:** 3001

| Dependency         | Purpose                      |
| ------------------ | ---------------------------- |
| `argon2`           | Password hashing             |
| `jsonwebtoken`     | JWT token creation           |
| `speakeasy`        | TOTP 2FA support             |
| `qrcode`           | QR code for 2FA setup        |

```powershell
pnpm add argon2 jsonwebtoken speakeasy qrcode --filter auth-service
```

---

### User Service (apps/user-service)

**Port:** 3002

| Dependency         | Purpose                      |
| ------------------ | ---------------------------- |
| (common only)      | CRUD on users table          |

---

### Tenant Service (apps/tenant-service)

**Port:** 3003

| Dependency         | Purpose                      |
| ------------------ | ---------------------------- |
| (common only)      | Multi-tenant management      |

---

### Content Service (apps/content-service)

**Port:** 3004

| Dependency         | Purpose                      |
| ------------------ | ---------------------------- |
| (common only)      | Block editor, versioning     |

---

### Media Service (apps/media-service)

**Port:** 3005

| Dependency            | Purpose                      |
| --------------------- | ---------------------------- |
| `@aws-sdk/client-s3`  | S3 operations                |
| `@aws-sdk/s3-request-presigner` | Presigned URLs      |
| `sharp`               | Image processing             |
| `@fastify/multipart`  | File upload handling         |

```powershell
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner sharp @fastify/multipart --filter media-service
```

---

### Comment Service (apps/comment-service)

**Port:** 3006

| Dependency         | Purpose                      |
| ------------------ | ---------------------------- |
| (common only)      | Threaded comments            |

---

### Analytics Service (apps/analytics-service)

**Port:** 3007

| Dependency         | Purpose                      |
| ------------------ | ---------------------------- |
| `ua-parser-js`     | User agent parsing           |

```powershell
pnpm add ua-parser-js --filter analytics-service
```

---

### Notification Service (apps/notification-service)

**Port:** 3008

| Dependency         | Purpose                      |
| ------------------ | ---------------------------- |
| `nodemailer`       | Email sending                |
| `handlebars`       | Email templates              |

```powershell
pnpm add nodemailer handlebars --filter notification-service
pnpm add -D @types/nodemailer --filter notification-service
```

---

### Search Service (apps/search-service)

**Port:** 3009

| Dependency               | Purpose                      |
| ------------------------ | ---------------------------- |
| `@elastic/elasticsearch` | Elasticsearch client          |

```powershell
pnpm add @elastic/elasticsearch --filter search-service
```

---

### Workflow Service (apps/workflow-service)

**Port:** 3010

| Dependency         | Purpose                      |
| ------------------ | ---------------------------- |
| (common only)      | Approval workflows           |

---

### Plugin Service (apps/plugin-service)

**Port:** 3011

| Dependency         | Purpose                      |
| ------------------ | ---------------------------- |
| `@cms/plugin-sdk`  | Plugin lifecycle             |

---

### Feature Flag Service (apps/feature-service)

**Port:** 3012

| Dependency            | Purpose                      |
| --------------------- | ---------------------------- |
| `@cms/feature-flags`  | Flag evaluation engine       |

---

### Audit Service (apps/audit-service)

**Port:** 3013

| Dependency         | Purpose                      |
| ------------------ | ---------------------------- |
| `json2csv`         | CSV export                   |

```powershell
pnpm add json2csv --filter audit-service
```

---

### Settings Service (apps/settings-service)

**Port:** 3014

| Dependency         | Purpose                      |
| ------------------ | ---------------------------- |
| (common only)      | Tenant settings, billing     |

---

### AI Service (apps/ai-service)

**Port:** 3015

| Dependency         | Purpose                      |
| ------------------ | ---------------------------- |
| `openai`           | OpenAI GPT API client        |

```powershell
pnpm add openai --filter ai-service
```

---

## Frontend

### Admin Dashboard (frontend/admin)

React 18 single-page application with Vite build tool.

**Path:** `frontend/admin/`  
**Dev port:** 5173  
**Production:** nginx on port 80

### Dependencies

| Package                    | Purpose                          |
| -------------------------- | -------------------------------- |
| `react`                    | UI framework                     |
| `react-dom`                | React DOM renderer               |
| `react-router-dom`         | Client-side routing              |
| `@tanstack/react-query`    | Server state management          |
| `zustand`                  | Client state management          |
| `axios`                    | HTTP client                      |
| `react-hook-form`          | Form management                  |
| `@hookform/resolvers`      | Zod resolver for forms           |
| `zod`                      | Schema validation                |
| `recharts`                 | Data visualization / charts      |
| `@dnd-kit/core`            | Drag-and-drop core               |
| `@dnd-kit/sortable`        | Sortable drag-and-drop           |
| `@dnd-kit/utilities`       | DnD utility functions            |
| `lucide-react`             | Icon library                     |
| `date-fns`                 | Date formatting & manipulation   |
| `clsx`                     | Conditional CSS classes          |

### Dev Dependencies

| Package                        | Purpose                       |
| ------------------------------ | ----------------------------- |
| `vite`                         | Build tool & dev server       |
| `@vitejs/plugin-react`         | React Vite plugin             |
| `typescript`                   | TypeScript compiler           |
| `tailwindcss`                  | Utility-first CSS             |
| `postcss`                      | CSS processing                |
| `autoprefixer`                 | CSS vendor prefixes           |
| `@types/react`                 | React type definitions        |
| `@types/react-dom`             | ReactDOM type definitions     |

### Install Commands

```powershell
# Install all frontend dependencies (done automatically by pnpm install at root)
cd frontend/admin
pnpm install

# Or install individual packages:
pnpm add react react-dom react-router-dom @tanstack/react-query zustand axios --filter admin
pnpm add react-hook-form @hookform/resolvers zod --filter admin
pnpm add recharts @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities --filter admin
pnpm add lucide-react date-fns clsx --filter admin
pnpm add -D vite @vitejs/plugin-react typescript tailwindcss postcss autoprefixer --filter admin
```

### Frontend Structure

```
frontend/admin/
├── index.html                    # Entry HTML
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tsconfig.node.json            # Node TypeScript config
├── vite.config.ts                # Vite build config
├── tailwind.config.js            # Tailwind configuration
├── postcss.config.js             # PostCSS config
└── src/
    ├── index.css                 # Global styles + Tailwind directives
    ├── main.tsx                  # React entry point
    ├── App.tsx                   # Router + providers (QueryClient, Auth)
    ├── lib/
    │   └── api.ts                # Axios client + typed API modules
    ├── stores/
    │   └── auth.ts               # Zustand auth store (persist)
    ├── layouts/
    │   └── DashboardLayout.tsx   # Sidebar + header layout
    └── pages/
        ├── LoginPage.tsx         # Email/password login
        ├── DashboardPage.tsx     # Overview stats + charts
        ├── ContentListPage.tsx   # Content table with filters
        ├── ContentEditorPage.tsx # Block editor with dnd-kit
        ├── MediaLibraryPage.tsx  # Grid/list view + drag-drop upload
        ├── UsersPage.tsx         # User management table
        ├── AnalyticsPage.tsx     # Charts via Recharts
        └── SettingsPage.tsx      # 6-tab settings (general, team, billing…)
```

---

## Infrastructure & DevOps

### Docker Images Used

| Image                                    | Version   | Service           |
| ---------------------------------------- | --------- | ----------------- |
| `node`                                   | 20-alpine | All microservices |
| `postgres`                               | 16-alpine | Database          |
| `redis`                                  | 7-alpine  | Cache             |
| `docker.elastic.co/elasticsearch/elasticsearch` | 8.12.0 | Search        |
| `minio/minio`                            | latest    | Object storage    |
| `mailhog/mailhog`                        | latest    | Email testing     |
| `bitnami/kafka`                          | latest    | Event streaming   |
| `nginx`                                  | alpine    | Frontend reverse proxy |

### Dockerfile Build Stages

**Dockerfile.service** (multi-stage):
1. `deps` — Install dependencies
2. `builder` — Build TypeScript
3. `runner` — Production runtime (node:20-alpine)

**Dockerfile.frontend** (multi-stage):
1. `deps` — Install dependencies
2. `builder` — Vite build
3. `runner` — nginx:alpine serving static files

### Kubernetes Resources

| Manifest              | Resources Created                           |
| --------------------- | ------------------------------------------- |
| `namespace.yaml`      | `cms` namespace                              |
| `config.yaml`         | ConfigMap + Secrets (all env vars)           |
| `infrastructure.yaml` | PostgreSQL, Redis, Elasticsearch StatefulSets|
| `services.yaml`       | 16 Deployments + Services + HPAs             |
| `ingress.yaml`        | TLS Ingress with cert-manager                |

### CI/CD Pipelines

**ci.yml:**
1. Lint all workspaces
2. Run all tests
3. Build all packages
4. Build Docker images
5. Push to container registry
6. Deploy to staging
7. Deploy to production (manual gate)

**migrations.yml:**
1. Manual trigger with environment selection
2. Connect to target database
3. Run pending migrations

---

## All npm Packages Used

Complete alphabetical list of every npm package across the entire platform:

### Runtime Dependencies

| Package | Used In | Purpose |
|---------|---------|---------|
| `@aws-sdk/client-s3` | media-service | S3 file operations |
| `@aws-sdk/s3-request-presigner` | media-service | Presigned URLs |
| `@dnd-kit/core` | frontend | Drag-and-drop |
| `@dnd-kit/sortable` | frontend | Sortable lists |
| `@dnd-kit/utilities` | frontend | DnD helpers |
| `@elastic/elasticsearch` | search-service | ES client |
| `@fastify/cors` | all services | CORS middleware |
| `@fastify/helmet` | all services | Security headers |
| `@fastify/http-proxy` | api-gateway | Reverse proxy |
| `@fastify/multipart` | media-service | File uploads |
| `@fastify/rate-limit` | api-gateway | Rate limiting |
| `@fastify/swagger` | api-gateway | API docs |
| `@fastify/swagger-ui` | api-gateway | Swagger UI |
| `@hookform/resolvers` | frontend | Form validation bridge |
| `@opentelemetry/api` | observability | OTel API |
| `@opentelemetry/auto-instrumentations-node` | observability | Auto-instrumentation |
| `@opentelemetry/exporter-prometheus` | observability | Prometheus export |
| `@opentelemetry/sdk-node` | observability | OTel Node SDK |
| `@tanstack/react-query` | frontend | Server state |
| `argon2` | auth-service, security | Password hashing |
| `axios` | frontend | HTTP client |
| `clsx` | frontend | CSS class helper |
| `date-fns` | frontend | Date formatting |
| `dotenv` | config | .env loading |
| `eventemitter2` | messaging | Event emitter |
| `fastify` | all services | HTTP framework |
| `handlebars` | notification-service | Email templates |
| `json2csv` | audit-service | CSV export |
| `jsonwebtoken` | auth, security | JWT tokens |
| `kafkajs` | messaging | Kafka client |
| `knex` | database | SQL builder |
| `lucide-react` | frontend | Icons |
| `nodemailer` | notification-service | Email sending |
| `openai` | ai-service | GPT API |
| `pg` | database | PostgreSQL driver |
| `pino` | logger | JSON logging |
| `pino-pretty` | logger | Dev pretty-print |
| `prom-client` | observability | Prometheus metrics |
| `qrcode` | auth-service | QR code generation |
| `react` | frontend | UI framework |
| `react-dom` | frontend | React DOM |
| `react-hook-form` | frontend | Forms |
| `react-router-dom` | frontend | Routing |
| `recharts` | frontend | Charts |
| `redis` | cache, rate-limit | Redis client |
| `sanitize-html` | utils | HTML sanitization |
| `sharp` | media-service | Image processing |
| `slugify` | utils | URL slugs |
| `speakeasy` | auth-service | TOTP 2FA |
| `ua-parser-js` | analytics-service | User agent parsing |
| `uuid` | security, utils | UUID generation |
| `zod` | config, validation, frontend | Schema validation |
| `zustand` | frontend | State management |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| `@types/jsonwebtoken` | JWT types |
| `@types/node` | Node.js types |
| `@types/nodemailer` | Nodemailer types |
| `@types/react` | React types |
| `@types/react-dom` | ReactDOM types |
| `@types/sanitize-html` | sanitize-html types |
| `@types/uuid` | UUID types |
| `@vitejs/plugin-react` | Vite React plugin |
| `autoprefixer` | CSS vendor prefixes |
| `eslint` | Linting |
| `postcss` | CSS processing |
| `prettier` | Code formatting |
| `tailwindcss` | Utility CSS |
| `ts-node` | TypeScript execution |
| `turbo` | Monorepo build |
| `typescript` | TypeScript compiler |
| `vite` | Frontend build tool |

---

**Total: ~55 unique npm packages, 14 shared libraries, 16 microservices, 1 React frontend**
