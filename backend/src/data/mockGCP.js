// GCP Cloud Billing Export Schema — gcp_billing_export_v1

export const gcpProjects = [
  {
    id: "my-prod-project-001", name: "Production Platform", billingAccountId: "01A2B3-C4D5E6-F7G8H9", spend: 39100, env: "production", resources: 112, lastSync: "2025-04-28T10:14:00Z", status: "connected", region: "us-central1",
    trendData: Array.from({ length: 90 }, (_, i) => ({ date: new Date(Date.now() - (89 - i) * 86400000).toISOString().split('T')[0], spend: 900 + Math.random() * 200 })),
    resourceList: [
      { type: 'Compute Engine', name: 'prod-api-node-01', status: 'Running', monthlyCost: 350, region: 'us-central1' },
      { type: 'BigQuery', name: 'finops_reporting', status: 'Healthy', monthlyCost: 400, region: 'us-central1' },
      { type: 'Cloud SQL', name: 'platform-postgres', status: 'Available', monthlyCost: 800, region: 'us-central1' },
      { type: 'GKE', name: 'prod-gke-cluster', status: 'Active', monthlyCost: 950, region: 'us-central1' },
    ]
  },
  {
    id: "data-analytics-prod-002", name: "Data Analytics", billingAccountId: "01A2B3-C4D5E6-F7G8H9", spend: 12400, env: "production", resources: 28, lastSync: "2025-04-28T10:10:00Z", status: "connected", region: "us-central1",
    trendData: Array.from({ length: 90 }, (_, i) => ({ date: new Date(Date.now() - (89 - i) * 86400000).toISOString().split('T')[0], spend: 300 + Math.random() * 50 })),
    resourceList: [
      { type: 'BigQuery', name: 'core_data_lake', status: 'Healthy', monthlyCost: 2000, region: 'us-central1' },
    ]
  },
  {
    id: "ml-research-003", name: "ML Research", billingAccountId: "01A2B3-C4D5E6-F7G8H9", spend: 8700, env: "staging", resources: 19, lastSync: "2025-04-28T09:45:00Z", status: "connected", region: "us-west1",
    trendData: Array.from({ length: 90 }, (_, i) => ({ date: new Date(Date.now() - (89 - i) * 86400000).toISOString().split('T')[0], spend: 200 + Math.random() * 100 })),
    resourceList: [
      { type: 'Vertex AI', name: 'recommendation-training', status: 'Running', monthlyCost: 1500, region: 'us-west1' },
    ]
  },
  {
    id: "dev-sandbox-004", name: "Dev Sandbox", billingAccountId: "01A2B3-C4D5E6-F7G8H9", spend: 3200, env: "development", resources: 8, lastSync: "2025-04-27T10:00:00Z", status: "warning", region: "us-east1",
    trendData: Array.from({ length: 90 }, (_, i) => ({ date: new Date(Date.now() - (89 - i) * 86400000).toISOString().split('T')[0], spend: 50 + Math.random() * 20 })),
    resourceList: [
      { type: 'Compute Engine', name: 'dev-desktop-01', status: 'Stopped', monthlyCost: 40, region: 'us-east1' },
    ]
  },
];

export const gcpServiceBreakdown = [
  { service: "Compute Engine", serviceId: "6F81-5844-456A", skuDescription: "N2 instance core running", cost: 18400, percent: 47.1, change: +12.3, region: "us-central1" },
  { service: "BigQuery", serviceId: "95FF-2EF5-5EA1", skuDescription: "Analysis", cost: 7200, percent: 18.4, change: +28.4, region: "us" },
  { service: "Cloud Storage", serviceId: "95FF-2EF5-5EA2", skuDescription: "Regional Storage", cost: 4100, percent: 10.5, change: +3.2, region: "us-central1" },
  { service: "Google Kubernetes Engine", serviceId: "CCD8-9D84-B45F", skuDescription: "GKE Cluster Management fee", cost: 3800, percent: 9.7, change: +5.6, region: "us-central1" },
  { service: "Cloud SQL", serviceId: "9662-B51E-5089", skuDescription: "Cloud SQL for PostgreSQL, db-n1-standard-4", cost: 2900, percent: 7.4, change: -2.1, region: "us-east1" },
  { service: "Cloud Run", serviceId: "152E-C115-5142", skuDescription: "CPU Allocation Time", cost: 1400, percent: 3.6, change: +41.2, region: "us-central1" },
  { service: "Vertex AI", serviceId: "VTXAI-001", skuDescription: "Prediction Online Node Hour", cost: 1300, percent: 3.3, change: +87.4, region: "us-central1" },
];

export const gcpRegionBreakdown = [
  { region: "us-central1", label: "Iowa, USA", cost: 22800, percent: 58.3 },
  { region: "us-east1", label: "South Carolina, USA", cost: 8200, percent: 21.0 },
  { region: "europe-west1", label: "Belgium", cost: 4600, percent: 11.8 },
  { region: "asia-east1", label: "Taiwan", cost: 3500, percent: 8.9 },
];

export const gcpCommittedUseDiscounts = [
  { resource: "N2 CPU — us-central1", commitment: "1 year", monthlyCommitment: 2000, monthlySavings: 620, utilizationPercent: 94, expiresAt: "2025-12-31" },
  { resource: "Memory Optimized — us-east1", commitment: "3 years", monthlyCommitment: 800, monthlySavings: 340, utilizationPercent: 88, expiresAt: "2026-09-30" },
];
export const gcpOrphanedResources = [ { resourceId: 'disk-gcp-unused-001', type: 'Persistent Disk', name: 'stale-analytics-disk', region: 'us-central1', monthlyCost: 22.8, createdAt: '2024-09-14', lastAttached: '2024-10-28', savingsIfDeleted: 22.8, daysSinceLastUsed: 180 } ];
