import { defineAction } from "astro:actions";
import OpenProcessesDataManagerSingleton from "../lib/OpenProcessesDataManager";
import { 
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb"
import { awsCredentialsProvider } from "@vercel/functions/oidc";

const credentials = import.meta.env.DEPLOY_MODE === "prod" ? awsCredentialsProvider({
  roleArn: import.meta.env.AWS_ROLE_ARN,
}) : {
  accessKeyId: import.meta.env.DYNAMODB_ACCESS_KEY_ID,
  secretAccessKey: import.meta.env.DYNAMODB_SECRET_ACCESS_KEY
}

const dynamoDBClient = new DynamoDBClient({
  region: import.meta.env.AWS_REGION,
  credentials,
});
const dynamoDBDocumentClient = DynamoDBDocumentClient.from(dynamoDBClient);

async function getProcessDataFromRemote(sort = false, n = 1) {
  try {
    const command = new ScanCommand({
      TableName: import.meta.env.DYNAMODB_TABLE_NAME,
    });

    const response = await dynamoDBDocumentClient.send(command);
    let items = response.Items || [];
    if ( sort ) {
      items = items.sort((a, b) => {
        const aTimestamp = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTimestamp = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTimestamp - aTimestamp; // Sort in descending order
      });
    }
    
    items = items.slice(0, n); // Limit to n items

    return items;
  } catch(error) {
    console.error("Error initializing DynamoDB client:", error);
  }
}

export default defineAction({
  handler: async () => {
    // Deprecated: Data pulled from AWS DynamoDB
    // const manager = OpenProcessesDataManagerSingleton.getInstance();

    // return [manager.hasData(), manager.getDataAsHashMap(), manager.getPreviousTimestamp()];

    const response = await getProcessDataFromRemote(true, 1);
    const processTimestamp: string[] = [];
    const processes = (response || []).map(item => {
      const hmap: {
        [_: string]: boolean,
      } = {};
      const payload: {
        appName: string,
        isRunning: boolean,
      }[] = (item as any).payload || [];

      processTimestamp.push(item.createdAt);
      payload.forEach((process) => {
        hmap[process.appName] = process.isRunning;
      });

      return hmap;
    });

    return [processes.length > 0, processes[0] || {}, processTimestamp[0] || null];
  }
});