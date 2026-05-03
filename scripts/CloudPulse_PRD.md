# CloudPulse — Product Requirements Document
### Smart Infrastructure Cost Intelligence
> *Giving every engineering team a number they own.*

**Document Version:** 1.0.0  
**Status:** Active — Engineering Baseline  
**Author:** Office of the CTO  
**Last Updated:** 2025  
**Classification:** Internal — Engineering & Product

---

## CTO Foreword

This document is the single source of truth for building CloudPulse. I am writing this as both the architect and the owner of this product. Every decision in here has been made deliberately — the technology choices, the feature prioritisation, the data model, the go-to-market sequencing. Nothing is accidental.

Cloud cost waste is not a finance problem. It is not a DevOps problem. It is an accountability and feedback-loop problem — and we are the team that will fix it. Our job is to compress the 47-day industry average for detecting cost anomalies down to under 12 hours, and to make the resulting insight so clear and actionable that a non-technical executive can act on it without asking for a translation.

We will build this product in four versions. V1 ships the core loop: observe, detect, act. Every subsequent version compounds on that loop. We do not build V2 features until V1 proves product-market fit. We do not scale what we have not proven. Every gate in our roadmap exists to force that discipline.

Read this document end to end before writing a single line of code. Architecture, data model, real-time pipeline, security model, and failure recovery are all here. The spec is the contract. Deviations require a written architecture decision record (ADR).

---

## Table of Contents

