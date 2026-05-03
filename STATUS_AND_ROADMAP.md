# 📊 CloudSpire - Development Status & Implementation Guide

**Last Updated:** May 2, 2026

---

## Table of Contents
1. [Completion Status](#completion-status)
2. [Remaining Work](#remaining-work)
3. [Real Cloud Data Integration](#real-cloud-data-integration)
4. [Next Priority Steps](#next-priority-steps)
5. [Architecture Overview](#architecture-overview)

---

## Completion Status

### ✅ Frontend (80% Complete)

| Feature | Status | Details |
|---------|--------|---------|
| **Dashboard** | ✅ Complete | Responsive grid layout, 4 KPI cards, multiple chart widgets |
| **Real-Time Charts** | ✅ Complete | Area, Donut, Bar, Heatmap charts implemented |
| **Responsive Design** | ✅ Complete | Mobile/tablet/desktop breakpoints configured |
| **Authentication Pages** | ✅ Complete | Login/Signup with form validation (autocomplete issue fixed) |
| **All Core Pages** | ✅ Complete | Dashboard, Accounts, Anomalies, CostExplorer, Optimizer, Reports, Settings, Teams, Onboarding |
| **RBAC System** | ✅ Complete | Role-based access control structure in place |
| **Alerts Display** | ✅ Partial | UI built, real-time updates need Socket.IO |
| **Recommendations Panel** | ✅ Partial | UI built, real AI data needed |

**Files Built:**
- `Dashboard.jsx` - Main dashboard with grid layout
- `Login.jsx`, `Signup.jsx` - Authentication pages
- `Onboarding.jsx` - Initial setup flow
- `Accounts.jsx`, `Anomalies.jsx`, `CostExplorer.jsx` - Analytics pages
- `Optimizer.jsx`, `Reports.jsx` - Action pages
- `Settings.jsx`, `Teams.jsx` - Configuration pages
- `WidgetRegistry.js` - Widget system for dashboard customization

---

### ✅ Backend (70% Complete)

| Feature | Status | Details |
|---------|--------|---------|
| **AWS Integration** | ✅ Complete | AWS SDK with Cost Explorer + EC2 APIs |
| **Azure Integration** | ✅ Complete | Azure Cost Management + VMs APIs configured |
| **Authentication** | ✅ Complete | JWT, register, login, user management |
| **API Routes** | ✅ Complete | All 10 main routes configured |
| **Database Setup** | ✅ Complete | MongoDB with Mongoose models |
| **Error Handling** | ✅ Complete | Centralized error handler + async wrapper |
| **Audit Logging** | ✅ Partial | Service exists, not fully integrated |
| **Mock Data** | ✅ Complete | AWS, Azure, GCP mock data for development |

**Key Files:**
- `awsService.js` - AWS Cost Explorer + EC2 integration
- `azureService.js` - Azure Cost Management + VMs integration (NEW)
- `database.js` - MongoDB connection setup
- `errorHandler.js` - Global error handling middleware
- `controllers/cloud.js` - Cloud provider endpoints
- `controllers/auth.js` - Authentication endpoints
- Mock data files for local testing

## Remaining Work

### 🔴 High Priority (Blocking Live Features)

| Item | Effort | Impact | Module | Status |
|------|--------|--------|--------|--------|
| **Real-Time Socket.IO** | 🔴 3 days | Dashboard updates every 3-5 seconds (critical for "live" dashboard) | Backend | ⏳ Not Started |
| **GCP Integration** | 🟡 2 days | Google Cloud Platform connector (currently mock only) | Backend | ⏳ Not Started |
| **AI Layer (Gemini API)** | 🔴 3 days | Root-cause explanation + recommendations engine | Backend | ⏳ Not Started |
| **Slack/Telegram Alerts** | 🟡 2 days | Alert delivery to messaging platforms | Backend | ⏳ Not Started |
| **Database Persistence** | 🟠 1 day | Cost/alert data not being persisted to MongoDB | Backend | ⏳ Not Started |

### 🟡 Medium Priority (Feature Complete)

| Item | Effort | Impact | Module |
|------|--------|--------|--------|
| **Predictive Forecasting** | 🟠 2 days | Month-end spend projection with confidence bands | Backend |
| **Report Generation** | 🟠 2 days | PDF/CSV exports for board meetings | Backend |
| **Team Chargeback** | 🟠 1 day | Team-wise cost attribution reports | Backend |
| **Budget Thresholds** | 🟠 1 day | 80%/100%/120% budget alerts | Backend |
| **Jira Integration** | 🟠 2 days | Convert recommendations to tracked tickets | Backend |
| **GitHub Actions** | 🟠 2 days | Show infra cost delta in PR checks | Backend |

### 🟢 Lower Priority (Nice-to-Have)

| Item | Effort | Impact |
|------|--------|--------|
| **PagerDuty Integration** | 🟢 1 day | Route alerts to on-call rotation |
| **Multi-region Residency** | 🟠 3 days | EU/India/US data zones |
| **White-Label** | 🟠 2 days | Branded dashboards for MSPs |
| **Kubernetes Monitoring** | 🟡 3 days | Pod-level cost tracking |
| **Carbon Footprint** | 🟢 1 day | CO₂ per dollar of cloud spend |

---

## Frontend Actions → Backend API Mapping

### यह दिखाता है कि जब आप Frontend पर कोई button क्लिक करते हो तो कौन सी Backend API call होती है

---

### 🔐 Authentication Pages (Login/Signup)

| Frontend Action | Component | API Call | Method | Response |
|---|---|---|---|---|
| **Sign Up क्लिक करो** | `Signup.jsx` | `/api/v1/auth/register` | `POST` | `{ user, token }` |
| **Sign In क्लिक करो** | `Login.jsx` | `/api/v1/auth/login` | `POST` | `{ user, token }` |
| **Get My Profile** | Any page (on load) | `/api/v1/auth/me` | `GET` | `{ user, role, team }` |

**Example Request:**
```javascript
// Signup
POST /api/v1/auth/register
{
  "email": "user@company.com",
  "password": "password123",
  "name": "John Doe"
}

// Response
{
  "success": true,
  "user": { "_id": "...", "email": "...", "role": "Admin" },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 📊 Dashboard Pages

| Frontend Action | Page | API Call | Method | Purpose |
|---|---|---|---|---|
| **Dashboard पर जाओ** | `Dashboard.jsx` | `/api/v1/cloud/aws` | `GET` | AWS costs + instances fetch करो |
| | | `/api/v1/cloud/azure` | `GET` | Azure costs + VMs fetch करो |
| | | `/api/v1/cloud/gcp` | `GET` | GCP costs fetch करो |
| **KPI Cards देखो** | `Dashboard.jsx` | Multiple cloud APIs | `GET` | सभी provider से real-time data |
| **Charts देखो** | `Dashboard.jsx` | `/api/v1/unified` | `GET` | All providers का combined data |
| **Refresh icon क्लिक करो** | `Dashboard.jsx` | Same as above | `GET` | Latest data re-fetch करो |

---

### 🔗 Onboarding / Cloud Account Connection

| Frontend Action | Page | API Call | Method | Purpose |
|---|---|---|---|---|
| **"Continue" बटन Onboarding में** | `Onboarding.jsx` (Step 1) | `/api/v1/teams` | `POST` | नया team बनाओ |
| **Cloud provider select करो** | `Onboarding.jsx` (Step 2) | (कोई API नहीं) | — | Frontend पर ही selection होता है |
| **AWS/Azure credentials enter करो** | `Onboarding.jsx` (Step 3) | `/api/v1/cloud/connect` | `POST` | Credentials को MongoDB में save करो (encrypted) |
| **"Test Connection" बटन क्लिक करो** | `Onboarding.jsx` | `/api/v1/cloud/aws` (or azure) | `GET` | Connection verify करने के लिए test करो |

**Example Request:**
```javascript
// Credentials submit करना
POST /api/v1/cloud/connect
{
  "provider": "aws",
  "name": "Production Account",
  "credentials": {
    "accessKey": "AKIA...",
    "secretKey": "..."
  }
}

// Response
{
  "success": true,
  "account": {
    "_id": "...",
    "provider": "aws",
    "name": "Production Account"
  }
}
```

---

### 💰 Cost Explorer Page

| Frontend Action | Page | API Call | Method |
|---|---|---|---|
| **Date range select करो** | `CostExplorer.jsx` | `/api/v1/cloud/aws?start=date&end=date` | `GET` |
| **Service filter लगाओ** | `CostExplorer.jsx` | `/api/v1/unified?service=EC2` | `GET` |
| **Export PDF बटन** | `CostExplorer.jsx` | `/api/v1/reports/generate` | `POST` |

---

### 🎯 Optimizer Page (Recommendations)

| Frontend Action | Page | API Call | Method |
|---|---|---|---|
| **Optimizer खोलो** | `Optimizer.jsx` | `/api/v1/optimizations` | `GET` |
| **"Implement" क्लिक करो** | `Optimizer.jsx` | `/api/v1/optimizations/{id}/execute` | `POST` |

---

### 📋 Alerts Page

| Frontend Action | Page | API Call | Method |
|---|---|---|---|
| **Alerts खोलो** | `Anomalies.jsx` | `/api/v1/alerts` | `GET` |
| **Alert acknowledge करो** | `Anomalies.jsx` | `/api/v1/alerts/{id}/acknowledge` | `PUT` |

---

### 👥 Teams Page

| Frontend Action | Page | API Call | Method |
|---|---|---|---|
| **Teams खोलो** | `Teams.jsx` | `/api/v1/teams` | `GET` |
| **नया team बनाओ** | `Teams.jsx` | `/api/v1/teams` | `POST` |
| **Member invite करो** | `Teams.jsx` | `/api/v1/teams/{id}/invite` | `POST` |

---

### ⚙️ Settings Page

| Frontend Action | Page | API Call | Method |
|---|---|---|---|
| **Settings खोलो** | `Settings.jsx` | `/api/v1/settings` | `GET` |
| **Budget set करो** | `Settings.jsx` | `/api/v1/settings/budget` | `PUT` |
| **Slack integrate करो** | `Settings.jsx` | `/api/v1/settings/integration` | `POST` |

---

### 📊 Reports Page

| Frontend Action | Page | API Call | Method |
|---|---|---|---|
| **Reports खोलो** | `Reports.jsx` | `/api/v1/reports` | `GET` |
| **नई report बनाओ** | `Reports.jsx` | `/api/v1/reports/generate` | `POST` |

---

### 🔐 Accounts Page

| Frontend Action | Page | API Call | Method |
|---|---|---|---|
| **Accounts खोलो** | `Accounts.jsx` | `/api/v1/cloud/accounts` | `GET` |
| **नया account add करो** | `Accounts.jsx` | `/api/v1/cloud/connect` | `POST` |
| **Account delete करो** | `Accounts.jsx` | `/api/v1/cloud/{id}` | `DELETE` |

---

## Real Cloud Data Integration

### Overview

The backend currently has **mock data** for development. To get **real data** from cloud providers, follow these steps:

---

### 1️⃣ AWS Integration (START HERE)

#### Step 1: Create AWS Access Key

```
AWS Console → IAM → Users
  1. Click "Create user"
  2. Username: cloudspire-service
  3. Select "Access key - Programmatic access"
  4. Attach policies: PowerUserAccess (or create custom read-only policy)
     - Minimum permissions needed:
       ✓ ce:GetCostAndUsage (Cost Explorer)
       ✓ ec2:Describe* (EC2 instances)
       ✓ ce:GetReservationPurchaseRecommendation
  5. Copy: Access Key ID and Secret Access Key
```

#### Step 2: Add to Backend `.env`

```bash
# c:\Users\RAHUL\Desktop\cloudSpire\backend\.env

AWS_ACCESS_KEY_ID=AKIA...your-key...
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

#### Step 3: Test Connection

```bash
# In terminal
cd c:\Users\RAHUL\Desktop\cloudSpire\backend
npm run dev

# In another terminal
curl http://localhost:4000/api/v1/cloud/aws \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "awsAccounts": [...],
    "awsServiceBreakdown": [...],
    "awsEC2Instances": [...]
  }
}
```

#### Step 4: Frontend - Connect via Onboarding

1. Navigate to `http://localhost:5173/onboarding`
2. Fill in workspace details
3. Select AWS
4. Enter:
   - Access Key ID
   - Secret Access Key
   - Account name (optional)
5. Click "Test Connection"
6. If successful, credentials saved to MongoDB (encrypted)

---

### 2️⃣ GCP Integration

#### Step 1: Create Service Account

```
GCP Console → APIs & Services → Credentials
  1. Click "Create Credentials" → "Service Account"
  2. Service account name: cloudspire-service
  3. Grant roles:
     ✓ BigQuery Admin
     ✓ Billing Account User
     ✓ Cloud Resource Manager Viewer
  4. Create JSON key file
  5. Download JSON (keep secure)
```

#### Step 2: Create GCP Service (`backend/src/services/gcpService.js`)

```javascript
import { BigQuery } from "@google-cloud/bigquery";
import * as fs from "fs";

export const fetchGcpCostAndUsage = async (credentials, startDate, endDate) => {
  try {
    const bigquery = new BigQuery({
      projectId: credentials.project_id,
      credentials: JSON.parse(credentials.serviceAccountJson)
    });

    const query = `
      SELECT
        service.description as service,
        SUM(CAST(cost AS FLOAT64)) as total_cost,
        usage_start_time as date
      FROM \`bigquery-public-data.gcp_billing_export_v1.gcp_billing_export_v1_...\`
      WHERE DATE(usage_start_time) >= @startDate
        AND DATE(usage_start_time) <= @endDate
      GROUP BY service, date
      ORDER BY date DESC
    `;

    const options = {
      query: query,
      params: {
        startDate: startDate,
        endDate: endDate
      },
      location: "US"
    };

    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    console.error("GCP Cost Query Error:", error);
    throw new Error("Failed to fetch GCP costs");
  }
};

export const fetchGcpInstances = async (credentials) => {
  try {
    const compute = google.compute("v1");
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(credentials.serviceAccountJson)
    });

    const instances = await compute.instances.list({
      project: credentials.project_id,
      zone: "-",
      auth: auth
    });

    return instances.data.items || [];
  } catch (error) {
    console.error("GCP Instance Query Error:", error);
    throw new Error("Failed to fetch GCP instances");
  }
};
```

#### Step 3: Add to Backend

```bash
npm install @google-cloud/bigquery @google-cloud/compute
```

#### Step 4: Update Controller (`backend/src/controllers/cloud.js`)

```javascript
import { fetchGcpCostAndUsage, fetchGcpInstances } from '../services/gcpService.js';

export const getGcp = catchAsync(async (req, res, next) => {
  const teamId = req.user.teamId;
  const accounts = await CloudAccount.find({ teamId, provider: 'gcp' });

  if (accounts && accounts.length > 0 && accounts[0].credentials?.serviceAccountJson) {
    try {
      const start = new Date(new Date().setDate(1)).toISOString().split('T')[0];
      const end = new Date().toISOString().split('T')[0];

      const liveCostData = await fetchGcpCostAndUsage(accounts[0].credentials, start, end);
      const liveInstances = await fetchGcpInstances(accounts[0].credentials);

      return res.status(200).json({
        success: true,
        data: {
          gcpProjects: accounts,
          gcpServiceBreakdown: liveCostData,
          gcpInstances: liveInstances
        }
      });
    } catch (error) {
      logger.warn({ err: error, teamId }, 'Failed real GCP sync, falling back to mock data');
    }
  }

  // Fallback to mock data
  res.status(200).json({ gcpProjects: [], gcpServiceBreakdown: [], gcpInstances: [] });
});
```

---

### 3️⃣ Azure Integration

#### Step 1: Create App Registration

```
Azure Portal → App registrations
  1. Click "New registration"
  2. Name: CloudSpire Service
  3. Supported account types: Accounts in this organizational directory
  4. Go to "Certificates & secrets"
     - Click "New client secret"
     - Description: CloudSpire Credentials
     - Expiry: 24 months
     - Copy Value (this is your secret)
  5. Go to "Overview"
     - Copy: Application (client) ID
     - Copy: Directory (tenant) ID
  6. Assign roles:
     - Go to Subscriptions
     - Select subscription → Access Control (IAM)
     - Add "Cost Management Reader" role for your service account
```

#### Step 2: Create Azure Service (`backend/src/services/azureService.js`)

```javascript
import axios from "axios";

const getAccessToken = async (tenantId, clientId, clientSecret) => {
  try {
    const response = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://management.azure.com/.default"
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("Azure Auth Error:", error);
    throw new Error("Failed to authenticate with Azure");
  }
};

export const fetchAzureCostAndUsage = async (credentials, startDate, endDate) => {
  try {
    const token = await getAccessToken(
      credentials.tenantId,
      credentials.clientId,
      credentials.clientSecret
    );

    const response = await axios.post(
      `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.CostManagement/query?api-version=2021-10-01`,
      {
        type: "Usage",
        timeframe: "Custom",
        timePeriod: {
          from: `${startDate}T00:00:00Z`,
          to: `${endDate}T23:59:59Z`
        },
        dataset: {
          granularity: "Daily",
          aggregation: {
            totalCost: {
              name: "PreTaxCost",
              function: "Sum"
            }
          },
          grouping: [
            {
              type: "Dimension",
              name: "ServiceName"
            }
          ]
        }
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return response.data.properties.rows;
  } catch (error) {
    console.error("Azure Cost Query Error:", error);
    throw new Error("Failed to fetch Azure costs");
  }
};

export const fetchAzureVMs = async (credentials) => {
  try {
    const token = await getAccessToken(
      credentials.tenantId,
      credentials.clientId,
      credentials.clientSecret
    );

    const response = await axios.get(
      `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.Compute/virtualMachines?api-version=2021-03-01`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return response.data.value;
  } catch (error) {
    console.error("Azure VM Query Error:", error);
    throw new Error("Failed to fetch Azure VMs");
  }
};
```

#### Step 3: Add Dependencies

```bash
npm install axios
```

#### Step 4: Update Controller

```javascript
import { fetchAzureCostAndUsage, fetchAzureVMs } from '../services/azureService.js';

export const getAzure = catchAsync(async (req, res, next) => {
  const teamId = req.user.teamId;
  const accounts = await CloudAccount.find({ teamId, provider: 'azure' });

  if (accounts && accounts.length > 0 && accounts[0].credentials?.tenantId) {
    try {
      const start = new Date(new Date().setDate(1)).toISOString().split('T')[0];
      const end = new Date().toISOString().split('T')[0];

      const liveCostData = await fetchAzureCostAndUsage(accounts[0].credentials, start, end);
      const liveVMs = await fetchAzureVMs(accounts[0].credentials);

      return res.status(200).json({
        success: true,
        data: {
          azureSubscriptions: accounts,
          azureServiceBreakdown: liveCostData,
          azureVMs: liveVMs
        }
      });
    } catch (error) {
      logger.warn({ err: error, teamId }, 'Failed real Azure sync, falling back to mock data');
    }
  }

  // Fallback to mock data
  res.status(200).json({ azureSubscriptions: [], azureServiceBreakdown: [], azureVMs: [] });
});
```

---

## Next Priority Steps

### Phase 1: Get Real AWS Data Working (1 Day)

**Goal:** Dashboard shows real AWS costs instead of mock data

1. Create AWS IAM user with read-only permissions
2. Add credentials to `.env`
3. Test `/api/v1/cloud/aws` endpoint
4. Frontend → Onboarding → Connect AWS account
5. Dashboard should now show real data

**Verification:**
```bash
# Check AWS credentials work
curl http://localhost:4000/api/v1/cloud/aws \
  -H "Authorization: Bearer <TOKEN>"
```

---

### Phase 2: Socket.IO Real-Time Updates (1 Day)

**Goal:** Dashboard updates every 3-5 seconds without page refresh

1. Install Socket.IO: `npm install socket.io`
2. Create `/backend/src/services/realtimeService.js`
3. Emit cost updates every 3 seconds
4. Frontend connects and updates charts in real-time

**Files to Create/Update:**
- `backend/src/app.js` - Add Socket.IO middleware
- `backend/src/services/realtimeService.js` - Emit logic
- `Frontend/src/hooks/useRealtime.js` - Subscribe to updates

---

### Phase 3: AI Spike Detection (1 Day)

**Goal:** When costs spike, AI explains why in plain English

1. Install: `npm install @google/generative-ai`
2. Add Gemini API key to `.env`: `GEMINI_API_KEY=xxx`
3. Create `/backend/src/services/aiService.js`
4. On anomaly detection, call Gemini for explanation
5. Frontend displays AI explanation in alerts

**Sample Implementation:**
```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const explainSpike = async (costData) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Cloud cost spike detected:
    - Previous day: $${costData.previousDay}
    - Today: $${costData.today}
    - Increase: ${((costData.today / costData.previousDay - 1) * 100).toFixed(1)}%
    - Top services: ${costData.topServices.join(", ")}

    Explain in 2-3 sentences why this spike might have occurred and what to check.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
};
```

---

### Phase 4: Database Persistence (1 Day)

**Goal:** Historical data saved so we can track trends

1. Create cost history model in MongoDB
2. On every metric update, save to DB
3. Dashboard queries last 90 days of history
4. Charts show trends over time

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   USER BROWSER                          │
│  (React Dashboard with Real-Time Chart Updates)         │
└────────────────┬────────────────────────────────────────┘
                 │ Socket.IO (Real-time updates)
                 │ REST API (Initial load + actions)
                 │
┌────────────────▼────────────────────────────────────────┐
│            BACKEND (Node.js + Express)                  │
│  ┌──────────────┬──────────────┬──────────────┐         │
│  │   AWS API    │   GCP API    │ Azure API    │         │
│  │  Connector   │  Connector   │  Connector   │         │
│  └──────────────┴──────────────┴──────────────┘         │
│                     │                                    │
│  ┌──────────────────▼────────────────────┐              │
│  │     Cost Calculation Engine           │              │
│  │  (Aggregates costs from all clouds)   │              │
│  └──────────────────┬────────────────────┘              │
│                     │                                    │
│  ┌──────────────────▼────────────────────┐              │
│  │   Anomaly Detection + AI Analysis     │              │
│  │  (Z-score detection + Gemini API)     │              │
│  └──────────────────┬────────────────────┘              │
│                     │                                    │
│  ┌──────────────────▼────────────────────┐              │
│  │   Alert Dispatch                      │              │
│  │  (Slack, Telegram, Email)             │              │
│  └─────────────────────────────────────┘               │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│            MONGODB (Data Layer)                         │
│  ├─ Cost Records (30 days rolling)                      │
│  ├─ Alerts (90 days)                                    │
│  ├─ Recommendations (active)                            │
│  ├─ Cloud Credentials (encrypted)                       │
│  └─ Users & Teams (RBAC)                                │
└─────────────────────────────────────────────────────────┘
```

---

### Data Flow Example: Cost Spike Detection

```
1. Backend polls AWS Cost Explorer API (every 5 minutes)
   └─ Gets: Today's spend vs Yesterday's spend

2. Calculate Z-score
   └─ today_cost = $850
   └─ 7_day_avg = $600
   └─ std_dev = $50
   └─ z_score = (850 - 600) / 50 = 5.0
   └─ Alert Threshold = 2.5
   └─ ✅ SPIKE DETECTED!

3. Call Gemini API with spike context
   └─ "Today: $850 vs avg $600. Top spike in EC2 (50%), S3 (30%). Why?"
   └─ Gemini response: "Large data transfer or instance launch detected..."

4. Emit Socket.IO event to frontend
   └─ { alert: "critical", message: "...", explanation: "..." }

5. Frontend receives update
   └─ Show red banner with explanation
   └─ Send Slack notification to #alerts channel

6. User opens Recommendations tab
   └─ See: "Shut down non-prod instances saving $2,000/month"
   └─ Click "Implement" → execute action → costs reduce
```

---

## Quick Reference: API Endpoints

### Cloud Providers
```bash
GET  /api/v1/cloud/aws      # Get AWS costs + instances
GET  /api/v1/cloud/gcp      # Get GCP costs + instances
GET  /api/v1/cloud/azure    # Get Azure costs + VMs
POST /api/v1/cloud/connect  # Connect new cloud account
```

### Alerts & Anomalies
```bash
GET  /api/v1/alerts         # List alerts
POST /api/v1/alerts/acknowledge  # Mark alert as read
GET  /api/v1/anomalies      # List cost anomalies
```

### Reports & Recommendations
```bash
GET  /api/v1/reports        # List generated reports
POST /api/v1/reports/generate    # Create new report
GET  /api/v1/optimizations  # List recommendations
POST /api/v1/optimizations/{id}/execute  # Execute recommendation
```

---

## Environment Variables Template

Create or update `.env` in backend root:

```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/cloudspire?retryWrites=true

# AWS
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1

# GCP
GCP_PROJECT_ID=your-project-id
GCP_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Azure
AZURE_TENANT_ID=xxxx-xxxx-xxxx
AZURE_CLIENT_ID=yyyy-yyyy-yyyy
AZURE_CLIENT_SECRET=your-secret
AZURE_SUBSCRIPTION_ID=zzzz-zzzz-zzzz

# AI
GEMINI_API_KEY=your-api-key

# Integrations
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_CHAT_ID=yyy

# App
NODE_ENV=development
PORT=4000
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:5173
```

---

## Testing Checklist

- [ ] AWS credentials work and return real data
- [ ] Dashboard displays real AWS costs
- [ ] Socket.IO connects and receives updates
- [ ] Cost spike detected and alert shown
- [ ] Gemini API explains spike in plain English
- [ ] Slack notification sent for critical alerts
- [ ] Historical data saved to MongoDB
- [ ] Team attribution working correctly
- [ ] Budget thresholds trigger alerts at 80%, 100%, 120%
- [ ] Recommendations engine suggests valid optimizations

---

## Support & Troubleshooting

### Dashboard shows "No data"
- ✅ Check AWS credentials in `.env`
- ✅ Verify IAM user has permissions
- ✅ Check backend logs for API errors

### Socket.IO not connecting
- ✅ Backend listening on correct port (4000)
- ✅ Frontend trying correct backend URL
- ✅ Check firewall/proxy not blocking

### Gemini API errors
- ✅ Verify `GEMINI_API_KEY` is valid
- ✅ Check API quotas in GCP Console
- ✅ Verify API is enabled in GCP project

---

**Created:** May 2, 2026  
**Version:** 1.0  
**Status:** In Development
