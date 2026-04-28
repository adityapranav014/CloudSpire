// Anomaly detection and budget alert data

export const anomalies = [
  {
    id: "anom-001",
    provider: "aws",
    service: "AWS Lambda",
    severity: "critical",
    detectedAt: "2025-04-27T14:32:00Z",
    spendToday: 2840,
    expectedSpend: 820,
    deviationPercent: 246,
    deviationAmount: 2020,
    description: "Lambda invocation spike detected in us-east-1. 18.7x normal call volume.",
    possibleCause: "Runaway recursive function in prod-data-processor",
    affectedResource: "arn:aws:lambda:us-east-1:123:function:prod-data-processor",
    status: "open",
    actionUrl: "/optimizer",
  },
  {
    id: "anom-002",
    provider: "gcp",
    service: "BigQuery",
    severity: "high",
    detectedAt: "2025-04-26T09:15:00Z",
    spendToday: 1240,
    expectedSpend: 480,
    deviationPercent: 158,
    deviationAmount: 760,
    description: "BigQuery analysis costs exceeded 2.5x moving average. Large unoptimized query detected.",
    possibleCause: "Full table scan on billing_export (1.2TB processed)",
    affectedResource: "projects/data-analytics-prod-002/datasets/billing_dataset",
    status: "open",
    actionUrl: "/cost-explorer",
  },
  {
    id: "anom-003",
    provider: "azure",
    service: "Azure Cognitive Services",
    severity: "medium",
    detectedAt: "2025-04-25T11:40:00Z",
    spendToday: 420,
    expectedSpend: 260,
    deviationPercent: 61.5,
    deviationAmount: 160,
    description: "Cognitive Services (GPT-4) API calls increased 61.5% compared to weekly average.",
    possibleCause: "New AI feature rollout in staging environment hitting production endpoints",
    affectedResource: "/subscriptions/a1b2c3/resourceGroups/rg-prod-ai/providers/Microsoft.CognitiveServices/accounts/cs-prod-001",
    status: "acknowledged",
    actionUrl: "/accounts",
  },
  {
    id: "anom-004",
    provider: "aws",
    service: "Amazon EC2",
    severity: "low",
    detectedAt: "2025-04-24T08:00:00Z",
    spendToday: 3200,
    expectedSpend: 2800,
    deviationPercent: 14.3,
    deviationAmount: 400,
    description: "EC2 spend marginally above threshold. New m5.2xlarge instance launched without tagging.",
    possibleCause: "Untagged resource launched in eu-west-1 by user john.doe@company.com",
    affectedResource: "i-0xyz999abc888def7",
    status: "resolved",
    actionUrl: "/accounts",
  },
];

export const budgetAlerts = [
  { id: "budget-001", name: "Total Monthly Budget", provider: "all", limit: 180000, current: 149400, percent: 83, status: "warning", forecastedEnd: 158200 },
  { id: "budget-002", name: "AWS Production Account", provider: "aws", limit: 90000, current: 82400, percent: 91.6, status: "critical", forecastedEnd: 96200 },
  { id: "budget-003", name: "GCP Data Analytics Project", provider: "gcp", limit: 15000, current: 12400, percent: 82.7, status: "warning", forecastedEnd: 14800 },
  { id: "budget-004", name: "Azure Dev & Test", provider: "azure", limit: 10000, current: 6800, percent: 68, status: "ok", forecastedEnd: 7900 },
];

// Generates 30-day anomaly count history for chart
export const anomalyHistory = Array.from({ length: 30 }, (_, i) => {
  const date = new Date('2025-04-28');
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toISOString().split('T')[0],
    count: [0, 0, 1, 0, 0, 2, 0, 1, 0, 0, 0, 1, 3, 0, 0, 1, 0, 2, 0, 0, 1, 0, 0, 0, 1, 2, 0, 1, 1, 3][i],
  };
});
