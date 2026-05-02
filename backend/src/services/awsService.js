import { CostExplorerClient, GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";
import { EC2Client, DescribeInstancesCommand, StopInstancesCommand } from "@aws-sdk/client-ec2";
import { AppError } from "../utils/AppError.js";

// Helper to instantiate clients
const getAwsClients = (credentials) => {
    if (!credentials || !credentials.accessKey || !credentials.secretKey) {
        throw new Error("Missing AWS credentials");
    }
    const config = {
        region: "us-east-1", // Default region or configure dynamically
        credentials: {
            accessKeyId: credentials.accessKey,
            secretAccessKey: credentials.secretKey,
        }
    };
    return {
        ceClient: new CostExplorerClient(config),
        ec2Client: new EC2Client(config)
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
        console.error("AWS CE Error:", error);
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
        console.error("AWS EC2 Error:", error);
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
        console.error("AWS Optimization Error:", error);
        throw new Error("Failed to execute AWS optimization");
    }
};
