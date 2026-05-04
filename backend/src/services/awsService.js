import { CostExplorerClient, GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";
import { EC2Client, DescribeInstancesCommand, StopInstancesCommand } from "@aws-sdk/client-ec2";
import { logger } from "../utils/logger.js";

// Helper to instantiate clients
const getAwsClients = (credentials) => {
    // Accept both naming conventions from frontend and backend
    const accessKeyId     = credentials.accessKeyId     || credentials.accessKey;
    const secretAccessKey = credentials.secretAccessKey || credentials.secretKey;
    const region          = credentials.region          || 'us-east-1';

    if (!accessKeyId || !secretAccessKey) {
        throw new Error("Missing AWS credentials (accessKeyId/secretAccessKey required)");
    }
    const config = {
        region,
        credentials: { accessKeyId, secretAccessKey },
    };
    return {
        ceClient:  new CostExplorerClient(config),
        ec2Client: new EC2Client(config),
    };
};

export const fetchAwsCostAndUsage = async (credentials, startDate, endDate) => {
    try {
        const { ceClient } = getAwsClients(credentials);
        const command = new GetCostAndUsageCommand({
            TimePeriod: {
                Start: startDate, // "YYYY-MM-DD"
                End: endDate      // "YYYY-MM-DD"
            },
            Granularity: "DAILY",
            Metrics: ["UnblendedCost"],
            GroupBy: [
                { Type: "DIMENSION", Key: "SERVICE" }
            ]
        });

        const response = await ceClient.send(command);
        return response;
    } catch (error) {
        logger.error({ err: error }, "AWS CE Error");
        throw new Error("Failed to fetch AWS Cost and Usage data");
    }
};

export const fetchAwsInstances = async (credentials) => {
    try {
        const { ec2Client } = getAwsClients(credentials);
        const command = new DescribeInstancesCommand({});
        const response = await ec2Client.send(command);
        return response.Reservations.flatMap(r => r.Instances);
    } catch (error) {
        logger.error({ err: error }, "AWS EC2 Error");
        throw new Error("Failed to fetch AWS EC2 instances");
    }
};

export const executeAwsOptimization = async (credentials, action, resourceId) => {
    try {
        const { ec2Client } = getAwsClients(credentials);

        if (action === 'shutdown') {
            const command = new StopInstancesCommand({ InstanceIds: [resourceId] });
            const response = await ec2Client.send(command);
            return response;
        }

        throw new Error(`Action ${action} not supported yet`);
    } catch (error) {
        logger.error({ err: error }, "AWS Optimization Error");
        throw new Error("Failed to execute AWS optimization");
    }
};
