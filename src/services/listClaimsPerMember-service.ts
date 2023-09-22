import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ScanCommand, ScanCommandInput } from "@aws-sdk/lib-dynamodb";
import { NotFoundError } from "../types/NotFoundError";

// Initialize DynamoDB and S3 Connection
const dynamo = new DynamoDBClient({ region: "ca-central-1" });

/**
 * Function to create claim via admins
 * @param submissionID
 * @param userUUID
 * @param status
 * @param receivedTime
 * @param type
 * @param claimID
 * @returns status code
 */
export async function listClaimsPerMember(userUUID: string) {
  try {
    // Search by query
    const params: ScanCommandInput = {
      TableName: process.env.ClaimsTable || "",
      FilterExpression: `userUUID = :userUUID`,
      ExpressionAttributeValues: {
        ":userUUID": userUUID,
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

    // Transforms Claim.eobFile to boolean - hides S3 key
    const response = scanResults.map((claim) => {
      claim.eobFile = !!claim.eobFile;
      return claim;
    });
    return response as claimTableObject[];
  } catch (err) {
    console.error((err as Error).message);
    throw err;
  }
}
