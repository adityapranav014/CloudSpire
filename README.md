# CloudSpire

> Unified multi-cloud FinOps platform for engineering and finance teams.

**Live:** https://cloud-spire.vercel.app · `npm run dev` → http://localhost:5173

---

## What it does

CloudSpire gives teams a single dashboard across AWS, GCP, and Azure — with anomaly detection, AI-driven cost optimization, team budgets, and automated reporting.

---

## Tech Stack

| | |
|---|---|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Animations | Framer Motion |
| UI | shadcn/ui (Radix primitives) |
| Icons | Lucide React |
| Hosting | Vercel |

---

## Local Setup

```bash
npm install
npm run dev
```

---

## App Flow

### Landing (`/`)
Marketing page. Explains the product, features, and pricing. CTAs lead to `/onboarding`.

---

### Step 1 — Onboarding (`/onboarding`)

5-step wizard: Welcome → Connect AWS → Connect GCP → Connect Azure → Syncing Data

- Click **Test Connection** on each provider step — simulates a live credential check
- Click **Start Sync** — auto-advances through 5 sync stages then redirects to the Dashboard
- Read-only credentials only; CloudSpire never writes to your cloud

---

### Step 2 — Dashboard (`/dashboard`)

Main overview. First screen after login.

- **KPI cards** — Total Spend, Savings Identified, Active Anomalies, Budget Health (with MoM trend arrows)
- **Multi-Cloud Spend Trend** — area chart across AWS / GCP / Azure
- **Provider Allocation** — donut chart showing spend split
- **Top Services & Regions** — ranked bar charts, color-coded by provider
- Summary cards for active anomalies and optimization opportunities with "View All" links

---

### Step 3 — Cost Explorer (`/cost-explorer`)

Drill into spend data with filters.

- Filter by **Date Range** (30 / 90 / 180 days), **Granularity** (Daily / Weekly / Monthly), **Provider**, **Group By** (Service / Region / Account)
- Toggle between **Bar** and **Area** chart modes
- **Provider Comparison cards** — current vs. last period with trend badges
- **Spend Records table** — full sortable billing line items at the bottom

---

### Step 4 — Anomalies (`/anomalies`)

Spike detection and alerting.

- Tabs: **All / Open / Acknowledged / Resolved**
- Expand any anomaly to see Spend Today vs Expected, Deviation %, and Detected time
- Actions: **Acknowledge** (amber), **Resolve** (green, moves to Resolved tab), **Create Ticket** (toast)
- **Anomaly History** chart (last 30 days) and **Configure Alert Rules** panel at the bottom

---

### Step 5 — Optimizer (`/optimizer`)

Five tabs of cost-saving recommendations.

| Tab | What it shows |
|---|---|
| Idle Instances | Under-utilized EC2 / VMs — select rows → **Stop Selected** |
| Orphaned Resources | Unattached EBS, unused IPs, stale snapshots — **Delete** with confirmation |
| Right-Sizing | Over-provisioned instances with recommended size + monthly savings |
| Reserved Instances | Commitment purchase opportunities with break-even month |
| Scheduled Shutdowns | Dev/staging resources set to auto-stop outside business hours |

---

### Step 6 — Accounts (`/accounts`)

Per-account visibility across all cloud providers.

- Tabs: **All / AWS / GCP / Azure**
- Each card shows current spend, resource count, environment tag, last sync time
- Click any card → side drawer with 30-day spend trend, service breakdown, top resources, and account metadata

---

### Step 7 — Teams & Budgets (`/teams`)

Budget allocation by team.

- Each team card shows lead, monthly budget, current spend, and a utilization bar (amber > 80%, red = over budget)
- Click a card → modal with 30/60/90-day spend history, service breakdown, team members, linked resources
- **New Team** button → create team modal with budget input

---

### Step 8 — Reports (`/reports`)

Automated reporting for stakeholders.

- 6 pre-built templates: Monthly Cost Digest, Cost by Team, Anomaly Report, RI Utilization, Year-over-Year, Custom
- **Generate** (toast) or **Preview** any template
- **Scheduled Reports** section — reports already running to CFO, DevOps, and Finance
- **Export Billing Data** — choose format (CSV / JSON / Excel), granularity, and provider

---

### Step 9 — Settings (`/settings`)

- **Profile** — name, email, role, avatar
- **Notifications** — email / Slack / in-app toggles with threshold controls
- **Integrations** — Slack, Teams, Jira, PagerDuty, Terraform, GitHub Actions
- **Team Members** — invite, set roles (Admin / Member / Viewer), remove
- **API Keys** — generate, revoke, toggle visibility

---

## 5-Minute Demo Cheat Sheet

| # | Page | What to do |
|---|---|---|
| 1 | `/onboarding` | Test Connection on all 3 providers → Start Sync |
| 2 | `/dashboard` | KPI cards + spend trend chart |
| 3 | `/cost-explorer` | Change Group By → switch chart type |
| 4 | `/anomalies` | Expand a card → Acknowledge → Resolve |
| 5 | `/optimizer` | Idle Instances → select rows → Stop |
| 6 | `/teams` | Click a team card → budget bar |
| 7 | `/reports` | Generate a Monthly Cost Digest |

---

> All data is mocked — no real cloud credentials are needed.

