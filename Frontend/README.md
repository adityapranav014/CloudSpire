# CloudSpire

**Multi-cloud FinOps platform** for engineering and finance teams — AWS, GCP, and Azure in one place.

🔗 [cloud-spire.vercel.app](https://cloud-spire.vercel.app) · No backend required · All data is mocked

---

## Quick Start

```bash
npm install
npm run dev   # → http://localhost:5173
```

---

## Stack

React 18 · Vite · React Router v6 · Tailwind CSS · Recharts · Framer Motion · shadcn/ui · Lucide

---

## Features

| Area | Highlights |
|---|---|
| **Dashboard** | KPI cards with semantic colors, provider breakdown, spend trend, budget health |
| **Cost Explorer** | Filter by date / provider / group · bar & area chart modes · billing table |
| **Anomalies** | Spike detection · acknowledge / resolve workflow · 30-day history chart |
| **Optimizer** | Idle instances, orphaned resources, right-sizing, reserved instances, scheduled shutdowns |
| **Accounts** | Per-account cards with spend, resource count, 30-day trend drawer |
| **Teams** | Budget bars, team modals, spend history · scoped per role |
| **Reports** | 6 templates · schedule · export (CSV / JSON / Excel) |
| **Settings** | Profile, notifications, integrations, team members, API keys · tabs gated by role |

---

## Role-Based Access Control

Switch personas using the **floating pill** (bottom-right). Role persists across refreshes.

| Role | Key restrictions |
|---|---|
| Super Admin | Full access |
| FinOps Manager | No API key management |
| Cloud Engineer | No billing, no team admin |
| Team Lead | Teams scoped to own team · no Accounts page |
| Finance Analyst | Read + export only · no infra actions |
| Read-Only | View only · all action buttons hidden |

RBAC controls: sidebar links · page-level 403 guards · action button visibility · settings tab access · data scoping.

---

## Semantic Color System

| Color | Meaning |
|---|---|
| 🔴 Red | Act now — overspend or critical alert |
| 🟡 Amber | Caution — approaching a limit |
| 🟢 Green | Positive — savings or under budget |
| ⚪ Gray | Informational only |

---

## Demo Script (5 min)

> Default persona on load: **FinOps Manager — Marcus Rivera**

### 1. Dashboard — first impression
- Open `/dashboard` — all 4 KPI cards visible with live-looking data
- Point out the **semantic badge colors**: amber on "Total Spend" (cost rising), red on "vs Last Month" (overspending), amber on "Forecast" (83% budget consumed)
- Scroll down to **Active Intelligence** — alerts, savings, and budget health side by side

### 2. Role switching — Team Lead
- Click the **floating pill** (bottom-right) → Role Switcher modal opens with 6 persona cards
- Select **James Kim — Team Lead**
- Sidebar instantly hides the **Accounts** link
- Navigate to **Teams** — only James's team ("Frontend") is visible; all other teams are gone

### 3. Page-level guard — 403
- Type `/accounts` directly in the address bar
- **Access Denied** screen appears with James's role badge and a "Switch Role" shortcut button
- No blank page, no error — clean UX even for blocked routes

### 4. Read-Only — action buttons vanish
- Switch to **External Auditor — Read-Only**
- Go to `/anomalies` — Acknowledge / Resolve / Create Ticket buttons are all hidden; only "Open Console" remains
- Go to `/optimizer` — Apply / Terminate / Schedule toggles replaced with "View only" text
- Everything readable, nothing actionable

### 5. Cloud Engineer — scoped Settings
- Switch to **Priya Patel — Cloud Engineer**
- Open `/settings` — only **Profile** and **Notifications** tabs are visible
- Integrations, Billing, Team Members, API Keys tabs are completely absent (not disabled — hidden)

### 6. Super Admin — full access
- Switch to **Sarah Chen — Super Admin**
- All sidebar links back · all Settings tabs visible · all action buttons active

### 7. Persistence across refresh
- With any role selected, **refresh the browser**
- Role, name, and avatar all persist — stored in `localStorage` key `cloudspire_demo_role`

### 8. Onboarding wizard
- Navigate to `/onboarding`
- Click **Test Connection** on AWS, GCP, and Azure steps — each shows a simulated success state
- Click **Start Sync** — progress bar auto-advances through 5 stages, then redirects to Dashboard

### 9. Optimizer — bulk actions
- Go to `/optimizer` → **Idle Instances** tab (as FinOps Manager or Super Admin)
- Select 2–3 rows using checkboxes → **Terminate Selected** bulk action bar slides up from the bottom
- Switch to **Right-Sizing** tab → each row shows current type → recommended type → monthly savings

### 10. Cost Explorer — drill-down
- Go to `/cost-explorer`
- Change **Group By** to Region → chart redraws
- Toggle between **Bar** and **Area** chart modes
- Scroll down to the billing records table — sortable by any column


