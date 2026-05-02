import axios from "axios";

const getAccessToken = async (tenantId, clientId, clientSecret) => {
  try {
    const response = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://management.azure.com/.default"
      })
    );
    return response.data.access_token;
  } catch (error) {
    console.error("Azure Token Error:", error.response?.data || error.message);
    throw new Error("Failed to authenticate with Azure");
  }
};

export const fetchAzureCostAndUsage = async (credentials, startDate, endDate) => {
  try {
    const token = await getAccessToken(
      credentials.tenantId,
      credentials.clientId,
      credentials.clientSecret
    );

    const response = await axios.post(
      `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.CostManagement/query?api-version=2021-10-01`,
      {
        type: "Usage",
        timeframe: "Custom",
        timePeriod: {
          from: `${startDate}T00:00:00Z`,
          to: `${endDate}T23:59:59Z`
        },
        dataset: {
          granularity: "Daily",
          aggregation: {
            totalCost: { name: "PreTaxCost", function: "Sum" }
          },
          grouping: [{ type: "Dimension", name: "ServiceName" }]
        }
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data.properties.rows;
  } catch (error) {
    console.error("Azure CE Error:", error.response?.data || error.message);
    throw new Error("Failed to fetch Azure Cost and Usage data");
  }
};

export const fetchAzureVMs = async (credentials) => {
  try {
    const token = await getAccessToken(
      credentials.tenantId,
      credentials.clientId,
      credentials.clientSecret
    );

    const response = await axios.get(
      `https://management.azure.com/subscriptions/${credentials.subscriptionId}/providers/Microsoft.Compute/virtualMachines?api-version=2021-03-01`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data.value || [];
  } catch (error) {
    console.error("Azure VM Error:", error.response?.data || error.message);
    throw new Error("Failed to fetch Azure VMs");
  }
};
