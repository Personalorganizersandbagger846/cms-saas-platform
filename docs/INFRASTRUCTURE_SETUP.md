# Infrastructure Setup Guide

> Step-by-step setup for every infrastructure dependency: PostgreSQL, Redis, Elasticsearch, S3/MinIO, SMTP, Kafka, JWT, and Encryption.

---

## Table of Contents

- [Overview](#overview)
- [PostgreSQL (Database)](#postgresql-database)
- [Redis (Cache & Sessions)](#redis-cache--sessions)
- [Elasticsearch (Search Engine)](#elasticsearch-search-engine)
- [S3 / MinIO (Object Storage)](#s3--minio-object-storage)
- [SMTP (Email)](#smtp-email)
- [Kafka (Event Streaming)](#kafka-event-streaming)
- [JWT (Authentication Tokens)](#jwt-authentication-tokens)
- [AES-256-GCM Encryption](#aes-256-gcm-encryption)
- [One-Command Docker Setup](#one-command-docker-setup)
- [Verifying All Services](#verifying-all-services)
- [Troubleshooting](#troubleshooting)

---

## Overview

| Service         | Default Port | Docker Image                              | Purpose                         |
| --------------- | ------------ | ----------------------------------------- | ------------------------------- |
| PostgreSQL      | 5432         | `postgres:16-alpine`                      | Primary relational database     |
| Redis           | 6379         | `redis:7-alpine`                          | Cache, sessions, rate limiting  |
| Elasticsearch   | 9200         | `elasticsearch:8.12.0`                    | Full-text search                |
| MinIO (S3)      | 9000 / 9001  | `minio/minio`                             | Object storage (files)          |
| MailHog (SMTP)  | 1025 / 8025  | `mailhog/mailhog`                         | Email testing (dev only)        |
| Kafka           | 9092         | `bitnami/kafka`                           | Event streaming (optional)      |

**Not infrastructure services (configured in `.env` only):**
- JWT — Configured via secret keys in `.env`
- Encryption — Configured via encryption key in `.env`

---

## PostgreSQL (Database)

PostgreSQL 16 is the primary data store for the entire platform. It stores 80+ tables including users, tenants, content, media metadata, workflows, audit logs, analytics, and more. Uses `uuid-ossp` and `pgcrypto` extensions.

### Docker Setup (Recommended)

```powershell
# Start PostgreSQL container
docker run -d --name cms-postgres `
  -e POSTGRES_DB=cms_platform `
  -e POSTGRES_USER=cms_admin `
  -e POSTGRES_PASSWORD=your_secure_password_here `
  -p 5432:5432 `
  -v cms_pgdata:/var/lib/postgresql/data `
  postgres:16-alpine

# Verify it's running
docker exec cms-postgres pg_isready -U cms_admin
# Expected: /var/run/postgresql:5432 - accepting connections

# Enable required extensions
docker exec cms-postgres psql -U cms_admin -d cms_platform -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
docker exec cms-postgres psql -U cms_admin -d cms_platform -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"
```

### Manual Setup (Windows)

```powershell
# Install PostgreSQL 16
winget install PostgreSQL.PostgreSQL.16

# Add to PATH (restart terminal after)
# Default: C:\Program Files\PostgreSQL\16\bin

# Create user and database
psql -U postgres
```

```sql
CREATE USER cms_admin WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE cms_platform OWNER cms_admin;
GRANT ALL PRIVILEGES ON DATABASE cms_platform TO cms_admin;
\c cms_platform
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
\q
```

### Environment Variables

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=cms_admin
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=cms_platform
POSTGRES_SSL=false
POSTGRES_POOL_MIN=2
POSTGRES_POOL_MAX=20
```

### Run Migrations & Seeds

```powershell
# Create 80+ tables
npx ts-node scripts/migrations/001_initial_schema.ts

# Seed roles, permissions, plans, default settings
npx ts-node scripts/seeds/001_initial_data.ts
```

### Useful Commands

```powershell
# Connect to database (interactive)
docker exec -it cms-postgres psql -U cms_admin -d cms_platform

# List all tables
docker exec cms-postgres psql -U cms_admin -d cms_platform -c "\dt"

# Count rows in a table
docker exec cms-postgres psql -U cms_admin -d cms_platform -c "SELECT COUNT(*) FROM users;"

# Backup database
docker exec cms-postgres pg_dump -U cms_admin cms_platform > backup.sql

# Restore database
docker exec -i cms-postgres psql -U cms_admin -d cms_platform < backup.sql

# Show running queries
docker exec cms-postgres psql -U cms_admin -d cms_platform -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Check database size
docker exec cms-postgres psql -U cms_admin -d cms_platform -c "SELECT pg_size_pretty(pg_database_size('cms_platform'));"
```

### Key Tables (partial list)

| Table                 | Description                                    |
| --------------------- | ---------------------------------------------- |
| `users`               | All user accounts (multi-tenant)              |
| `roles`               | Roles: super_admin, admin, editor, viewer     |
| `permissions`         | Granular permissions for RBAC                 |
| `role_permissions`    | M2M role ↔ permission                         |
| `sessions`            | Active user sessions + refresh tokens         |
| `tenants`             | Multi-tenant organizations                    |
| `tenant_members`      | Users belonging to tenants                    |
| `tenant_limits`       | Usage quotas per tenant plan                  |
| `content`             | Main content entries                          |
| `content_versions`    | Full version history for content              |
| `content_blocks`      | Block editor blocks (heading, para, image…)   |
| `content_tags`        | Content ↔ tag associations                    |
| `content_categories`  | Content ↔ category associations               |
| `media`               | Uploaded file metadata                        |
| `media_variants`      | Image variants (thumb, small, medium, large)  |
| `media_folders`       | Media library folder structure                |
| `comments`            | Threaded comments on content                  |
| `comment_reactions`   | Reactions on comments                         |
| `analytics_events`    | Page views, clicks, custom events             |
| `analytics_sessions`  | Visitor sessions                              |
| `notifications`       | In-app notifications                          |
| `notification_preferences` | Per-user notification settings           |
| `webhooks`            | Webhook endpoint configs                      |
| `webhook_deliveries`  | Webhook delivery log                          |
| `workflows`           | Workflow definitions                          |
| `workflow_steps`      | Steps within workflows                        |
| `workflow_instances`  | Running workflow instances                    |
| `plugins`             | Installed plugins                             |
| `plugin_configs`      | Plugin configuration per tenant               |
| `feature_flags`       | Feature flag definitions                      |
| `feature_flag_rules`  | Targeting rules for flags                     |
| `audit_logs`          | Full audit trail                              |
| `settings`            | Tenant & global settings                      |
| `plans`               | Subscription plans                            |
| `subscriptions`       | Active tenant subscriptions                   |
| `api_keys`            | Generated API keys (encrypted)                |

---

## Redis (Cache & Sessions)

Redis 7 is used for:
- **API response caching** — User profiles, tenant details, content, settings
- **Session storage** — Active user sessions
- **Rate limiting** — Sliding window counters per IP/user
- **Pub/Sub** — Real-time event notifications

### Docker Setup

```powershell
# Start Redis
docker run -d --name cms-redis `
  -p 6379:6379 `
  -v cms_redisdata:/data `
  redis:7-alpine

# Verify
docker exec cms-redis redis-cli ping
# Expected: PONG
```

### With Password (production)

```powershell
docker run -d --name cms-redis `
  -p 6379:6379 `
  -v cms_redisdata:/data `
  redis:7-alpine redis-server --requirepass your_redis_password
```

### Manual Setup (Windows)

```powershell
# Install via winget
winget install Redis.Redis

# Or use Memurai (native Windows Redis)
winget install Memurai.Memurai

# Start the server
redis-server

# Test it
redis-cli ping
```

### Environment Variables

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here
REDIS_DB=0
REDIS_CLUSTER=false
```

### Useful Commands

```powershell
# Connect to Redis CLI
docker exec -it cms-redis redis-cli

# List all keys
redis-cli KEYS *

# Check cache for a specific key
redis-cli GET "cms:cache:user:uuid-here"

# Get key expiration time (TTL)
redis-cli TTL "cms:cache:user:uuid-here"

# Flush all data (DESTRUCTIVE)
redis-cli FLUSHALL

# Monitor all commands in real-time
redis-cli MONITOR

# Check memory usage
redis-cli INFO memory

# Check number of connected clients
redis-cli INFO clients
```

### Cache Key Patterns Used

| Pattern                       | Description                    | TTL    |
| ----------------------------- | ------------------------------ | ------ |
| `cms:cache:user:{id}`         | User profile cache             | 5 min  |
| `cms:cache:tenant:{id}`       | Tenant details cache           | 5 min  |
| `cms:cache:content:{id}`      | Content with blocks cache      | 5 min  |
| `cms:cache:settings:{tenant}` | Tenant settings cache          | 10 min |
| `cms:ratelimit:{ip}:{window}` | Rate limit counters            | 1 min  |
| `cms:session:{userId}`        | Session data                   | 24 hr  |

---

## Elasticsearch (Search Engine)

Elasticsearch 8.12.0 powers:
- **Full-text search** with custom English analyzer
- **Autocomplete suggestions** with edge n-gram tokenizer
- **Faceted browsing** by content type, tags, categories, authors
- **Fuzzy matching** for typo tolerance

### Docker Setup

```powershell
# Start Elasticsearch (single-node, dev mode)
docker run -d --name cms-elasticsearch `
  -e discovery.type=single-node `
  -e xpack.security.enabled=false `
  -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" `
  -p 9200:9200 `
  -v cms_esdata:/usr/share/elasticsearch/data `
  docker.elastic.co/elasticsearch/elasticsearch:8.12.0

# Verify (wait ~30 seconds for startup)
Invoke-RestMethod http://localhost:9200

# Check cluster health
Invoke-RestMethod http://localhost:9200/_cluster/health
```

### Manual Setup (Windows)

```powershell
# Download Elasticsearch 8.12.0
# https://www.elastic.co/downloads/past-releases/elasticsearch-8-12-0

# Extract to C:\elasticsearch-8.12.0

# Edit config\elasticsearch.yml:
# discovery.type: single-node
# xpack.security.enabled: false

# Start
cd C:\elasticsearch-8.12.0
.\bin\elasticsearch.bat

# Verify
Invoke-RestMethod http://localhost:9200
```

### Environment Variables

```env
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_USER=elastic
ELASTICSEARCH_PASSWORD=your_elastic_password_here
```

### Index Management

The search service automatically creates and manages indices. If you need to do it manually:

```powershell
# List all indices
Invoke-RestMethod http://localhost:9200/_cat/indices?v

# Check index mapping
Invoke-RestMethod http://localhost:9200/cms_content/_mapping

# Search an index
$body = '{"query":{"match":{"title":"getting started"}}}'
Invoke-RestMethod -Method POST -Uri "http://localhost:9200/cms_content/_search" -Body $body -ContentType "application/json"

# Delete an index (DESTRUCTIVE)
Invoke-RestMethod -Method DELETE http://localhost:9200/cms_content

# Trigger reindex via API (through gateway)
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/v1/search/reindex" -Headers @{Authorization="Bearer $token"}

# Check index document count
Invoke-RestMethod http://localhost:9200/cms_content/_count

# Check cluster stats
Invoke-RestMethod http://localhost:9200/_cluster/stats
```

### Custom Analyzer

The search service configures a custom analyzer with:
- English stemming
- Stop word removal
- Edge n-gram for autocomplete (2-20 characters)
- Synonym support

---

## S3 / MinIO (Object Storage)

S3-compatible storage for all uploaded files (images, videos, PDFs). Images are automatically processed into multiple variants.

### MinIO (Local Development)

```powershell
# Start MinIO
docker run -d --name cms-minio `
  -p 9000:9000 `
  -p 9001:9001 `
  -e MINIO_ROOT_USER=minioadmin `
  -e MINIO_ROOT_PASSWORD=minioadmin `
  -v cms_miniodata:/data `
  minio/minio server /data --console-address ":9001"

# Open MinIO Console
Start-Process http://localhost:9001
# Login: minioadmin / minioadmin

# Create bucket using MinIO Client (mc)
docker exec cms-minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec cms-minio mc mb local/cms-media
docker exec cms-minio mc anonymous set download local/cms-media
```

### Environment Variables (Local/MinIO)

```env
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=cms-media
S3_REGION=us-east-1
```

### Environment Variables (AWS S3 — Production)

```env
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
S3_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BUCKET=your-cms-media-bucket
S3_REGION=us-east-1
```

### AWS S3 Setup

```powershell
# Install AWS CLI
winget install Amazon.AWSCLI

# Configure credentials
aws configure
# Enter your Access Key, Secret Key, region

# Create bucket
aws s3 mb s3://your-cms-media-bucket --region us-east-1

# Set CORS policy
aws s3api put-bucket-cors --bucket your-cms-media-bucket --cors-configuration '{\"CORSRules\":[{\"AllowedHeaders\":[\"*\"],\"AllowedMethods\":[\"GET\",\"PUT\",\"POST\",\"DELETE\"],\"AllowedOrigins\":[\"*\"],\"ExposeHeaders\":[\"ETag\"]}]}'

# Verify bucket
aws s3 ls s3://your-cms-media-bucket
```

### Image Processing

When an image is uploaded, the media service automatically creates these variants using Sharp:

| Variant    | Dimensions | Format | Purpose                |
| ---------- | ---------- | ------ | ---------------------- |
| `original` | As-is      | As-is  | Original file          |
| `thumbnail`| 150×150    | WebP   | Grid thumbnails        |
| `small`    | 300px wide | WebP   | Mobile screens         |
| `medium`   | 800px wide | WebP   | Content body           |
| `large`    | 1200px wide| WebP   | Full-width sections    |

### Useful Commands

```powershell
# List objects in bucket (MinIO)
docker exec cms-minio mc ls local/cms-media

# List objects (AWS)
aws s3 ls s3://your-cms-media-bucket --recursive

# Download a file
aws s3 cp s3://your-cms-media-bucket/uploads/image.webp ./image.webp

# Check bucket size
aws s3 ls s3://your-cms-media-bucket --recursive --summarize | Select-String "Total"
```

---

## SMTP (Email)

The notification service sends emails using Nodemailer with Handlebars templates. Emails include: welcome, password reset, content published, comment notifications, workflow actions.

### MailHog (Local Development)

MailHog catches all outbound emails and provides a web UI for viewing them.

```powershell
# Start MailHog
docker run -d --name cms-mailhog `
  -p 1025:1025 `
  -p 8025:8025 `
  mailhog/mailhog

# Open MailHog web UI
Start-Process http://localhost:8025
# SMTP server: localhost:1025 (no auth)
```

### Environment Variables (MailHog)

```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@cms-platform.local
```

### Gmail Setup

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_16_char_app_password
SMTP_FROM=your_email@gmail.com
```

> **How to get Gmail App Password:**
> 1. Go to https://myaccount.google.com/security
> 2. Enable 2-Step Verification
> 3. Go to https://myaccount.google.com/apppasswords
> 4. Generate an app password for "Other (Custom name)"
> 5. Use the 16-character password in `SMTP_PASSWORD`

### SendGrid Setup

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your_sendgrid_api_key_here
SMTP_FROM=noreply@your-domain.com
```

### AWS SES Setup

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_ses_smtp_user
SMTP_PASSWORD=your_ses_smtp_password
SMTP_FROM=noreply@your-verified-domain.com
```

### Mailgun Setup

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your_mailgun_smtp_password
SMTP_FROM=noreply@your-domain.com
```

### Test Email Sending

```powershell
# Send test email via API (requires running notification service)
$body = @{
  to = "test@example.com"
  subject = "Test Email"
  template = "welcome"
  data = @{ firstName = "Test" }
} | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri "http://localhost:3008/test-email" -Body $body -ContentType "application/json"

# Check MailHog for the email
Start-Process http://localhost:8025
```

### Email Templates

| Template              | Trigger                         |
| --------------------- | ------------------------------- |
| `welcome`             | User registration               |
| `password-reset`      | Password reset request          |
| `content-published`   | Content published notification  |
| `comment-created`     | New comment on user's content   |
| `workflow-action`     | Workflow step needs approval     |
| `invitation`          | Tenant membership invitation    |

---

## Kafka (Event Streaming)

Kafka is **optional** for development. The platform uses an in-memory EventBus by default. Use Kafka for production-scale async event processing.

### Docker Setup (KRaft mode — no Zookeeper)

```powershell
# Start Kafka
docker run -d --name cms-kafka `
  -p 9092:9092 `
  -e KAFKA_CFG_NODE_ID=0 `
  -e KAFKA_CFG_PROCESS_ROLES=controller,broker `
  -e KAFKA_CFG_LISTENERS=PLAINTEXT://:9092,CONTROLLER://:9093 `
  -e KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT `
  -e KAFKA_CFG_CONTROLLER_QUORUM_VOTERS=0@localhost:9093 `
  -e KAFKA_CFG_CONTROLLER_LISTENER_NAMES=CONTROLLER `
  -e KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 `
  bitnami/kafka:latest

# Verify it's running
docker exec cms-kafka kafka-topics.sh --bootstrap-server localhost:9092 --list
```

### Create Topics

```powershell
# Content events
docker exec cms-kafka kafka-topics.sh --bootstrap-server localhost:9092 --create --topic cms.content.events --partitions 3 --replication-factor 1

# User events
docker exec cms-kafka kafka-topics.sh --bootstrap-server localhost:9092 --create --topic cms.user.events --partitions 3 --replication-factor 1

# Audit events
docker exec cms-kafka kafka-topics.sh --bootstrap-server localhost:9092 --create --topic cms.audit.events --partitions 3 --replication-factor 1

# Notification events
docker exec cms-kafka kafka-topics.sh --bootstrap-server localhost:9092 --create --topic cms.notification.events --partitions 3 --replication-factor 1

# Analytics events
docker exec cms-kafka kafka-topics.sh --bootstrap-server localhost:9092 --create --topic cms.analytics.events --partitions 6 --replication-factor 1

# Workflow events
docker exec cms-kafka kafka-topics.sh --bootstrap-server localhost:9092 --create --topic cms.workflow.events --partitions 3 --replication-factor 1
```

### Environment Variables

```env
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=cms-platform
KAFKA_GROUP_ID=cms-consumers
```

### Kafka UI (Optional Monitoring)

```powershell
docker run -d --name cms-kafka-ui `
  -p 8080:8080 `
  -e KAFKA_CLUSTERS_0_NAME=cms-local `
  -e KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS=host.docker.internal:9092 `
  provectuslabs/kafka-ui:latest

# Open Kafka UI
Start-Process http://localhost:8080
```

### Useful Commands

```powershell
# List topics
docker exec cms-kafka kafka-topics.sh --bootstrap-server localhost:9092 --list

# Describe a topic
docker exec cms-kafka kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic cms.content.events

# Consume messages (for debugging)
docker exec cms-kafka kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic cms.content.events --from-beginning

# Produce a test message
docker exec -it cms-kafka kafka-console-producer.sh --bootstrap-server localhost:9092 --topic cms.content.events

# Check consumer group lag
docker exec cms-kafka kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group cms-consumers --describe

# Delete a topic
docker exec cms-kafka kafka-topics.sh --bootstrap-server localhost:9092 --delete --topic cms.content.events
```

---

## JWT (Authentication Tokens)

JSON Web Tokens are used for stateless authentication. Two tokens are issued: a short-lived **access token** and a long-lived **refresh token** (with rotation).

### Generate Secrets

```powershell
# Generate JWT_SECRET (64 hex characters)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate REFRESH_TOKEN_SECRET
node -e "console.log('REFRESH_TOKEN_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### Environment Variables

```env
JWT_SECRET=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1
REFRESH_TOKEN_EXPIRES_IN=7d
```

### Token Lifecycle

```
┌──────────────────────────────────────────────────────────────────┐
│                      JWT Token Flow                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. POST /api/v1/auth/login                                      │
│     → Returns accessToken (15 min) + refreshToken (7 days)       │
│                                                                  │
│  2. All API calls use accessToken:                               │
│     Authorization: Bearer <accessToken>                          │
│                                                                  │
│  3. When accessToken expires (15 min):                           │
│     POST /api/v1/auth/refresh                                    │
│     Body: { "refreshToken": "..." }                              │
│     → Returns NEW accessToken + NEW refreshToken (rotation)      │
│                                                                  │
│  4. POST /api/v1/auth/logout                                     │
│     → Revokes ALL sessions for user                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Token Payload Structure

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "role": "admin",
  "tenantId": "660e8400-e29b-41d4-a716-446655440000",
  "permissions": ["content.read", "content.create", "content.update"],
  "iat": 1709000000,
  "exp": 1709000900,
  "iss": "cms-platform"
}
```

### Security Features

- **Argon2id** password hashing (memory: 64MB, iterations: 3, parallelism: 4)
- **Token rotation** — Refresh tokens are single-use, new pair issued each time
- **Session tracking** — Server-side session validation (tokens can be revoked)
- **2FA support** — TOTP via Google Authenticator / Authy (using `speakeasy`)
- **API keys** — Long-lived keys for server-to-server calls (encrypted in DB)
- **Rate limiting** — Auth endpoints limited to 20 req/min

### 2FA Setup (for users)

```bash
# Enable 2FA — returns QR code for authenticator app
POST /api/v1/auth/2fa/enable
Authorization: Bearer <token>

# Verify 2FA with code from authenticator
POST /api/v1/auth/2fa/verify
Authorization: Bearer <token>
Content-Type: application/json
{
  "code": "123456"
}
```

---

## AES-256-GCM Encryption

AES-256 in GCM mode provides authenticated encryption for sensitive data at rest. Used for encrypting API keys, 2FA secrets, and sensitive tenant configuration.

### Generate Encryption Key

```powershell
# Generate a 32-byte (256-bit) key
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# Example output:
# ENCRYPTION_KEY=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2

# Or using PowerShell
$key = -join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
Write-Output "ENCRYPTION_KEY=$key"
```

### Environment Variables

```env
ENCRYPTION_KEY=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
ENCRYPTION_ALGORITHM=aes-256-gcm
```

### How It Works

```
┌─────────────────────────────────────────────────────────┐
│                  AES-256-GCM Encryption                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Encrypt:                                                │
│    plaintext → AES-256-GCM(key, random_iv) → ciphertext │
│    Output: iv:authTag:ciphertext (base64)                │
│                                                          │
│  Decrypt:                                                │
│    iv:authTag:ciphertext → AES-256-GCM(key, iv) → plain │
│    Verifies authTag → integrity check                    │
│                                                          │
│  Properties:                                             │
│    ✓ Confidentiality — data is encrypted                 │
│    ✓ Integrity — GCM auth tag detects tampering          │
│    ✓ Random IV — same plaintext → different ciphertext   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### What Gets Encrypted

| Data                  | Where Used                  |
| --------------------- | --------------------------- |
| API keys              | api_keys table              |
| 2FA secrets           | users table (totp_secret)   |
| Webhook secrets       | webhooks table              |
| Sensitive config      | plugin_configs table        |
| OAuth tokens          | integrations table          |

### Security Best Practices

1. **Never commit the key** — Keep `ENCRYPTION_KEY` out of source control
2. **Backup the key** — Store it in a secure vault (AWS Secrets Manager, HashiCorp Vault)
3. **Key rotation** — Plan for key rotation; re-encrypt affected data when rotating
4. **Different keys per environment** — dev, staging, production should each have unique keys

---

## One-Command Docker Setup

Start **all** infrastructure services with Docker Compose:

```powershell
# From the project root
docker-compose up -d postgres redis elasticsearch

# Or start everything including all microservices
docker-compose up -d
```

The `docker-compose.yml` includes:

| Container            | Image                             | Ports        |
| -------------------- | --------------------------------- | ------------ |
| `cms-postgres`       | `postgres:16-alpine`              | 5432         |
| `cms-redis`          | `redis:7-alpine`                  | 6379         |
| `cms-elasticsearch`  | `elasticsearch:8.12.0`            | 9200         |
| `api-gateway`        | `Dockerfile.service` (built)      | 3000         |
| `auth-service`       | `Dockerfile.service` (built)      | 3001         |
| `user-service`       | `Dockerfile.service` (built)      | 3002         |
| `tenant-service`     | `Dockerfile.service` (built)      | 3003         |
| `content-service`    | `Dockerfile.service` (built)      | 3004         |
| `media-service`      | `Dockerfile.service` (built)      | 3005         |
| `comment-service`    | `Dockerfile.service` (built)      | 3006         |
| `analytics-service`  | `Dockerfile.service` (built)      | 3007         |
| `notification-service` | `Dockerfile.service` (built)    | 3008         |
| `search-service`     | `Dockerfile.service` (built)      | 3009         |
| `workflow-service`   | `Dockerfile.service` (built)      | 3010         |
| `plugin-service`     | `Dockerfile.service` (built)      | 3011         |
| `feature-service`    | `Dockerfile.service` (built)      | 3012         |
| `audit-service`      | `Dockerfile.service` (built)      | 3013         |
| `settings-service`   | `Dockerfile.service` (built)      | 3014         |
| `ai-service`         | `Dockerfile.service` (built)      | 3015         |
| `frontend`           | `Dockerfile.frontend` (Nginx)     | 80           |

---

## Verifying All Services

After starting, run these checks:

```powershell
# 1. Check infrastructure
docker exec cms-postgres pg_isready -U cms_admin                   # PostgreSQL
docker exec cms-redis redis-cli ping                                # Redis
Invoke-RestMethod http://localhost:9200/_cluster/health             # Elasticsearch

# 2. Check API Gateway
Invoke-RestMethod http://localhost:3000/health

# 3. Check individual services
@(3001,3002,3003,3004,3005,3006,3007,3008,3009,3010,3011,3012,3013,3014,3015) | ForEach-Object {
  try {
    $result = Invoke-RestMethod "http://localhost:$_/health" -TimeoutSec 3
    Write-Host "Port $_ : OK" -ForegroundColor Green
  } catch {
    Write-Host "Port $_ : FAILED" -ForegroundColor Red
  }
}

# 4. Check frontend
Start-Process http://localhost:5173

# 5. Test full auth flow
$login = Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/v1/auth/login" `
  -Body '{"email":"admin@example.com","password":"admin123"}' `
  -ContentType "application/json"
Write-Host "Token: $($login.accessToken.Substring(0,20))..."
```

---

## Troubleshooting

### PostgreSQL won't start

```powershell
# Check logs
docker logs cms-postgres

# Port already in use?
netstat -ano | findstr :5432
# Kill the process if needed
taskkill /PID <pid> /F
```

### Elasticsearch out of memory

```powershell
# Increase memory allocation
docker run -d --name cms-elasticsearch `
  -e "ES_JAVA_OPTS=-Xms1g -Xmx1g" `
  ...
```

### Redis connection refused

```powershell
# Check if Redis is running
docker ps | Select-String redis

# Check port
Test-NetConnection localhost -Port 6379
```

### Cannot connect to MinIO

```powershell
# Check MinIO health
Invoke-RestMethod http://localhost:9000/minio/health/live

# Check container logs
docker logs cms-minio
```

### pnpm install fails

```powershell
# Clear pnpm cache
pnpm store prune

# Remove node_modules and retry
Remove-Item -Recurse -Force node_modules
pnpm install
```

### Migration fails

```powershell
# Check database connection
docker exec cms-postgres psql -U cms_admin -d cms_platform -c "SELECT 1;"

# Check if extensions exist
docker exec cms-postgres psql -U cms_admin -d cms_platform -c "SELECT * FROM pg_extension;"

# Run migration with verbose logging
npx ts-node scripts/migrations/001_initial_schema.ts 2>&1
```

### Service won't start

```powershell
# Check if required env vars are set
Get-Content .env | Select-String "POSTGRES_HOST|REDIS_HOST|ELASTICSEARCH_NODE"

# Check if infrastructure services are running
docker-compose ps

# Start with verbose logging
$env:NODE_ENV="development"
$env:LOG_LEVEL="debug"
cd apps/auth-service
pnpm dev
```
