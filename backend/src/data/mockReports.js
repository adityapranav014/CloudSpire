export const mockReports = {
    reportTemplates: [
        { id: 1, title: 'Monthly Cost Digest', description: 'PDF summary of all providers with trend analysis and top cost drivers.', iconName: 'BarChart3', color: 'var(--accent-primary)' },
        { id: 2, title: 'Cost by Team', description: 'Budget vs actuals breakdown per team for finance allocation.', iconName: 'Users2', color: 'var(--accent-emerald)' },
        { id: 3, title: 'Anomaly Report', description: 'All detected anomalies with root cause analysis and resolution status.', iconName: 'ShieldAlert', color: 'var(--accent-rose)' },
        { id: 4, title: 'RI Utilization', description: 'Reserved Instance and Committed Use Discount coverage report.', iconName: 'Layers', color: 'var(--accent-violet)' },
        { id: 5, title: 'Year-over-Year', description: '12-month trend comparison across all cloud providers and services.', iconName: 'TrendingUp', color: 'var(--accent-amber)' },
        { id: 6, title: 'Custom Report', description: 'Build your own report by selecting dimensions, filters, and date range.', iconName: 'SlidersHorizontal', color: 'var(--accent-cyan)' },
    ],
    scheduledReports: [
        { id: 1, name: 'Monthly Cost Digest', frequency: 'Monthly', recipients: 'cfo@company.com', format: 'PDF', lastSent: 'Apr 1, 2025', nextSend: 'May 1, 2025' },
        { id: 2, name: 'Weekly Anomalies', frequency: 'Weekly', recipients: 'devops@company.com', format: 'Email', lastSent: 'Apr 22, 2025', nextSend: 'Apr 29, 2025' },
        { id: 3, name: 'Team Budget Report', frequency: 'Monthly', recipients: 'finance@company.com', format: 'CSV', lastSent: 'Apr 1, 2025', nextSend: 'May 1, 2025' },
    ]
};
