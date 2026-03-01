import { defineAction } from "astro:actions";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { getProcessDataFromRemote } from "@saphal/shared";

const credentials = {
  accessKeyId: import.meta.env.DYNAMODB_ACCESS_KEY_ID,
  secretAccessKey: import.meta.env.DYNAMODB_SECRET_ACCESS_KEY,
};

const dynamoDBClient = new DynamoDBClient({
  region: import.meta.env.AWS_REGION,
  credentials,
});
const dynamoDBDocumentClient = DynamoDBDocumentClient.from(dynamoDBClient);

const getProcessStatus = defineAction({
  handler: async () => {
    const response = await getProcessDataFromRemote(
      dynamoDBDocumentClient,
      import.meta.env.DYNAMODB_TABLE_NAME,
      true,
      1
    );
    const processTimestamp: string[] = [];
    const processes = (response || []).map(item => {
      const hmap: {
        [_: string]: boolean;
      } = {};
      const payload: {
        appName: string;
        isRunning: boolean;
      }[] = (item as any).payload || [];

      processTimestamp.push(item.createdAt);
      payload.forEach(process => {
        hmap[process.appName] = process.isRunning;
      });

      return hmap;
    });

    return [processes.length > 0, processes[0] || {}, processTimestamp[0] || null];
  },
});

export const server = {
  getProcessStatus,
};
