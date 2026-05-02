// Azure Cost Management API — UsageDetail, BillingAccount, Subscription schemas

export const azureSubscriptions = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", name: "Production Workloads", tenantId: "tenant-001", spend: 27900, env: "production", resources: 84, lastSync: "2025-04-28T10:14:00Z", status: "connected", region: "eastus",
    trendData: Array.from({ length: 90 }, (_, i) => ({ date: new Date(Date.now() - (89 - i) * 86400000).toISOString().split('T')[0], spend: 600 + Math.random() * 100 })),
    resourceList: [
      { type: 'VM', name: 'vm-prod-web-001', status: 'Running', monthlyCost: 250, region: 'eastus' },
      { type: 'SQL Database', name: 'prod-sql-eastus', status: 'Online', monthlyCost: 400, region: 'eastus' },
      { type: 'AKS', name: 'aks-prod-eastus', status: 'Healthy', monthlyCost: 550, region: 'eastus' },
      { type: 'Blob Storage', name: 'prodblobarchive01', status: 'Available', monthlyCost: 150, region: 'eastus' },
    ]
  },
  {
    id: "b2c3d4e5-f6a7-8901-bcde-f12345678901", name: "Development & Testing", tenantId: "tenant-001", spend: 6800, env: "development", resources: 22, lastSync: "2025-04-28T09:45:00Z", status: "connected", region: "westus",
    trendData: Array.from({ length: 90 }, (_, i) => ({ date: new Date(Date.now() - (89 - i) * 86400000).toISOString().split('T')[0], spend: 100 + Math.random() * 50 })),
    resourceList: [
      { type: 'VM', name: 'vm-dev-desktop-01', status: 'Stopped', monthlyCost: 80, region: 'westus' },
    ]
  },
  {
    id: "c3d4e5f6-a7b8-9012-cdef-123456789012", name: "Disaster Recovery", tenantId: "tenant-001", spend: 3200, env: "production", resources: 11, lastSync: "2025-04-27T10:00:00Z", status: "warning", region: "centralus",
    trendData: Array.from({ length: 90 }, (_, i) => ({ date: new Date(Date.now() - (89 - i) * 86400000).toISOString().split('T')[0], spend: 50 + Math.random() * 20 })),
    resourceList: [
      { type: 'Blob Storage', name: 'drblobarchive01', status: 'Available', monthlyCost: 200, region: 'centralus' },
    ]
  },
];

export const azureServiceBreakdown = [
  { service: "Virtual Machines", meterCategory: "Virtual Machines", serviceFamily: "Compute", cost: 12400, percent: 44.4, change: +6.8, resourceGroup: "rg-prod-compute" },
  { service: "Azure SQL Database", meterCategory: "SQL Database", serviceFamily: "Databases", cost: 5200, percent: 18.6, change: +3.2, resourceGroup: "rg-prod-data" },
  { service: "Azure Blob Storage", meterCategory: "Storage", serviceFamily: "Storage", cost: 3100, percent: 11.1, change: +1.8, resourceGroup: "rg-prod-storage" },
  { service: "Azure Kubernetes Service", meterCategory: "Azure Kubernetes Service", serviceFamily: "Compute", cost: 2800, percent: 10.0, change: +19.4, resourceGroup: "rg-prod-aks" },
  { service: "Azure Cognitive Services", meterCategory: "Cognitive Services", serviceFamily: "AI + Machine Learning", cost: 1800, percent: 6.5, change: +54.2, resourceGroup: "rg-prod-ai" },
  { service: "Azure CDN", meterCategory: "Content Delivery Network", serviceFamily: "Networking", cost: 1400, percent: 5.0, change: -2.1, resourceGroup: "rg-prod-network" },
  { service: "Others", meterCategory: "various", serviceFamily: "various", cost: 1200, percent: 4.4, change: +2.3, resourceGroup: "various" },
];

export const azureVMs = [
  {
    resourceId: "/subscriptions/a1b2c3/resourceGroups/rg-prod/providers/Microsoft.Compute/virtualMachines/vm-prod-web-001",
    name: "vm-prod-web-001", size: "Standard_D2s_v5", location: "eastus",
    powerState: "running", osType: "Linux",
    cpu7dayAvg: 2.8, cpu30dayAvg: 3.4, ramGB: 8, vCPUs: 2,
    monthlyCost: 71.42, resourceGroup: "rg-prod-compute",
    tags: { environment: "production", team: "frontend" },
    isIdle: true, recommendation: "downsize_to_B2s",
  },
  {
    resourceId: "/subscriptions/a1b2c3/resourceGroups/rg-prod-data/providers/Microsoft.Compute/virtualMachines/vm-prod-sql-001",
    name: "vm-prod-sql-001", size: "Standard_E8s_v4", location: "eastus",
    powerState: "running", osType: "Windows",
    cpu7dayAvg: 24.6, cpu30dayAvg: 28.1, ramGB: 64, vCPUs: 8,
    monthlyCost: 562.18, resourceGroup: "rg-prod-data",
    tags: { environment: "production", team: "data" },
    isIdle: false, recommendation: null,
  },
];

export const azureRegionBreakdown = [
  { region: "eastus", label: "East US (Virginia)", cost: 16800, percent: 60.2 },
  { region: "westeurope", label: "West Europe (Netherlands)", cost: 6400, percent: 22.9 },
  { region: "southeastasia", label: "Southeast Asia (Singapore)", cost: 3100, percent: 11.1 },
  { region: "australiaeast", label: "Australia East (Sydney)", cost: 1600, percent: 5.8 },
];
export const azureOrphanedResources = [ { resourceId: 'azure-ip-unused-001', type: 'Public IP', name: 'orphaned-pip-eastus', region: 'eastus', monthlyCost: 8.2, createdAt: '2024-11-08', lastAttached: '2024-12-01', savingsIfDeleted: 8.2, daysSinceLastUsed: 149 } ];
