import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

export interface DynamoDBConfig {
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  tableName: string;
}

export async function getProcessDataFromRemote(
  config: DynamoDBConfig,
  sort = false,
  n = 1
) {
  try {
    const dynamoDBClient = new DynamoDBClient({
      region: config.region,
      credentials: config.credentials,
    });
    const dynamoDBDocumentClient =
      DynamoDBDocumentClient.from(dynamoDBClient);

    const command = new ScanCommand({
      TableName: config.tableName,
    });

    const response = await dynamoDBDocumentClient.send(command);
    let items = response.Items || [];
    if (sort) {
      items = items.sort((a, b) => {
        const aTimestamp = a.createdAt
          ? new Date(a.createdAt).getTime()
          : 0;
        const bTimestamp = b.createdAt
          ? new Date(b.createdAt).getTime()
          : 0;
        return bTimestamp - aTimestamp;
      });
    }

    items = items.slice(0, n);

    return items;
  } catch (error) {
    console.error("Error initializing DynamoDB client:", error);
  }
}
