# CloudPulse — Complete Application Flow
### Smart Infrastructure Cost Intelligence · V1 + V2 Full Coverage
> *Authored from the Office of the CTO. Every flow. Every step. No exceptions.*

**Document Type:** Technical App Flow Reference  
**Coverage:** V1 Foundation + V2 Intelligence Release  
**Classification:** Internal — Engineering, Product, Design

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Authentication Flows](#2-authentication-flows)
3. [Onboarding Flows](#3-onboarding-flows)
4. [Real-Time Data Pipeline Flow](#4-real-time-data-pipeline-flow)
5. [Main Dashboard Flow](#5-main-dashboard-flow)
6. [Resource Monitoring Flow](#6-resource-monitoring-flow)
7. [Cost Analytics Flow](#7-cost-analytics-flow)
8. [Alert Engine Flow](#8-alert-engine-flow)
9. [AI Recommendation Engine Flow](#9-ai-recommendation-engine-flow)
10. [AI Assistant (Natural Language) Flow](#10-ai-assistant-natural-language-flow)
11. [Reports Flow](#11-reports-flow)
12. [Teams Management Flow](#12-teams-management-flow)
13. [Settings & Configuration Flow](#13-settings--configuration-flow)
14. [Role-Based Access Control Flow](#14-role-based-access-control-flow)
15. [Notification Dispatch Flow](#15-notification-dispatch-flow)
16. [Background Job Flows (BullMQ)](#16-background-job-flows-bullmq)
17. [V2 — Multi-Cloud Integration Flow](#17-v2--multi-cloud-integration-flow)
18. [V2 — Multi-LLM AI Council Flow](#18-v2--multi-llm-ai-council-flow)
19. [V2 — Predictive Cost Forecasting Flow](#19-v2--predictive-cost-forecasting-flow)
20. [V2 — Jira Integration Flow](#20-v2--jira-integration-flow)
21. [V2 — GitHub PR Cost Delta Flow](#21-v2--github-pr-cost-delta-flow)
22. [V2 — PagerDuty Escalation Flow](#22-v2--pagerduty-escalation-flow)
23. [V2 — Enhanced Slack Interactive Flow](#23-v2--enhanced-slack-interactive-flow)
24. [Billing & Plan Upgrade Flow](#24-billing--plan-upgrade-flow)
25. [CSV Import (Demo Mode) Flow](#25-csv-import-demo-mode-flow)
26. [Error, Failure, and Recovery Flows](#26-error-failure-and-recovery-flows)
27. [Security & Session Management Flows](#27-security--session-management-flows)
28. [Complete Screen Map](#28-complete-screen-map)
29. [Socket.IO Event Map](#29-socketio-event-map)
30. [End-to-End Request Lifecycle](#30-end-to-end-request-lifecycle)

---

## 1. System Architecture Overview

Before any flow is described, every engineer must understand the topology every request and event moves through.

```
┌────────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser / Mobile)                       │
│   React 19 + Vite + Tailwind v4 + Redux Toolkit + Socket.IO Client    │
└────────────────────────────┬───────────────────────────────────────────┘
                              │ HTTPS / WSS
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Vercel Edge (Frontend CDN)                          │
│            Static assets served at < 100ms globally                    │
└────────────────────────────┬───────────────────────────────────────────┘
                              │ API Calls / WebSocket Upgrade
                              ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Node.js + Express Backend (Railway/Render)            │
│                                                                         │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ REST API     │  │ Socket.IO   │  │ BullMQ       │  │ Auth/RBAC  │ │
│  │ (Express     │  │ Server      │  │ Workers      │  │ Middleware  │ │
│  │  routes)     │  │ (org rooms) │  │ (jobs)       │  │            │ │
│  └──────┬───────┘  └──────┬──────┘  └──────┬───────┘  └────────────┘ │
└─────────│─────────────────│────────────────│───────────────────────────┘
          │                 │                │
          ▼                 ▼                ▼
┌─────────────────┐ ┌──────────────┐ ┌──────────────────────────────────┐
│  MongoDB Atlas  │ │  Redis       │ │   External APIs                   │
│  (Primary DB)   │ │  (BullMQ +   │ │                                   │
│                 │ │   Socket.IO  │ │  Cloud: AWS, GCP, Azure           │
│  Collections:   │ │   Adapter +  │ │  AI:    Gemini, Mistral, Claude   │
│  users, orgs,   │ │   AI Cache)  │ │  Notif: Slack, Telegram, Email   │
│  teams,         │ │              │ │  Work:  Jira, GitHub, PagerDuty  │
│  resources,     │ └──────────────┘ │  Infra: systeminformation (npm)  │
│  costs, alerts, │                  │  FX:    ExchangeRate-API          │
│  recommendations│                  └──────────────────────────────────┘
│  logs,          │
│  forecasts (V2) │
│  integrations   │
│  (V2)           │
└─────────────────┘
```

**Key rules that govern every flow:**
- Every DB query is scoped by `orgId` — no exceptions.
- Every Socket.IO event is emitted to an org-scoped room only.
- JWT lives in `httpOnly` cookies, never in LocalStorage.
- AI never auto-executes. All recommendations require explicit human confirmation.
- Background jobs (BullMQ) are the only path for slow operations (billing ingestion, forecasting, PDF generation, AI analysis).

---

## 2. Authentication Flows

### 2.1 Registration Flow (New Org)

```
User visits /register
  │
  ├── Fills: Full Name, Email, Password, Company Name, Plan selection
  │
  ├── Frontend validation (inline):
  │     - Email format check
  │     - Password strength (min 8 chars, 1 uppercase, 1 number)
  │     - Company name non-empty
  │
  ├── POST /api/auth/register
  │     ├── Middleware: None (public endpoint)
  │     ├── Server validates all fields
  │     ├── Check: email not already registered → 409 if duplicate
  │     ├── Hash password (bcrypt, cost factor 12)
  │     ├── Create Org document { name, plan: 'starter', monthlyBudget: 0 }
  │     ├── Create User document { email, passwordHash, role: 'admin', orgId }
  │     ├── Write to audit log: { action: 'user.register', userId, ip, timestamp }
  │     ├── Issue access token (JWT, 15min) → httpOnly cookie
  │     ├── Issue refresh token (JWT, 7d) → httpOnly cookie
  │     └── Return 201 { user: { id, name, email, role }, org: { id, name, plan } }
  │
  ├── Frontend: store user+org in Redux state
  ├── Redirect → /onboarding (first-time flow)
  └── [Onboarding Flow starts — see Section 3]
```

### 2.2 Login Flow

```
User visits /login (or session expires → redirected from any protected route)
  │
  ├── Fills: Email, Password
  │
  ├── POST /api/auth/login
  │     ├── Look up user by email
  │     ├── Compare password with bcrypt hash
  │     ├── On failure:
  │     │     - Increment failedAttempts counter (Redis key, TTL 1hr)
  │     │     - If failedAttempts >= 10 → lock account, email admin
  │     │     - Apply exponential backoff response delay
  │     │     - Return 401 "Invalid credentials"
  │     ├── On success:
  │     │     - Reset failedAttempts counter
  │     │     - Update lastLogin timestamp
  │     │     - Write to audit log: { action: 'user.login', ip, userAgent }
  │     │     - Issue new access token (15min) → httpOnly, Secure, SameSite=Strict cookie
  │     │     - Issue new refresh token (7d) → httpOnly cookie
  │     │     - Return 200 { user, org }
  │
  ├── Frontend: Redux stores user+org
  ├── Redirect → /dashboard (or originally requested URL)
  └── Socket.IO handshake begins immediately [see Section 2.5]
```

### 2.3 Token Refresh Flow

```
Any API call returns 401 (access token expired)
  │
  ├── Frontend interceptor catches 401
  ├── POST /api/auth/refresh
  │     ├── Read refresh token from httpOnly cookie
  │     ├── Verify refresh token signature + expiry
  │     ├── Check refresh token not in invalidation list (Redis blacklist)
  │     ├── Issue NEW access token (15min)
  │     ├── Rotate refresh token (old one invalidated in Redis, new one set)
  │     └── Return 200 with new cookies set
  │
  ├── If refresh token also expired/invalid → redirect to /login
  └── If refresh succeeds → retry original failed request
```

### 2.4 Logout Flow

```
User clicks "Logout"
  │
  ├── POST /api/auth/logout
  │     ├── Read refresh token from cookie
  │     ├── Add refresh token to Redis blacklist (TTL = remaining token life)
  │     ├── Clear httpOnly cookie (Set-Cookie: expires=past)
  │     └── Write to audit log: { action: 'user.logout' }
  │
  ├── Frontend: clear Redux state
  ├── Disconnect Socket.IO
  └── Redirect → /login
```

### 2.5 Socket.IO Connection + Auth Flow

```
After successful login, dashboard mounts
  │
  ├── Frontend: io.connect(BACKEND_URL, { withCredentials: true })
  │     [Cookie is automatically sent with the WebSocket upgrade request]
  │
  ├── Backend Socket.IO middleware:
  │     ├── Extract JWT from cookie on the HTTP upgrade request
  │     ├── Verify JWT
  │     ├── If invalid → disconnect with 401 error
  │     └── Attach { userId, orgId, role } to socket object
  │
  ├── On successful auth:
  │     ├── socket.join(`org:${orgId}`)  ← org-scoped room
  │     ├── socket.join(`user:${userId}`) ← user-specific room (for personal events)
  │     └── emit 'connection:ready' to client
  │
  └── [Real-time data begins flowing — see Section 4]
```

### 2.6 Forgot Password Flow

```
User clicks "Forgot Password" on /login
  │
  ├── Enters email → POST /api/auth/forgot-password
  │     ├── Look up user by email
  │     ├── Generate secure random token (crypto.randomBytes(32))
  │     ├── Store token hash in DB (expires in 1 hour)
  │     ├── Send reset email via Resend API with link: /reset-password?token=<raw>
  │     └── Return 200 always (even if email not found — prevents user enumeration)
  │
  ├── User clicks email link → /reset-password?token=<token>
  │
  ├── Enters new password → POST /api/auth/reset-password
  │     ├── Hash incoming token, look up in DB
  │     ├── Check not expired
  │     ├── Hash new password with bcrypt
  │     ├── Update user.passwordHash
  │     ├── Delete reset token from DB
  │     ├── Invalidate all existing refresh tokens for this user (Redis blacklist)
  │     └── Return 200 "Password reset successfully"
  │
  └── Redirect → /login with success toast
```

---

## 3. Onboarding Flows

### 3.1 First-Time Onboarding (Starter Plan)

```
New user lands on /onboarding after registration
  │
  ├── Step 1: Welcome Screen
  │     - Show product tour overview
  │     - "Connect your first server" OR "Import a billing CSV" OR "Explore with demo data"
  │
  ├── Path A: Connect Live Server
  │     ├── User selects "Connect a server"
  │     ├── Shown: install snippet for Node.js agent
  │     │         npm install -g cloudpulse-agent
  │     │         cloudpulse-agent start --org-id=<orgId> --api-key=<apiKey>
  │     ├── Backend: polling endpoint at GET /api/onboarding/server-status?orgId=X
  │     ├── Frontend: polls every 5s for server heartbeat
  │     ├── When heartbeat detected → "✅ Server connected!" → advance to Step 2
  │     └── Timeout after 5min → offer demo data fallback
  │
  ├── Path B: Connect AWS (Starter: mock data only, Pro+: live API)
  │     [See Section 3.2]
  │
  ├── Path C: Import CSV
  │     [See Section 25 — CSV Import Flow]
  │
  ├── Path D: Explore with Demo Data
  │     ├── POST /api/onboarding/seed-demo-data
  │     │     - Generates synthetic 30-day cost history for org
  │     │     - Creates 3 demo servers with realistic CPU/RAM patterns
  │     │     - Creates 2 demo teams (Backend, Frontend)
  │     │     - Creates 5 sample alerts (mix of severities)
  │     │     - Creates 3 sample recommendations
  │     │     - Tags all demo data with source: 'demo'
  │     └── Redirect → /dashboard with "🎭 Demo Mode" banner
  │
  ├── Step 2: Set Your Budget
  │     ├── Input: Monthly budget (₹)
  │     ├── PATCH /api/orgs/:id { monthlyBudget }
  │     └── Advance to Step 3
  │
  ├── Step 3: Invite Your Team (optional)
  │     ├── Email input (multi-add)
  │     ├── Role selector per invitee
  │     ├── POST /api/users/invite (sends invite email via Resend)
  │     └── "Skip for now" always available
  │
  ├── Step 4: Configure Alerts (optional)
  │     ├── Slack Webhook URL input
  │     ├── Telegram chat ID input
  │     ├── Test notification buttons
  │     └── "Skip for now" always available
  │
  └── Step 5: First Insight Delivery (< 10 minute target)
        ├── Dashboard loads with first AI-generated insight card
        ├── Card content: "Here's what we found in your first 60 seconds..."
        ├── Time-to-first-insight logged for KPI tracking
        └── Onboarding marked complete in DB
```

### 3.2 AWS Cloud Connector Onboarding (Pro+)

```
Settings → Cloud Integrations → Add AWS  (or during Onboarding Step 1)
  │
  ├── Step 1: Instructions shown
  │     "Create a read-only IAM user in your AWS Console with these permissions:"
  │     - ce:GetCostAndUsage
  │     - ce:GetCostForecast
  │     - ce:GetDimensionValues
  │     - ce:GetTags
  │     - cloudwatch:GetMetricData
  │     - cloudwatch:ListMetrics
  │     [Copy-paste IAM policy JSON shown in UI]
  │
  ├── Step 2: Enter credentials
  │     - AWS Access Key ID
  │     - AWS Secret Access Key
  │     - AWS Region (default: us-east-1)
  │     - [All fields encrypted with AES-256 before leaving the browser — no, actually encrypted server-side]
  │
  ├── POST /api/integrations/cloud/aws
  │     ├── Encrypt credentials with AES-256 (CREDENTIAL_ENCRYPTION_KEY)
  │     ├── Store in org.cloudAccounts.aws
  │     ├── Queue test call: GetCostAndUsage for last 7 days
  │     ├── On success: status = 'active', return 200
  │     └── On failure: return 422 with specific AWS error message
  │
  ├── Step 3: Tag Mapping
  │     - "Which AWS tag key do you use for team names?"
  │     - Default: "Team" (case-insensitive match)
  │     - PATCH /api/orgs/:id { cloudTagKey: 'Team' }
  │
  ├── POST /api/integrations/cloud/aws/sync → queues BullMQ job
  │     [First billing data ingested within 10 minutes]
  │
  └── Redirect → /dashboard with "AWS connected ✅" toast
```

### 3.3 GCP Connector Onboarding (V2 — Business+)

```
Settings → Cloud Integrations → Add GCP
  │
  ├── Step 1: Create Service Account
  │     [Step-by-step guide with screenshots]
  │     GCP Console → IAM & Admin → Service Accounts → Create
  │     Grant role: roles/billing.viewer on Billing Account
  │     Download: Service Account JSON key
  │
  ├── Step 2: Enable BigQuery Billing Export (one-time, guided)
  │     GCP Console → Billing → Billing Export → BigQuery Export
  │     Create dataset → note dataset ID
  │     [CloudPulse detects if export already enabled via API check]
  │
  ├── Step 3: Upload credentials
  │     - Drag-and-drop Service Account JSON
  │     - Frontend: parse JSON client-side to show project_id, client_email for confirmation
  │     - Enter BigQuery billing dataset ID
  │
  ├── POST /api/integrations/cloud/gcp
  │     ├── Validate JSON structure
  │     ├── Encrypt full JSON with AES-256
  │     ├── Store in org.cloudAccounts.gcp
  │     ├── Test BigQuery connection: run COUNT(*) on billing dataset
  │     ├── On success: status = 'active', queue first sync
  │     └── On failure: specific error (permission denied / dataset not found / wrong credentials)
  │
  └── First GCP sync: ETA 10 minutes via BullMQ job
```

### 3.4 Azure Connector Onboarding (V2 — Business+)

```
Settings → Cloud Integrations → Add Azure
  │
  ├── Step 1: Register App in Azure AD
  │     [Guide with screenshots]
  │     Azure Portal → Azure Active Directory → App Registrations → New Registration
  │     Note: Tenant ID, Application (Client) ID
  │
  ├── Step 2: Create Client Secret
  │     Under Certificates & Secrets → New Client Secret
  │     Note: Secret Value (shown only once)
  │
  ├── Step 3: Assign Role
  │     Azure Portal → Subscriptions → Access Control (IAM)
  │     Add role assignment: Cost Management Reader → the registered app
  │     Note: Subscription ID
  │
  ├── Step 4: Enter credentials in CloudPulse
  │     - Tenant ID
  │     - Client ID
  │     - Client Secret
  │     - Subscription ID
  │
  ├── POST /api/integrations/cloud/azure
  │     ├── Encrypt all fields with AES-256
  │     ├── Test: call /subscriptions/{subscriptionId} to validate
  │     ├── On success: status = 'active', queue first sync
  │     └── On failure: specific error returned
  │
  └── First Azure sync: ETA 10 minutes via BullMQ
```

---

## 4. Real-Time Data Pipeline Flow

This is the heartbeat of the product. Every 3 seconds for live servers, every 60 minutes for cloud billing APIs.

### 4.1 On-Premise Server Metrics Flow (Live Mode)

```
CloudPulse Agent running on monitored server
  │
  ├── setInterval(3000ms):
  │     ├── si.currentLoad() → CPU %
  │     ├── si.mem() → RAM used/total
  │     ├── si.fsSize() → Disk per volume
  │     ├── si.networkStats() → inbound/outbound Mbps
  │     ├── si.cpuTemperature() → temperature (if sensor available)
  │     └── si.services('*') → list of running processes
  │
  ├── Assemble metrics object:
  │     { serverId, orgId, timestamp, cpu, ram, disk[], network, temperature, runningServices[] }
  │
  ├── POST /api/metrics (agent → backend)
  │     ├── Auth: server API key in Authorization header
  │     ├── Middleware: validateServerApiKey(req) → resolve orgId, teamId, serverId
  │     │
  │     ├── STEP 1 — Store raw metrics:
  │     │     Insert into resources collection (TTL: 90d Starter, 365d Business+)
  │     │
  │     ├── STEP 2 — Cost estimation:
  │     │     calculateCost(metrics, org.rateCard)
  │     │     delta_cost = (cpu_usage_fraction × server_hourly_rate) × (3/3600)
  │     │     Upsert today's cost record in costs collection
  │     │
  │     ├── STEP 3 — Anomaly detection:
  │     │     detectSpike(todayCost, rolling7DayAvg)
  │     │     if (todayCost > rolling7DayAvg × 1.5) → Critical alert
  │     │     zScore = (todayCost - mean30Day) / stdDev30Day
  │     │     if (zScore > 2.5) → Info alert + queue AI explanation
  │     │
  │     ├── STEP 4 — Idle server check:
  │     │     if (cpu < 5% for all readings in last 720 min) → Warning alert + queue recommendation
  │     │
  │     ├── STEP 5 — Disk check:
  │     │     if (any disk.usedPercent > 80%) → Warning alert
  │     │
  │     ├── STEP 6 — Budget check:
  │     │     currentMonthTotal / team.monthlyBudget
  │     │     if ≥ 80% → Warning; if ≥ 100% → Critical; if ≥ 120% → Critical + exec notify
  │     │
  │     └── STEP 7 — Emit to frontend:
  │           io.to(`org:${orgId}`).emit('metrics:update', metricsPayload)
  │           io.to(`org:${orgId}`).emit('cost:update', costPayload)
  │           [If new alert] io.to(`org:${orgId}`).emit('alert:new', alertPayload)
  │
  └── Repeat every 3 seconds
```

### 4.2 Cloud Billing Ingestion Flow (AWS — BullMQ, every 60 min)

```
BullMQ: cloud-billing-ingestion queue
  │
  ├── Job: aws-cost-ingest (one job per org with AWS connected)
  │
  ├── Worker picks up job:
  │     ├── Load org's encrypted AWS credentials → decrypt
  │     ├── Instantiate CostExplorerClient
  │     │
  │     ├── API Call 1 — GetCostAndUsage (last 30 days, daily, by SERVICE + Team tag)
  │     │     Rate limit: 5 req/s → max 1 req/3s with jitter
  │     │
  │     ├── API Call 2 — GetCostAndUsage (current month, daily) for live billing
  │     │
  │     ├── Normalise all records to unified cost schema:
  │     │     { orgId, teamId, provider: 'aws', service, amount (INR), period, source, region, tags }
  │     │     [Tag 'Team' value → resolve to CloudPulse teamId]
  │     │
  │     ├── Bulk upsert into costs collection
  │     │     [upsert key: { orgId, provider, service, period.start, teamId }]
  │     │
  │     ├── Run post-ingestion analysis:
  │     │     ├── Re-run anomaly detection on newly ingested data
  │     │     └── Check if forecast needs refresh (cost trend changed > 10%)
  │     │
  │     ├── Emit to frontend: io.to(`org:${orgId}`).emit('cost:update', { provider: 'aws', ... })
  │     │
  │     └── Update org.cloudAccounts.aws.lastSyncedAt = now()
  │
  ├── On error:
  │     ├── ServiceUnavailableException → retry 3× (2s, 4s, 8s backoff)
  │     ├── AccessDeniedException → mark integration.status = 'error', notify admin
  │     ├── LimitExceededException → delay 60s, retry once
  │     └── After 3 failures → mark job failed, emit integration:status error event
  │
  └── Next run: scheduled 60min later
```

### 4.3 GCP Billing Ingestion Flow (V2)

```
BullMQ: cloud-billing-ingestion queue
  │
  ├── Job: gcp-cost-ingest (per org with GCP connected)
  │
  ├── Worker:
  │     ├── Load encrypted Service Account JSON → decrypt → parse
  │     ├── Instantiate BigQuery client
  │     │
  │     ├── Execute BigQuery SQL:
  │     │     SELECT service.description, labels.value AS team,
  │     │            SUM(cost) AS total_cost, TIMESTAMP_TRUNC(usage_start_time, DAY) AS usage_date
  │     │     FROM `<billingDataset>.gcp_billing_export_v1_*`
  │     │     WHERE usage_start_time >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
  │     │       AND labels.key = 'team'
  │     │     GROUP BY service, team, usage_date
  │     │     ORDER BY usage_date DESC
  │     │
  │     ├── Currency conversion (if GCP returns USD):
  │     │     amount_inr = amount_usd × getUSDtoINR() [Redis cached, 1hr TTL]
  │     │
  │     ├── Normalise to unified cost schema { provider: 'gcp', ... }
  │     │
  │     ├── Bulk upsert into costs collection
  │     │
  │     └── Emit cost:update event to org room
  │
  ├── On error:
  │     ├── PERMISSION_DENIED → mark integration error, notify admin
  │     ├── Dataset not found → send guided error: "Enable BigQuery Billing Export"
  │     └── RESOURCE_EXHAUSTED → backoff 60s
  │
  └── Next run: 60min later
```

### 4.4 Azure Billing Ingestion Flow (V2)

```
BullMQ: cloud-billing-ingestion queue
  │
  ├── Job: azure-cost-ingest (per org with Azure connected)
  │
  ├── Worker:
  │     ├── Load encrypted Azure credentials → decrypt
  │     ├── Instantiate ClientSecretCredential + CostManagementClient
  │     │
  │     ├── API Call: query.usage(subscriptionScope, {
  │     │     type: 'Usage', timeframe: 'Custom' (last 30 days), granularity: 'Daily',
  │     │     grouping: [ServiceName, ResourceGroup, tag:team]
  │     │   })
  │     │
  │     ├── Currency conversion (Azure returns USD or local currency)
  │     │
  │     ├── Normalise to unified cost schema { provider: 'azure', ... }
  │     │
  │     ├── Bulk upsert into costs collection
  │     │
  │     └── Emit cost:update event to org room
  │
  ├── On error:
  │     ├── AuthenticationError → flag integration invalid, notify admin
  │     ├── 429 Too Many Requests → exponential backoff; alert admin if sustained > 1hr
  │     └── BillingAccountNotFound → guide role assignment
  │
  └── Next run: 60min later
```

---

## 5. Main Dashboard Flow

### 5.1 Dashboard Load Flow

```
User navigates to /dashboard
  │
  ├── Route guard: requireAuth() checks Redux state (or cookie presence)
  │     └── If not authenticated → redirect /login
  │
  ├── Route guard: requirePlan() — dashboard is available to all plans
  │
  ├── Redux dispatch: fetchDashboardData()
  │     │
  │     ├── GET /api/dashboard/summary
  │     │     ├── RBAC: requireRole(any authenticated role)
  │     │     ├── Query: costs collection, scoped by orgId (+ teamId if role = Team Lead)
  │     │     └── Returns:
  │     │           {
  │     │             totalMonthSpend: ₹X (vs last month %),
  │     │             todaySpend: ₹X (hourly trend array),
  │     │             activeServers: { total, healthy, warning, idle },
  │     │             activeAlerts: { critical, warning, info },
  │     │             potentialSavings: ₹X (from open recommendations),
  │     │             budgetStatus: [{ teamId, teamName, percentUsed, status: 'green|amber|red' }],
  │     │             teamCostRanking: [{ teamId, name, spend, trend: 'up|down|flat' }]
  │     │           }
  │     │
  │     ├── GET /api/alerts?status=open&limit=5
  │     │
  │     ├── GET /api/recommendations?status=open&limit=3
  │     │
  │     └── GET /api/ai/daily-narrative (Gemini — cached 1hr)
  │           Returns: AI-generated plain-English summary of today's infra state
  │
  ├── Frontend renders 7 KPI cards (all widgets refresh on data load)
  │
  ├── Socket.IO: already connected [Section 2.5]
  │     ├── Listen: 'metrics:update' → update server monitoring sparklines
  │     ├── Listen: 'cost:update' → update KPI cards + charts
  │     ├── Listen: 'alert:new' → show toast + increment alert badge
  │     └── Listen: 'recommendation:new' → append to savings panel
  │
  └── Widget refresh schedule (background polling as Socket.IO fallback):
        Total Monthly Spend → every 60s (REST fallback)
        Today's Spend → every 5min
        Active Servers → every 30s
        Active Alerts → real-time via Socket.IO
        Potential Savings → every 60min (after recommendations job runs)
        Budget Status → every 5min
        Team Cost Ranking → every 5min
```

### 5.2 KPI Card Update Flow (Real-Time)

```
Backend emits 'cost:update':
  { teamId, amount, period, delta, currency, provider }
  │
  ├── Redux reducer: updateCostData(payload)
  │     ├── Recalculate totalMonthSpend
  │     ├── Recalculate todaySpend
  │     ├── Update teamCostRanking (re-sort if rank changed)
  │     └── Update budgetStatus (re-check thresholds)
  │
  ├── React: KPI cards re-render with new values
  │     ├── Animate delta value (green for decrease, red for increase)
  │     └── Sparkline chart appends new data point (Chart.js canvas — no DOM repaint)
  │
  └── [V2] If provider field present → update provider attribution breakdown
```

---

## 6. Resource Monitoring Flow

### 6.1 Server List Load

```
User navigates to /monitoring
  │
  ├── RBAC check: requireRole('admin', 'devops_manager') — Team Lead and Finance cannot access raw metrics
  │
  ├── GET /api/servers
  │     ├── Query: resources collection, orgId scoped, latest document per serverId
  │     └── Returns: [{
  │           serverId, name, teamId, teamName, status (healthy/warning/idle/offline),
  │           cpu, ram, disk, network, uptime, lastSeen
  │         }]
  │
  ├── Render server table with sortable columns
  │
  └── Socket.IO 'metrics:update' events → real-time row updates (every 3s)
```

### 6.2 Server Detail Drilldown

```
User clicks a server row → /monitoring/:serverId
  │
  ├── GET /api/servers/:serverId/metrics?range=24h
  │     └── Returns: 24-hour time-series for cpu, ram, disk, network
  │
  ├── GET /api/servers/:serverId/metrics?range=90d&resolution=daily
  │     └── 90-day daily averages for sparkline context
  │
  ├── Render 6 metric charts:
  │     - CPU % line chart (live 3s updates via Socket.IO)
  │     - RAM % line chart
  │     - Disk usage per volume (stacked bar)
  │     - Network in/out (area chart)
  │     - Running services list (updates when service list changes)
  │     - Temperature gauge (if data available)
  │
  ├── GET /api/alerts?serverId=X&status=open
  │     └── Show open alerts for this server in sidebar
  │
  ├── GET /api/recommendations?resourceId=X&status=open
  │     └── Show recommendations tied to this server
  │
  └── Socket.IO: 'metrics:update' filtered by serverId → live chart append
```

---

## 7. Cost Analytics Flow

### 7.1 Analytics Page Load

```
User navigates to /costs
  │
  ├── RBAC: All roles except Viewer have access (scoped by role)
  │
  ├── Default state: current month, all teams, all services, all providers
  │
  ├── GET /api/costs?period=current-month&groupBy=daily
  │     └── Returns: daily cost array for trend line chart
  │
  ├── GET /api/costs/by-team?period=current-month
  │     └── Returns: [{ teamId, teamName, amount, percentOfTotal }]
  │           Used for pie chart + ranked bar chart
  │
  ├── GET /api/costs/by-service?period=current-month
  │     └── Returns: [{ service, provider, amount }]
  │
  ├── GET /api/costs/delta?period=current-month&compareWith=last-month
  │     └── Returns: delta table [{ teamId, currentAmount, previousAmount, delta%, status }]
  │
  └── [V2] GET /api/costs/by-provider
          Returns: { aws: ₹X, gcp: ₹X, azure: ₹X, onPremise: ₹X }
```

### 7.2 Filter Interaction Flow

```
User changes date range / team filter / provider filter
  │
  ├── Frontend: update URL query params (?period=last-30d&team=payments&provider=aws)
  │
  ├── Redux: dispatch updateFilters(filters)
  │
  ├── Re-fetch all cost endpoints with new filter params
  │
  ├── Charts re-render with new data
  │     - Loading skeleton shown during fetch (< 500ms target)
  │     - Period comparison overlay shown if "Compare" toggled
  │
  └── URL is shareable — same filters restored from query params on page load
```

### 7.3 Cost Export Flow

```
User clicks "Export" → selects PDF or CSV
  │
  ├── POST /api/reports/generate { type: 'custom', filters: currentFilters, format: 'pdf'|'csv' }
  │     ├── RBAC: requireRole('admin', 'devops_manager', 'finance_manager')
  │     ├── Queue BullMQ job: report-generation
  │     └── Return 202 { jobId }
  │
  ├── Frontend: polls GET /api/reports/status/:jobId every 2s
  │
  ├── BullMQ worker:
  │     ├── Fetch all required cost data with applied filters
  │     ├── For CSV: generate CSV string, save to temp storage
  │     ├── For PDF: render HTML template → puppeteer PDF → save to temp storage
  │     └── Mark job complete with download URL
  │
  ├── GET /api/reports/download/:reportId → stream file to browser
  │
  └── Download complete → toast "Report downloaded"
```

---

## 8. Alert Engine Flow

### 8.1 Alert Generation Flow

```
Triggered by: metrics ingestion (Section 4.1) OR billing ingestion (Section 4.2)
  │
  ├── DETECTION LAYER:
  │     │
  │     ├── Rule: Cost spike
  │     │     if todayCost > rolling7DayAvg × 1.5
  │     │     → severity: Critical
  │     │
  │     ├── Rule: Statistical anomaly
  │     │     zScore = (todayCost - mean30Day) / stdDev30Day
  │     │     if zScore > 2.5
  │     │     → severity: Info
  │     │
  │     ├── Rule: CPU overload
  │     │     if cpu > 90% sustained > 5min (10 consecutive 30s readings)
  │     │     → severity: Critical
  │     │
  │     ├── Rule: Idle server
  │     │     if cpu < 5% for ≥ 720min (running sum of sub-threshold readings)
  │     │     → severity: Warning
  │     │
  │     ├── Rule: Disk near full
  │     │     if any disk.usedPercent > 80%
  │     │     → severity: Warning
  │     │
  │     └── Rule: Budget threshold
  │           monthlySpend / teamBudget → 80% → Warning, 100% → Critical, 120% → Critical+
  │
  ├── DEDUPLICATION:
  │     Check alerts collection: exists open alert of same type + resourceId + orgId?
  │     If yes → skip (don't create duplicate)
  │     If no → proceed
  │
  ├── ALERT CREATION:
  │     Insert alert: {
  │       orgId, teamId, type, severity, message, resourceId,
  │       status: 'open', triggeredAt: now(), provider (V2)
  │     }
  │
  ├── AI EXPLANATION (async — for Info alerts and Critical cost spikes):
  │     Queue BullMQ job: generate-ai-explanation
  │     [Gemini 1.5 Flash called in background — see Section 18]
  │     Alert updated with aiExplanation when complete
  │
  ├── EMIT TO FRONTEND:
  │     io.to(`org:${orgId}`).emit('alert:new', {
  │       alertId, type, severity, message, resourceId, aiExplanation (if ready)
  │     })
  │     → Frontend: toast notification appears + badge counter increments
  │
  └── NOTIFICATION DISPATCH:
        [See Section 15 — Notification Dispatch Flow]
```

### 8.2 Alert List Flow (Alerts Screen)

```
User navigates to /alerts
  │
  ├── RBAC: requireRole('admin', 'devops_manager', 'team_lead')
  │     Team Lead sees only their team's alerts
  │
  ├── GET /api/alerts?status=open&page=1&limit=20
  │     └── Returns: alerts sorted by severity DESC, triggeredAt DESC
  │
  ├── Filters available: severity, type, team, provider (V2), date range, status
  │
  ├── Each alert card shows:
  │     - Severity badge (color-coded)
  │     - Alert type
  │     - Affected resource
  │     - Message
  │     - Triggered timestamp
  │     - AI explanation (if generated)
  │     - [V2] Provider badge
  │     - [V2] PagerDuty status badge (paged/not paged)
  │
  └── Real-time: Socket.IO 'alert:new' → new card prepended to list
```

### 8.3 Alert Acknowledge Flow

```
User clicks "Acknowledge" on an alert
  │
  ├── PATCH /api/alerts/:id { status: 'acknowledged', acknowledgedBy: userId }
  │     ├── RBAC: requireRole('admin', 'devops_manager', 'team_lead')
  │     ├── Update alert.status = 'acknowledged'
  │     ├── Write to audit log
  │     └── [V2] If PagerDuty linked: POST resolve event to PagerDuty Events API
  │
  ├── Frontend: alert card moves to "Acknowledged" section
  │
  └── [V2] Slack message updated: acknowledge button disabled, "Acknowledged by X" label shown
```

### 8.4 Alert Resolution Flow

```
System auto-resolves when triggering condition clears:
  │
  ├── On next metric ingestion: re-check condition
  │     e.g., CPU drops back below 90% → mark CPU overload alert as 'resolved'
  │
  ├── PATCH /api/alerts/:id { status: 'resolved', resolvedAt: now() }
  │
  ├── MTTR calculated: resolvedAt - triggeredAt → stored for KPI reporting
  │
  ├── [V2] PagerDuty: POST resolve event with same dedup_key
  │
  └── Frontend: alert moves to "Resolved" tab
```

---

## 9. AI Recommendation Engine Flow

### 9.1 Recommendation Generation (BullMQ — Hourly)

```
BullMQ: recommendation-generation queue (every 60 minutes)
  │
  ├── For each org:
  │     │
  │     ├── RULE 1 — Idle Server Detection:
  │     │     Query resources: cpu < 5% for all readings in last 720min
  │     │     For each idle server:
  │     │       estimated_saving = daily_cost × 30 × (1 - 0.05)
  │     │       Create recommendation: { type: 'idle-server', resourceId, estimatedSaving, confidence: 95 }
  │     │
  │     ├── RULE 2 — Overprovisioned RAM:
  │     │     Query resources: ram.usedPercent < 20% over last 7 days
  │     │     Calculate downgrade savings
  │     │     Create recommendation: { type: 'downsize-instance', ... }
  │     │
  │     ├── RULE 3 — Stale Snapshots:
  │     │     Query costs: S3/EBS snapshot line items > 30 days old
  │     │     (AWS Cost Explorer tag-based identification)
  │     │     Create recommendation: { type: 'delete-snapshots', ... }
  │     │
  │     ├── RULE 4 — Storage Tier Optimization:
  │     │     Query costs: S3/GCS Standard with zero access in 90+ days
  │     │     Calculate Glacier/Coldline savings
  │     │     Create recommendation: { type: 'storage-tiering', ... }
  │     │
  │     ├── RULE 5 — Reserved Instance Opportunity:
  │     │     Query costs: on-demand instances with > 85% uptime over 30 days
  │     │     [V2 Mistral]: complex RI calculation for 1-year vs 3-year commitment
  │     │     Create recommendation: { type: 'reserved-instance', ... }
  │     │
  │     ├── [V2] RULE 6 — Cross-Cloud Migration:
  │     │     [Mistral]: compare same workload cost across providers
  │     │     Create recommendation: { type: 'cross-cloud-migration', sourceProvider, targetProvider }
  │     │
  │     ├── [V2] RULE 7 — GCP Committed Use Discount:
  │     │     GCP VMs at > 92% uptime → CUD analysis via Mistral
  │     │
  │     └── [V2] RULE 8 — Azure Reserved VM Instance:
  │           Azure VMs at > 80% uptime → 1-year reserved analysis
  │
  ├── Deduplication:
  │     For each new recommendation: check if open recommendation of same type + resourceId exists
  │     If yes → skip (don't create duplicate)
  │
  ├── Save new recommendations to DB
  │
  ├── Emit to frontend:
  │     io.to(`org:${orgId}`).emit('recommendation:new', {
  │       type, title, estimatedSaving, resourceId
  │     })
  │     → Updates Potential Savings KPI card + appends to recommendations panel
  │
  └── Update potentialSavings total on org dashboard summary
```

### 9.2 Recommendations Screen Flow

```
User navigates to /recommendations
  │
  ├── RBAC: requireRole('admin', 'devops_manager')
  │
  ├── GET /api/recommendations?status=open
  │     └── Returns: recommendations sorted by estimatedSaving DESC
  │
  ├── Each card shows:
  │     - Type (Idle Server / Downsize / Storage / RI / Cross-Cloud)
  │     - Affected resource name
  │     - Recommended action (1 sentence)
  │     - Estimated monthly saving (₹)
  │     - Confidence score (%)
  │     - If confidence < 70%: "Needs human review" label shown
  │     - [V2] Provider badge
  │     - [V2] Jira ticket button (if Jira connected)
  │     - [V2] If Jira ticket exists: shows "INFRA-142 ↗" badge
  │
  └── Filter: by type, team, provider, estimated saving range
```

### 9.3 Recommendation Action Flow

```
User clicks "I'll action this" on a recommendation
  │
  ├── PATCH /api/recommendations/:id { status: 'actioned', actionedAt: now(), actionedBy: userId }
  │
  ├── Write to audit log
  │
  ├── Frontend: card moves to "Actioned" section
  │
  ├── Savings report updated: recommendation now appears in "actioned savings" total
  │
  └── KPI: recommendations actioned rate tracked for > 30% target
```

### 9.4 Recommendation Dismiss Flow

```
User clicks "Dismiss" → modal: "Why are you dismissing this?"
  (options: Already done / Not applicable / Disagree / Too risky)
  │
  ├── PATCH /api/recommendations/:id { status: 'dismissed', dismissReason, dismissedBy }
  │
  └── Card moves to "Dismissed" tab; never resurfaces for same resource
```

---

## 10. AI Assistant (Natural Language) Flow

### 10.1 NL Query Flow

```
User opens AI Assistant panel (available from any screen, slide-in panel)
  │
  ├── User types query:
  │     "Why did our AWS bill spike 40% this week?"
  │
  ├── POST /api/ai/query { query: "...", context: { orgId, teamId, currentPeriod } }
  │     ├── RBAC: requireRole(any authenticated role — scoped by orgId)
  │     │
  │     ├── STEP 1 — Input sanitisation:
  │     │     Strip HTML/JS injections
  │     │     Check for prompt injection patterns (e.g., "ignore previous instructions")
  │     │     Flag and log suspicious inputs
  │     │
  │     ├── STEP 2 — Cache check:
  │     │     cacheKey = SHA256(orgId + queryType + sortedParams + dateTruncated)
  │     │     Redis GET → if hit, return cached response (with fromCache: true)
  │     │
  │     ├── STEP 3 — Intent classification (Gemini Flash — fast):
  │     │     Classify query into one of:
  │     │       'anomaly-explanation' | 'nl-cost-query' | 'optimization-complex' |
  │     │       'executive-summary' | 'board-briefing' | off-topic
  │     │     If off-topic → return "I can only help with infrastructure cost questions."
  │     │
  │     ├── STEP 4 — Context assembly:
  │     │     Pull relevant data from MongoDB based on query type:
  │     │       - Last 30 days cost data for the org
  │     │       - Team budgets and actuals
  │     │       - Recent alerts (last 7 days)
  │     │       - Top 5 open recommendations
  │     │
  │     ├── STEP 5 — Route to correct model (V2 multi-LLM, V1 Gemini only):
  │     │     'nl-cost-query' → Gemini Flash
  │     │     'anomaly-explanation' → Gemini Flash
  │     │     'optimization-complex' → Mistral Medium
  │     │     'executive-summary' → Claude Haiku 4.5
  │     │     'board-briefing' → Claude Haiku 4.5
  │     │
  │     ├── STEP 6 — AI call with system prompt + assembled context
  │     │
  │     ├── STEP 7 — Output validation:
  │     │     Parse JSON response
  │     │     Validate against schema: { answer: string, confidence: number, sources: [] }
  │     │     If confidence < 70% → append "This analysis needs human review" disclaimer
  │     │     If parse fails → return graceful fallback: "Unable to generate insight"
  │     │
  │     ├── STEP 8 — Cache response in Redis (TTL: 30min for NL queries)
  │     │
  │     └── Return 200 { answer, confidence, fromCache }
  │
  ├── Frontend: stream response text with typewriter animation
  │
  └── User can ask follow-up in same session (context maintained for conversation)
```

---

## 11. Reports Flow

### 11.1 Report List Screen

```
User navigates to /reports
  │
  ├── RBAC: requireRole('admin', 'finance_manager')
  │
  └── GET /api/reports
        Returns: list of all generated reports { id, type, period, generatedAt, format, downloadUrl }
```

### 11.2 Manual Report Generation Flow

```
User clicks "Generate Report" → selects report type + filters
  │
  ├── Report types:
  │     - Monthly Summary (auto: runs 1st of each month)
  │     - Team Chargeback (team-by-team spend vs budget)
  │     - Savings Report (recommendations actioned vs open, cumulative saved)
  │     - Custom Date Range (any filter combination)
  │
  ├── POST /api/reports/generate { type, filters, format: 'pdf'|'csv' }
  │     ├── Queue BullMQ job: report-generation
  │     └── Return 202 { jobId }
  │
  ├── Frontend: progress indicator → polls /api/reports/status/:jobId
  │
  ├── BullMQ Worker (report-generation):
  │     ├── Fetch all required data (costs, teams, alerts, recommendations)
  │     ├── [V2] For executive summary reports → call Claude Haiku 4.5 for AI narrative
  │     │
  │     ├── If CSV:
  │     │     Generate CSV rows → save to /tmp/reports/<reportId>.csv
  │     │
  │     └── If PDF:
  │           Render HTML template (Handlebars/EJS) with data
  │           Puppeteer: headless Chrome → print to PDF
  │           Save to /tmp/reports/<reportId>.pdf
  │
  ├── GET /api/reports/download/:reportId → stream file
  │
  └── Report saved to reports collection for future re-download
```

### 11.3 Scheduled Monthly Report Flow (BullMQ — 1st of Month)

```
BullMQ: monthly-report job (CRON: 0 6 1 * * — 6am on 1st of every month)
  │
  ├── For each org:
  │     ├── Generate monthly summary report (PDF)
  │     ├── [V2] Claude Haiku 4.5 generates AI narrative section
  │     ├── Save report to DB
  │     └── Email report to all Admin + Finance Manager users via Resend API
  │           Subject: "[CloudPulse] {OrgName} — {Month} Cost Summary"
  │           Body: total spend, vs last month, top teams, open savings opportunities
  │           Attachment: PDF report
  │
  └── Weekly digest email also scheduled (every Monday 8am):
        Summary card: week's spend, top alert, top recommendation
        Delivered to Admin + DevOps Manager
```

---

## 12. Teams Management Flow

### 12.1 Teams List Screen

```
User navigates to /teams
  │
  ├── RBAC: Admin + DevOps Manager (full view), Team Lead (own team only)
  │
  ├── GET /api/teams
  │     └── Returns: teams with { id, name, memberCount, monthlyBudget, currentSpend, budgetStatus }
  │
  └── Each team card shows:
        - Team name
        - Budget RAG status (green/amber/red)
        - Current month spend vs budget bar chart
        - Server count
        - Open alerts count
        - Trend arrow (spend up/down vs last month)
```

### 12.2 Team Detail Drilldown

```
User clicks a team → /teams/:teamId
  │
  ├── GET /api/teams/:teamId/summary
  │     ├── Cost trend (30-day daily chart)
  │     ├── Server list (owned by this team)
  │     ├── Open alerts
  │     ├── Open recommendations (with savings total)
  │     └── Member list
  │
  └── Team Lead visiting their own team: same view, no other teams accessible
```

### 12.3 Team Creation Flow (Admin Only)

```
Admin clicks "Create Team"
  │
  ├── Form: Team Name, Monthly Budget (₹), Assign Members (multi-select users)
  │
  ├── POST /api/teams { name, monthlyBudget, memberIds[] }
  │     ├── RBAC: requireRole('admin')
  │     ├── Create team document
  │     ├── Update user.teamId for all assigned members
  │     └── Return 201 { team }
  │
  └── Members now see team-scoped dashboard views
```

### 12.4 Server Assignment to Team Flow

```
Admin / DevOps Manager assigns a server to a team
  │
  ├── PATCH /api/servers/:serverId { teamId }
  │     ├── Update resources collection: resourceId → teamId
  │     ├── Update all future cost attribution for this server
  │     └── Backfill last 30 days cost records with new teamId (BullMQ job)
  │
  └── Team dashboard now includes this server's costs
```

---

## 13. Settings & Configuration Flow

### 13.1 Settings Screen Structure

```
/settings (Admin only for all sub-sections except Profile)
  │
  ├── /settings/profile       → Own name, email, password change
  ├── /settings/billing       → Plan details, upgrade CTA [Section 24]
  ├── /settings/budgets       → Set team monthly budgets + alert thresholds
  ├── /settings/users         → User list, invite, role change, deactivate
  ├── /settings/cloud         → AWS, GCP (V2), Azure (V2) connectors [Section 3.2–3.4]
  ├── /settings/integrations  → Slack, Telegram, Email, Jira (V2), GitHub (V2), PagerDuty (V2)
  ├── /settings/alerts        → Custom alert rules, threshold overrides
  └── /settings/ai            → [V2] Multi-LLM council status, cache stats
```

### 13.2 Budget Update Flow

```
Admin updates team budget
  │
  ├── PATCH /api/teams/:teamId { monthlyBudget: ₹X }
  │     ├── RBAC: requireRole('admin')
  │     ├── Update team.monthlyBudget
  │     ├── Recalculate current budget status percentages immediately
  │     └── Write to audit log
  │
  └── Dashboard budget widgets update on next refresh
```

### 13.3 User Invite Flow

```
Admin invites a new user
  │
  ├── POST /api/users/invite { email, role, teamId (optional) }
  │     ├── Generate invite token (crypto.randomBytes(32), TTL 72hrs)
  │     ├── Store pending invite in DB
  │     └── Send invite email via Resend:
  │           Link: /accept-invite?token=<token>
  │           Shows: who invited, org name, role
  │
  ├── Invitee clicks link → /accept-invite?token=X
  │     ├── Verify token valid + not expired
  │     ├── Show: set password form
  │     ├── On submit: POST /api/users/accept-invite { token, password }
  │     │     - Create user with assigned role + teamId
  │     │     - Invalidate invite token
  │     └── Auto-login → redirect to /dashboard
  │
  └── Admin sees pending invites in /settings/users list
```

### 13.4 Role Change Flow

```
Admin changes a user's role
  │
  ├── PATCH /api/users/:userId { role: 'finance_manager' }
  │     ├── RBAC: requireRole('admin') — admins cannot demote other admins without another admin present
  │     ├── Update user.role
  │     ├── Write to audit log: { action: 'user.roleChanged', from, to, changedBy }
  │     └── If user is currently logged in → next API call returns updated role in response
  │           (access token carries old role until next refresh — 15 min max delay)
  │
  └── User's view updates on next page load or token refresh
```

### 13.5 Alert Threshold Configuration Flow

```
Admin configures custom alert thresholds
  │
  ├── GET /api/settings/alerts → current thresholds
  │
  ├── Form: 
  │     - Cost spike multiplier (default 1.5×)
  │     - Z-score threshold (default 2.5)
  │     - CPU overload % (default 90%)
  │     - Idle CPU % (default 5%)
  │     - Idle duration (default 720 min)
  │     - Disk warning % (default 80%)
  │     - Budget warning threshold (default 80%)
  │
  ├── PATCH /api/settings/alerts { thresholds }
  │     ├── Validate: ranges are sensible
  │     ├── Update org.settings.alertThresholds
  │     └── Write to audit log
  │
  └── New thresholds used immediately on next metric ingestion
```

---

## 14. Role-Based Access Control Flow

### 14.1 Request-Level RBAC Enforcement

```
Every API request:
  │
  ├── Middleware 1: requireAuth()
  │     ├── Extract JWT from httpOnly cookie
  │     ├── Verify signature with JWT_ACCESS_SECRET
  │     ├── Check token not expired
  │     ├── Attach req.user = { userId, orgId, role } to request
  │     └── If invalid → 401 Unauthorized
  │
  ├── Middleware 2: injectOrgId()
  │     ├── req.orgId = req.user.orgId
  │     └── [CRITICAL] orgId is NEVER trusted from the request body or params
  │           It always comes from the verified JWT
  │
  ├── Middleware 3: requireRole(...allowedRoles) [route-specific]
  │     ├── Check req.user.role is in allowedRoles
  │     └── If not → 403 Forbidden { error, requiredRoles }
  │
  ├── [V2] Middleware 4: requirePlan(...allowedPlans) [feature-specific]
  │     ├── Query Org.findById(req.orgId).select('plan')
  │     ├── If plan not in allowedPlans → 402 { error, upgradeUrl }
  │     └── Example: GCP routes require plan: 'business'|'enterprise'
  │
  └── Every DB query appends: { orgId: req.orgId }
        Team Lead routes additionally append: { teamId: req.user.teamId }
```

### 14.2 Socket.IO RBAC

```
Socket.IO connection established (Section 2.5):
  │
  ├── User joins: socket.join(`org:${orgId}`)
  │
  ├── All org-level events emitted to this room:
  │     io.to(`org:${orgId}`).emit(...)
  │     [User in Org A CANNOT receive events for Org B — enforced by room membership]
  │
  ├── Team Lead scoping:
  │     Frontend filters incoming socket events by teamId in payload
  │     [Backend does not emit team-specific rooms to reduce complexity]
  │
  └── Cross-tenant leakage test:
        Automated test suite asserts: org A user cannot receive org B events
        Runs on every deploy
```

---

## 15. Notification Dispatch Flow

### 15.1 Alert Notification Routing

```
New alert created [from Section 8.1]:
  │
  ├── Determine channels based on alert severity + org settings:
  │     │
  │     ├── Critical (cost spike, CPU overload, budget > 100%):
  │     │     → Dashboard Socket.IO event ✅ (always)
  │     │     → Slack webhook (if configured) ✅
  │     │     → Telegram bot (if configured) ✅
  │     │     → [V2] PagerDuty (if configured + routing rule enabled) ✅
  │     │
  │     ├── Warning (idle server, disk, budget 80%):
  │     │     → Dashboard Socket.IO event ✅
  │     │     → Dashboard recommendation created ✅
  │     │     → Email for budget warnings ✅
  │     │
  │     └── Info (statistical anomaly):
  │           → Dashboard Socket.IO event ✅
  │           → AI explanation queued ✅
  │           → No external channel (noise reduction)
  │
  ├── Dispatch in parallel (Promise.allSettled — one failing doesn't block others):
  │     ├── dispatchSlack(alert, org) [if slackWebhookUrl configured]
  │     ├── dispatchTelegram(alert, org) [if telegramChatId configured]
  │     ├── dispatchEmail(alert, org) [for budget alerts only]
  │     └── [V2] dispatchPagerDuty(alert, org) [if routing rule matched]
  │
  └── Log dispatch results: { channel, status: 'sent'|'failed', timestamp }
```

### 15.2 Slack Notification Flow

```
dispatchSlack(alert, org):
  │
  ├── V1: IncomingWebhook.send({ text, blocks })
  │     Simple text with severity + message + AI explanation
  │
  ├── [V2]: Enhanced with Block Kit + interactive buttons:
  │     ├── Header block: "🔴 Cost Spike: Team Name"
  │     ├── Section block: Today's cost / Yesterday's cost / Team / Provider
  │     ├── AI Root Cause block: plain English explanation
  │     └── Actions block:
  │           [✅ Acknowledge] → action_id: 'acknowledge_alert', value: alertId
  │           [😴 Snooze 4h] → action_id: 'snooze_alert'
  │           [🔍 View Details] → url: APP_URL/alerts/:id
  │
  ├── Slack sends button interactions to POST /api/integrations/slack/actions
  │     ├── Validate Slack signature (HMAC-SHA256, reject if > 5min old)
  │     ├── Parse action payload
  │     ├── 'acknowledge_alert' → PATCH /api/alerts/:id { status: 'acknowledged' }
  │     ├── 'snooze_alert' → PATCH /api/alerts/:id { snoozedUntil: now() + 4hrs }
  │     └── Update original Slack message via web-api chat.update (disable buttons)
  │
  └── On Slack error → log, don't fail alert creation
```

### 15.3 Telegram Notification Flow

```
dispatchTelegram(alert, org):
  │
  ├── Format message (Markdown):
  │     🔴 *Cost Spike Detected*
  │     *Team:* X | *Provider:* AWS | *Today:* ₹X | *vs Yesterday:* ₹X (+Y%)
  │     💡 *AI Analysis:* [explanation]
  │
  ├── POST https://api.telegram.org/bot{TOKEN}/sendMessage
  │     { chat_id, text, parse_mode: 'Markdown', reply_markup: inline_keyboard }
  │
  ├── [V2] Inline keyboard buttons:
  │     [✅ Acknowledge] → callback_data: 'ack_{alertId}'
  │     [🔍 View] → url: APP_URL/alerts/:id
  │
  ├── Telegram sends button callbacks to webhook (POST /api/integrations/telegram/callback)
  │     ├── Parse callback_data
  │     └── Route to same acknowledge handler
  │
  └── On Telegram error → log, don't fail
```

### 15.4 Email Notification Flow (Resend)

```
Budget alert OR monthly report:
  │
  ├── Find recipients: all users with role 'admin' + 'finance_manager' in org
  │
  ├── resend.emails.send({
  │     from: 'alerts@cloudpulse.io',
  │     to: [recipientEmails],
  │     subject: "[CloudPulse] Budget Warning: Team X at 80%",
  │     html: generateEmailHTML(...)
  │   })
  │
  └── On Resend error → log, retry once after 60s
```

---

## 16. Background Job Flows (BullMQ)

### 16.1 Complete Job Registry

```
Queue: cloud-billing-ingestion (every 60 min per org)
  ├── aws-cost-ingest
  ├── gcp-cost-ingest (V2)
  └── azure-cost-ingest (V2)

Queue: recommendation-generation (every 60 min, all orgs)
  └── generate-recommendations

Queue: ai-explanation (triggered on anomaly alert creation)
  └── generate-ai-explanation

Queue: report-generation (triggered by user action or CRON)
  ├── generate-pdf-report
  └── generate-csv-export

Queue: forecast-generation (V2 — daily at 00:30 org timezone)
  └── generate-forecast

Queue: notifications (triggered by alert creation)
  ├── send-slack-notification
  ├── send-telegram-notification
  ├── send-email-notification
  └── send-pagerduty-event (V2)

Queue: scheduled-emails (CRON)
  ├── monthly-summary-report (1st of month, 6am)
  └── weekly-digest (Monday, 8am)
```

### 16.2 Job Failure & Retry Policy

```
All BullMQ jobs follow this retry policy:
  │
  ├── Max attempts: 3
  ├── Backoff: exponential (2s, 4s, 8s)
  ├── On final failure:
  │     - Job moves to 'failed' queue
  │     - Error logged with full context (orgId, jobType, error message, stack)
  │     - Admin notified via email: "Background job failed: [job type]"
  │     - Dashboard shows "Data as of [last successful sync]" indicator
  │
  └── Job concurrency limits:
        cloud-billing-ingestion: max 10 concurrent (rate limit protection)
        report-generation: max 5 concurrent (CPU-heavy PDF rendering)
        forecast-generation: max 3 concurrent (BigQuery call-heavy)
        ai-explanation: max 20 concurrent
```

---

## 17. V2 — Multi-Cloud Integration Flow

### 17.1 Multi-Cloud Dashboard Aggregation Flow

```
User opens /dashboard (V2, with multi-cloud connected):
  │
  ├── GET /api/costs/cross-cloud-summary
  │     ├── Query costs collection grouped by provider, current month
  │     └── Returns: { aws: ₹X, gcp: ₹X, azure: ₹X, total: ₹X }
  │
  ├── V2 Dashboard additions:
  │     ├── Provider attribution bar below "Total Monthly Spend" KPI:
  │     │     [AWS 65%] [GCP 25%] [Azure 10%]
  │     │
  │     ├── Cloud Provider Health badges (header bar):
  │     │     AWS ✅ | GCP ✅ | Azure ⚠️ (Delayed — last synced 2h ago)
  │     │
  │     ├── Cross-Cloud Anomalies feed (new widget):
  │     │     Shows anomalies from all providers with provider badge
  │     │
  │     └── Forecast preview card (30-day total, confidence band)
  │
  ├── All existing widgets updated with provider dimension:
  │     - Team Cost Ranking: adds AWS / GCP / Azure columns per team
  │     - Service Breakdown: GCP + Azure services appear alongside AWS
  │     - Delta Table: provider column added
  │
  └── Socket.IO: 'cost:update' events now include { provider } field
        Frontend routes update to correct provider bucket in Redux state
```

### 17.2 Cloud Integration Health Monitoring Flow

```
Every 15 minutes (BullMQ: integration-health-check):
  │
  ├── For each configured cloud integration:
  │     ├── AWS: lightweight GetCostAndUsage for yesterday (1 API call)
  │     ├── GCP: simple BigQuery COUNT(*) query
  │     └── Azure: GET /subscriptions/{id}
  │
  ├── On success: update integration.status = 'active', integration.lastTestedAt = now()
  │
  ├── On failure:
  │     - Update integration.status = 'error'
  │     - Emit Socket.IO: 'integration:status' { type, status: 'error', lastTestedAt, error }
  │     - Frontend: health badge turns red in header
  │     - Admin email notification if error persists > 1 hour
  │
  └── Frontend: Settings → Cloud Integrations shows last-tested time per provider
```

---

## 18. V2 — Multi-LLM AI Council Flow

### 18.1 Request Routing Flow

```
Any AI call enters routeAIQuery(queryType, payload):
  │
  ├── STEP 1 — Cache check:
  │     cacheKey = SHA256(orgId + queryType + sortedParams + dateTruncatedToDay)
  │     Redis GET `ai:cache:{cacheKey}`
  │     If HIT → return cached { response, fromCache: true }
  │
  ├── STEP 2 — Model selection:
  │     Lookup ROUTING_RULES[queryType]:
  │     │
  │     ├── 'gemini' routes:
  │     │     anomaly-explanation, nl-cost-query, intent-classification,
  │     │     alert-root-cause, optimization-simple
  │     │     → GoogleGenerativeAI.generateContent(...)
  │     │     → Temperature: 0.1, responseMimeType: 'application/json'
  │     │     → Timeout: 10s
  │     │
  │     ├── 'mistral' routes:
  │     │     optimization-complex, cross-cloud-migration,
  │     │     reserved-instance-calc, multi-resource-analysis
  │     │     → MistralClient.chat(...)
  │     │     → response_format: { type: 'json_object' }
  │     │     → Timeout: 10s; fallback to Gemini on timeout
  │     │
  │     └── 'claude' routes:
  │           executive-summary, monthly-report, board-briefing
  │           → Anthropic.messages.create(...)
  │           → max_tokens: 2048
  │           → Timeout: 15s; on timeout → queue retry in 15min via BullMQ
  │
  ├── STEP 3 — Context assembly:
  │     Pull org-specific data from MongoDB based on queryType
  │     Inject into system prompt or user message
  │
  ├── STEP 4 — API call
  │
  ├── STEP 5 — Output validation:
  │     JSON.parse(response)
  │     Validate against expected schema
  │     On parse error → graceful fallback message
  │     On confidence < 70% → append "Needs human review" flag
  │
  ├── STEP 6 — Cache write:
  │     Redis SETEX `ai:cache:{cacheKey}` {TTL} {response}
  │     TTL rules:
  │       anomaly-explanation → 3600s (1hr)
  │       nl-cost-query → 1800s (30min)
  │       executive-summary → 21600s (6hr)
  │       optimization-recommendation → 3600s (1hr)
  │       intent-classification → 86400s (24hr)
  │
  └── Return { response, model, confidence, fromCache: false }
```

### 18.2 AI Fallback Chain

```
Primary model times out or returns error:
  │
  ├── Mistral timeout → fallback to Gemini Flash
  │     [Response quality degrades gracefully — user sees result, not error]
  │     Log: { event: 'ai-fallback', from: 'mistral', to: 'gemini', reason: 'timeout' }
  │
  ├── Claude timeout → queue retry via BullMQ (15min delay)
  │     User sees: "Your executive summary is being generated — check back shortly"
  │     On retry success → emit Socket.IO 'report:ready' event to user
  │
  └── Gemini failure (primary/fallback) → return graceful error
        "Unable to generate insight at this time. Please try again."
        Never show raw AI error to user
```

---

## 19. V2 — Predictive Cost Forecasting Flow

### 19.1 Forecast Generation Flow (BullMQ — Daily 00:30)

```
BullMQ: forecast-generation job
  │
  ├── For each org (with ≥ 30 days of cost history):
  │     │
  │     ├── Query costs collection:
  │     │     Last 90 days, daily totals, grouped by: org, team, provider, service
  │     │
  │     ├── For each dimension (org-level, per-team, per-provider):
  │     │     │
  │     │     ├── If < 30 data points:
  │     │     │     Skip + store { insufficientData: true }
  │     │     │     Frontend shows: "Need 30+ days of data for reliable forecast"
  │     │     │
  │     │     ├── Run linear regression:
  │     │     │     slope = Σ((xᵢ-x̄)(yᵢ-ȳ)) / Σ((xᵢ-x̄)²)
  │     │     │     intercept = ȳ - slope × x̄
  │     │     │     RSE = √(Σ(yᵢ-ŷᵢ)² / (n-2))
  │     │     │
  │     │     ├── Calculate R² score:
  │     │     │     R² > 0.8 → "High" confidence
  │     │     │     R² 0.5–0.8 → "Medium"
  │     │     │     R² < 0.5 → "Low" (shown with warning)
  │     │     │
  │     │     ├── Apply seasonal adjustment if weekly variance > 20%:
  │     │     │     Day-of-week weighting factors applied to each future date
  │     │     │
  │     │     └── Generate predictions: 90 items
  │     │           { date, predicted, lowerBound, upperBound }
  │     │           90% confidence interval: predicted ± 1.645 × RSE
  │     │
  │     ├── Upsert forecasts collection (one doc per org/team/provider combination)
  │     │     TTL: { generatedAt, expireAfterSeconds: 86400 } — expires next day
  │     │
  │     └── Emit Socket.IO: 'forecast:updated' { orgId, teamId, provider, predictions, rSquared }
  │           → Forecast chart updates live if user is on /forecast screen
  │
  └── Job completes: log duration, record count processed
```

### 19.2 Forecast Screen Flow

```
User navigates to /forecast
  │
  ├── RBAC: requireRole('admin', 'devops_manager', 'finance_manager')
  ├── requirePlan('pro', 'business', 'enterprise')
  │     [Pro: 30-day forecast only; Business+: 90-day + confidence bands]
  │
  ├── GET /api/forecasts?period=90&team=all&provider=all
  │     └── Returns latest forecast document for org
  │
  ├── Render: Area chart
  │     - Solid line: predicted cost per day (30/60/90 days forward)
  │     - Shaded band: 90% confidence interval
  │     - Dotted horizontal line: monthly budget limit (visual crossover warning)
  │     - Historical cost overlay (last 90 days): context for the projection
  │     - R² badge: "Forecast confidence: High / Medium / Low"
  │
  ├── Period selector: 30 / 60 / 90 days (only 30 on Pro)
  │
  ├── Filters:
  │     - By team (each team can have its own forecast line)
  │     - By provider (AWS / GCP / Azure / All)
  │
  ├── Export button:
  │     GET /api/forecasts/export?format=csv
  │     → CSV: { date, predicted, lowerBound, upperBound, team, provider }
  │
  └── Socket.IO: 'forecast:updated' → chart re-renders with new data
```

---

## 20. V2 — Jira Integration Flow

### 20.1 Jira Setup Flow

```
Admin → Settings → Integrations → Jira
  │
  ├── Form:
  │     - Jira Domain (yourcompany.atlassian.net)
  │     - User Email (for API token auth)
  │     - API Token (id.atlassian.com → Security → API tokens)
  │     - Default Project Key (e.g. INFRA)
  │     - Default Issue Type (Task / Story)
  │
  ├── POST /api/integrations/workflow/jira
  │     ├── Encrypt API token with AES-256
  │     ├── Store in integrations collection
  │     ├── Test: GET https://{domain}/rest/api/3/myself
  │     │     → Validates credentials
  │     └── On success: status = 'active', emit integration:status event
  │
  └── Integration active: "Create Jira Ticket" button appears on recommendation cards
```

### 20.2 Jira Ticket Creation Flow

```
DevOps Manager clicks "Create Jira Ticket" on a recommendation card:
  │
  ├── GET /api/integrations/jira/projects
  │     → Fetch available Jira projects (shown in modal dropdown)
  │
  ├── GET /api/integrations/jira/issue-types/:projectKey
  │     → Fetch issue types for selected project
  │
  ├── Modal appears with pre-populated fields:
  │     - Project: [dropdown, default: org.settings.jiraDefaultProject]
  │     - Issue Type: [dropdown, default: Task]
  │     - Summary: "[CloudPulse] {recommendation.title}" (editable)
  │     - Description: auto-populated with:
  │         Resource, Action, Estimated Saving, Confidence, CloudPulse link
  │     - Priority: High (if confidence ≥ 90%) or Medium
  │     - Assignee: [optional, searchable]
  │     - Labels: ['cloudpulse', 'cost-optimization', 'team-{name}']
  │
  ├── User edits if needed → clicks "Create Ticket"
  │
  ├── POST /api/recommendations/:id/create-jira-ticket { projectKey, issueTypeId, assignee }
  │     ├── RBAC: requireRole('admin', 'devops_manager')
  │     ├── Jira.createIssue(projectKey, issueTypeId, recommendation, team)
  │     ├── Store: recommendation.jiraIssueKey = 'INFRA-142', recommendation.jiraIssueUrl
  │     └── Emit Socket.IO: 'jira:ticket-created' { recommendationId, issueKey, issueUrl }
  │
  └── Recommendation card shows Jira badge: [INFRA-142 ↗]
```

---

## 21. V2 — GitHub PR Cost Delta Flow

### 21.1 GitHub Integration Setup Flow

```
Admin → Settings → Integrations → GitHub
  │
  ├── Form:
  │     - Personal Access Token (permissions: pull_requests:write, repo:read)
  │     - Repositories (one per line: owner/repo)
  │     - Cost threshold (only comment if delta > ₹X, default ₹1,000)
  │     - Webhook Secret: [auto-generated by CloudPulse — shown once]
  │
  ├── User adds webhook to GitHub:
  │     GitHub Repo → Settings → Webhooks → Add webhook
  │     Payload URL: https://api.cloudpulse.io/api/integrations/github/webhook
  │     Content type: application/json
  │     Secret: [paste CloudPulse-generated secret]
  │     Events: Pull requests
  │
  ├── POST /api/integrations/workflow/github
  │     - Encrypt PAT + webhook secret
  │     - Store repositories list
  │     - Status: active
  │
  └── OR: Customer adds GitHub Actions workflow file to their repo [see below]
```

### 21.2 GitHub Actions Workflow Flow

```
Developer opens a Pull Request in their repo:
  │
  ├── GitHub Actions triggers: cloudpulse-cost-delta.yml
  │     on: pull_request (types: opened, synchronize)
  │
  ├── Job: cost-estimate
  │     ├── actions/checkout@v4
  │     └── cloudpulse/cost-delta-action@v1
  │           inputs: api-key, org-id, github-token
  │
  ├── GitHub Action:
  │     ├── Collects: PR metadata (changed files, diff summary, branch name)
  │     ├── POST https://api.cloudpulse.io/api/integrations/github/analyze-pr {
  │     │     orgId, prNumber, repo, changedFiles, baseBranch, headBranch
  │     │   }
  │     └── Receives: costDelta object
  │
  ├── CloudPulse API /api/integrations/github/analyze-pr:
  │     ├── Validate API key → resolve orgId
  │     ├── Analyze changed files against current org resource costs
  │     │     [AI: identify infrastructure-affecting changes]
  │     │     - Lambda function changes → estimate invocation cost change
  │     │     - RDS schema changes → estimate query load change
  │     │     - New environment variables → detect new resource provisioning
  │     ├── Calculate: current monthly cost vs projected after merge
  │     └── Return: { costDelta, breakdown, confidence }
  │
  ├── GitHub Action posts PR comment (if delta > threshold):
  │     ☁️ CloudPulse Infrastructure Cost Estimate
  │     | Metric | Current | Projected | Delta |
  │     | Monthly cost | ₹84,200 | ₹91,500 | 📈 +₹7,300 (+8.7%) |
  │     Changed resources detected: [list]
  │     Confidence: 78% · [View full analysis]
  │
  ├── Idempotency: if CloudPulse already commented on this PR → UPDATE comment (not duplicate)
  │     Check: list comments → find existing CloudPulse comment → octokit.issues.updateComment
  │
  └── Emit Socket.IO: 'pr:cost-delta' { prNumber, repo, costDelta } to org room
```

### 21.3 Webhook-Based Flow (alternative to Actions)

```
Developer opens PR → GitHub sends webhook to CloudPulse:
  POST /api/integrations/github/webhook
  Headers: x-hub-signature-256, x-github-event
  │
  ├── Validate HMAC-SHA256 signature:
  │     hmac = SHA256(GITHUB_WEBHOOK_SECRET, body)
  │     crypto.timingSafeEqual(received, computed)
  │     If mismatch → 401 Reject (prevents spoofed webhook events)
  │
  ├── Filter: x-github-event == 'pull_request'
  │     action == 'opened' OR 'synchronize'
  │
  ├── Queue BullMQ job: analyze-pr-cost
  │     [Async — webhook must return 200 within 10s or GitHub will retry]
  │
  ├── BullMQ worker: same analysis as Actions flow above
  │
  └── Post comment via Octokit: octokit.issues.createComment or updateComment
```

---

## 22. V2 — PagerDuty Escalation Flow

### 22.1 PagerDuty Setup Flow

```
Admin → Settings → Integrations → PagerDuty
  │
  ├── Form:
  │     - Integration Key (Events API v2 Routing Key)
  │       [PagerDuty Service → Integrations → Add → "Events API v2"]
  │     - Routing rules (per alert type):
  │         Cost spike: ✅ ON
  │         CPU overload: ✅ ON
  │         Budget > 120%: ✅ ON
  │         Statistical anomaly: ☐ OFF
  │         Disk near full: ☐ OFF
  │
  ├── Test: POST /api/integrations/pagerduty/test-event
  │     → Sends test event to PagerDuty
  │     → User verifies PagerDuty receives it
  │
  ├── POST /api/integrations/workflow/pagerduty
  │     - Encrypt routing key
  │     - Save routing rules
  │     - Status: active
  │
  └── Integration active: Critical alerts now route to PagerDuty
```

### 22.2 Alert → PagerDuty Flow

```
Critical alert created [Section 8.1]:
  │
  ├── Check: org.integrations.pagerduty.status == 'active'
  │     AND alert.type matches any active routing rule
  │
  ├── POST https://events.pagerduty.com/v2/enqueue
  │     Payload:
  │       routing_key: decrypted key
  │       event_action: 'trigger'
  │       dedup_key: 'cloudpulse-{alert._id}'  [MongoDB ObjectId = globally unique]
  │       payload.summary: "[CloudPulse] Cost Spike: Team X"
  │       payload.severity: 'critical' | 'error' | 'warning'
  │       payload.custom_details:
  │         - team, provider, resource, alert_type
  │         - cost_impact: ₹X
  │         - ai_explanation: [from Gemini, attached to incident]
  │         - cloudpulse_url: link to alert detail
  │       links: [{ href: cloudpulse_url, text: "View Full Analysis" }]
  │
  ├── On success:
  │     - Store alert.pagerdutyDedupKey = dedup_key
  │     - alert.pagerdutySent = true
  │     - [V2] Dashboard alert card shows "PD 🔴" badge
  │
  └── On failure:
        - Fallback: send Slack + email immediately
        - Log: { event: 'pagerduty-dispatch-failed', alertId, error }
        - Admin notification: "PagerDuty delivery failed for alert X"
```

### 22.3 PagerDuty Resolution Flow

```
CloudPulse alert resolved [Section 8.4]:
  │
  ├── Check: alert.pagerdutyDedupKey exists
  │
  ├── POST https://events.pagerduty.com/v2/enqueue
  │     {
  │       routing_key: key,
  │       event_action: 'resolve',
  │       dedup_key: alert.pagerdutyDedupKey
  │     }
  │     → PagerDuty automatically resolves the associated incident
  │
  └── alert.pagerdutyResolved = true
```

---

## 23. V2 — Enhanced Slack Interactive Flow

### 23.1 Slack Button Interaction Flow

```
On-call engineer sees CloudPulse Slack alert and clicks "✅ Acknowledge":
  │
  ├── Slack sends POST to: /api/integrations/slack/actions
  │     payload: { type: 'block_actions', actions: [{ action_id, value }], user, team }
  │
  ├── Middleware: validateSlackSignature(req)
  │     ├── x-slack-signature: 'v0=' + HMAC-SHA256(SLACK_SIGNING_SECRET, rawBody)
  │     ├── x-slack-request-timestamp: must be < 5 minutes old (replay attack prevention)
  │     └── If invalid → 401
  │
  ├── Parse action_id:
  │     'acknowledge_alert' → PATCH /api/alerts/:value { status: 'acknowledged' }
  │     'snooze_alert' → PATCH /api/alerts/:alertId { snoozedUntil: now() + 4hrs }
  │
  ├── Update original Slack message:
  │     webClient.chat.update({
  │       channel, ts,  // from original message
  │       blocks: [...same blocks but actions section replaced with "Acknowledged by {user.name}"]
  │     })
  │
  └── Return 200 to Slack (within 3s — Slack will show error if response is slow)
```

---

## 24. Billing & Plan Upgrade Flow

### 24.1 Plan Upgrade Flow

```
User hits plan limit (e.g., tries to add GCP on Starter):
  │
  ├── API returns: 402 { error: 'Plan upgrade required', requiredPlans: ['business'], upgradeUrl: '/settings/billing' }
  │
  ├── Frontend: toast + upgrade modal appears
  │     "This feature requires the Business plan (₹8,999/mo)"
  │     [Upgrade Now] [Learn More]
  │
  ├── User navigates to /settings/billing:
  │     - Current plan shown
  │     - Comparison table (Starter / Pro / Business / Enterprise)
  │     - Feature differences highlighted
  │
  ├── User clicks "Upgrade to Business":
  │     ├── Redirect to payment provider (Razorpay / Stripe — India market)
  │     ├── Payment completed → webhook to CloudPulse
  │     │     POST /api/billing/webhook { planId, orgId, status: 'paid' }
  │     │     Update org.plan = 'business'
  │     └── Confirmation email sent via Resend
  │
  └── User is back in app with Business plan features unlocked
        Feature gates immediately lift (plan check is live per request)
```

---

## 25. CSV Import (Demo Mode) Flow

```
User selects "Import Billing CSV" during onboarding or from Settings:
  │
  ├── Supported formats:
  │     - AWS Cost Explorer export (CSV)
  │     - GCP Billing export (CSV)
  │     - Azure Cost Management export (CSV)
  │     - Generic: date, service, team, amount, currency columns
  │
  ├── Frontend: CSV drag-and-drop or file picker
  │
  ├── POST /api/costs/import (multipart/form-data)
  │     ├── Validate: file size < 50MB, extension .csv
  │     ├── Parse CSV with papaparse (streaming for large files)
  │     ├── Detect format: inspect column headers
  │     ├── Normalise all rows to unified cost schema
  │     ├── Currency conversion if needed (getUSDtoINR())
  │     ├── Batch upsert into costs collection
  │     │     source: 'csv-import'
  │     └── Return 200 { rowsImported, dateRange, totalAmount }
  │
  ├── Frontend: success toast "Imported 2,847 cost records (90 days)"
  │
  ├── BullMQ: triggers recommendation-generation job for this org
  │
  ├── Dashboard populates within 60 seconds
  │     [First AI insight generated]
  │
  └── Banner: "Viewing CSV import — connect live cloud API for real-time data"
```

---

## 26. Error, Failure, and Recovery Flows

### 26.1 Socket.IO Disconnect & Recovery

```
Client loses WebSocket connection:
  │
  ├── Socket.IO auto-detects (no heartbeat > 10s)
  │
  ├── Client: auto-reconnect with exponential backoff:
  │     Attempt 1: 1s · Attempt 2: 2s · Attempt 3: 4s · max: 30s
  │
  ├── Frontend UI:
  │     - "Reconnecting…" banner shown after 5s of no connection
  │     - Dashboard freezes on last known state (not blank)
  │     - No alerts emitted during disconnect period
  │
  ├── On reconnect:
  │     - Re-join org room
  │     - GET /api/dashboard/summary (REST) to sync any missed updates
  │     - Remove "Reconnecting…" banner
  │
  └── If socket permanently unavailable → fallback to 30s REST polling
```

### 26.2 Cloud API Failure Recovery

```
AWS / GCP / Azure API returns 5xx or times out:
  │
  ├── BullMQ job retries 3× with exponential backoff (2s, 4s, 8s)
  │
  ├── After 3 failures:
  │     - Job marked failed
  │     - integration.status = 'error'
  │     - integration.lastErrorAt = now()
  │     - integration.lastErrorMessage = error.message
  │     - Emit Socket.IO: 'integration:status' { type, status: 'error' }
  │     - Admin email notification
  │
  ├── Dashboard shows for affected provider:
  │     "AWS data delayed — last synced [timestamp]"
  │     [Not blank, not broken — last known data shown]
  │
  └── Recovery: next 60-min job run attempts again
        If successful: status → 'active', 'error' banner removed
```

### 26.3 AI Failure Recovery

```
AI model returns error / malformed response:
  │
  ├── try/catch wraps ALL AI calls
  │
  ├── JSON.parse failure:
  │     - Log: { event: 'ai-json-parse-error', model, prompt, rawResponse }
  │     - Return graceful fallback: "Unable to generate insight at this time"
  │
  ├── Timeout (> 10s for Gemini/Mistral, > 15s for Claude):
  │     - Gemini/Mistral → fallback to alternate model
  │     - Claude → queue BullMQ retry in 15min
  │
  ├── Low confidence (< 70%):
  │     - Response still shown
  │     - Append: "⚠️ This analysis needs human review"
  │     - For recommendations: never show as firm numbers
  │
  └── Prompt injection detected:
        - Do not call AI
        - Return: "I can only help with infrastructure cost questions"
        - Log: { event: 'prompt-injection-detected', input, orgId }
```

### 26.4 MongoDB Failure Recovery

```
Atlas node failure / write unavailability:
  │
  ├── Atlas 3-node replica set: automatic failover (< 30s)
  │
  ├── During failover:
  │     - App switches to read-only mode automatically
  │     - Write operations (metric ingestion, alert creation) queued in BullMQ
  │     - Read operations continue from replica
  │
  ├── App-level retry:
  │     mongoose retryWrites: true + w: 'majority'
  │     Automatic retry on write failure
  │
  └── On recovery:
        - Queued writes flush
        - Normal operation resumes
```

### 26.5 Redis Failure Recovery

```
Redis node unavailable:
  │
  ├── BullMQ jobs cannot enqueue → new jobs fail to add
  │     - Log failure
  │     - Critical jobs (alert notifications) fall back to synchronous execution
  │
  ├── Socket.IO Redis Adapter unavailable (V2):
  │     - Fall back to single-node Socket.IO mode
  │     - Events still delivered within single node
  │     - Clients reconnect — no data loss for single-node case
  │
  ├── AI cache unavailable:
  │     - All AI calls proceed without cache (higher cost, higher latency)
  │     - Log: 'ai-cache-miss-redis-down'
  │
  └── Redis Sentinel (Month 3+): provides HA for Redis
```

---

## 27. Security & Session Management Flows

### 27.1 Audit Log Flow

```
Every sensitive action writes to audit log:
  │
  ├── Logged actions:
  │     user.register, user.login, user.logout, user.roleChanged
  │     team.created, team.updated, team.deleted
  │     integration.added, integration.removed, integration.tested
  │     budget.updated, alertThreshold.updated
  │     recommendation.actioned, recommendation.dismissed
  │     report.generated, report.downloaded
  │     apiKey.rotated
  │
  ├── Each log entry:
  │     { orgId, userId, action, resource, resourceId, before, after, ip, userAgent, timestamp }
  │     'before' and 'after' are JSON diffs for config changes
  │
  ├── Storage: logs collection (MongoDB Atlas)
  │     - Immutable: no update or delete operations permitted on this collection
  │     - No TTL: logs are retained indefinitely (SOC2 requirement)
  │
  └── Access: Admin can view audit log at /settings/audit-log
        Read-only UI — no deletion interface provided
```

### 27.2 API Key Rotation Flow

```
Admin rotates cloud API credentials:
  │
  ├── PATCH /api/integrations/cloud/:provider/credentials
  │     ├── Accepts new credentials
  │     ├── Validates new credentials (test API call)
  │     ├── On success: overwrites encrypted credentials in DB
  │     ├── Old credentials immediately invalidated
  │     └── Write to audit log: { action: 'apiKey.rotated', provider }
  │
  └── No re-onboarding required — next billing sync uses new credentials
```

### 27.3 Data Isolation Verification Flow

```
Automated test (runs on every deploy):
  │
  ├── Create Org A + Org B with separate test data
  │
  ├── Authenticate as Org A user
  │
  ├── Attempt to access Org B data via:
  │     - REST API with manipulated IDs
  │     - Socket.IO room injection
  │     - Direct DB query simulation
  │
  ├── Assert: all cross-tenant access returns 403 or empty results
  │
  └── Deploy blocked if any assertion fails
```

---

## 28. Complete Screen Map

| Screen | Route | Roles | Key Data Fetched | Real-Time? |
|---|---|---|---|:---:|
| Login | `/login` | Public | — | ✗ |
| Register | `/register` | Public | — | ✗ |
| Forgot Password | `/forgot-password` | Public | — | ✗ |
| Reset Password | `/reset-password?token=` | Public | — | ✗ |
| Accept Invite | `/accept-invite?token=` | Public | — | ✗ |
| Onboarding | `/onboarding` | Admin (new) | — | ✓ (server poll) |
| Main Dashboard | `/dashboard` | All | Summary, alerts, recommendations, AI narrative | ✓ Socket.IO |
| Resource Monitoring | `/monitoring` | Admin, DevOps | Server list, live metrics | ✓ Socket.IO |
| Server Detail | `/monitoring/:serverId` | Admin, DevOps | 24h + 90d metrics, alerts, recs | ✓ Socket.IO |
| Cost Analytics | `/costs` | All (scoped) | Daily/team/service costs, delta table | ✗ (manual refresh) |
| [V2] Cross-Cloud Analytics | `/costs/cross-cloud` | Admin, DevOps, Finance | Provider breakdown, unified view | ✗ |
| Alerts | `/alerts` | Admin, DevOps, Team Lead | Alert list by severity | ✓ Socket.IO |
| Alert Detail | `/alerts/:id` | Admin, DevOps, Team Lead | Alert + AI explanation + root cause | ✗ |
| Recommendations | `/recommendations` | Admin, DevOps | Open recs sorted by saving | ✓ Socket.IO |
| Teams | `/teams` | Admin, DevOps, (TL: own) | Team list + budget status | ✗ |
| Team Detail | `/teams/:teamId` | Admin, DevOps, TL (own) | Cost trend, servers, alerts, recs | ✗ |
| Reports | `/reports` | Admin, Finance | Report list | ✗ |
| Report Viewer | `/reports/:id` | Admin, Finance | PDF preview / CSV download | ✗ |
| AI Assistant | `[slide-in panel]` | All | NL query response | ✗ (on query) |
| [V2] Forecast | `/forecast` | Admin, DevOps, Finance | 90d forecast chart + confidence band | ✓ Socket.IO |
| [V2] PR Cost Deltas | `/github/pr-deltas` | Admin, DevOps, Team Lead | PR cost analysis history | ✗ |
| Settings / Profile | `/settings/profile` | All | Own user data | ✗ |
| Settings / Billing | `/settings/billing` | Admin | Plan + usage | ✗ |
| Settings / Budgets | `/settings/budgets` | Admin | Team budgets, thresholds | ✗ |
| Settings / Users | `/settings/users` | Admin | User list, invites | ✗ |
| Settings / Cloud | `/settings/cloud` | Admin | Cloud connectors | ✓ (health check) |
| Settings / Integrations | `/settings/integrations` | Admin | Slack, Telegram, Jira, GitHub, PagerDuty | ✓ (health check) |
| Settings / Alerts | `/settings/alerts` | Admin | Custom alert thresholds | ✗ |
| [V2] Settings / AI | `/settings/ai` | Admin | LLM status, cache stats | ✗ |
| Audit Log | `/settings/audit-log` | Admin | Immutable action log | ✗ |

---

## 29. Socket.IO Event Map

| Event | Direction | Emitter | Room | Payload | Frontend Handler |
|---|---|---|---|---|---|
| `metrics:update` | Server → Client | Metrics ingestion | `org:{orgId}` | `{ serverId, cpu, ram, disk, network, timestamp }` | Updates server table rows + sparklines |
| `cost:update` | Server → Client | Billing ingestion | `org:{orgId}` | `{ teamId, amount, period, delta, currency, provider }` | Updates KPI cards + cost charts |
| `alert:new` | Server → Client | Alert engine | `org:{orgId}` | `{ alertId, type, severity, message, resourceId, aiExplanation? }` | Toast notification + badge increment + list prepend |
| `recommendation:new` | Server → Client | Rec. engine | `org:{orgId}` | `{ type, title, estimatedSaving, resourceId, provider }` | Savings KPI update + list append |
| `integration:status` | Server → Client | Health check job | `org:{orgId}` | `{ type, status, lastTestedAt, error? }` | Integration health badges in Settings |
| `connection:ready` | Server → Client | Auth middleware | `user:{userId}` | `{}` | UI: socket connected, hide offline banner |
| `[V2] forecast:updated` | Server → Client | Forecast job | `org:{orgId}` | `{ orgId, teamId, provider, predictions[], rSquared }` | Forecast chart re-renders |
| `[V2] jira:ticket-created` | Server → Client | Jira integration | `org:{orgId}` | `{ recommendationId, issueKey, issueUrl }` | Recommendation card shows Jira badge |
| `[V2] pr:cost-delta` | Server → Client | GitHub webhook handler | `org:{orgId}` | `{ prNumber, repo, costDelta, breakdown }` | PR cost delta panel notification |

---

## 30. End-to-End Request Lifecycle

This is the complete journey of a single event — a cost spike detected at 2:17 AM — from raw data to a paged on-call engineer.

```
T+0:00 — Agent on prod-api-2 (payments team) collects metrics (setInterval 3s)
          CPU: 92%, RAM: 78%, Disk: 45%
          POST /api/metrics { serverId: 'prod-api-2', cpu: 92, ... }

T+0:00 — Backend receives metric:
          Writes to resources collection
          Calculates cost delta: ₹0.47 added to today's total
          Today's total is now ₹8,420 (yesterday was ₹4,100)

T+0:00 — Anomaly detection runs:
          Rule 1: todayCost ₹8,420 > ₹4,100 × 1.5 = ₹6,150 → ✅ CRITICAL SPIKE
          Rule 2: Z-score = (8420 - 4200) / 800 = 5.27 > 2.5 → ✅ STATISTICAL ANOMALY

T+0:00 — Deduplication check:
          No open cost spike alert for this org + today → proceed

T+0:00 — Alert created in DB:
          { type: 'cost-spike', severity: 'Critical', message: 'Today's cost is 105% above yesterday', orgId, teamId: 'payments' }

T+0:00 — Socket.IO emit:
          io.to('org:abc123').emit('alert:new', alertPayload)
          → All users on this org's dashboard see toast immediately

T+0:01 — Notification dispatch (Promise.allSettled):
          ├── Slack webhook POST → Block Kit message with AI explanation + buttons → 200 OK (sent)
          ├── Telegram POST → Markdown alert + inline buttons → 200 OK (sent)
          └── [V2] PagerDuty POST → routes to payments team on-call rotation

T+0:02 — BullMQ: queue ai-explanation job for this alert
          (AI explanation runs async — dashboard shows alert immediately without waiting)

T+0:15 — BullMQ ai-explanation worker:
          Gemini 1.5 Flash called with:
            - Alert context
            - Last 30 days of costs for payments team
            - Last 10 alerts for this org
          Returns: { explanation: "Spike caused by Lambda cold starts in checkout-service.
                     Concurrency limit was removed in deploy at 23:45. 14,000 cold starts
                     in 90 minutes at ₹0.42/cold start = ₹5,880 unexpected spend.",
                     suggestedAction: "Restore Lambda concurrency limit to 100 in checkout-service",
                     confidence: 91 }
          Alert updated: alert.aiExplanation = explanation
          Socket.IO emit: alert:updated with explanation appended to dashboard alert card

T+0:16 — On-call engineer "Siddharth" is paged via PagerDuty on his phone at 2:17 AM
          PagerDuty incident includes:
            - Title: "[CloudPulse] Cost Spike: Payments Team"
            - AI Explanation: full root cause (already computed)
            - CloudPulse URL: link to alert detail
          He reads the explanation without opening a single cloud console.
          He knows exactly what happened and what to do.

T+0:20 — Siddharth restores Lambda concurrency limit via AWS CLI
          CPU drops back to 18%

T+0:21 — Next metric ingestion: today's spend growth rate normalises
          Auto-resolution check: cost growth rate below threshold
          Alert status → 'resolved', resolvedAt set
          MTTR = 21 minutes recorded

T+0:21 — [V2] PagerDuty resolve event sent: incident auto-resolves in PagerDuty
          [V2] Slack message updated: buttons disabled, "Resolved" label shown

T+0:21 — Dashboard alert moves to "Resolved" tab for all users
          MTTR KPI updated in analytics

Total elapsed from spike detection to on-call engineer understanding root cause: 16 minutes.
Industry average: 47 days.
```

---

## Appendix A — Feature → Plan Gate Reference

| Feature | Starter | Pro | Business | Enterprise |
|---|:---:|:---:|:---:|:---:|
| Live server monitoring | 1 server | 5 servers | Unlimited | Unlimited |
| AWS integration | ✅ | ✅ | ✅ | ✅ |
| GCP integration | ✗ | 1 project | Unlimited | Unlimited |
| Azure integration | ✗ | ✗ | ✅ | ✅ |
| AI anomaly explanation | Demo only | ✅ | ✅ | ✅ |
| AI recommendations | Demo only | ✅ | ✅ | ✅ |
| AI assistant (NL queries) | ✗ | ✅ | ✅ | ✅ |
| Slack + Telegram alerts | ✗ | ✅ | ✅ | ✅ |
| PDF + CSV reports | ✗ | ✅ | ✅ | ✅ |
| 30-day cost forecast | ✗ | ✅ | ✅ | ✅ |
| 90-day forecast + CI bands | ✗ | ✗ | ✅ | ✅ |
| Jira integration | ✗ | ✗ | ✅ | ✅ |
| GitHub PR cost delta | ✗ | 1 repo | Unlimited | Unlimited |
| PagerDuty routing | ✗ | ✗ | ✅ | ✅ |
| Mistral deep optimization | ✗ | ✗ | ✅ | ✅ |
| Claude executive summaries | ✗ | ✗ | ✅ | ✅ |
| Cross-cloud migration recs | ✗ | ✗ | ✅ | ✅ |
| SSO / SAML | ✗ | ✗ | ✗ | ✅ |
| White-label | ✗ | ✗ | ✗ | ✅ |
| On-premise deploy | ✗ | ✗ | ✗ | ✅ |
| SLA + dedicated support | ✗ | ✗ | ✗ | ✅ |
| SOC 2 compliance reports | ✗ | ✗ | ✗ | ✅ |

---

## Appendix B — V3 & V4 Flows (Planned, Not Yet Specced)

The following flows are committed in the roadmap but will be designed in separate PRD documents when their build gates are cleared.

- **V3:** Public REST API flow, Kubernetes pod-level monitoring flow, Slack `/infra` bot command flow, carbon footprint score flow, auto-remediation (opt-in) confirmation + execution flow, GitHub App OAuth flow (replacing PAT)
- **V4:** SSO/SAML authentication flow, white-label tenant provisioning flow, on-premise deployment flow, multi-region data routing flow, SOC 2 evidence collection flow

---

*All architectural changes to flows described in this document require:*
1. *A pull request with linked GitHub issue*
2. *A new or updated ADR entry (see PRD V2 Section 27.2)*
3. *Review and approval from CTO before implementation begins*
4. *Updated E2E test coverage for the changed flow*

*This document is the authoritative source of truth for how CloudPulse behaves at every level. When in doubt: refer here first.*