1. [Product Thesis & Problem Statement](#1-product-thesis--problem-statement)
2. [Market Context](#2-market-context)
3. [Product Vision & Strategic Pillars](#3-product-vision--strategic-pillars)
4. [Target Users & Personas](#4-target-users--personas)
5. [Role-Based Access Control (RBAC)](#5-role-based-access-control-rbac)
6. [Product Capabilities — Feature Specifications](#6-product-capabilities--feature-specifications)
7. [Architecture & Technical Decisions](#7-architecture--technical-decisions)
8. [Database Schema & Data Model](#8-database-schema--data-model)
9. [Real-Time Data Pipeline](#9-real-time-data-pipeline)
10. [AI Layer — Design & Behaviour](#10-ai-layer--design--behaviour)
11. [Security & Trust Architecture](#11-security--trust-architecture)
12. [Integration Ecosystem](#12-integration-ecosystem)
13. [Failure Modes & Recovery Playbook](#13-failure-modes--recovery-playbook)
14. [API Design Reference](#14-api-design-reference)
15. [Frontend Architecture & Screen Map](#15-frontend-architecture--screen-map)
16. [Business Model & Unit Economics](#16-business-model--unit-economics)
17. [Competitive Positioning & Moat](#17-competitive-positioning--moat)
18. [Go-To-Market Strategy](#18-go-to-market-strategy)
19. [Scaling Plan](#19-scaling-plan)
20. [Success Metrics & KPIs](#20-success-metrics--kpis)
21. [Risk Register](#21-risk-register)
22. [Product Roadmap](#22-product-roadmap)
23. [Appendix — Algorithms, Formulas & ADR Log](#23-appendix--algorithms-formulas--adr-log)

---

## 1. Product Thesis & Problem Statement

### 1.1 The Core Problem

Cloud bills are engineering's silent tax. Every team knows costs are out of control. Nobody owns fixing it.

The root cause is not overspending in isolation — it is a **missing feedback loop**. Engineers make infrastructure decisions in milliseconds, but the financial consequences arrive 30 days later as a line item on an invoice nobody fully understands. By then, the code that caused the spike is in production, the engineer has moved on, and accountability is impossible.

This is structurally broken:

- The people who create costs (engineers) never see those costs at the moment of creation.
- The people who own budgets (finance, CTO) receive information too late to act.
- The people who could fix inefficiency (DevOps) lack tooling to systematically identify and prioritise waste.

**CloudPulse closes that loop.** Real-time cost data, attributed to the team that created it, with AI that explains why a spike happened and tells you exactly what to do about it — with a rupee amount attached.

### 1.2 The Six Compounding Failures

Each failure below compounds every other one. Together they create the environment where cloud waste is structural and invisible until it is too late.

| # | Failure Mode | Who Feels It | Business Impact |
|---|---|---|---|
| 1 | No real-time cost visibility | Finance, CTO | Overages discovered at month-end — too late to act |
| 2 | No team-level attribution | CTO, VP Eng | No accountability; budgets impossible to enforce |
| 3 | Idle servers running undetected | DevOps | Servers at <5% CPU burning money 24/7, silently |
| 4 | No anomaly detection or alerting | All | 200% cost spikes go unnoticed until billing cycle ends |
| 5 | Finance and tech speak different languages | Finance, Eng | No shared source of truth; misaligned conversations |
| 6 | No optimization recommendations | DevOps Lead | Knows something is wrong but has no systematic fix |

CloudPulse must address all six failures in a single product. A solution that addresses only some of them is not a solution — it relocates the problem.

### 1.3 The Aha Moment

Every great SaaS product has one moment when the user goes from "interesting" to "I need this." Ours is:

> *The first time a user sees their AI-generated root cause explanation for a cost spike they didn't know had happened.*

Everything in onboarding, UX, and first-run experience must be optimised to get the user to that moment in under **10 minutes** from account creation.

---

## 2. Market Context

| Metric | Value |
|---|---|
| Global cloud spend | $723 Billion |
| Estimated waste rate | 30% |
| Organisations without real-time cost visibility | 68% |
| Cloud cost management market size | $8.4 Billion |
| Industry average time to detect a cost anomaly | **47 days** |
| CloudPulse detection target | **< 12 hours** |

The gap between 47 days and 12 hours is not a marginal improvement. It is a category shift. We are not competing on features — we are competing on the fundamental speed of the feedback loop.

### 2.1 Why Now

Three forces have converged to make this the right moment:

1. **Cloud-first is the default.** Even seed-stage startups run multi-service cloud infrastructure from day one. The pain threshold has dropped to teams of 5.
2. **AI has made root-cause explanation economically viable.** Gemini 1.5 Flash at 10× cheaper cost-per-token than GPT-4 makes always-on AI analysis feasible at startup margins.
3. **Developer-led buying is the norm.** DevOps Leads and CTOs at sub-500-person companies can adopt tools without procurement cycles. PLG directly reaches the decision-maker.

---

## 3. Product Vision & Strategic Pillars

### 3.1 Vision Statement

To be the intelligence layer every engineering team opens before they open their cloud console — the product that turns raw billing data into team-level accountability and clear, actionable decisions in real time.

### 3.2 The Three Strategic Pillars

```
┌──────────────────┬──────────────────┬──────────────────┐
│     OBSERVE      │     DETECT       │      ACT         │
├──────────────────┼──────────────────┼──────────────────┤
│ Real-time        │ AI anomaly       │ Specific, imple- │
│ visibility       │ detection that   │ mentable recom-  │
│ across every     │ explains WHY a   │ mendations with  │
│ cloud, team,     │ spike happened,  │ projected monthly│
│ and resource —   │ not just that    │ savings in ₹.    │
│ in one place.    │ it did.          │                  │
└──────────────────┴──────────────────┴──────────────────┘
```

### 3.3 Non-Negotiable Design Principles

These are constraints, not guidelines. Any feature or technical decision that violates these principles requires a formal ADR and CTO sign-off before proceeding.

| Principle | What It Means in Practice |
|---|---|
| **Speed over completeness** | A 90% accurate insight delivered in real time beats a 100% accurate report in 30 days. Never hold a feature waiting for perfect data. |
| **Accountability by default** | Every cost event is attributed to a team, a service, and a resource. Ambiguity in attribution is a bug — not a product decision. |
| **AI that explains, not just predicts** | Every anomaly alert includes a plain-English root cause. Every recommendation includes the exact action and the projected saving. No black-box outputs. |
| **Zero-friction onboarding** | First meaningful insight within 10 minutes of account creation. No sales calls, no setup fee, no professional services required on Starter or Pro. |
| **Never auto-execute** | AI recommends, humans decide. Every optimization requires explicit confirmation before action. This is a trust constraint — violating it once destroys customer trust permanently. |
| **Role-scoped everything** | No user ever sees data outside their assigned role scope. This is enforced at the middleware layer, not the UI layer. |

---

## 4. Target Users & Personas

### 4.1 Ideal Customer Profile

**Primary market:** Startups and mid-size companies with 10–500 engineers running workloads on AWS, GCP, or Azure, with monthly cloud bills between ₹4L and ₹4Cr.

**Why this segment:**
- Large enough to have real, measurable cloud cost pain
- Too small for enterprise tooling with 6-month sales cycles and $100K+ contracts
- Decision-makers (DevOps Leads, CTOs) are reachable via PLG and community channels without a sales motion
- Monthly cloud bills in the ₹4L–₹4Cr range make even a 10% savings ROI justify our Pro tier within the first month

### 4.2 User Personas — Full Specification

#### Persona 1: The DevOps Lead — "Rohan"
- **Age:** 28–38 | **Team size:** 3–15 infra engineers
- **Core pain:** He is blamed for every bill spike, but has no real-time view. He spends 3+ hours every billing cycle pulling raw CSVs from AWS console, reformatting them in Excel, and manually identifying anomalies — before he can even start investigating root cause.
- **Job to be done:** One screen that tells the full cost story — live — without digging through multiple cloud consoles.
- **Value delivered:** Live dashboard with team attribution and spike alerts. Saves 3+ hours per billing cycle and eliminates the "where did that come from?" conversation with the CTO.
- **Aha moment:** First Slack alert with an AI explanation that tells him exactly which server caused the spike and why — before his CTO calls him.

#### Persona 2: The CTO / VP Engineering — "Priya"
- **Age:** 35–50 | **Org size:** 50–500 engineers
- **Core pain:** The board asks every quarter why infrastructure costs are growing faster than revenue. She doesn't have a clean answer. She has spreadsheets, not a narrative.
- **Job to be done:** A single number — how much we wasted this month, exactly where — ready for a board presentation in 5 minutes.
- **Value delivered:** Executive-ready AI summaries and attribution reports. Team-level accountability that she can enforce in quarterly planning.
- **Aha moment:** The first time she pulls an AI-generated board summary directly from CloudPulse, without reformatting anything.

#### Persona 3: The Finance Manager — "Kavita"
- **Age:** 30–45
- **Core pain:** She cannot map cloud invoices to teams or projects. She knows the total spend but has no chargeback mechanism. She fights with engineering every month about what the bill actually represents.
- **Job to be done:** Chargeback reports — team-level spend vs budget — that she can send directly to cost centre owners.
- **Value delivered:** Downloadable PDF and CSV reports with team-wise cost breakdown and budget variance. She has a defensible number for every team, every month.
- **Aha moment:** The first time she exports a team chargeback report and sends it to an engineering lead without a single conversation with DevOps.

#### Persona 4: The Team Lead — "Arjun"
- **Age:** 26–38
- **Core pain:** He has no visibility into how much infrastructure his squad is consuming. He discovers overspend when his manager tells him — retrospectively — that his team was over budget.
- **Job to be done:** See his team's budget status, usage, and alerts in real time — without depending on the DevOps team to manually pull a report.
- **Value delivered:** Team-scoped dashboard with live spend, alerts, and savings opportunities. He can act before a problem escalates.

#### Persona 5: The IT Agency / MSP — "Vikram"
- **Age:** 32–50 | **Manages:** 5–50 client cloud accounts
- **Core pain:** He manually reports to multiple clients via spreadsheets. Every month is an operational nightmare of CSV exports, reformatting, and client-specific presentations.
- **Job to be done:** White-label per-client dashboards sent automatically on a schedule.
- **Value delivered:** Multi-org support with client-branded reports and scheduled delivery. He can add 10 new clients without adding headcount.

---

## 5. Role-Based Access Control (RBAC)

RBAC is enforced at the Express middleware layer on every API route and at the Socket.IO connection layer. The UI role-gates are supplementary — they cannot be the only enforcement point.

### 5.1 Role Definitions

| Role | Access Scope | Capabilities |
|---|---|---|
| **Admin** | Full platform (org-wide) | Manage users, teams, integrations, budgets, alerts, all reports, all settings |
| **DevOps Manager** | All infrastructure (org-wide) | Resource metrics, all alerts, recommendations, server management, cross-team comparison |
| **Finance Manager** | Cost data only (org-wide) | Budgets, forecasts, team attribution, CSV/PDF export — no raw server metrics |
| **Team Lead** | Own team only | Read: team usage, costs, alerts, budget status — no cross-team visibility or configuration |
| **Viewer** | Assigned dashboards only | Read-only. No configuration, no export, no alert management |

### 5.2 Middleware Enforcement

```javascript
// Middleware pseudo-code — every protected route runs this
const requireRole = (...allowedRoles) => (req, res, next) => {
  const { role, orgId } = req.user;
  if (!allowedRoles.includes(role)) return res.status(403).json({ error: 'Forbidden' });
  // orgId is ALWAYS injected into every DB query from req.user — never from request body
  req.orgId = orgId;
  next();
};

// Route example
router.get('/api/teams/:teamId/costs', requireRole('Admin', 'DevOps Manager', 'Finance Manager'), getCosts);
```

### 5.3 Socket.IO Room Scoping

Every socket connection is placed into a room identified by `orgId`. No event is ever broadcast to a room without explicit `orgId` routing. This is verified by automated test cases that assert cross-org event leakage is impossible.

```javascript
io.on('connection', (socket) => {
  const { orgId } = socket.user;         // Verified JWT payload
  socket.join(`org:${orgId}`);           // Org-scoped room
  socket.on('disconnect', () => socket.leave(`org:${orgId}`));
});

// Emitting — always scoped
io.to(`org:${orgId}`).emit('metrics:update', payload);
```

---

## 6. Product Capabilities — Feature Specifications

### 6.1 Live Infrastructure Dashboard

The first screen users see after login. A real-time command center for infrastructure health and cost posture. All widgets update automatically via Socket.IO — no page refresh, no manual export required.

#### 6.1.1 KPI Card Specifications

| Widget | What It Shows | Data Source | Refresh Rate |
|---|---|---|---|
| Total Monthly Spend | Cumulative spend this billing cycle with % change vs last month | `costs` collection, aggregated by `orgId + period` | Every 60 seconds via Socket.IO |
| Today's Spend | Cost accrued in current calendar day with hourly trend sparkline | Real-time cost estimator pipeline | Every 5 minutes |
| Active Servers | Count of running instances grouped by status: healthy / warning / idle | `resources` collection, live status field | Every 30 seconds |
| Active Alerts | Count of open (unresolved) alerts by severity: Critical / Warning / Info | `alerts` collection, real-time via Socket.IO | Real-time on `alert:new` event |
| Potential Savings | AI-estimated monthly savings from all currently open recommendations | `recommendations` collection sum of `estimatedSaving` | Hourly recalculation by BullMQ job |
| Budget Status | % of monthly budget consumed per team — RAG colour coding: Green < 80%, Yellow 80–100%, Red > 100% | Budget config vs. cost aggregation | Every 5 minutes |
| Team Cost Ranking | Ranked list of teams by spend this month with trend direction arrow | Aggregated cost pipeline | Every 5 minutes |

#### 6.1.2 Dashboard Layout Requirements

- All widgets must be visible without scrolling on a 1440px wide display.
- Mobile responsive — single column on viewports < 768px.
- Skeleton loaders shown during initial data fetch — no empty states without context.
- A persistent "Last updated: [timestamp]" indicator on every data widget.
- Stale data (>5 minutes since last update) shows a yellow "Data may be delayed" banner.

### 6.2 Real-Time Resource Monitoring

Six server metrics streamed every 3–5 seconds. Engineers see not just current state but a 90-day trend to understand whether things are getting better or worse.

#### 6.2.1 Monitored Metrics

| Metric | Collection Method | Alert Threshold | Display Format |
|---|---|---|---|
| CPU utilization (%) | `systeminformation.currentLoad()` | > 90% sustained 5 min = Critical | Gauge + 90-day sparkline + deviation from weekly average |
| RAM utilization (%) | `systeminformation.mem()` | > 90% = Warning | Used vs Available bar + provisioned headroom indicator |
| Disk usage (%) | `systeminformation.fsSize()` | > 80% = Warning | Per-volume progress bar |
| Network traffic | `systeminformation.networkStats()` | Baseline deviation > 3× = Info | Inbound/outbound Mbps with daily peak baseline |
| Running services | `systeminformation.services('*')` | Count delta > ±5 = Info | Count and expandable list of process names |
| Server temperature | `systeminformation.cpuTemperature()` | > 80°C = Critical | Numeric + colour-coded status |

#### 6.2.2 Multi-Server Support

- Server table shows all registered servers in a paginated, sortable list.
- Each row shows: server name, IP/hostname, OS, uptime, current CPU/RAM/Disk summary, status badge, last seen.
- Click-through to individual server detail page with full 90-day history charts.
- Filter by team, status (healthy / warning / idle / offline), or cloud provider tag.

#### 6.2.3 Idle Server Detection Logic

```
IF cpu_utilization < 5%
  sustained for >= 720 consecutive minutes (12 hours)
THEN:
  1. Update server status to "idle" in resources collection
  2. Generate idle server recommendation record
  3. Emit alert:new event (Warning severity)
  4. Queue Slack notification
```

**Target:** Detect idle servers in under 12 hours. Industry average is 47 days.

### 6.3 Multi-Dimensional Cost Analytics

Interactive cost exploration across five dimensions: time, team, service, resource, and request. Built for both engineering and finance audiences.

#### 6.3.1 View Specifications

| View | Chart Type | Dimensions | Interactivity |
|---|---|---|---|
| Daily trend | Line chart (multi-series) | Current period vs prior period | Click to drill into any day |
| Team breakdown | Pie chart + ranked bar chart | This month by team | Filter by date range, click to isolate team |
| Service breakdown | Stacked bar | EC2, RDS, S3, Lambda, custom-tagged | Toggle services on/off |
| Month-over-month delta | Table with RAG status | Team × month matrix | Sort by any column, filter by status |
| Cost density | Table | Cost-per-server, cost-per-request | Sortable, exportable |

#### 6.3.2 Filters & Controls

- Date range picker: presets (Today / 7D / 30D / 90D) and custom range
- Team multi-select filter
- Service type multi-select filter
- Currency toggle: INR / USD (display only — storage is always INR)
- Export button: triggers CSV or PDF generation via BullMQ (async)

### 6.4 Intelligent Alert Engine

Six alert types across three severity levels, combining rule-based triggers with statistical anomaly detection. Every alert includes an AI-generated plain-English explanation.

#### 6.4.1 Alert Type Definitions

| Alert Type | Trigger Condition | Severity | Notification Channels | AI Explanation |
|---|---|:---:|---|:---:|
| Cost spike | today_cost > yesterday_cost × 1.5 | 🔴 Critical | Dashboard + Slack + Telegram | Yes |
| Budget threshold — Warning | Monthly spend crosses 80% of budget | 🟡 Warning | Dashboard + Email | No |
| Budget threshold — Critical | Monthly spend crosses 100% or 120% of budget | 🔴 Critical | Dashboard + Email + Slack | No |
| CPU overload | CPU > 90% sustained > 5 minutes | 🔴 Critical | Dashboard + Slack | No |
| Idle server | CPU < 5% sustained > 12 hours | 🟡 Warning | Dashboard + Recommendation | Yes |
| Disk near full | Disk usage > 80% on any volume | 🟡 Warning | Dashboard | No |
| Statistical anomaly | Z-score > 2.5 SD from rolling 7-day average | 🔵 Info | Dashboard + AI root-cause | Yes |

#### 6.4.2 Alert Lifecycle

```
TRIGGERED → OPEN → (ACKNOWLEDGED) → RESOLVED
                         ↕
                     SNOOZED (up to 24h)
```

- Every state transition is written to the immutable `logs` collection.
- `resolvedAt - triggeredAt` = MTTR (Mean Time to Resolve), surfaced in the reporting module.
- Resolved alerts are retained for 90 days (Starter), 365 days (Business+).

#### 6.4.3 Alert Deduplication

- Consecutive triggers of the same alert type on the same resource within a 30-minute window are deduplicated into a single alert with an `occurrenceCount` field.
- This prevents notification spam during sustained high-CPU events.

### 6.5 AI Recommendation Engine

Runs as a BullMQ job every hour. Scans all resources against five detection rules. Each recommendation surfaces: the specific resource, the exact action, the projected monthly saving in ₹, and a confidence score.

#### 6.5.1 Recommendation Types

| Type | Detection Rule | Example Output | Confidence Calculation |
|---|---|---|---|
| Shut down idle server | CPU < 5% for 12+ consecutive hours | "Server-3 idle 3 days → shutdown saves ₹6,000/month" | Based on utilization consistency and age of idle period |
| Downsize instance | RAM usage < 20% of provisioned capacity | "prod-api-2 uses 18% RAM → downgrade to next tier saves ₹3,200/month" | Based on peak RAM usage over 30-day window |
| Delete stale backups | Snapshots > 30 days with zero restore activity | "14 old snapshots found → delete saves ₹1,800/month" | Rule-based (deterministic) |
| Move to cheaper storage | S3 Standard data not accessed in 90+ days | "Move 2.3 TB to S3 Glacier → saves ₹4,500/month" | Access log frequency analysis |
| Switch to reserved instances | On-demand instances > 85% uptime for 30 days | "Commit to 1-year reserved for prod cluster → save 40%" | Uptime trend over 90-day window |

#### 6.5.2 Recommendation Lifecycle

```
GENERATED → OPEN → ACTIONED (with actionedAt timestamp)
                    ↕
               DISMISSED (with reason)
```

- Actions require explicit user confirmation (click through confirm modal).
- Dismissed recommendations are logged with a reason field for AI training purposes.
- Actioned recommendations feed into the cumulative "Savings Achieved" KPI in reports.

#### 6.5.3 Confidence Score Display Rules

| Score Range | Display Behaviour |
|---|---|
| ≥ 90% | Show recommendation with projected savings as a firm number |
| 70–89% | Show recommendation with projected savings + "(estimated)" label |
| < 70% | Show recommendation with "Needs human review" label. Do NOT show a projected savings number. |

### 6.6 AI Assistant — Natural Language Interface

A conversational interface powered by Gemini 1.5 Flash. Users ask questions in plain English; the assistant queries live cost data and returns context-aware answers in seconds.

#### 6.6.1 Supported Query Types

| Category | Example Queries |
|---|---|
| Anomaly explanation | "Why did our AWS bill spike 40% this week?" |
| Status queries | "Which team is overspending their budget right now?" |
| Scenario modelling | "What would our bill look like if we shut down staging every weekend?" |
| Executive summaries | "Draft a summary of this month's cloud spend for my board update." |
| Comparative analysis | "Compare the payments team vs the platform team spend last quarter." |
| Trend analysis | "Are our EC2 costs trending up or down over the last 90 days?" |

#### 6.6.2 Technical Implementation

```javascript
// AI assistant call pattern
const response = await fetch('/api/ai/query', {
  method: 'POST',
  body: JSON.stringify({
    query: userMessage,
    context: {
      orgId,
      dateRange: { from, to },
      activeTeams: teams.map(t => t.id),
      currentCosts: dashboardSnapshot    // Inject live cost context
    }
  })
});
```

- System prompt strictly isolates the assistant role — it answers cost questions only and will not execute commands.
- All user inputs are sanitised for prompt injection before being passed to the AI.
- AI outputs are validated against a schema before rendering to the UI.
- Responses are cached for 1 hour (TTL) when the same query + same date range is issued by the same org — reduces API costs at scale.

#### 6.6.3 Multi-LLM Routing (V2)

| Query Type | Routed To | Rationale |
|---|---|---|
| Cost analysis, anomaly investigation | Gemini 1.5 Flash | Cheapest per token, fastest for structured queries |
| Optimization recommendations | Mistral Medium | Fine-tuned reasoning for structured optimization tasks |
| Executive summaries, narrative reports | Claude (Anthropic) | Strongest long-form structured narrative output |

### 6.7 Reports Module

Five report types covering every audience, from board packs to finance chargeback exports.

| Report Type | Audience | Format | Schedule |
|---|---|---|---|
| Monthly summary | CTO, VP Eng | PDF | Auto-sent on 1st of month |
| Team chargeback | Finance Manager | PDF + CSV | On-demand or monthly auto-send |
| Savings report | CTO, DevOps Lead | PDF | On-demand |
| Custom date range | Any role | PDF + CSV | On-demand |
| Audit trail export | Admin, Compliance | CSV | On-demand |

**Report generation:** All report generation is queued via BullMQ — it is never synchronous. This prevents report generation spikes from degrading API response times. Users receive an in-app notification and email when their report is ready.

---

## 7. Architecture & Technical Decisions

Every technology choice below is documented with its rationale. Undocumented technology choices are not permitted in this codebase. If you introduce a new dependency, write an ADR first.

### 7.1 Full Stack Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  React 19 + Vite + Tailwind v4 + Redux Toolkit + Recharts      │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS / Socket.IO
┌──────────────────────────────▼──────────────────────────────────┐
│                       API LAYER                                  │
│           Node.js + Express + Socket.IO + JWT Auth              │
│        BullMQ Workers │ AI Processor │ Alert Dispatcher         │
└────────┬──────────────┬──────────────┬──────────────────────────┘
         │              │              │
    ┌────▼────┐   ┌──────▼──────┐  ┌───▼──────────┐
    │ MongoDB │   │  Redis      │  │  External    │
    │  Atlas  │   │ (BullMQ +   │  │  APIs        │
    │         │   │  Sessions)  │  │  (AWS/GCP/   │
    └─────────┘   └─────────────┘  │  Gemini/     │
                                   │  Slack/etc)  │
                                   └──────────────┘
```

### 7.2 Technology Decisions with Rationale

| Layer | Technology | Why This Choice | Rejected Alternatives & Why |
|---|---|---|---|
| **Frontend** | React 19 + Vite | React's concurrent rendering handles high-frequency Socket.IO updates without UI jank. Vite HMR under 500ms. | Next.js adds SSR complexity we don't need. Create React App is deprecated. |
| **Styling** | Tailwind v4 | JIT eliminates CSS bloat. Utility-first scales well across a large component library. | CSS Modules: too verbose. Styled-components: runtime overhead. |
| **Charts** | Recharts + Chart.js | Recharts for React-native composability on analytics views. Chart.js Canvas-based sparklines don't repaint the DOM on every tick — critical at 3-second update intervals. | D3: too low-level for our timeline. Victory: poorer performance at high frequency. |
| **State** | Redux Toolkit | Predictable state tree essential for syncing real-time socket events with dashboard UI. RTK Query handles API caching and deduplication automatically. | React Query alone: insufficient for socket state. Zustand: poor DevTools at this complexity. |
| **Backend** | Node.js + Express | Event-loop model matches our high-concurrency, I/O-bound workload. Shared JS stack reduces context switching. | FastAPI/Python: doubles context switching cost. Go: overkill for current scale, slower iteration. |
| **Real-Time** | Socket.IO | Org-scoped rooms prevent cross-tenant leakage. Auto-reconnect + HTTP long-poll fallback handle unstable connections. | Native WebSockets: no room abstraction, manual reconnect. SSE: unidirectional only. |
| **Database** | MongoDB Atlas | Flexible schema accommodates per-cloud resource shapes without migrations. Built-in TTL indexes. Atlas Search for full-text alert querying. | PostgreSQL: schema migrations slow iteration on diverse resource shapes. DynamoDB: vendor lock-in, higher cost. |
| **Job Queue** | BullMQ + Redis | Durable queue with retry logic. Redis-backed jobs survive backend restarts. Worker concurrency tunable per environment. | Agenda.js: MongoDB-backed jobs, slower. SQS: vendor lock-in, cold start latency. |
| **Auth** | JWT via httpOnly cookies | httpOnly prevents XSS-based token theft. Short-lived (15 min) access tokens with refresh rotation. | LocalStorage JWTs: XSS vulnerable. Sessions: horizontal scaling complexity. |
| **Metrics** | systeminformation (npm) | Cross-platform OS metrics without agents. Works on Linux/macOS/Windows. Covers all 6 required metrics. | Prometheus + Node Exporter: requires agent installation, operational complexity. |
| **AI Layer** | Gemini 1.5 Flash | 10× cheaper cost-per-token than GPT-4 at comparable quality for structured cost queries. | GPT-4: 10× more expensive, not justified. Claude Haiku: strong but Gemini Flash more cost-effective for V1. |
| **Email** | Resend | Modern API, excellent deliverability, generous free tier for transactional email. | SendGrid: complex pricing. Nodemailer direct SMTP: deliverability risk. |
| **Deployment — Frontend** | Vercel | Edge network delivers sub-100ms dashboard loads globally. Git-integrated preview deployments. | Netlify: comparable, Vercel preferred for React teams. |
| **Deployment — Backend** | Railway / Render | Containerised backend with zero-downtime deploys on push. No Kubernetes overhead at V1 scale. | AWS ECS: over-engineered for V1. Heroku: deprecated free tier. |

---

## 8. Database Schema & Data Model

All collections are scoped by `orgId`. Every query in the application MUST include an `orgId` filter — this is enforced by middleware, but every developer is responsible for verifying their queries include it.

### 8.1 Collection Specifications

#### `users`
```javascript
{
  _id: ObjectId,
  orgId: ObjectId,        // Required. Scopes all access.
  name: String,           // Display name
  email: String,          // Unique within platform
  passwordHash: String,   // bcrypt, salt rounds: 12
  role: String,           // Enum: Admin | DevOps Manager | Finance Manager | Team Lead | Viewer
  teamId: ObjectId,       // Required for Team Lead role
  isActive: Boolean,      // Soft delete — never hard delete users
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
// Indexes: { email: 1, unique: true }, { orgId: 1 }, { orgId: 1, role: 1 }
```

#### `orgs`
```javascript
{
  _id: ObjectId,
  name: String,
  plan: String,           // Enum: starter | pro | business | enterprise
  cloudAccounts: [{
    provider: String,     // aws | gcp | azure
    label: String,        // Human-readable name
    encryptedKey: String, // AES-256 encrypted, key from env
    iv: String,           // AES-256 IV
    scopes: [String],     // Read-only scopes only
    lastVerified: Date
  }],
  monthlyBudget: Number,  // INR
  currency: String,       // Default: INR
  settings: {
    alertEmail: String,
    slackWebhook: String,
    telegramChatId: String,
    telegramBotToken: String,
    timezone: String      // IANA timezone string
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### `teams`
```javascript
{
  _id: ObjectId,
  orgId: ObjectId,
  name: String,
  members: [ObjectId],    // Array of user _ids
  monthlyBudget: Number,  // INR
  servers: [ObjectId],    // Array of resource _ids
  tags: [{
    key: String,          // e.g. "env"
    value: String         // e.g. "production"
  }],
  createdAt: Date,
  updatedAt: Date
}
// Indexes: { orgId: 1 }, { orgId: 1, name: 1 }
```

#### `resources`
```javascript
{
  _id: ObjectId,
  orgId: ObjectId,
  teamId: ObjectId,
  serverId: String,       // Friendly name or cloud resource ID
  type: String,           // ec2 | rds | s3 | lambda | on-premise | etc
  provider: String,       // aws | gcp | azure | on-premise
  status: String,         // healthy | warning | idle | offline
  metrics: {
    cpu: Number,          // Percentage 0-100
    ram: { used: Number, total: Number },
    disk: [{ mount: String, used: Number, total: Number }],
    network: { inbound: Number, outbound: Number }, // Mbps
    temperature: Number,  // Celsius
    runningServices: [String]
  },
  timestamp: Date,        // Metric observation time
  createdAt: Date
}
// TTL index: { timestamp: 1, expireAfterSeconds: 7776000 } (90 days, Starter)
// Indexes: { orgId: 1, teamId: 1 }, { orgId: 1, status: 1 }
```

#### `costs`
```javascript
{
  _id: ObjectId,
  orgId: ObjectId,
  teamId: ObjectId,
  service: String,        // ec2 | rds | s3 | lambda | etc
  amount: Number,         // INR
  currency: String,       // Always store as INR
  period: {
    start: Date,
    end: Date
  },
  source: String,         // api | csv-import | estimated
  tags: [{ key: String, value: String }],
  resourceId: ObjectId,   // Optional link to resources collection
  createdAt: Date
}
// Indexes: { orgId: 1, period.start: -1 }, { orgId: 1, teamId: 1, period.start: -1 }
```

#### `alerts`
```javascript
{
  _id: ObjectId,
  orgId: ObjectId,
  teamId: ObjectId,
  type: String,           // cost-spike | budget-threshold | cpu-overload | idle-server | disk-full | statistical-anomaly
  severity: String,       // critical | warning | info
  message: String,        // Human-readable alert message
  aiExplanation: String,  // AI-generated root cause (nullable)
  resourceId: ObjectId,   // The resource that triggered this alert
  status: String,         // open | acknowledged | snoozed | resolved
  snoozedUntil: Date,     // Nullable
  occurrenceCount: Number,// Deduplication counter
  triggeredAt: Date,
  acknowledgedAt: Date,   // Nullable
  resolvedAt: Date,       // Nullable
  resolvedBy: ObjectId    // Nullable, user who resolved
}
// Indexes: { orgId: 1, status: 1 }, { orgId: 1, triggeredAt: -1 }
```

#### `recommendations`
```javascript
{
  _id: ObjectId,
  orgId: ObjectId,
  teamId: ObjectId,
  type: String,           // idle-server | downsize | stale-backup | storage-tier | reserved-instance
  title: String,
  description: String,    // Plain-English action description
  resourceId: ObjectId,
  estimatedSaving: Number,// Monthly INR saving (only set if confidence >= 70%)
  confidence: Number,     // 0-100
  status: String,         // open | actioned | dismissed
  dismissReason: String,  // Nullable
  generatedAt: Date,
  actionedAt: Date,       // Nullable
  actionedBy: ObjectId    // Nullable
}
// Indexes: { orgId: 1, status: 1 }, { orgId: 1, type: 1 }
```

#### `logs` (Immutable Audit Log)
```javascript
{
  _id: ObjectId,
  orgId: ObjectId,
  userId: ObjectId,
  action: String,         // e.g. "recommendation.actioned", "alert.resolved", "user.created"
  resource: String,       // Collection name + resource ID
  before: Object,         // JSON snapshot before change (nullable)
  after: Object,          // JSON snapshot after change (nullable)
  ip: String,
  userAgent: String,
  timestamp: Date
}
// NEVER delete from this collection. No TTL index.
// Indexes: { orgId: 1, timestamp: -1 }, { orgId: 1, userId: 1 }
```

---

## 9. Real-Time Data Pipeline

### 9.1 End-to-End Pipeline — 8 Steps

All 8 steps complete within 3 seconds of a metric event reaching the system.

| Step | What Happens | Target Latency | Failure Behaviour |
|---|---|---|---|
| 1. Auth | User authenticates → JWT issued via httpOnly cookie → redirect to dashboard | < 500ms | Reject with 401 |
| 2. Socket Handshake | Frontend opens Socket.IO connection; middleware verifies JWT; user assigned to `org:{orgId}` room | < 200ms | Reject connection; client retries |
| 3. Metric Collection | `setInterval` every 3s: collect CPU, RAM, Disk, Network, Temperature, Services via `systeminformation` | < 100ms per call | Log error; use last known values; emit stale indicator |
| 4. Cost Estimation | `calculateCost()` applies rate card to resource delta since last tick; accumulates daily total | < 50ms | Use last confirmed rate; flag as estimated |
| 5. Anomaly Check | `detectSpike()` runs rule-based and Z-score checks; flags if thresholds breached | < 30ms | Log check failure; skip alert generation for this tick |
| 6. Emit to Client | Backend emits `metrics:update` and `cost:update` to `org:{orgId}` room only | < 50ms round-trip | Client shows stale banner after 10s no heartbeat |
| 7. Alert Dispatch | On anomaly: write to `alerts` collection → emit `alert:new` → fire Slack + Telegram webhooks | < 2 seconds | Retry webhooks 3× with backoff; alert still persisted in DB |
| 8. Recommendations | BullMQ job every 60 minutes: scans all resources → saves to `recommendations` → emits `recommendation:new` | < 60 seconds (batch) | Job retries on failure; stale recommendations remain visible |

### 9.2 Socket.IO Event Contracts

These events are the contract between the backend and frontend. Both sides must conform to these schemas. Schema violations should be logged and the event discarded gracefully.

| Event Name | Direction | Payload Schema | Frontend Handler |
|---|---|---|---|
| `metrics:update` | Server → Client | `{ serverId, cpu, ram: { used, total }, disk: [{ mount, used, total }], network: { in, out }, temperature, timestamp }` | Update server monitoring table row + append to sparkline |
| `cost:update` | Server → Client | `{ teamId, amount, period, delta, currency, source }` | Update KPI cards + append cost chart data point |
| `alert:new` | Server → Client | `{ alertId, type, severity, message, resourceId, aiExplanation }` | Show toast notification + increment alert badge + append to alert feed |
| `recommendation:new` | Server → Client | `{ recommendationId, type, title, estimatedSaving, confidence, resourceId }` | Append to recommendations panel + update Potential Savings KPI |
| `heartbeat` | Server → Client | `{ timestamp }` | Update "Last updated" indicator; absence > 10s triggers stale banner |

### 9.3 Cost Calculation Engine

```javascript
// Rate card (configurable per org, defaults shown)
const RATE_CARD = {
  ec2_micro_hourly: 2.50,        // INR per hour
  ec2_small_hourly: 5.00,
  ec2_medium_hourly: 10.00,
  rds_storage_gb_monthly: 8.00,
  s3_standard_gb_monthly: 2.00,
  s3_glacier_gb_monthly: 0.40,
  lambda_per_million_requests: 170.00
};

function calculateCost(resource, deltaSeconds) {
  const hourlyRate = RATE_CARD[`${resource.type}_${resource.size}_hourly`] || estimateFromCPU(resource);
  const cost = (hourlyRate / 3600) * deltaSeconds;
  return Math.round(cost * 100) / 100; // Paise precision
}
```

### 9.4 Data Source Modes

CloudPulse supports three operational modes, allowing onboarding of any customer regardless of infrastructure maturity.

**Mode 1: Live Mode (On-Premise)**
- Backend runs on a monitored server
- `systeminformation` reads CPU/RAM/Disk/Network directly from the host OS
- Zero additional agents or infrastructure changes required
- Supported OS: Linux (Ubuntu 20.04+, CentOS 7+), macOS 12+, Windows Server 2019+

**Mode 2: Cloud API Mode**
- Connects to AWS Cost Explorer, GCP Billing API, or Azure Cost Management
- Requires read-only API keys with minimum required scopes
- Billing data polled every 60 minutes (Cloud APIs are not real-time)
- Resource-level metrics supplemented by CloudWatch / Stackdriver where available

**Mode 3: Demo / CSV Mode**
- Customer uploads a billing export CSV (AWS CUR, GCP billing export, or Azure billing CSV)
- CloudPulse parses and renders it as an interactive historical dashboard within 60 seconds
- Anomaly detection runs on historical data to demonstrate value immediately
- No live data — all dates are relative to the CSV's time range

---

## 10. AI Layer — Design & Behaviour

### 10.1 AI System Architecture

```
User Query
    │
    ▼
Input Sanitisation Layer (strip prompt injection attempts)
    │
    ▼
Intent Classification (Gemini Flash — lightweight)
    │
    ├─── Cost query → Inject live cost context → Gemini Flash
    ├─── Optimization query → Inject resource data → Gemini Flash (V1) / Mistral (V2)
    ├─── Executive summary → Inject full dashboard snapshot → Gemini Flash (V1) / Claude (V2)
    └─── Anomaly explanation → Inject alert + 7-day baseline → Gemini Flash
    │
    ▼
Output Validation (schema check + confidence score extraction)
    │
    ├─── Valid + confidence ≥ 70% → Render to user
    ├─── Valid + confidence < 70% → Render with "Needs human review" label
    └─── Invalid → Graceful fallback message + log prompt context
    │
    ▼
Cache Check (1-hour TTL, keyed by orgId + query hash + date range)
```

### 10.2 Anomaly Explanation Prompt Engineering

```javascript
const anomalyExplanationPrompt = `
You are CloudPulse's cost intelligence engine. You are given:
1. A cost anomaly event (type, severity, affected resource, detected value)
2. The 7-day baseline for this resource (min, max, mean, stdDev)
3. The team that owns this resource

Your job is to explain in 2-3 plain sentences:
- What happened
- Why it is abnormal (use specific numbers)
- What the team should investigate first

Output format: JSON only, no markdown, no preamble.
{ "explanation": "...", "suggestedAction": "...", "confidence": 0-100 }

Anomaly data: ${JSON.stringify(anomalyData)}
Baseline data: ${JSON.stringify(baselineData)}
`;
```

### 10.3 Prompt Injection Defence

Every user-provided string that reaches an AI prompt must pass through:
1. **Strip HTML tags** — prevent prompt via injected tags
2. **Remove control characters** — prevent instruction injection via Unicode tricks
3. **Length limit** — max 1,000 characters for NL queries
4. **Keyword detection** — flag queries containing "ignore previous instructions", "system prompt", "jailbreak" etc. — log and reject
5. **Role isolation in system prompt** — the system prompt explicitly states the AI only answers cost-related questions and will not execute instructions

---

## 11. Security & Trust Architecture

Security is not a feature — it is the foundation on which every customer relationship is built. CloudPulse handles both sensitive financial data and infrastructure access credentials. A single breach ends the company.

### 11.1 Credential Security

- Cloud API keys stored with AES-256 encryption at rest. Encryption key stored in environment secrets — never in source code, database, or logs.
- CloudPulse requests **read-only IAM scopes exclusively**. For AWS: `ce:GetCostAndUsage`, `ce:GetCostForecast`. No write permissions are ever requested or accepted.
- API key values are never returned in any API response, error message, or stack trace.
- Key rotation is supported: customers can update credentials via Settings without re-onboarding. Old key is overwritten atomically.

```javascript
// Credential encryption
const crypto = require('crypto');
const ENCRYPTION_KEY = Buffer.from(process.env.CREDENTIAL_ENCRYPTION_KEY, 'hex'); // 32 bytes

function encryptKey(plaintext) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return { encrypted: encrypted.toString('hex'), iv: iv.toString('hex') };
}
```

### 11.2 Authentication Security

| Control | Implementation |
|---|---|
| Token storage | `httpOnly`, `Secure`, `SameSite=Strict` cookies. Inaccessible to JavaScript. |
| Access token lifetime | 15 minutes |
| Refresh token behaviour | Rotates on every use. Invalidated on logout. |
| Failed login policy | Exponential backoff after 3 failures. Account lock after 10 consecutive failures. |
| Audit logging | All auth events written to `logs` collection with IP, timestamp, user agent. |
| Password hashing | bcrypt with salt rounds: 12 |

### 11.3 Data Isolation

- Every database query includes `{ orgId: req.orgId }` filter — injected by middleware, not by route handlers.
- Socket.IO rooms are `org:{orgId}` scoped. Cross-org event emission is architecturally impossible.
- Automated test suite includes cross-tenant isolation tests that run on every CI build.

### 11.4 Transport & Infrastructure Security

- All data in transit encrypted via TLS 1.3
- All data at rest encrypted in MongoDB Atlas (AES-256 native encryption)
- Backend deployed in private network. No direct public exposure. Traffic via reverse proxy.
- Dependency CVE scanning via automated checks on every deploy. Critical vulnerabilities block deployment.
- Content Security Policy headers set on all API responses
- Rate limiting: 100 requests/15 minutes per IP on auth routes; 1000 requests/15 minutes on general API routes

### 11.5 Compliance Roadmap

| Milestone | Target | Trigger Condition |
|---|---|---|
| GDPR Compliance | Month 6 | Required before any EU customer onboarding |
| SOC 2 Type I | Month 9 | Pre-condition for any enterprise contract > ₹50K/month |
| SOC 2 Type II | Month 18 | Triggered at 50+ enterprise customers or Series A funding |
| ISO 27001 | Month 24 | Required for EU and regulated-industry customers |
| Multi-region Data Residency | V4 (Month 24+) | EU, India, US availability zones |
| Annual Penetration Test | Month 12 | First test at Series A, annually thereafter |

---

## 12. Integration Ecosystem

### 12.1 Cloud Provider Integrations

| Provider | V1 Status | V2 Status | Data Retrieved |
|---|:---:|:---:|---|
| AWS | ✅ Live | — | Cost Explorer: daily spend, service breakdown, resource tags |
| On-premise | ✅ Live | — | systeminformation: CPU, RAM, Disk, Network from host OS |
| GCP | Roadmap | ✅ Planned | Cloud Billing API: project-level cost, resource usage, labels |
| Azure | Roadmap | ✅ Planned | Cost Management API: subscription spend, resource groups, tags |

### 12.2 AWS Integration Technical Specification

```javascript
// AWS Cost Explorer integration
const { CostExplorerClient, GetCostAndUsageCommand } = require('@aws-sdk/client-cost-explorer');

const client = new CostExplorerClient({
  credentials: {
    accessKeyId: decrypt(org.cloudAccounts.aws.encryptedKey),
    secretAccessKey: decrypt(org.cloudAccounts.aws.encryptedSecret)
  },
  region: 'us-east-1'
});

const command = new GetCostAndUsageCommand({
  TimePeriod: { Start: startDate, End: endDate },
  Granularity: 'DAILY',
  GroupBy: [
    { Type: 'DIMENSION', Key: 'SERVICE' },
    { Type: 'TAG', Key: 'Team' }           // Maps to CloudPulse teams
  ],
  Metrics: ['UnblendedCost']
});
```

### 12.3 Workflow Integrations

| Tool | Version | Integration Type | Capability |
|---|:---:|---|---|
| Slack | V1 | Outbound Webhook | Alert notifications with severity + AI explanation. `/infra` bot for inline queries (V3). |
| Telegram | V1 | Bot API | Mobile-first alert delivery for on-call engineers. Configurable per alert severity. |
| Email (Resend) | V1 | API | Finance and executive reports. Budget threshold notifications. Monthly auto-summaries. |
| Jira | V2 | REST API | Convert recommendation to tracked Jira ticket with one click. Auto-populates summary, description, priority. |
| GitHub Actions | V2 | Webhook | Estimated infra cost delta per pull request in CI pipeline summary. |
| PagerDuty | V2 | Events API | Route Critical-severity alerts into existing on-call rotation workflows. |
| Terraform | V3 | Provider Plugin | Surface cost estimates for planned infrastructure changes before `terraform apply`. |

### 12.4 Slack Alert Payload Structure

```javascript
// Slack webhook payload for cost spike alert
{
  text: "🔴 *Cost Spike Detected* — payments-team",
  blocks: [{
    type: "section",
    text: {
      type: "mrkdwn",
      text: `*Alert:* Cost spike on payments-team\n*Detected:* ₹12,400 today vs ₹8,100 yesterday (+53%)\n*AI Explanation:* ${alert.aiExplanation}`
    }
  }, {
    type: "actions",
    elements: [{
      type: "button",
      text: { type: "plain_text", text: "View in CloudPulse" },
      url: `${APP_URL}/alerts/${alert._id}`
    }]
  }]
}
```

---

## 13. Failure Modes & Recovery Playbook

A production-grade system is defined by how it fails, not how it succeeds. Every failure mode documented here has a defined detection mechanism, user-facing impact statement, and recovery behaviour.

| Failure Mode | Detection Method | User-Facing Impact | Recovery Behaviour |
|---|---|---|---|
| **Socket.IO connection drops** | Client-side reconnect event; no heartbeat > 10s | Dashboard freezes on last known state | Auto-reconnect with exponential backoff (max 30s interval). UI shows "Reconnecting…" banner. State resumes on reconnect. |
| **AWS Cost Explorer API down** | HTTP 5xx from polling job; BullMQ job marked failed after 3 retries | Cost data becomes stale; no new recommendations generated | Jobs retry 3× with exponential backoff. Last known data shown with "Data as of [timestamp]" indicator. Admin receives alert email. |
| **AI returns confidence < 70%** | Confidence score in model JSON response | Recommendation displayed with "Needs human review" label | Never show projected savings as firm numbers below threshold. Log low-confidence outputs for model quality monitoring. |
| **AI returns malformed JSON** | `JSON.parse` exception in response handler | Recommendation or NL query shows graceful error | Try/catch wraps ALL AI calls. Fallback to "Unable to generate insight — please try again" message. Full prompt context logged for debugging. |
| **MongoDB Atlas node failure** | Atlas auto-detects; triggers replica promotion | Up to 30 seconds write unavailability | Atlas 3-node replica set provides automatic failover. App-level retry with 3-attempt backoff. Read-only mode during failover window. |
| **BullMQ / Redis failure** | Bull health check endpoint returns unhealthy | Background jobs (billing ingestion, AI analysis, report generation) stop processing | Redis Sentinel for HA from Month 3. Jobs marked for replay on recovery via persistent queue. Dashboard shows "Analysis paused — recovering" banner. |
| **Malicious prompt injection** | Input sanitisation layer keyword detection | Potential AI instruction hijacking | System prompt isolates role strictly. Output schema-validated before rendering. Suspicious inputs flagged, logged with user ID and timestamp, and rejected with generic error. |
| **Rate limit hit on AI API** | HTTP 429 from Gemini API | AI assistant and anomaly explanations fail | Response caching (1-hour TTL) prevents repeated calls. Retry with 5-second backoff. AI features degrade gracefully — core dashboard and alerts remain functional. |
| **Report generation timeout** | BullMQ job exceeds 120-second timeout | Report generation fails silently | Job retried up to 3×. User notified via in-app notification + email of failure with option to regenerate. |

---

## 14. API Design Reference

All API routes follow REST conventions. Authentication via JWT in httpOnly cookie on all protected routes. All responses include:
- `200 OK` for successful operations
- `400 Bad Request` for validation failures (with field-level error array)
- `401 Unauthorized` for missing/invalid auth
- `403 Forbidden` for insufficient role
- `429 Too Many Requests` for rate limit violations
- `500 Internal Server Error` for unexpected failures (never expose stack traces to clients)

### 14.1 Core API Endpoints

```
Authentication
POST   /api/auth/register          Register new org and admin user
POST   /api/auth/login             Issue JWT access + refresh tokens
POST   /api/auth/logout            Invalidate refresh token
POST   /api/auth/refresh           Rotate refresh token, issue new access token
POST   /api/auth/forgot-password   Send password reset email
POST   /api/auth/reset-password    Validate token + update password

Dashboard
GET    /api/dashboard/summary      KPI cards snapshot for current org
GET    /api/dashboard/alerts/live  Open alerts count by severity

Resources (Servers)
GET    /api/resources              List all servers (paginated, filterable)
GET    /api/resources/:id          Individual server detail + metric history
POST   /api/resources              Register new server
PUT    /api/resources/:id          Update server metadata
DELETE /api/resources/:id          Deregister server

Costs
GET    /api/costs                  Cost records (filterable by team, service, date)
GET    /api/costs/summary          Aggregated totals for KPI cards
GET    /api/costs/trend            Daily trend data for chart
GET    /api/costs/by-team          Team-wise breakdown
GET    /api/costs/by-service       Service-wise breakdown

Alerts
GET    /api/alerts                 List alerts (filterable by status, severity, type)
GET    /api/alerts/:id             Individual alert detail
PATCH  /api/alerts/:id/acknowledge Acknowledge alert
PATCH  /api/alerts/:id/resolve     Resolve alert
PATCH  /api/alerts/:id/snooze      Snooze alert (body: { until: ISODate })

Recommendations
GET    /api/recommendations        List recommendations (filterable by status, type)
GET    /api/recommendations/:id    Individual recommendation
PATCH  /api/recommendations/:id/action    Mark as actioned (requires confirm: true in body)
PATCH  /api/recommendations/:id/dismiss   Dismiss with reason

Teams
GET    /api/teams                  List all teams for org
GET    /api/teams/:id              Team detail + budget status
POST   /api/teams                  Create team
PUT    /api/teams/:id              Update team (budget, members, tags)
DELETE /api/teams/:id              Archive team

Reports
GET    /api/reports                List generated reports
POST   /api/reports/generate       Queue report generation job
GET    /api/reports/:id/download   Download PDF or CSV

AI Assistant
POST   /api/ai/query               Submit NL query, returns AI response
GET    /api/ai/query/:id           Retrieve cached query response

Settings
GET    /api/settings               Org settings
PUT    /api/settings               Update settings
POST   /api/settings/integrations/test   Test Slack/Telegram/Email connection
PUT    /api/settings/cloud-accounts/:provider   Update cloud API credentials
```

---

## 15. Frontend Architecture & Screen Map

### 15.1 Application Structure

```
src/
├── app/
│   ├── store.js                Redux store configuration
│   └── rootReducer.js
├── features/
│   ├── auth/                   Login, Register, Reset Password
│   ├── dashboard/              Main dashboard, KPI cards
│   ├── monitoring/             Server table, metric charts
│   ├── costs/                  Analytics views, filters, charts
│   ├── alerts/                 Alert list, detail, acknowledge flow
│   ├── recommendations/        Recommendation list, action flow
│   ├── teams/                  Team management, budget tracking
│   ├── reports/                Report list, generation, download
│   ├── ai/                     NL query interface
│   └── settings/               Integrations, budgets, users, API keys
├── components/
│   ├── ui/                     Shared: Button, Card, Badge, Modal, Toast
│   ├── charts/                 Recharts wrappers: Sparkline, TrendLine, BarChart, PieChart
│   └── layout/                 Sidebar, TopNav, PageHeader
├── hooks/
│   ├── useSocket.js            Socket.IO connection management
│   ├── useMetrics.js           Subscribe to metrics:update events
│   ├── useAlerts.js            Subscribe to alert:new events
│   └── useAuth.js              Auth state and token management
└── services/
    ├── api.js                  RTK Query API service (all endpoints)
    └── socket.js               Socket.IO client singleton
```

### 15.2 Screen-by-Screen Specification

| Screen | Route | Key UI Elements | Primary Action | Role Access |
|---|---|---|---|---|
| Login | `/login` | Email, password, forgot password link | Authenticate → dashboard redirect | All (unauthenticated) |
| Register | `/register` | Org name, name, email, password | Create org + admin account | Unauthenticated |
| Main Dashboard | `/dashboard` | 7 KPI cards, live server chart, cost trend, alert feed, AI narrative banner | Get instant infra + cost overview | All (scoped by role) |
| Monitoring | `/monitoring` | Server table (CPU/RAM/Disk/Network/status/uptime), click-through to server detail | Identify overloaded or idle servers | Admin, DevOps Manager |
| Server Detail | `/monitoring/:id` | 90-day sparklines for all 6 metrics, status history, alert history for this resource | Investigate specific server health | Admin, DevOps Manager |
| Cost Analytics | `/costs` | Day/team/service tabs, trend line chart, date filter, RAG delta table, export button | Analyse spend by dimension | All except Viewer |
| Alerts | `/alerts` | Alert list with severity badges, filters, AI explanation column, action buttons | Acknowledge, snooze, resolve alerts | Admin, DevOps Manager, Team Lead |
| Alert Detail | `/alerts/:id` | Full AI explanation, resource details, 7-day cost baseline chart, action history | Full root cause investigation | Admin, DevOps Manager, Team Lead |
| Recommendations | `/recommendations` | Card list with ₹ saving, confidence score, action/dismiss buttons, filters | Review and action AI recommendations | Admin, DevOps Manager |
| Teams | `/teams` | Team cards: spend, servers, budget RAG, trend arrow, member count | View team accountability snapshot | Admin, DevOps Manager |
| Team Detail | `/teams/:id` | Budget vs spend chart, server list, alert history, member list | Hold one team accountable | Admin, DevOps Manager |
| Reports | `/reports` | Report list, preview tiles, download button, schedule toggle | Export for board, finance, or client | Admin, Finance Manager |
| AI Assistant | `/ai` | Chat interface, query history, example queries | Ask cost questions in plain English | All except Viewer |
| Settings — General | `/settings` | Org name, timezone, currency, billing plan | Update org configuration | Admin only |
| Settings — Integrations | `/settings/integrations` | Slack, Telegram, Email setup + test button | Connect notification channels | Admin only |
| Settings — Cloud | `/settings/cloud` | AWS/GCP/Azure credential forms with encrypted display | Connect cloud billing APIs | Admin only |
| Settings — Users | `/settings/users` | User table, invite form, role selector, deactivate button | Manage team access | Admin only |
| Settings — Budgets | `/settings/budgets` | Per-team budget input + org-wide budget | Set budget thresholds for alerts | Admin only |

---

## 16. Business Model & Unit Economics

### 16.1 Pricing Tier Specifications

| Tier | Price | Target Segment | Key Capability Limits | Conversion Trigger |
|---|:---:|---|---|---|
| **Starter** | Free | Solo devs, evaluators | 1 server, mock data only, basic dashboard, 7-day history | Hits 1-server limit or needs 90-day history |
| **Pro** | ₹2,499/month | Startups, 5–50 engineers | 5 servers, AI assistant, Slack + Telegram alerts, PDF reports, 90-day history, team attribution | Needs multi-team or more servers |
| **Business** | ₹8,999/month | Series A+, 50–500 engineers | Unlimited servers, multi-cloud, public API access, custom alert rules, 1-year history, multi-team | Needs unlimited scale or API access |
| **Enterprise** | ₹50,000+/month | Large orgs, IT agencies, MSPs | SSO/SAML, on-premise, SLA, white-label, compliance reports, dedicated support | Needs white-label or compliance certification |

### 16.2 Feature Gate Matrix

| Feature | Starter | Pro | Business | Enterprise |
|---|:---:|:---:|:---:|:---:|
| Servers monitored | 1 | 5 | Unlimited | Unlimited |
| Data history | 7 days | 90 days | 1 year | Unlimited |
| AI assistant | ✗ | ✅ | ✅ | ✅ |
| Team attribution | ✗ | ✅ | ✅ | ✅ |
| PDF/CSV export | ✗ | ✅ | ✅ | ✅ |
| Slack + Telegram alerts | ✗ | ✅ | ✅ | ✅ |
| Multi-cloud connectors | ✗ | ✗ | ✅ | ✅ |
| Public API access | ✗ | ✗ | ✅ | ✅ |
| Custom alert rules | ✗ | ✗ | ✅ | ✅ |
| White-label | ✗ | ✗ | ✗ | ✅ |
| SSO / SAML | ✗ | ✗ | ✗ | ✅ |
| SLA guarantee | ✗ | ✗ | ✗ | ✅ |
| On-premise deployment | ✗ | ✗ | ✗ | ✅ |

### 16.3 Product-Led Growth Engine

| PLG Stage | Mechanism | Primary Metric |
|---|---|---|
| **Acquire** | Organic search, r/devops, r/aws, r/sysadmin, Product Hunt | Starter signups per week |
| **Activate** | First AI-generated cost insight within 10 minutes — the aha moment | Time to first insight < 10 minutes |
| **Retain** | Daily cost digest email; Slack alerts pull engineers back daily | DAU / MAU > 40% |
| **Expand** | Team invite prompt when user explores Team Comparison features; upgrade wall on server limit | Starter → Pro conversion > 8% |
| **Refer** | "Powered by CloudPulse" on exported PDF reports; NPS-triggered referral flow | NPS > 40 |

### 16.4 Revenue Projections

| Milestone | Month 3 | Month 9 | Month 18 |
|---|:---:|:---:|:---:|
| Pro customers | 10 | 80 | 300 |
| Business customers | 0 | 8 | 40 |
| Enterprise customers | 0 | 1 | 5 |
| Monthly Recurring Revenue | ₹24,990 | ₹2.7 Lakh | ₹11 Lakh |
| Annual Recurring Revenue | ₹3 Lakh | ₹32 Lakh | ₹1.32 Crore |

### 16.5 Unit Economics Targets

| Metric | Target | Rationale |
|---|---|---|
| Customer Acquisition Cost (Pro) | < ₹8,000 | Primarily content SEO + community, low CAC channel |
| Average Customer Lifetime (Pro) | 36 months | < 3% monthly churn implies ~33-month average |
| Lifetime Value (Pro) | ₹89,964 | ₹2,499 × 36 months |
| LTV : CAC Ratio | > 10× | Best-in-class SaaS benchmark is 3× |
| Gross Margin (at scale) | > 80% | AI API costs are primary COGS variable |
| Payback Period (Pro) | < 4 months | ₹8,000 CAC ÷ ₹2,499 MRR × margin |

---

## 17. Competitive Positioning & Moat

### 17.1 Competitive Landscape

| Capability | AWS Cost Explorer | CloudHealth (VMware) | Infracost | **CloudPulse** |
|---|:---:|:---:|:---:|:---:|
| Real-time monitoring | ✗ Daily batch | ~ Hourly partial | ✗ CI/CD only | ✅ Every 3 seconds |
| Multi-cloud | ✗ AWS only | ✅ Yes | ✅ Yes | ✅ V2 roadmap |
| Team cost attribution | ✗ No | ✅ Yes | ✗ No | ✅ Core feature |
| AI root-cause explanation | ✗ No | ~ Basic alerts | ✗ No | ✅ Full root cause + fix |
| Natural language queries | ✗ No | ✗ No | ✗ No | ✅ Plain English |
| Self-serve onboarding | ✅ Yes | ✗ 6-month sales cycle | ✅ Yes | ✅ Live in 10 minutes |
| Startup-affordable pricing | ✅ Free tier | ✗ Enterprise-only | ✅ Open source | ✅ ₹2,499/month |
| Slack + Telegram alerts | ✗ No | ~ Email only | ✗ No | ✅ Both |
| On-premise support | ✗ No | ✗ No | ✗ No | ✅ V1 core feature |

### 17.2 Durable Competitive Moats

| Moat | How It Compounds |
|---|---|
| **Data moat** | The longer a customer uses CloudPulse, the richer their 90-day baselines become, making anomaly detection more accurate. A competitor starting fresh cannot replicate this baseline — only time and usage builds it. |
| **Team network effect** | Once a DevOps Lead invites Finance and Engineering leadership into the same dashboard, CloudPulse becomes the shared source of truth. Ripping it out requires organisational alignment, not just a technical migration. |
| **AI recommendation flywheel** | Recommendations that are actioned generate savings data, which improves future recommendation quality. This flywheel compounds over the customer's lifetime. |
| **Workflow lock-in** | Slack alerts, Jira tickets, and GitHub PR comments embed CloudPulse in daily engineering routines. Switching requires rebuilding all these integrations from scratch. |

---

## 18. Go-To-Market Strategy

Each phase has a clear entry condition, exit condition, and decision gate. We do not scale what we have not proven.

### Phase 1 — Prove (Month 0–3)

**Objective:** Demonstrate that CloudPulse generates real value for at least 10 paying customers.

**Activities:**
- Launch MVP: AWS connector, real-time dashboard, AI spike explanation, Slack alerts
- Acquire first 10 paying Pro customers via direct LinkedIn outreach to DevOps Leads at Series A/B startups
- Seed developer communities: r/devops, r/aws, r/sysadmin, DevOps Discord servers
- Run weekly 30-minute user interviews with every paying customer. Fix the top 3 complaints each sprint.
- Validate aha moment: first AI-generated insight within 10 minutes of signup

> **Decision gate to Phase 2:** 10 paying customers AND NPS > 30 AND monthly churn < 3%

### Phase 2 — Grow (Month 3–9)

**Objective:** Build repeatable, scalable acquisition across inbound and outbound channels.

**Activities:**
- Product Hunt launch — target Top 5 product of the day
- Content SEO: 5 articles/month targeting "reduce AWS bill", "cloud cost monitoring", "infrastructure cost attribution"
- Add GCP + Azure connectors — expand TAM 3×
- Introduce Multi-LLM AI council: Gemini (analysis), Mistral (optimization), Claude (executive summaries)
- Close first 2–3 Business tier customers at Series A startups with ₹50L+/month cloud spend

> **Decision gate to Phase 3:** MRR > ₹2 Lakh AND Business tier customers signed AND Starter → Pro conversion > 8%

### Phase 3 — Scale (Month 9–18)

**Objective:** Activate enterprise channel. Establish CloudPulse as the category-defining product.

**Activities:**
- Enterprise sales motion targeting IT agencies managing multiple client infrastructures
- White-label offering for MSPs and cloud consultancies
- Public API marketplace — expose cost intelligence as a JSON API
- Evaluate seed fundraise or path to profitability based on MRR trajectory and unit economics

> **Decision gate to Phase 4:** MRR > ₹5 Lakh AND first enterprise customer signed

---

## 19. Scaling Plan

### 19.1 Technical Scaling Triggers

| Threshold | Scaling Action | Rationale |
|---|---|---|
| 500 concurrent orgs | Redis Adapter for Socket.IO horizontal scaling | Single-node Socket.IO saturates at ~500 concurrent connections under load |
| 10M cost records | Shard MongoDB `costs` collection by `orgId` | Single Atlas node shows > 100ms query latency at this volume |
| 100 orgs on BullMQ | Add dedicated worker nodes for billing ingestion | Shared workers cause queue depth growth under concurrent ingestion |
| 1,000 AI queries/day | Implement AI response caching with 1-hour TTL | Uncached AI spend exceeds ₹1.5L/month at this volume |
| 10,000 MAU | Cloudflare CDN for frontend + edge-cached API responses | Read-heavy routes must serve from edge to stay under 200ms globally |
| 50 enterprise orgs | Multi-region database deployment | Data residency requirements + latency SLA for EU/US customers |

### 19.2 Operational Scaling Plan

| Phase | Support Model | CS Ratio | Response SLA |
|---|---|---|---|
| Month 1–3 | Founder handles all support | N/A | < 4 hours |
| Month 3–9 | First CS hire. In-app chat (Crisp/Intercom). Self-serve docs. | 1:30 | < 8 hours |
| Month 9+ | Dedicated enterprise sales for deals > ₹50K/month. | 1:50 (CS), 1:10 (Enterprise) | < 2 hours (Enterprise SLA) |

### 19.3 Platform Cost Controls

| Control | Mechanism | Impact |
|---|---|---|
| AI routing | Simple NL queries → Gemini Flash (cheapest). Complex multi-step → higher-tier models only | Prevents AI cost blowout as query volume grows |
| Database TTL | Raw metric records auto-expire: 90 days (Starter), 365 days (Business+) | Storage costs stay proportional to plan value |
| Socket.IO diff emission | Emit only changed metric fields, not full state on every tick | Reduces bandwidth ~80% at scale |
| Report generation queue | PDF rendering via BullMQ (async), never synchronous | Prevents report spikes from degrading API latency |
| Recommendation caching | Recommendations cached for 60 minutes — re-run only when new data arrives | Prevents redundant AI calls on unchanged resource data |

---

## 20. Success Metrics & KPIs

### 20.1 Product Metrics

| Metric | Target | Why It Matters | What a Miss Signals |
|---|---|---|---|
| Time to first insight | < 10 minutes | The aha moment. Slow onboarding = churn before conversion. | Onboarding UX broken. Add demo data fallback or simplify connector setup. |
| Starter → Pro conversion | > 8% | Industry benchmark is 3–5%. Beating it validates product value. | Free tier too generous or upgrade triggers not compelling enough. |
| Monthly churn rate | < 3% | High churn means the product isn't solving the pain durably. | Segment by cohort: product gaps, price sensitivity, or onboarding failure? |
| DAU / MAU ratio | > 40% | Measures habit formation — is the team opening this daily? | Not embedded in daily workflow. Re-examine alert delivery and daily digest. |
| Recommendations actioned | > 30% | If users don't act, the feature has zero ROI. | Recommendations too vague or require too much effort. Improve specificity. |
| Net Promoter Score | > 40 | Strong NPS drives word-of-mouth — the primary PLG acquisition channel. | Product is useful but not loved. Find the gap between "useful" and "love". |
| Average savings shown | > 15% of customer's cloud bill | The product's core promise. Real savings = automatic retention. | AI isn't finding enough waste, or customers aren't acting on findings. |

### 20.2 Engineering Metrics

| Metric | Target |
|---|---|
| API P95 response time | < 200ms |
| Socket.IO event latency | < 100ms |
| Metric collection cycle | < 3 seconds end-to-end |
| Alert dispatch time | < 2 seconds from detection to Slack |
| Anomaly detection accuracy | > 85% true positive rate |
| Uptime | 99.9% monthly |
| Time to detect idle server | < 12 hours |

---

## 21. Risk Register

| Risk | Severity | Probability | Mitigation Strategy |
|---|:---:|:---:|---|
| AWS changes / deprecates Cost Explorer API | 🔴 Critical | Low | Abstract all cloud connectors behind a `CloudProviderAdapter` interface. GCP + Azure provide redundancy. Monitor AWS changelog weekly. |
| AI generates incorrect recommendations | 🔴 High | Medium | Confidence score on every recommendation. < 70% triggers "Needs human review". Auto-execution permanently forbidden — every action requires explicit human confirmation. |
| Socket.IO fails at scale | 🟡 Medium | Medium | Redis Adapter deployed before 500 concurrent orgs. Load test at 500; scale plan triggers at 1,000. Circuit breaker falls back to 30-second REST polling if socket layer fails. |
| Customer data breach | 🔴 Critical | Low | Read-only API key scopes only. AES-256 encryption at rest. SOC 2 roadmap from day one. Annual penetration testing from Month 12. |
| AWS Cost Explorer free tier undercuts positioning | 🟡 Medium | High | Win on dimensions AWS Explorer doesn't offer: multi-cloud, team attribution, AI explanations, non-engineer UX, Slack/Telegram, on-premise support. Target teams, not individual engineers. |
| Key engineer departure (bus factor) | 🟡 Medium | Medium | All architectural decisions documented in ADRs. No single-owner services. PR review enforces knowledge sharing. |
| LLM provider outage (Gemini) | 🟡 Medium | Low | Multi-LLM council in V2 adds full provider redundancy. Until then, AI features degrade gracefully — dashboard, alerts, and monitoring remain fully functional without the AI layer. |
| Competitor replicates core features | 🟡 Medium | High | Data moat and network effect compound over time. Speed of execution and PLG distribution are the near-term advantage. Enterprise integrations create switching costs. |
| Redis failure brings down BullMQ | 🟡 Medium | Low | Redis Sentinel HA from Month 3. Jobs persisted — replay on recovery. All background jobs have graceful degradation paths. |

---

## 22. Product Roadmap

Roadmap items are tied to product milestones and business triggers — not arbitrary version numbers. We build the next feature when the current feature is proven.

### V1 — Foundation (Now → Month 3)

*Ships when:* Time to First Insight < 10 minutes AND first 10 customers are live AND monthly churn < 3%.

- [ ] AWS Cost Explorer connector + CSV import mode
- [ ] Real-time dashboard: 7 KPI cards, live server metrics, cost trend charts
- [ ] Alert engine: 6 alert types, Slack + Telegram + email delivery
- [ ] AI spike explanation via Gemini 1.5 Flash — root cause in plain English
- [ ] AI recommendation engine: 5 recommendation types with ₹ savings estimate
- [ ] Reports: PDF and CSV export, monthly auto-send
- [ ] RBAC: 5 user roles with org-scoped data isolation
- [ ] On-premise server monitoring via systeminformation
- [ ] Secure credential management (AES-256)
- [ ] BullMQ background jobs: billing ingestion, recommendation generation, report rendering

### V2 — Intelligence (Month 3–9)

*Builds when:* Starter → Pro conversion > 8% AND 50 paying customers. AI quality becomes the retention lever at this scale.

- [ ] Multi-LLM AI council: Gemini (analysis) + Mistral (optimization) + Claude (summaries)
- [ ] Predictive cost forecasting: linear regression on 90-day billing history with confidence bands
- [ ] GCP Billing API connector
- [ ] Azure Cost Management connector
- [ ] Jira integration: convert recommendation to tracked ticket in one click
- [ ] GitHub Actions: infra cost delta per pull request in CI pipeline
- [ ] PagerDuty integration: route Critical alerts into on-call rotation
- [ ] Response caching layer (1-hour TTL) for AI queries

### V3 — Platform (Month 9–18)

*Builds when:* MRR > ₹5 Lakh AND first enterprise customer signed.

- [ ] Public REST API: expose cost intelligence as JSON for third-party integrations
- [ ] Kubernetes monitoring: pod-level resource + cost tracking via K8s Metrics API
- [ ] Slack bot: `/infra cost this-week`, `/infra status`, inline queries from any channel
- [ ] Carbon footprint score: estimated CO₂ per dollar of cloud spend
- [ ] Auto-remediation (opt-in): shut down idle servers automatically with explicit consent
- [ ] Redis Adapter for Socket.IO horizontal scaling
- [ ] Multi-region MongoDB deployment

### V4 — Enterprise (Month 18+)

*Builds when:* 10 enterprise customers OR Series A funding.

- [ ] SSO / SAML authentication (Okta, Azure AD, Google Workspace)
- [ ] On-premise deployment option for regulated industries
- [ ] SOC 2 Type II certification
- [ ] ISO 27001 certification
- [ ] White-label platform for MSPs and cloud consultancies
- [ ] Multi-region data residency: EU, India, US availability zones
- [ ] Dedicated infrastructure per enterprise tenant (data isolation upgrade)

---

## 23. Appendix — Algorithms, Formulas & ADR Log

### 23.1 Key Algorithms & Formulas

#### Cost Spike Detection

```javascript
// Rule-based (immediate Critical alert)
function detectCostSpike(todayCost, rollingAvg) {
  if (todayCost > rollingAvg * 1.5) {
    return { type: 'cost-spike', severity: 'critical', trigger: 'rule-based' };
  }
}

// Statistical (Z-score, Info alert with AI explanation)
function detectStatisticalAnomaly(todayCost, historicalData) {
  const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
  const stdDev = Math.sqrt(
    historicalData.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / historicalData.length
  );
  const zScore = (todayCost - mean) / stdDev;
  if (zScore > 2.5) {
    return { type: 'statistical-anomaly', severity: 'info', zScore, trigger: 'statistical' };
  }
}
```

#### Idle Server Detection

```javascript
function checkIdleServer(cpuReadings) {
  // cpuReadings: array of { value, timestamp } sorted chronologically
  const IDLE_THRESHOLD_PCT = 5;
  const IDLE_DURATION_MINUTES = 720; // 12 hours
  
  const recentReadings = cpuReadings.filter(r => {
    const minutesAgo = (Date.now() - new Date(r.timestamp)) / 60000;
    return minutesAgo <= IDLE_DURATION_MINUTES;
  });
  
  const allIdle = recentReadings.length >= 144 && // at least 144 readings (3s interval × 12h)
    recentReadings.every(r => r.value < IDLE_THRESHOLD_PCT);
  
  return allIdle;
}
```

#### Budget Alert Thresholds

```javascript
function checkBudgetThresholds(monthlySpend, monthlyBudget) {
  const pct = (monthlySpend / monthlyBudget) * 100;
  if (pct >= 120) return { severity: 'critical', threshold: 120, channels: ['dashboard', 'email', 'slack', 'executive'] };
  if (pct >= 100) return { severity: 'critical', threshold: 100, channels: ['dashboard', 'email', 'slack'] };
  if (pct >= 80)  return { severity: 'warning',  threshold: 80,  channels: ['dashboard', 'email'] };
  return null;
}
```

#### Estimated Savings Calculation

```
monthly_savings_opportunity = daily_cost_of_resource × 30 × (1 − utilization_ratio)

Example:
  Server at 8% CPU utilization, ₹400/day cost
  → ₹400 × 30 × (1 − 0.08)
  → ₹400 × 30 × 0.92
  → ₹11,040/month potential saving
```

```javascript
function calculateEstimatedSaving(resource, dailyCost) {
  const utilizationRatio = resource.metrics.cpu / 100;
  return Math.round(dailyCost * 30 * (1 - utilizationRatio));
}
```

#### Z-Score Calculation for Statistical Anomaly Detection

```
z_score = (today_cost − rolling_mean) / rolling_stdDev

Rolling window: 30 days
Alert threshold: z_score > 2.5 (99.4th percentile)
```

### 23.2 Architecture Decision Records (ADR Log)

ADRs document every significant technical decision. New decisions must add an entry here before implementation.

| ADR # | Decision | Alternatives Considered | Rationale | Date |
|---|---|---|---|---|
| ADR-001 | Use MongoDB over PostgreSQL | PostgreSQL, DynamoDB | Schema flexibility for diverse cloud resource shapes. TTL indexes for auto-expiry. Atlas Search for alert querying. | V1 |
| ADR-002 | JWT via httpOnly cookies over LocalStorage | LocalStorage, Session cookies | XSS protection. LocalStorage tokens are accessible to injected scripts. httpOnly cookies are not. | V1 |
| ADR-003 | BullMQ over Agenda.js | Agenda.js, AWS SQS, Inngest | Redis-backed durability. Worker concurrency tunable per environment. MongoDB-backed Agenda is slower. SQS creates vendor lock-in. | V1 |
| ADR-004 | Gemini 1.5 Flash over GPT-4 | GPT-4, Claude Haiku, Mistral 7B | 10× cheaper per token at comparable quality for structured cost queries. Critical for AI-heavy workload economics. | V1 |
| ADR-005 | Socket.IO over native WebSockets | Raw WebSockets, SSE, Long-polling | Room abstraction for org scoping. Auto-reconnect built-in. HTTP long-poll fallback for restricted networks. | V1 |
| ADR-006 | Never auto-execute AI recommendations | Auto-execute with undo | Trust constraint. A single incorrect auto-execution (e.g., shutting down a production server) ends the customer relationship and company reputation. | V1 |
| ADR-007 | Separate BullMQ worker for report generation | Synchronous PDF generation | Report generation can take 10–60 seconds. Synchronous generation would block the API under report load. Async queue with notification is the correct pattern. | V1 |

### 23.3 Environment Variables Reference

```bash
# Application
NODE_ENV=production
PORT=5000
APP_URL=https://app.cloudpulse.io
CLIENT_URL=https://cloudpulse.io

# Database
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=cloudpulse

# Redis
REDIS_URL=redis://...

# Auth
JWT_ACCESS_SECRET=<64-byte-hex>
JWT_REFRESH_SECRET=<64-byte-hex>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CREDENTIAL_ENCRYPTION_KEY=<32-byte-hex>  # AES-256 key for cloud API credentials

# AI
GEMINI_API_KEY=<key>
MISTRAL_API_KEY=<key>           # V2
ANTHROPIC_API_KEY=<key>         # V2

# Notifications
RESEND_API_KEY=<key>
DEFAULT_FROM_EMAIL=alerts@cloudpulse.io

# Monitoring (optional, for self-hosted systeminformation)
METRICS_POLL_INTERVAL=3000      # milliseconds

# Feature Flags
ENABLE_MULTI_LLM=false          # Toggle for V2 AI council
ENABLE_AUTO_REMEDIATION=false   # Toggle for V3 auto-remediation (always off by default)
```

---

*Document maintained by the Office of the CTO. All modifications require a pull request with a linked issue. Significant architectural changes require an ADR entry in Section 23.2 before implementation begins.*

*Version 1.0.0 — CloudPulse Foundation Spec*
