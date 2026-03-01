import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

export async function getProcessDataFromRemote(
  docClient: DynamoDBDocumentClient,
  tableName: string,
  sort = false,
  n = 1
) {
  try {
    const command = new ScanCommand({
      TableName: tableName,
    });

    const response = await docClient.send(command);
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
