// Unified normalized cost schema — based on AWS CUR 2.0, GCP billing export, Azure Cost Management API

export const UNIFIED_SCHEMA_FIELDS = {
  id: "string — unique record ID",
  timestamp: "ISO 8601 date",
  provider: "aws | gcp | azure",
  accountId: "string",
  accountName: "string",
  service: "string — normalized service name",
  serviceRaw: "string — provider-native service name",
  region: "string",
  cost: "number — USD",
  usageQuantity: "number",
  usageUnit: "string",
  currency: "USD",
  costType: "regular | tax | adjustment | credit | savings",
  resourceId: "string",
  resourceName: "string",
  tags: "object",
  department: "string",
  environment: "string — production | staging | development",
  linkedAccountId: "string",
};

export const generateDailySpend = () => {
  const days = [];
  const today = new Date('2025-04-28');
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const weekday = date.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const baseAWS = isWeekend ? 1800 : 2400;
    const baseGCP = isWeekend ? 900 : 1200;
    const baseAzure = isWeekend ? 600 : 850;
    // deterministic noise based on day index
    const noise = (seed) => ((seed % 7) - 3) * 0.033;
    const aws = +(baseAWS * (1 + noise(i))).toFixed(2);
    const gcp = +(baseGCP * (1 + noise(i + 1))).toFixed(2);
    const azure = +(baseAzure * (1 + noise(i + 2))).toFixed(2);
    days.push({
      date: dateStr,
      aws,
      gcp,
      azure,
      total: +(aws + gcp + azure).toFixed(2),
    });
  }
  return days;
};

export const dailySpend = generateDailySpend();

export const monthlySpend = [
  { month: "Nov 2024", aws: 68400, gcp: 32100, azure: 21800, total: 122300 },
  { month: "Dec 2024", aws: 71200, gcp: 33900, azure: 23400, total: 128500 },
  { month: "Jan 2025", aws: 74800, gcp: 35200, azure: 24100, total: 134100 },
  { month: "Feb 2025", aws: 69300, gcp: 34100, azure: 22900, total: 126300 },
  { month: "Mar 2025", aws: 78100, gcp: 37400, azure: 26300, total: 141800 },
  { month: "Apr 2025", aws: 82400, gcp: 39100, azure: 27900, total: 149400 },
];

export const currentMonthStats = {
  totalSpend: 149400,
  prevMonthSpend: 141800,
  changePercent: +5.36,
  projectedMonthEnd: 158200,
  budgetLimit: 180000,
  budgetUsedPercent: 83,
  savingsIdentified: 18400,
  anomaliesDetected: 3,
};

export const tagBreakdown = {
  Environment: [
    { value: "production", cost: 128400, percent: 85.9 },
    { value: "staging", cost: 14200, percent: 9.5 },
    { value: "development", cost: 6800, percent: 4.6 },
  ],
  Team: [
    { value: "backend", cost: 38600, percent: 25.8 },
    { value: "devops", cost: 48200, percent: 32.3 },
    { value: "data-science", cost: 32100, percent: 21.5 },
    { value: "frontend", cost: 14200, percent: 9.5 },
    { value: "qa", cost: 5300, percent: 3.5 },
    { value: "untagged", cost: 10000, percent: 6.7 },
  ],
  Project: [
    { value: "k8s-cluster", cost: 31200, percent: 20.9 },
    { value: "ml-pipeline", cost: 28400, percent: 19.0 },
    { value: "api", cost: 22100, percent: 14.8 },
    { value: "data-warehouse", cost: 18600, percent: 12.5 },
    { value: "web-platform", cost: 14200, percent: 9.5 },
    { value: "others", cost: 34900, percent: 23.3 },
  ],
};
