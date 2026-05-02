// AWS Cost Explorer API shape — GetCostAndUsage

export const awsAccounts = [
  {
    id: "123456789012", name: "Production - Main", env: "production", spend: 82400, resources: 248, lastSync: "2025-04-28T10:15:00Z", status: "connected", region: "us-east-1",
    trendData: Array.from({ length: 90 }, (_, i) => ({ date: new Date(Date.now() - (89 - i) * 86400000).toISOString().split('T')[0], spend: 2000 + Math.random() * 500 })),
    resourceList: [
      { type: 'EC2', name: 'prod-web-server-01', status: 'Running', monthlyCost: 450, region: 'us-east-1' },
      { type: 'RDS', name: 'prod-db-cluster', status: 'Available', monthlyCost: 850, region: 'us-east-1' },
      { type: 'S3', name: 'analytics-archive-bucket', status: 'Healthy', monthlyCost: 120, region: 'us-east-1' },
      { type: 'Lambda', name: 'prod-data-processor', status: 'Active', monthlyCost: 65, region: 'us-east-1' },
    ]
  },
  {
    id: "234567890123", name: "Staging Environment", env: "staging", spend: 14200, resources: 67, lastSync: "2025-04-28T10:14:00Z", status: "connected", region: "us-east-1",
    trendData: Array.from({ length: 90 }, (_, i) => ({ date: new Date(Date.now() - (89 - i) * 86400000).toISOString().split('T')[0], spend: 400 + Math.random() * 100 })),
    resourceList: [
      { type: 'EC2', name: 'staging-web-01', status: 'Running', monthlyCost: 150, region: 'us-east-1' },
    ]
  },
  {
    id: "345678901234", name: "Data & Analytics", env: "production", spend: 21800, resources: 34, lastSync: "2025-04-28T10:10:00Z", status: "connected", region: "us-west-2",
    trendData: Array.from({ length: 90 }, (_, i) => ({ date: new Date(Date.now() - (89 - i) * 86400000).toISOString().split('T')[0], spend: 600 + Math.random() * 200 })),
    resourceList: [
      { type: 'EMR', name: 'analytics-cluster', status: 'Running', monthlyCost: 1200, region: 'us-west-2' },
    ]
  },
  {
    id: "456789012345", name: "Security & Audit", env: "production", spend: 4100, resources: 12, lastSync: "2025-04-28T10:05:00Z", status: "warning", region: "us-east-1",
    trendData: Array.from({ length: 90 }, (_, i) => ({ date: new Date(Date.now() - (89 - i) * 86400000).toISOString().split('T')[0], spend: 100 + Math.random() * 50 })),
    resourceList: [
      { type: 'GuardDuty', name: 'prod-guardduty', status: 'Active', monthlyCost: 80, region: 'us-east-1' },
    ]
  },
];

export const awsServiceBreakdown = [
  { service: "Amazon EC2", serviceCode: "AmazonEC2", cost: 31200, percent: 37.9, change: +8.2, region: "us-east-1", usageType: "BoxUsage:m5.xlarge" },
  { service: "Amazon S3", serviceCode: "AmazonS3", cost: 12800, percent: 15.5, change: +2.1, region: "us-east-1", usageType: "TimedStorage-ByteHrs" },
  { service: "Amazon RDS", serviceCode: "AmazonRDS", cost: 11400, percent: 13.8, change: -3.4, region: "us-west-2", usageType: "InstanceUsage:db.r5.large" },
  { service: "AWS Lambda", serviceCode: "AWSLambda", cost: 8200, percent: 9.9, change: +18.7, region: "us-east-1", usageType: "Lambda-GB-Second" },
  { service: "Amazon CloudFront", serviceCode: "AmazonCloudFront", cost: 5100, percent: 6.2, change: +4.3, region: "global", usageType: "DataTransfer-Out-Bytes" },
  { service: "Amazon EKS", serviceCode: "AmazonEKS", cost: 4800, percent: 5.8, change: +22.1, region: "us-east-1", usageType: "EKS-Hours:Linux/UNIX" },
  { service: "Amazon ElastiCache", serviceCode: "AmazonElastiCache", cost: 3200, percent: 3.9, change: -1.2, region: "us-east-1", usageType: "NodeUsage:cache.r6g.large" },
  { service: "AWS Data Transfer", serviceCode: "AWSDataTransfer", cost: 2800, percent: 3.4, change: +9.8, region: "global", usageType: "DataTransfer-Regional-Bytes" },
  { service: "Amazon Route 53", serviceCode: "AmazonRoute53", cost: 1600, percent: 1.9, change: 0, region: "global", usageType: "DNS-Queries" },
  { service: "Others", serviceCode: "others", cost: 1300, percent: 1.7, change: +3.1, region: "various", usageType: "various" },
];

