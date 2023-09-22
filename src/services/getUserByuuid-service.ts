import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB and S3 Connection
const dynamo = new DynamoDBClient({ region: "ca-central-1" });

export async function getUserByUUID(uuid: string) {
  try {
    console.log("grabbing user with uuid:" + uuid);
    if (typeof uuid === "string") {
      uuid = uuid.replaceAll(/[:=<>!]/g, "");
    } else {
      return [];
    }
    const params: QueryCommandInput = {
      TableName: process.env.ERecordsTable || "",
      KeyConditionExpression: "#userUUID = :userUUID",
      ExpressionAttributeNames: {
        "#userUUID": "uuid",
      },
      ExpressionAttributeValues: {
        ":userUUID": uuid,
      },
    };

    const getCommand = new QueryCommand(params);
    const results = [];
    let items;
    do {
      items = await dynamo.send(getCommand);
      results.push(...(items.Items ? items.Items : []));
      params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey !== "undefined");
    const user = results as EligibilityRecord[];
    return user;
  } catch (err) {
    console.error((err as Error).message);
    throw err;
  }
}
