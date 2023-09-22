import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ScanCommand, ScanCommandInput } from "@aws-sdk/lib-dynamodb";
import { NotFoundError } from "../types/NotFoundError";

// Initialize DynamoDB and S3 Connection
const dynamo = new DynamoDBClient({ region: "ca-central-1" });

/**
 * @param memberID
 * @returns status code
 */
export async function listDependantsPerMember(
  memberID: string,
  policyNumber: string
) {
  try {
    // Search by query
    const params: ScanCommandInput = {
      TableName: process.env.CRecordsTable || "",
      FilterExpression: `memberID = :memberID`,
      ExpressionAttributeValues: {
        ":memberID": memberID,
      },
    };
    const scanCommand = new ScanCommand(params);
    const scanResults = [];
    let items;
    do {
      items = await dynamo.send(scanCommand);
      scanResults.push(...(items.Items ? items.Items : []));
      params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey !== "undefined");

    const response = scanResults.filter((x) => x.policyNumber === policyNumber);
    return response;
  } catch (err) {
    console.error((err as Error).message);
    throw err;
  }
}
