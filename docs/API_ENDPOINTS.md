# API Endpoints Reference

> Complete API reference for all 15 microservices. All routes are accessible through the API Gateway at `http://localhost:3000`.

---

## Table of Contents

- [Authentication](#authentication)
- [Gateway Routes](#gateway-routes)
- [Auth Service](#1-auth-service)
- [User Service](#2-user-service)
- [Tenant Service](#3-tenant-service)
- [Content Service](#4-content-service)
- [Media Service](#5-media-service)
- [Comment Service](#6-comment-service)
- [Analytics Service](#7-analytics-service)
- [Notification Service](#8-notification-service)
- [Search Service](#9-search-service)
- [Workflow Service](#10-workflow-service)
- [Plugin Service](#11-plugin-service)
- [Feature Flag Service](#12-feature-flag-service)
- [Audit Service](#13-audit-service)
- [Settings Service](#14-settings-service)
- [AI Service](#15-ai-service)
- [Request/Response Examples](#requestresponse-examples)
- [Error Codes](#error-codes)

---

## Authentication

All authenticated endpoints require a JWT bearer token:

```
Authorization: Bearer <access_token>
```

**Getting a token:**

```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

**Permission system:** Routes require specific permissions (e.g., `content.read`, `content.create`). Permissions are assigned to roles, and roles are assigned to users within tenants.

---

## Gateway Routes

**Base URL:** `http://localhost:3000`

| Method | Route          | Description                      |
| ------ | -------------- | -------------------------------- |
| GET    | `/health`      | Health check — pings all services |
| GET    | `/metrics`     | Prometheus-style metrics          |
| GET    | `/docs`        | Swagger UI documentation          |

**Global middleware:**
- Rate limiting: 100 requests/minute per IP
- CORS enabled
- Helmet security headers
- Request ID tracing (`X-Request-ID`)
- Request logging

**Proxy prefix mapping:**

| Gateway Prefix        | Upstream Service     | Port |
| --------------------- | -------------------- | ---- |
| `/api/v1/auth`        | auth-service         | 3001 |
| `/api/v1/users`       | user-service         | 3002 |
| `/api/v1/tenants`     | tenant-service       | 3003 |
| `/api/v1/content`     | content-service      | 3004 |
| `/api/v1/media`       | media-service        | 3005 |
| `/api/v1/comments`    | comment-service      | 3006 |
| `/api/v1/analytics`   | analytics-service    | 3007 |
| `/api/v1/notifications` | notification-service | 3008 |
| `/api/v1/search`      | search-service       | 3009 |
| `/api/v1/workflows`   | workflow-service     | 3010 |
| `/api/v1/plugins`     | plugin-service       | 3011 |
| `/api/v1/features`    | feature-service      | 3012 |
| `/api/v1/audit`       | audit-service        | 3013 |
| `/api/v1/settings`    | settings-service     | 3014 |
| `/api/v1/ai`          | ai-service           | 3015 |

---

## 1. Auth Service

**Gateway prefix:** `/api/v1/auth` | **Direct:** `http://localhost:3001`

| Method | Route                | Auth | Description                                    |
| ------ | -------------------- | ---- | ---------------------------------------------- |
| POST   | `/register`          | No   | Register a new user                            |
| POST   | `/login`             | No   | Login with email/password (supports 2FA)       |
| POST   | `/refresh`           | No   | Refresh access token (token rotation)          |
| POST   | `/logout`            | Yes  | Logout — revoke all sessions                   |
| POST   | `/forgot-password`   | No   | Request password reset email                   |
| POST   | `/reset-password`    | No   | Reset password using token                     |
| GET    | `/me`                | Yes  | Get current user's profile                     |

### Request Examples

**Register:**
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecureP@ss123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Login:**
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecureP@ss123!"
}
```

**Login with 2FA:**
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecureP@ss123!",
  "twoFactorCode": "123456"
}
```

**Refresh token:**
```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOi..."
}
```

**Forgot password:**
```bash
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Reset password:**
```bash
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "password": "NewSecureP@ss456!"
}
```

---

## 2. User Service

**Gateway prefix:** `/api/v1/users` | **Direct:** `http://localhost:3002`

| Method | Route   | Auth | Permission      | Description               |
| ------ | ------- | ---- | --------------- | ------------------------- |
| GET    | `/`     | Yes  | `users.read`    | List users in tenant      |
| GET    | `/:id`  | Yes  | —               | Get user profile (cached) |
| PATCH  | `/:id`  | Yes  | `users.manage`  | Update user profile       |
| DELETE | `/:id`  | Yes  | `users.manage`  | Soft-delete user          |

### Request Examples

**List users:**
```bash
GET /api/v1/users?page=1&limit=20&search=john
Authorization: Bearer <token>
```

**Update user:**
```bash
PATCH /api/v1/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Updated",
  "avatar": "https://example.com/avatar.jpg"
}
```

---

## 3. Tenant Service

**Gateway prefix:** `/api/v1/tenants` | **Direct:** `http://localhost:3003`

| Method | Route            | Auth | Permission       | Description                        |
| ------ | ---------------- | ---- | ---------------- | ---------------------------------- |
| POST   | `/`              | Yes  | —                | Create a new tenant                |
| GET    | `/`              | Yes  | —                | List user's tenants                |
| GET    | `/:id`           | Yes  | —                | Get tenant details (cached)        |
| PATCH  | `/:id`           | Yes  | `tenant.manage`  | Update tenant name/settings        |
| GET    | `/:id/members`   | Yes  | —                | List tenant members (paginated)    |
| POST   | `/:id/members`   | Yes  | `users.manage`   | Invite member to tenant            |
| GET    | `/:id/usage`     | Yes  | —                | Get resource usage & limits        |

### Request Examples

**Create tenant:**
```bash
POST /api/v1/tenants
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Company",
  "slug": "my-company"
}
```

**Invite member:**
```bash
POST /api/v1/tenants/550e...000/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "member@example.com",
  "roleId": "role-uuid-here"
}
```

---

## 4. Content Service

**Gateway prefix:** `/api/v1/content` | **Direct:** `http://localhost:3004`

| Method | Route                              | Auth | Permission        | Description                     |
| ------ | ---------------------------------- | ---- | ----------------- | ------------------------------- |
| POST   | `/`                                | Yes  | `content.create`  | Create content with blocks      |
| GET    | `/`                                | Yes  | `content.read`    | List content (filtered)         |
| GET    | `/:id`                             | Yes  | `content.read`    | Get content with blocks (cached)|
| PATCH  | `/:id`                             | Yes  | `content.update`  | Update content (new version)    |
| DELETE | `/:id`                             | Yes  | `content.delete`  | Soft-delete/archive content     |
| GET    | `/:id/versions`                    | Yes  | `content.read`    | List version history            |
| POST   | `/:id/versions/:version/restore`   | Yes  | `content.update`  | Restore to a specific version   |
| POST   | `/:id/publish`                     | Yes  | `content.publish` | Publish content                 |
| POST   | `/:id/unpublish`                   | Yes  | `content.publish` | Unpublish content to draft      |

**Query parameters for `GET /`:**
- `page` (number) — Page number, default 1
- `limit` (number) — Items per page, default 20
- `status` (string) — Filter: `draft`, `published`, `archived`
- `contentType` (string) — Filter by content type
- `authorId` (uuid) — Filter by author

### Request Examples

**Create content:**
```bash
POST /api/v1/content
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My First Article",
  "slug": "my-first-article",
  "contentType": "article",
  "status": "draft",
  "blocks": [
    {
      "type": "heading",
      "content": { "text": "Introduction", "level": 2 },
      "order": 0
    },
    {
      "type": "paragraph",
      "content": { "text": "This is the body of the article." },
      "order": 1
    },
    {
      "type": "image",
      "content": { "url": "https://cdn.example.com/photo.jpg", "alt": "Photo" },
      "order": 2
    }
  ],
  "tags": ["tutorial", "getting-started"],
  "categories": ["guides"]
}
```

**Publish content:**
```bash
POST /api/v1/content/550e...000/publish
Authorization: Bearer <token>
```

**Restore version:**
```bash
POST /api/v1/content/550e...000/versions/3/restore
Authorization: Bearer <token>
```

---

## 5. Media Service

**Gateway prefix:** `/api/v1/media` | **Direct:** `http://localhost:3005`

| Method | Route                    | Auth | Permission     | Description                           |
| ------ | ------------------------ | ---- | -------------- | ------------------------------------- |
| POST   | `/`                      | Yes  | `media.upload` | Upload file (auto image variants)     |
| GET    | `/`                      | Yes  | `media.read`   | List media (filtered)                 |
| GET    | `/:id`                   | Yes  | `media.read`   | Get media details + variants          |
| DELETE | `/:id`                   | Yes  | `media.delete` | Delete from S3 + soft-delete          |
| GET    | `/:id/presigned-url`     | Yes  | `media.read`   | Get presigned download URL            |
| POST   | `/folders`               | Yes  | `media.upload` | Create media folder                   |
| GET    | `/folders`               | Yes  | `media.read`   | List media folders                    |
| DELETE | `/folders/:id`           | Yes  | `media.delete` | Delete empty folder                   |
| PATCH  | `/:id/move`              | Yes  | `media.upload` | Move media to folder                  |

**Upload variants generated automatically for images:**
- `thumbnail` — 150×150
- `small` — 300px width
- `medium` — 800px width
- `large` — 1200px width
- All variants in WebP format

### Request Examples

**Upload file:**
```bash
POST /api/v1/media
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
folderId: optional-folder-uuid
```

**List media:**
```bash
GET /api/v1/media?mimeType=image&folderId=uuid&search=photo&page=1&limit=20
Authorization: Bearer <token>
```

---

## 6. Comment Service

**Gateway prefix:** `/api/v1/comments` | **Direct:** `http://localhost:3006`

| Method | Route                       | Auth | Permission       | Description                    |
| ------ | --------------------------- | ---- | ---------------- | ------------------------------ |
| POST   | `/content/:contentId`       | Yes  | —                | Create comment (threaded)      |
| GET    | `/content/:contentId`       | Yes  | —                | List comments (paginated)      |
| PATCH  | `/:id`                      | Yes  | —                | Update own comment             |
| DELETE | `/:id`                      | Yes  | —                | Delete comment (own or admin)  |
| POST   | `/:id/reactions`            | Yes  | —                | Toggle reaction                |
| POST   | `/:id/approve`              | Yes  | `content.update` | Approve comment (moderation)   |
| POST   | `/:id/reject`               | Yes  | `content.update` | Reject comment (moderation)    |
| GET    | `/threads/:contentId`       | Yes  | —                | List comment threads           |

**Available reactions:** `like`, `love`, `laugh`, `surprised`, `sad`, `angry`

### Request Examples

**Create threaded comment:**
```bash
POST /api/v1/comments/content/550e...000
Authorization: Bearer <token>
Content-Type: application/json

{
  "body": "Great article!",
  "parentId": null
}
```

**Reply to comment:**
```bash
POST /api/v1/comments/content/550e...000
Authorization: Bearer <token>
Content-Type: application/json

{
  "body": "Thanks for the feedback!",
  "parentId": "parent-comment-uuid"
}
```

**Toggle reaction:**
```bash
POST /api/v1/comments/550e...000/reactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "like"
}
```

---

## 7. Analytics Service

**Gateway prefix:** `/api/v1/analytics` | **Direct:** `http://localhost:3007`

| Method | Route                  | Auth | Permission       | Description                      |
| ------ | ---------------------- | ---- | ---------------- | -------------------------------- |
| POST   | `/events`              | No   | —                | Track event (public)             |
| POST   | `/sessions`            | No   | —                | Start session (public)           |
| GET    | `/overview`            | Yes  | `analytics.view` | Dashboard overview stats         |
| GET    | `/top-content`         | Yes  | `analytics.view` | Top content by pageviews         |
| GET    | `/referrers`           | Yes  | `analytics.view` | Top referrers                    |
| GET    | `/devices`             | Yes  | `analytics.view` | Device/browser/OS breakdown      |
| GET    | `/timeseries`          | Yes  | `analytics.view` | Time-series data for any metric  |
| GET    | `/content/:contentId`  | Yes  | `analytics.view` | Per-content analytics            |

### Request Examples

**Track event:**
```bash
POST /api/v1/analytics/events
Content-Type: application/json

{
  "tenantId": "tenant-uuid",
  "sessionId": "session-uuid",
  "event": "page_view",
  "contentId": "content-uuid",
  "metadata": {
    "path": "/blog/my-article",
    "referrer": "https://google.com",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Overview stats:**
```bash
GET /api/v1/analytics/overview?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

**Time-series:**
```bash
GET /api/v1/analytics/timeseries?metric=pageviews&period=day&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

---

## 8. Notification Service

**Gateway prefix:** `/api/v1/notifications` | **Direct:** `http://localhost:3008`

| Method | Route                     | Auth | Description                     |
| ------ | ------------------------- | ---- | ------------------------------- |
| GET    | `/`                       | Yes  | List notifications              |
| GET    | `/unread-count`           | Yes  | Get unread count                |
| PATCH  | `/:id/read`               | Yes  | Mark as read                    |
| POST   | `/read-all`               | Yes  | Mark all as read                |
| DELETE | `/:id`                    | Yes  | Delete notification             |
| GET    | `/preferences`            | Yes  | Get notification preferences    |
| PUT    | `/preferences`            | Yes  | Update preferences              |
| POST   | `/webhooks`               | Yes  | Create webhook                  |
| GET    | `/webhooks`               | Yes  | List webhooks                   |
| DELETE | `/webhooks/:id`           | Yes  | Delete webhook                  |
| GET    | `/webhooks/:id/deliveries`| Yes  | Get webhook delivery history    |

### Request Examples

**List notifications:**
```bash
GET /api/v1/notifications?unreadOnly=true&type=comment
Authorization: Bearer <token>
```

**Create webhook:**
```bash
POST /api/v1/notifications/webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["content.published", "comment.created"],
  "secret": "your-webhook-secret"
}
```

**Update preferences:**
```bash
PUT /api/v1/notifications/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": {
    "content_published": true,
    "comment_created": true,
    "workflow_action": true
  },
  "inApp": {
    "content_published": true,
    "comment_created": true,
    "workflow_action": true
  }
}
```

---

## 9. Search Service

**Gateway prefix:** `/api/v1/search` | **Direct:** `http://localhost:3009`

| Method | Route       | Auth | Permission         | Description                          |
| ------ | ----------- | ---- | ------------------ | ------------------------------------ |
| GET    | `/`         | Yes  | —                  | Full-text search                     |
| GET    | `/suggest`  | Yes  | —                  | Autocomplete suggestions (cached)    |
| POST   | `/reindex`  | Yes  | `settings.manage`  | Reindex all tenant documents         |

### Request Examples

**Full-text search:**
```bash
GET /api/v1/search?q=getting+started&contentType=article&tags=tutorial&page=1&limit=10
Authorization: Bearer <token>
```

**Autocomplete:**
```bash
GET /api/v1/search/suggest?q=gett
Authorization: Bearer <token>
```

**Reindex:**
```bash
POST /api/v1/search/reindex
Authorization: Bearer <token>
```

---

## 10. Workflow Service

**Gateway prefix:** `/api/v1/workflows` | **Direct:** `http://localhost:3010`

| Method | Route                               | Auth | Permission         | Description                   |
| ------ | ----------------------------------- | ---- | ------------------ | ----------------------------- |
| POST   | `/`                                 | Yes  | `settings.manage`  | Create workflow definition    |
| GET    | `/`                                 | Yes  | —                  | List workflows                |
| GET    | `/:id`                              | Yes  | —                  | Get workflow + steps          |
| DELETE | `/:id`                              | Yes  | `settings.manage`  | Deactivate workflow           |
| POST   | `/:id/instances`                    | Yes  | —                  | Start workflow instance       |
| GET    | `/:id/instances`                    | Yes  | —                  | List instances (paginated)    |
| POST   | `/instances/:instanceId/approve`    | Yes  | —                  | Approve step (role-checked)   |
| POST   | `/instances/:instanceId/reject`     | Yes  | —                  | Reject instance               |
| GET    | `/instances/:instanceId/history`    | Yes  | —                  | Get step-by-step history      |
| GET    | `/my-tasks`                         | Yes  | —                  | Pending tasks for current user|

### Request Examples

**Create workflow:**
```bash
POST /api/v1/workflows
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Article Review",
  "description": "3-step article approval",
  "steps": [
    { "name": "Editor Review", "role": "editor", "order": 1 },
    { "name": "Manager Approval", "role": "admin", "order": 2 },
    { "name": "Legal Check", "role": "admin", "order": 3 }
  ]
}
```

**Start instance:**
```bash
POST /api/v1/workflows/workflow-uuid/instances
Authorization: Bearer <token>
Content-Type: application/json

{
  "contentId": "content-uuid"
}
```

**Approve step:**
```bash
POST /api/v1/workflows/instances/instance-uuid/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "comment": "Looks good, approved!"
}
```

---

## 11. Plugin Service

**Gateway prefix:** `/api/v1/plugins` | **Direct:** `http://localhost:3011`

| Method | Route                  | Auth | Permission        | Description                     |
| ------ | ---------------------- | ---- | ----------------- | ------------------------------- |
| GET    | `/`                    | Yes  | `plugins.manage`  | List installed plugins          |
| POST   | `/`                    | Yes  | `plugins.manage`  | Install plugin                  |
| GET    | `/:id`                 | Yes  | `plugins.manage`  | Get plugin details + config     |
| POST   | `/:id/activate`        | Yes  | `plugins.manage`  | Activate plugin                 |
| POST   | `/:id/deactivate`      | Yes  | `plugins.manage`  | Deactivate plugin               |
| DELETE | `/:id`                 | Yes  | `plugins.manage`  | Uninstall plugin                |
| PUT    | `/:id/config`          | Yes  | `plugins.manage`  | Update plugin configuration     |
| GET    | `/marketplace/browse`  | Yes  | —                 | Browse marketplace              |

### Request Examples

**Install plugin:**
```bash
POST /api/v1/plugins
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "seo-optimizer",
  "version": "1.0.0",
  "source": "marketplace"
}
```

**Update plugin config:**
```bash
PUT /api/v1/plugins/plugin-uuid/config
Authorization: Bearer <token>
Content-Type: application/json

{
  "autoGenerateMeta": true,
  "defaultLanguage": "en"
}
```

---

## 12. Feature Flag Service

**Gateway prefix:** `/api/v1/features` | **Direct:** `http://localhost:3012`

| Method | Route            | Auth | Permission         | Description                      |
| ------ | ---------------- | ---- | ------------------ | -------------------------------- |
| POST   | `/`              | Yes  | `settings.manage`  | Create feature flag              |
| GET    | `/`              | Yes  | `settings.manage`  | List all flags                   |
| GET    | `/evaluate`      | Yes  | —                  | Evaluate flags for current user  |
| PATCH  | `/:id`           | Yes  | `settings.manage`  | Toggle/update flag               |
| DELETE | `/:id`           | Yes  | `settings.manage`  | Delete flag + rules              |
| PUT    | `/:id/rules`     | Yes  | `settings.manage`  | Replace targeting rules          |

### Request Examples

**Create feature flag:**
```bash
POST /api/v1/features
Authorization: Bearer <token>
Content-Type: application/json

{
  "key": "new-editor",
  "name": "New Block Editor",
  "description": "Enable the new block editor experience",
  "enabled": false,
  "rules": [
    {
      "type": "percentage",
      "value": 25,
      "description": "25% rollout"
    }
  ]
}
```

**Evaluate flags:**
```bash
GET /api/v1/features/evaluate
Authorization: Bearer <token>
```

Response:
```json
{
  "new-editor": true,
  "dark-mode": false,
  "ai-features": true
}
```

---

## 13. Audit Service

**Gateway prefix:** `/api/v1/audit` | **Direct:** `http://localhost:3013`

| Method | Route       | Auth | Permission         | Description                     |
| ------ | ----------- | ---- | ------------------ | ------------------------------- |
| GET    | `/`         | Yes  | `settings.manage`  | Search audit logs (filtered)    |
| GET    | `/actions`  | Yes  | `settings.manage`  | List distinct action types      |
| GET    | `/summary`  | Yes  | `settings.manage`  | Activity summary                |
| GET    | `/export`   | Yes  | `settings.manage`  | Export as JSON or CSV           |

### Request Examples

**Search audit logs:**
```bash
GET /api/v1/audit?action=content.published&userId=uuid&startDate=2024-01-01&endDate=2024-01-31&page=1&limit=50
Authorization: Bearer <token>
```

**Export:**
```bash
GET /api/v1/audit/export?format=csv&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

---

## 14. Settings Service

**Gateway prefix:** `/api/v1/settings` | **Direct:** `http://localhost:3014`

| Method | Route               | Auth | Permission         | Description                         |
| ------ | ------------------- | ---- | ------------------ | ----------------------------------- |
| GET    | `/`                 | Yes  | `settings.manage`  | Get all tenant settings (cached)    |
| GET    | `/:key`             | Yes  | —                  | Get single setting                  |
| PUT    | `/:key`             | Yes  | `settings.manage`  | Create/update setting               |
| PUT    | `/bulk/update`      | Yes  | `settings.manage`  | Bulk update settings                |
| GET    | `/public/:tenantId` | No   | —                  | Get public tenant settings (cached) |
| GET    | `/plans`            | No   | —                  | List available plans                |
| GET    | `/billing`          | Yes  | `billing.manage`   | Get billing & subscription info     |

### Request Examples

**Get all settings:**
```bash
GET /api/v1/settings
Authorization: Bearer <token>
```

**Update setting:**
```bash
PUT /api/v1/settings/site.name
Authorization: Bearer <token>
Content-Type: application/json

{
  "value": "My Awesome CMS",
  "type": "string"
}
```

**Bulk update:**
```bash
PUT /api/v1/settings/bulk/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "settings": [
    { "key": "site.name", "value": "My CMS", "type": "string" },
    { "key": "site.language", "value": "en", "type": "string" },
    { "key": "comments.autoApprove", "value": true, "type": "boolean" }
  ]
}
```

---

## 15. AI Service

**Gateway prefix:** `/api/v1/ai` | **Direct:** `http://localhost:3015`

> Requires `OPENAI_API_KEY` in `.env`

| Method | Route          | Auth | Description                              |
| ------ | -------------- | ---- | ---------------------------------------- |
| POST   | `/generate`    | Yes  | Generate content (article, title, SEO…)  |
| POST   | `/improve`     | Yes  | Improve/rewrite content                  |
| POST   | `/summarize`   | Yes  | Summarize as paragraph, bullets, TL;DR   |
| POST   | `/translate`   | Yes  | Translate to target language              |
| POST   | `/seo-analyze` | Yes  | SEO analysis with scoring                |
| POST   | `/alt-text`    | Yes  | Generate image alt text                  |

### Request Examples

**Generate article:**
```bash
POST /api/v1/ai/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "article",
  "topic": "Best practices for API design",
  "tone": "professional",
  "length": "long"
}
```

**Improve content:**
```bash
POST /api/v1/ai/improve
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "This is some rough text that need improvement.",
  "action": "fix-grammar"
}
```

**Available improve actions:** `rewrite`, `simplify`, `expand`, `fix-grammar`, `make-formal`, `make-casual`

**Translate:**
```bash
POST /api/v1/ai/translate
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hello, welcome to our platform!",
  "targetLanguage": "es"
}
```

**SEO analysis:**
```bash
POST /api/v1/ai/seo-analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My Blog Post Title",
  "content": "Full content text here...",
  "keywords": ["api", "design", "rest"]
}
```

**Response:**
```json
{
  "score": 72,
  "analysis": {
    "title": { "score": 85, "suggestions": ["Add primary keyword closer to the beginning"] },
    "readability": { "score": 68, "suggestions": ["Break up long paragraphs"] },
    "keywords": { "score": 75, "suggestions": ["Use keyword 'api' more frequently"] },
    "structure": { "score": 60, "suggestions": ["Add more H2/H3 headings"] }
  }
}
```

---

## Error Codes

All services return standardized error responses:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Content with id 'xyz' not found",
    "statusCode": 404
  }
}
```

| Status Code | Error Code               | Description                |
| ----------- | ------------------------ | -------------------------- |
| 400         | `VALIDATION_ERROR`       | Invalid request body/params|
| 401         | `UNAUTHORIZED`           | Missing or invalid token   |
| 403         | `FORBIDDEN`              | Insufficient permissions   |
| 404         | `RESOURCE_NOT_FOUND`     | Resource doesn't exist     |
| 409         | `CONFLICT`               | Resource already exists    |
| 423         | `RESOURCE_LOCKED`        | Content is locked          |
| 429         | `RATE_LIMIT_EXCEEDED`    | Too many requests          |
| 500         | `INTERNAL_ERROR`         | Internal server error      |

---

## Rate Limiting

- Global: **100 requests/minute** per IP (via API Gateway)
- Auth endpoints: **20 requests/minute** (stricter for security)
- File upload: **10 requests/minute**

Headers returned:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1709000060
```

---

**Total API surface: ~100 unique endpoints across 15 microservices**
