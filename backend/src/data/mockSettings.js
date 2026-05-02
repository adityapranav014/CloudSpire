export const mockSettings = {
    integrations: [
        { key: 'slack', name: 'Slack', connected: false, description: 'Get anomaly alerts and spend digests in Slack.' },
        { key: 'teams', name: 'Microsoft Teams', connected: false, description: 'Receive CloudSpire notifications in MS Teams channels.' },
        { key: 'jira', name: 'Jira', connected: false, description: 'Auto-create tickets for anomalies and optimization tasks.' },
        { key: 'pagerduty', name: 'PagerDuty', connected: false, description: 'Page on-call engineers for critical spend anomalies.' },
        { key: 'terraform', name: 'Terraform', connected: true, description: 'Manage cloud resources with Terraform integration.' },
        { key: 'githubActions', name: 'GitHub Actions', connected: false, description: 'Trigger cost reports in CI/CD pipelines.' },
    ],
    apiKeys: [
        { name: 'Production API Key', key: 'csp_live_xxxxxxxxxxxxxxxxxxxx', created: 'Jan 10, 2025', lastUsed: '2 hours ago' },
        { name: 'CI/CD Integration', key: 'csp_live_yyyyyyyyyyyyyyyyyyyy', created: 'Mar 1, 2025', lastUsed: '3 days ago' },
    ]
};
