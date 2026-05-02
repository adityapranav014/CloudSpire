import { Resend } from 'resend';

// Use a mock key if environment variable isn't present during prototype transition
const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_123456789');

export const sendEmail = async ({ to, subject, html }) => {
    try {
        const data = await resend.emails.send({
            from: 'CloudSpire Notifications <noreply@cloudspire.com>',
            to,
            subject,
            html,
        });
        return data;
    } catch (error) {
        console.error('Email sending failed:', error);
        // Throwing error might crash synchronous flows; typically we just log it in an async worker
        throw new Error('Email sending failed');
    }
};

export const sendTeamInviteEmail = async (email, inviterName, teamName, inviteLink) => {
    return sendEmail({
        to: email,
        subject: `You have been invited to join ${teamName} on CloudSpire`,
        html: `
            <h2>Team Invitation</h2>
            <p>${inviterName} has invited you to manage cloud spend for <strong>${teamName}</strong>.</p>
            <a href="${inviteLink}" style="padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation</a>
        `
    });
};

export const sendAnomalyAlertEmail = async (email, anomalyDetails) => {
    return sendEmail({
        to: email,
        subject: `CloudSpire Alert: Spending Anomaly Detected (${anomalyDetails.service})`,
        html: `
            <h2>Anomaly Detected</h2>
            <p>We detected an unexpected spend of <strong>$${anomalyDetails.actualSpend}</strong> in ${anomalyDetails.service}, deviating from the expected $${anomalyDetails.expectedSpend}.</p>
            <p>Please log in to your CloudSpire dashboard to review and acknowledge this anomaly.</p>
        `
    });
};
