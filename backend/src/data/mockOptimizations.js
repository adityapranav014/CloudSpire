// Cost optimization recommendations

export const optimizationSummary = {
  totalPotentialSavings: 18400,
  savingsBreakdown: {
    idleInstances: 8200,
    orphanedStorage: 4800,
    rightSizing: 3200,
    reservedInstances: 1600,
    scheduledShutdowns: 600,
  },
  implementedThisMonth: 4200,
  savingsImplementedPercent: 22.8,
};

export const rightsizingRecommendations = [
  {
    id: "rs-001", provider: "aws", resourceType: "EC2 Instance",
    resourceId: "i-0abc123def456789a", resourceName: "prod-web-server-01",
    currentType: "m5.xlarge", recommendedType: "t3.medium",
    currentMonthlyCost: 142.80, projectedMonthlyCost: 33.58,
    monthlySavings: 109.22, annualSavings: 1310.64,
    confidence: "high", cpuUtilization: 3.2, memoryUtilization: 12.4,
    region: "us-east-1", account: "Production - Main",
    status: "pending",
  },
  {
    id: "rs-002", provider: "aws", resourceType: "RDS Instance",
    resourceId: "db-prod-mysql-02", resourceName: "prod-mysql-reporting",
    currentType: "db.r5.2xlarge", recommendedType: "db.r5.large",
    currentMonthlyCost: 748.80, projectedMonthlyCost: 187.20,
    monthlySavings: 561.60, annualSavings: 6739.20,
    confidence: "high", cpuUtilization: 1.8, memoryUtilization: 4.1,
    region: "us-west-2", account: "Data Team",
    status: "pending",
  },
  {
    id: "rs-gcp-001", provider: "gcp", resourceType: "Compute Engine",
    resourceId: "instance-001928", resourceName: "idle-data-worker-vm",
    currentType: "e2-standard-4", recommendedType: "Delete (Idle)",
    currentMonthlyCost: 98.55, projectedMonthlyCost: 0,
    monthlySavings: 98.55, annualSavings: 1182.60,
    confidence: "high", cpuUtilization: 0.1, memoryUtilization: 0.5,
    region: "us-central1", account: "GCP - BigData",
    status: "pending",
  },
  {
    id: "rs-003", provider: "azure", resourceType: "Virtual Machine",
    resourceId: "/subscriptions/a1b2c3/rg/vm-prod-web-001", resourceName: "vm-prod-web-001",
    currentType: "Standard_D2s_v5", recommendedType: "Standard_B2s",
    currentMonthlyCost: 71.42, projectedMonthlyCost: 38.32,
    monthlySavings: 33.10, annualSavings: 397.20,
    confidence: "high", cpuUtilization: 2.8, memoryUtilization: 18.2,
    region: "eastus", account: "Production Workloads",
    status: "implementing",
  },
  {
    id: "rs-004", provider: "gcp", resourceType: "Compute Engine VM",
    resourceId: "projects/prod-001/zones/us-central1-a/instances/api-server-07", resourceName: "api-server-07",
    currentType: "n2-standard-8", recommendedType: "n2-standard-4",
    currentMonthlyCost: 312.40, projectedMonthlyCost: 156.20,
    monthlySavings: 156.20, annualSavings: 1874.40,
    confidence: "high", cpuUtilization: 11.4, memoryUtilization: 28.3,
    region: "us-central1", account: "Production Platform",
    status: "pending",
  },
];

export const reservedInstanceOpportunities = [
  {
    id: "ri-001", provider: "aws", service: "EC2",
    instanceType: "m5.xlarge", region: "us-east-1",
    onDemandMonthlyCost: 142.80, reservedMonthlyCost: 85.68,
    monthlySavings: 57.12, term: "1 year", upfrontCost: 0,
    paymentOption: "No Upfront", utilizationEstimate: 94,
    breakEvenMonths: 0, normalizedUsageHours: 720,
  },
  {
    id: "ri-002", provider: "aws", service: "RDS",
    instanceType: "db.r5.large", region: "us-east-1",
    onDemandMonthlyCost: 187.20, reservedMonthlyCost: 112.32,
    monthlySavings: 74.88, term: "1 year", upfrontCost: 0,
    paymentOption: "No Upfront", utilizationEstimate: 100,
    breakEvenMonths: 0, normalizedUsageHours: 744,
  },
  {
    id: "ri-003", provider: "gcp", service: "Compute Engine",
    instanceType: "n2-standard-4", region: "us-central1",
    onDemandMonthlyCost: 156.20, reservedMonthlyCost: 109.34,
    monthlySavings: 46.86, term: "1 year", upfrontCost: 0,
    paymentOption: "CUD — No Upfront", utilizationEstimate: 96,
    breakEvenMonths: 0, normalizedUsageHours: 730,
  },
];

export const scheduledShutdowns = [
  { id: "ss-001", name: "Staging Auto-Shutdown", description: "Auto-shutdown all staging environments at 8pm UTC on weekdays", enabled: true, schedule: "Weekdays 20:00 UTC", nextRun: "2025-04-28T20:00:00Z", estimatedSavings: 380 },
  { id: "ss-002", name: "Dev Sandbox Weekend Off", description: "Shutdown developer sandbox accounts on weekends", enabled: true, schedule: "Fri 22:00 – Mon 06:00 UTC", nextRun: "2025-05-02T22:00:00Z", estimatedSavings: 220 },
  { id: "ss-003", name: "QA Env Nightly", description: "Stop QA test servers nightly from 11pm to 6am UTC", enabled: false, schedule: "Daily 23:00 – 06:00 UTC", nextRun: null, estimatedSavings: 0 },
];