export const awsEC2Instances = [
  {
    instanceId: "i-0abc123def456789a", instanceType: "m5.xlarge", state: "running",
    name: "prod-web-server-01", region: "us-east-1", az: "us-east-1a",
    cpu7dayAvg: 3.2, cpu30dayAvg: 4.1, memorySizeGB: 16, vcpus: 4,
    monthlyCost: 142.80, hourlyRate: 0.192, launchTime: "2024-09-15",
    tags: { Environment: "production", Team: "frontend", Project: "web-platform" },
    isIdle: true, idleReason: "CPU < 5% for 7 days",
    potentialSavings: 142.80, recommendation: "rightsizing_to_t3.medium",
  },
  {
    instanceId: "i-0def456ghi789012b", instanceType: "r5.2xlarge", state: "running",
    name: "prod-db-replica-02", region: "us-west-2", az: "us-west-2b",
    cpu7dayAvg: 18.4, cpu30dayAvg: 21.2, memorySizeGB: 64, vcpus: 8,
    monthlyCost: 483.20, hourlyRate: 0.504, launchTime: "2024-07-20",
    tags: { Environment: "production", Team: "backend", Project: "database" },
    isIdle: false, idleReason: null,
    potentialSavings: 0, recommendation: null,
  },
  {
    instanceId: "i-0ghi789jkl012345c", instanceType: "t3.large", state: "running",
    name: "staging-api-server-01", region: "us-east-1", az: "us-east-1b",
    cpu7dayAvg: 1.8, cpu30dayAvg: 2.3, memorySizeGB: 8, vcpus: 2,
    monthlyCost: 60.74, hourlyRate: 0.0832, launchTime: "2024-11-02",
    tags: { Environment: "staging", Team: "backend", Project: "api" },
    isIdle: true, idleReason: "CPU < 5% for 7 days",
    potentialSavings: 60.74, recommendation: "terminate_or_stop",
  },
  {
    instanceId: "i-0jkl012mno345678d", instanceType: "c5.4xlarge", state: "running",
    name: "prod-ml-training-01", region: "us-east-2", az: "us-east-2a",
    cpu7dayAvg: 76.3, cpu30dayAvg: 68.9, memorySizeGB: 32, vcpus: 16,
    monthlyCost: 552.96, hourlyRate: 0.68, launchTime: "2024-10-10",
    tags: { Environment: "production", Team: "data-science", Project: "ml-pipeline" },
    isIdle: false, idleReason: null,
    potentialSavings: 0, recommendation: null,
  },
  {
    instanceId: "i-0mno345pqr678901e", instanceType: "m5.large", state: "stopped",
    name: "dev-test-server-03", region: "eu-west-1", az: "eu-west-1c",
    cpu7dayAvg: 0, cpu30dayAvg: 0, memorySizeGB: 8, vcpus: 2,
    monthlyCost: 14.40, hourlyRate: 0.00, launchTime: "2024-06-01",
    tags: { Environment: "development", Team: "qa", Project: "testing" },
    isIdle: true, idleReason: "Instance stopped for 14+ days",
    potentialSavings: 14.40, recommendation: "terminate",
  },
];

export const awsOrphanedResources = [
  {
    resourceId: "vol-0abc123def456789a", type: "EBS Volume", name: "unattached-vol-prod-01",
    region: "us-east-1", sizeGB: 500, volumeType: "gp3", state: "available",
    monthlyCost: 40.00, createdAt: "2024-08-10", lastAttached: "2024-10-01",
    tags: { Environment: "production" }, savingsIfDeleted: 40.00,
  },
  {
    resourceId: "vol-0def456ghi789012b", type: "EBS Volume", name: "data-backup-vol-02",
    region: "us-west-2", sizeGB: 1000, volumeType: "gp2", state: "available",
    monthlyCost: 100.00, createdAt: "2024-05-20", lastAttached: "2024-09-15",
    tags: {}, savingsIfDeleted: 100.00,
  },
  {
    resourceId: "eipalloc-0abc123def", type: "Elastic IP", name: "unattached-eip-01",
    region: "us-east-1", sizeGB: null, volumeType: null, state: "unattached",
    monthlyCost: 3.60, createdAt: "2024-07-15", lastAttached: "2024-08-30",
    tags: { Project: "decommissioned" }, savingsIfDeleted: 3.60,
  },
  {
    resourceId: "eipalloc-0def456ghi", type: "Elastic IP", name: "unattached-eip-02",
    region: "eu-west-1", sizeGB: null, volumeType: null, state: "unattached",
    monthlyCost: 3.60, createdAt: "2024-09-01", lastAttached: null,
    tags: {}, savingsIfDeleted: 3.60,
  },
  {
    resourceId: "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/unused-lb-01",
    type: "Load Balancer", name: "unused-alb-prod-01",
    region: "us-east-1", sizeGB: null, volumeType: null, state: "active",
    monthlyCost: 18.00, createdAt: "2024-06-10", lastAttached: "2024-10-20",
    tags: { Project: "deprecated-service" }, savingsIfDeleted: 18.00,
  },
  {
    resourceId: "snap-0abc123def456789", type: "EBS Snapshot", name: "old-prod-snapshot-042",
    region: "us-east-1", sizeGB: 800, volumeType: null, state: "completed",
    monthlyCost: 32.00, createdAt: "2024-01-15", lastAttached: null,
    tags: { Purpose: "backup" }, savingsIfDeleted: 32.00,
  },
];

export const awsRegionBreakdown = [
  { region: "us-east-1", label: "US East (N. Virginia)", cost: 41200, percent: 50.0 },
  { region: "us-west-2", label: "US West (Oregon)", cost: 18600, percent: 22.6 },
  { region: "eu-west-1", label: "Europe (Ireland)", cost: 11400, percent: 13.8 },
  { region: "us-east-2", label: "US East (Ohio)", cost: 7200, percent: 8.7 },
  { region: "ap-southeast-1", label: "Asia Pacific (Singapore)", cost: 4000, percent: 4.9 },
];
