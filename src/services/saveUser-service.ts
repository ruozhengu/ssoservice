import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, PutCommandInput } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB and S3 Connection
const dynamo = new DynamoDBClient({ region: "ca-central-1" });

export async function saveUser(user: EligibilityRecord) {
  try {
    if (!process.env.ERecordsTable) {
      console.error("No ERecordsTable loaded in environment.");
      throw new Error("No ERecordsTable loaded in environment.");
    }

    // TODO create DTO
    const item: EligibilityRecord = {
      ...user,
    };

    const params: PutCommandInput = {
      TableName: process.env.ERecordsTable || "",
      Item: item,
    };

    const putCommand = new PutCommand(params);
    const res = await dynamo.send(putCommand);
    return res;
  } catch (err) {
    console.error((err as Error).message);
    throw err;
  }
}
