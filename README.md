# CMS SaaS Platform

> Production-grade, multi-tenant Content Management System built as a microservices monorepo.  
> Comparable to Contentful, Strapi, Ghost, Notion, and Shopify in scope.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
  - [PostgreSQL (Database)](#1-postgresql-database)
  - [Redis (Cache)](#2-redis-cache)
  - [Elasticsearch (Search)](#3-elasticsearch-search)
  - [S3 / MinIO (Object Storage)](#4-s3--minio-object-storage)
  - [SMTP (Email)](#5-smtp-email)
  - [Kafka (Event Streaming)](#6-kafka-event-streaming)
  - [JWT (Authentication)](#7-jwt-authentication)
  - [Encryption (AES-256-GCM)](#8-encryption-aes-256-gcm)
- [Running the Platform](#running-the-platform)
- [Project Structure](#project-structure)
- [Service Ports](#service-ports)
- [Useful Commands](#useful-commands)
- [Additional Docs](#additional-docs)

---

## Quick Start

```powershell
# 1 — Clone & enter the repo
cd "c:\Users\IGNACIO\Pictures\real cms"

# 2 — Install pnpm globally (if not already installed)
npm install -g pnpm@9

# 3 — Install all dependencies across the monorepo
pnpm install

# 4 — Copy environment file and fill in secrets
cp .env.example .env
# Open .env and replace every CHANGEME_ value

# 5 — Start infrastructure with Docker Compose
docker-compose up -d postgres redis elasticsearch

# 6 — Run database migrations & seed data
npx ts-node scripts/migrations/001_initial_schema.ts
npx ts-node scripts/seeds/001_initial_data.ts

# 7 — Build all packages
pnpm turbo build

# 8 — Start everything in dev mode
pnpm dev
```

The API Gateway will be available at **http://localhost:3000** and the admin dashboard at **http://localhost:5173**.

---

## Prerequisites

| Tool              | Minimum Version | Install Command                                         |
| ----------------- | --------------- | ------------------------------------------------------- |
| **Node.js**       | 20.x            | https://nodejs.org or `winget install OpenJS.NodeJS.LTS` |
| **pnpm**          | 9.x             | `npm install -g pnpm@9`                                 |
| **Docker Desktop**| 4.x             | https://www.docker.com/products/docker-desktop           |
| **Git**           | 2.x             | `winget install Git.Git`                                 |
| **TypeScript**    | 5.4+            | Installed via devDependencies                            |
| **Turborepo**     | 2.x             | Installed via devDependencies                            |

### Verify Installation

```powershell
node -v          # v20.x.x
pnpm -v          # 9.x.x
docker --version # Docker version 2x.x.x
git --version    # git version 2.x.x
```

---

## Installation

### Step 1 — Install all monorepo dependencies

```powershell
# From the root of the project
pnpm install
```

This installs dependencies for **all** workspaces:
- `packages/*` — 14 shared libraries
- `apps/*` — 16 microservices (includes API gateway)
- `frontend/*` — Admin dashboard (React)

### Step 2 — Build shared packages

```powershell
# Build every package in dependency order
pnpm turbo build
```

### Step 3 — Setup infrastructure

**Option A — Docker Compose (recommended)**:

```powershell
# Start all infrastructure
docker-compose up -d postgres redis elasticsearch

# Verify containers are running
docker-compose ps
```

**Option B — Manual installation** (see [Infrastructure Setup](docs/INFRASTRUCTURE_SETUP.md) for detailed instructions).

### Step 4 — Database setup

```powershell
# Run migrations (creates 80+ tables)
npx ts-node scripts/migrations/001_initial_schema.ts

# Seed initial data (roles, permissions, plans, settings)
npx ts-node scripts/seeds/001_initial_data.ts
```

### Step 5 — Start the platform

```powershell
# Dev mode — all services with hot reload
pnpm dev

# Or start a single service
cd apps/auth-service && pnpm dev
```

---

## Environment Configuration

Copy `.env.example` to `.env` and configure each section:

```powershell
cp .env.example .env
```

### 1. PostgreSQL (Database)

The primary relational database. Stores users, tenants, content, media metadata, workflows, audit logs, and more (80+ tables).

```env
# .env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=cms_admin
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=cms_platform
POSTGRES_SSL=false
POSTGRES_POOL_MIN=2
POSTGRES_POOL_MAX=20
```

**Docker setup:**

```powershell
# Start PostgreSQL
docker run -d --name cms-postgres \
  -e POSTGRES_DB=cms_platform \
  -e POSTGRES_USER=cms_admin \
  -e POSTGRES_PASSWORD=your_secure_password_here \
  -p 5432:5432 \
  -v cms_pgdata:/var/lib/postgresql/data \
  postgres:16-alpine

# Verify it's running
docker exec cms-postgres pg_isready -U cms_admin

# Connect with psql
docker exec -it cms-postgres psql -U cms_admin -d cms_platform
```

**Manual install (Windows):**

```powershell
# Download from https://www.postgresql.org/download/windows/
# Or use winget:
winget install PostgreSQL.PostgreSQL.16

# Create database
psql -U postgres -c "CREATE USER cms_admin WITH PASSWORD 'your_secure_password_here';"
psql -U postgres -c "CREATE DATABASE cms_platform OWNER cms_admin;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE cms_platform TO cms_admin;"
```

**Connection test:**

```powershell
# Using Docker
docker exec cms-postgres psql -U cms_admin -d cms_platform -c "SELECT version();"

# Using local psql
psql -h localhost -U cms_admin -d cms_platform -c "SELECT version();"
```

**Key tables created by migration:**  
`users`, `roles`, `permissions`, `sessions`, `tenants`, `tenant_members`, `content`, `content_versions`, `content_blocks`, `media`, `media_variants`, `comments`, `analytics_events`, `notifications`, `plugins`, `feature_flags`, `workflows`, `audit_logs`, `settings`, `webhooks` (80+ total)

---

### 2. Redis (Cache)

Used for session caching, rate limiting, API response caching, and pub/sub.

```env
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here
REDIS_DB=0
REDIS_CLUSTER=false
```

**Docker setup:**

```powershell
# Start Redis
docker run -d --name cms-redis \
  -p 6379:6379 \
  -v cms_redisdata:/data \
  redis:7-alpine

# Verify
docker exec cms-redis redis-cli ping
# Expected: PONG

# Monitor in real-time
docker exec -it cms-redis redis-cli monitor
```

**Manual install (Windows):**

```powershell
# Using winget
winget install Redis.Redis

# Or use Memurai (native Windows Redis alternative)
winget install Memurai.Memurai

# Start Redis
redis-server

# Test connection
redis-cli ping
```

**Common Redis commands for debugging:**

```powershell
redis-cli
> KEYS *              # List all keys
> GET cms:cache:*     # Get cached values
> FLUSHDB             # Clear current database
> INFO memory         # Memory usage stats
```

---

### 3. Elasticsearch (Search)

Full-text search engine with custom analyzers for content search, autocomplete, and faceted browsing.

```env
# .env
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_USER=elastic
ELASTICSEARCH_PASSWORD=your_elastic_password_here
```

**Docker setup:**

```powershell
# Start Elasticsearch (single-node for dev)
docker run -d --name cms-elasticsearch \
  -e discovery.type=single-node \
  -e xpack.security.enabled=false \
  -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
  -p 9200:9200 \
  -v cms_esdata:/usr/share/elasticsearch/data \
  docker.elastic.co/elasticsearch/elasticsearch:8.12.0

# Verify
curl http://localhost:9200
# or in PowerShell:
Invoke-RestMethod http://localhost:9200

# Check cluster health
Invoke-RestMethod http://localhost:9200/_cluster/health
```

**Manual install (Windows):**

```powershell
# Download from https://www.elastic.co/downloads/elasticsearch
# Extract and run:
cd elasticsearch-8.12.0
.\bin\elasticsearch.bat

# Verify
Invoke-RestMethod http://localhost:9200
```

**Useful Elasticsearch commands:**

```powershell
# List all indices
Invoke-RestMethod http://localhost:9200/_cat/indices?v

# Search content index
Invoke-RestMethod "http://localhost:9200/cms_content/_search?q=hello"

# Reindex via API (after services are running)
Invoke-RestMethod -Method POST http://localhost:3000/api/v1/search/reindex
```

---

### 4. S3 / MinIO (Object Storage)

Stores uploaded media files (images, videos, documents). Uses S3-compatible API. For local development, use **MinIO**.

```env
# .env
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=cms-media
S3_REGION=us-east-1
```

**Docker setup (MinIO for local dev):**

```powershell
# Start MinIO
docker run -d --name cms-minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -v cms_miniodata:/data \
  minio/minio server /data --console-address ":9001"

# MinIO Console: http://localhost:9001 (minioadmin / minioadmin)

# Create bucket via CLI
docker exec cms-minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec cms-minio mc mb local/cms-media
docker exec cms-minio mc policy set download local/cms-media
```

**For AWS S3 (production):**

```env
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
S3_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BUCKET=your-cms-media-bucket
S3_REGION=us-east-1
```

```powershell
# Create bucket via AWS CLI
aws s3 mb s3://your-cms-media-bucket --region us-east-1

# Set CORS for the bucket
aws s3api put-bucket-cors --bucket your-cms-media-bucket --cors-configuration '{
  "CORSRules": [{
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET","PUT","POST","DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }]
}'
```

---

### 5. SMTP (Email)

Used by the notification service for email delivery (welcome emails, content published notifications, workflow actions, comment alerts).

```env
# .env
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@your-domain.com
```

**Local dev with MailHog (catches all emails):**

```powershell
# Start MailHog
docker run -d --name cms-mailhog \
  -p 1025:1025 \
  -p 8025:8025 \
  mailhog/mailhog

# Web UI: http://localhost:8025
# SMTP: localhost:1025 (no auth needed)
```

```env
# .env for MailHog
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@cms-platform.local
```

**Gmail setup (production/testing):**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_16_char_app_password
SMTP_FROM=your_email@gmail.com
```

> **Note:** For Gmail, enable "App Passwords" at https://myaccount.google.com/apppasswords  
> For production, use a dedicated service like **SendGrid**, **Mailgun**, or **AWS SES**.

**SendGrid setup:**

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your_sendgrid_api_key
SMTP_FROM=noreply@your-domain.com
```

**Email templates used:**  
- `welcome` — New user registration
- `content_published` — Content published notification
- `comment_created` — New comment alert
- `workflow_action_required` — Workflow step needs action

---

### 6. Kafka (Event Streaming)

Optional event streaming for high-throughput async communication between services. The platform uses an in-memory EventBus by default; Kafka is for production scale.

```env
# .env
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=cms-platform
KAFKA_GROUP_ID=cms-consumers
```

**Docker setup:**

```powershell
# Start Kafka with KRaft (no Zookeeper needed)
docker run -d --name cms-kafka \
  -p 9092:9092 \
  -e KAFKA_CFG_NODE_ID=0 \
  -e KAFKA_CFG_PROCESS_ROLES=controller,broker \
  -e KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093 \
  -e KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT \
  -e KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=0@localhost:9093 \
  -e KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER \
  bitnami/kafka:latest

# Verify
docker exec cms-kafka kafka-topics.sh --bootstrap-server localhost:9092 --list

# Create topics
docker exec cms-kafka kafka-topics.sh --bootstrap-server localhost:9092 --create --topic cms.content.events --partitions 3 --replication-factor 1
docker exec cms-kafka kafka-topics.sh --bootstrap-server localhost:9092 --create --topic cms.user.events --partitions 3 --replication-factor 1
docker exec cms-kafka kafka-topics.sh --bootstrap-server localhost:9092 --create --topic cms.audit.events --partitions 3 --replication-factor 1
```

**With Kafka UI (optional, for monitoring):**

```powershell
docker run -d --name cms-kafka-ui \
  -p 8080:8080 \
  -e KAFKA_CLUSTERS_0_NAME=cms-local \
  -e KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS=host.docker.internal:9092 \
  provectuslabs/kafka-ui:latest

# Kafka UI: http://localhost:8080
```

> **Note:** For local development, the in-memory EventBus works fine. Kafka is recommended for production deployments with high event throughput.

---

### 7. JWT (Authentication)

JSON Web Tokens for stateless authentication. Two token types: access (short-lived) and refresh (long-lived).

```env
# .env
JWT_SECRET=CHANGE_THIS_to_a_random_32_plus_char_string
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=CHANGE_THIS_to_another_random_32_plus_char_string
REFRESH_TOKEN_EXPIRES_IN=7d
```

**Generate secure secrets:**

```powershell
# PowerShell — generate random 64-character hex strings
[Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using openssl (Git Bash / WSL)
openssl rand -hex 32
```

**Token flow:**
1. `POST /api/v1/auth/login` → returns `{ accessToken, refreshToken }`
2. Include `Authorization: Bearer <accessToken>` in all requests
3. When access token expires, call `POST /api/v1/auth/refresh` with the refresh token
4. Refresh returns a new token pair

**Token structure (decoded):**

```json
{
  "userId": "uuid-here",
  "email": "user@example.com",
  "role": "admin",
  "tenantId": "uuid-here",
  "iat": 1709000000,
  "exp": 1709000900
}
```

**Security features:**
- Argon2id password hashing (memory-hard, timing-safe)
- Optional 2FA via TOTP (Google Authenticator compatible)
- API key authentication for server-to-server calls
- Rate limiting on auth endpoints (sliding window)

---

### 8. Encryption (AES-256-GCM)

Symmetric encryption for sensitive data at rest (API keys, secrets, PII).

```env
# .env
ENCRYPTION_KEY=your_32_byte_hex_string_here_change_me
ENCRYPTION_ALGORITHM=aes-256-gcm
```

**Generate a 32-byte encryption key:**

```powershell
# PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Example output: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
```

**How encryption is used:**
- API keys are encrypted before storage
- Sensitive tenant configuration is encrypted
- 2FA secrets are encrypted in the database
- Uses authenticated encryption (GCM) — integrity + confidentiality

> **CRITICAL:** Back up your `ENCRYPTION_KEY` securely. Losing it means losing access to all encrypted data. Never commit it to source control.

---

## Running the Platform

### Development (all services)

```powershell
# Start infrastructure first
docker-compose up -d postgres redis elasticsearch

# Run migrations
npx ts-node scripts/migrations/001_initial_schema.ts
npx ts-node scripts/seeds/001_initial_data.ts

# Start all services in parallel (hot-reload)
pnpm dev
```

### Development (individual service)

```powershell
# Start only auth service
cd apps/auth-service
pnpm dev

# Start only the frontend
cd frontend/admin
pnpm dev
```

### Production (Docker Compose)

```powershell
# Build and start everything
docker-compose up -d --build

# View logs
docker-compose logs -f api-gateway
docker-compose logs -f auth-service

# Stop everything
docker-compose down

# Stop and remove volumes (DESTRUCTIVE — deletes data)
docker-compose down -v
```

### Production (Kubernetes)

```powershell
# Apply manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/config.yaml
kubectl apply -f k8s/infrastructure.yaml
kubectl apply -f k8s/services.yaml
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get pods -n cms
kubectl get services -n cms

# View logs
kubectl logs -n cms deployment/api-gateway -f
kubectl logs -n cms deployment/content-service -f

# Scale a service
kubectl scale deployment content-service --replicas=5 -n cms
```

---

## Project Structure

```
cms-platform/
├── .env.example                 # Environment variables template
├── .github/workflows/           # CI/CD pipelines
│   ├── ci.yml                   # Lint → Test → Build → Deploy
│   └── migrations.yml           # Database migration workflow
├── apps/                        # Microservices
│   ├── api-gateway/             # Port 3000 — route proxy, rate limiting, Swagger
│   ├── auth-service/            # Port 3001 — login, register, 2FA, API keys
│   ├── user-service/            # Port 3002 — user CRUD, profiles
│   ├── tenant-service/          # Port 3003 — multi-tenancy, members, domains
│   ├── content-service/         # Port 3004 — block editor, versioning, publish
│   ├── media-service/           # Port 3005 — upload, S3, image variants
│   ├── comment-service/         # Port 3006 — threaded comments, reactions
│   ├── analytics-service/       # Port 3007 — events, sessions, dashboards
│   ├── notification-service/    # Port 3008 — email, in-app, webhooks
│   ├── search-service/          # Port 3009 — Elasticsearch full-text search
│   ├── workflow-service/        # Port 3010 — content approval workflows
│   ├── plugin-service/          # Port 3011 — install, activate, marketplace
│   ├── feature-service/         # Port 3012 — feature flags, rules, rollouts
│   ├── audit-service/           # Port 3013 — activity logs, export
│   ├── settings-service/        # Port 3014 — tenant settings, billing, plans
│   └── ai-service/              # Port 3015 — generate, improve, summarize, translate
├── docker/                      # Docker build files
│   ├── Dockerfile.service       # Multi-stage build for any microservice
│   ├── Dockerfile.frontend      # Multi-stage build for React + nginx
│   └── nginx.conf               # SPA routing, API proxy, security headers
├── docker-compose.yml           # Full-stack orchestration
├── frontend/
│   └── admin/                   # React 18 + Vite + Tailwind admin dashboard
├── k8s/                         # Kubernetes manifests
│   ├── namespace.yaml
│   ├── config.yaml              # ConfigMap + Secrets
│   ├── infrastructure.yaml      # Postgres, Redis, Elasticsearch StatefulSets
│   ├── services.yaml            # All Deployments + Services + HPAs
│   └── ingress.yaml             # TLS Ingress with cert-manager
├── packages/                    # Shared libraries (@cms/*)
│   ├── auth/                    # JWT middleware, RBAC, API key auth
│   ├── cache/                   # Redis cache manager
│   ├── config/                  # Zod-validated env config
│   ├── database/                # Knex.js PostgreSQL, migrations, pagination
│   ├── errors/                  # Typed error hierarchy
│   ├── feature-flags/           # Feature flag evaluation engine
│   ├── logger/                  # Pino structured logging
│   ├── messaging/               # EventBus (pub/sub)
│   ├── observability/           # OpenTelemetry + Prometheus
│   ├── plugin-sdk/              # Plugin manifest, lifecycle, manager
│   ├── rate-limit/              # Sliding window rate limiter
│   ├── security/                # Argon2id, AES-256-GCM, JWT, API keys
│   ├── utils/                   # UUID, slugify, sanitize, retry, chunk
│   └── validation/              # Zod schemas for all entities
├── scripts/
│   ├── migrations/              # Database migration files
│   │   └── 001_initial_schema.ts
│   └── seeds/                   # Seed data
│       └── 001_initial_data.ts
├── package.json                 # Root workspace config
├── tsconfig.json                # Root TypeScript config
└── turbo.json                   # Turborepo pipeline config
```

---

## Service Ports

| Service              | Port | URL                              | Description                  |
| -------------------- | ---- | -------------------------------- | ---------------------------- |
| **API Gateway**      | 3000 | http://localhost:3000            | Main entry point + Swagger   |
| **Auth**             | 3001 | http://localhost:3001            | Authentication & 2FA         |
| **Users**            | 3002 | http://localhost:3002            | User management              |
| **Tenants**          | 3003 | http://localhost:3003            | Multi-tenancy                |
| **Content**          | 3004 | http://localhost:3004            | Content & block editor       |
| **Media**            | 3005 | http://localhost:3005            | File upload & processing     |
| **Comments**         | 3006 | http://localhost:3006            | Threaded comments            |
| **Analytics**        | 3007 | http://localhost:3007            | Event tracking & dashboards  |
| **Notifications**    | 3008 | http://localhost:3008            | Email, in-app, webhooks      |
| **Search**           | 3009 | http://localhost:3009            | Elasticsearch full-text      |
| **Workflows**        | 3010 | http://localhost:3010            | Content approval             |
| **Plugins**          | 3011 | http://localhost:3011            | Plugin marketplace           |
| **Features**         | 3012 | http://localhost:3012            | Feature flags                |
| **Audit**            | 3013 | http://localhost:3013            | Activity audit trail         |
| **Settings**         | 3014 | http://localhost:3014            | Tenant configuration         |
| **AI**               | 3015 | http://localhost:3015            | AI content generation        |
| **Admin Dashboard**  | 5173 | http://localhost:5173            | React admin UI (Vite dev)    |
| **PostgreSQL**       | 5432 | postgresql://localhost:5432      | Primary database             |
| **Redis**            | 6379 | redis://localhost:6379           | Cache & sessions             |
| **Elasticsearch**    | 9200 | http://localhost:9200            | Search engine                |
| **MinIO (S3)**       | 9000 | http://localhost:9000            | Object storage               |
| **MinIO Console**    | 9001 | http://localhost:9001            | MinIO web UI                 |
| **MailHog**          | 8025 | http://localhost:8025            | Email testing UI             |
| **Swagger Docs**     | 3000 | http://localhost:3000/docs       | API documentation            |

---

## Useful Commands

### Package Management

```powershell
# Install all dependencies
pnpm install

# Add a dependency to a specific workspace
pnpm add <package> --filter @cms/auth-service

# Add a dev dependency to root
pnpm add -D <package> -w

# Update all dependencies
pnpm update --recursive

# Check for outdated packages
pnpm outdated --recursive

# Clean all node_modules
pnpm run clean
```

### Build & Development

```powershell
# Build everything (packages first, then apps)
pnpm turbo build

# Dev mode — all services in parallel
pnpm dev

# Dev mode — single service
cd apps/content-service && pnpm dev

# Dev mode — frontend only
cd frontend/admin && pnpm dev

# Lint all workspaces
pnpm turbo lint

# Run all tests
pnpm turbo test
```

### Database

```powershell
# Run migrations
npx ts-node scripts/migrations/001_initial_schema.ts

# Run seeds
npx ts-node scripts/seeds/001_initial_data.ts

# Connect to database (Docker)
docker exec -it cms-postgres psql -U cms_admin -d cms_platform

# Quick table check
docker exec cms-postgres psql -U cms_admin -d cms_platform -c "\dt"

# Dump database
docker exec cms-postgres pg_dump -U cms_admin cms_platform > backup.sql
```

### Docker

```powershell
# Start everything
docker-compose up -d

# Start only infrastructure
docker-compose up -d postgres redis elasticsearch

# Rebuild a single service
docker-compose build auth-service
docker-compose up -d auth-service

# View logs
docker-compose logs -f api-gateway
docker-compose logs -f --tail=100 content-service

# Stop everything
docker-compose down

# Stop and delete all data (DESTRUCTIVE)
docker-compose down -v
```

### Testing & Debugging

```powershell
# Health check (all services through gateway)
Invoke-RestMethod http://localhost:3000/health

# Test auth flow
$body = @{ email="admin@example.com"; password="admin123" } | ConvertTo-Json
$res = Invoke-RestMethod -Method POST -Uri http://localhost:3000/api/v1/auth/login -Body $body -ContentType "application/json"
$token = $res.accessToken

# Authenticated request
Invoke-RestMethod -Uri http://localhost:3000/api/v1/content -Headers @{ Authorization = "Bearer $token" }

# Check Swagger docs
Start-Process http://localhost:3000/docs
```

---

## Additional Docs

| Document | Description |
|----------|-------------|
| [docs/API_ENDPOINTS.md](docs/API_ENDPOINTS.md) | Complete API endpoint reference with request/response examples |
| [docs/INFRASTRUCTURE_SETUP.md](docs/INFRASTRUCTURE_SETUP.md) | Detailed infrastructure setup guide for each service |
| [docs/PACKAGES.md](docs/PACKAGES.md) | All packages, dependencies, and technology reference |

---

## License

Private — All Rights Reserved.
