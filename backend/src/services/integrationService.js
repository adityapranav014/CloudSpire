import axios from 'axios';

export const notifySlack = async (webhookUrl, message, details = {}) => {
    try {
        const payload = {
            text: message,
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*${message}*\n${Object.entries(details).map(([k, v]) => `• *${k}:* ${v}`).join('\n')}`
                    }
                }
            ]
        };
        await axios.post(webhookUrl, payload);
        return true;
    } catch (error) {
        console.error("Slack webhook failed:", error.message);
        return false;
    }
};

export const createJiraTicket = async (jiraUrl, apiKey, projectKey, summary, description) => {
    try {
        // Simple Jira API payload map
        const payload = {
            fields: {
                project: { key: projectKey },
                summary: summary,
                description: description,
                issuetype: { name: "Task" }
            }
        };
        await axios.post(`${jiraUrl}/rest/api/2/issue`, payload, {
            headers: {
                'Authorization': `Basic ${Buffer.from(apiKey).toString('base64')}`,
                'Content-Type': 'application/json'
            }
        });
        return true;
    } catch (error) {
        console.error("Jira Integration failed:", error.message);
        return false;
    }
};

export const sendGenericWebhook = async (webhookUrl, eventType, data) => {
    try {
        await axios.post(webhookUrl, {
            event: eventType,
            timestamp: new Date().toISOString(),
            data
        });
        return true;
    } catch (error) {
        console.error(`Webhook to ${webhookUrl} failed:`, error.message);
        return false;
    }
};
