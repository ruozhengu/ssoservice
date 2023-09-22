import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, PutCommandInput } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB and S3 Connection
const dynamo = new DynamoDBClient({ region: "ca-central-1" });

/**
 * Function to create claim via admins
 * @param submissionID
 * @param memberID
 * @param status
 * @param receivedTime
 * @param type
 * @param claimID
 * @returns status code
 */
export async function createClaim(claim: claimTableObject): Promise<number> {
  try {
    const item: claimTableObject = {
      submissionID: claim.submissionID || "",
      userUUID: claim.userUUID || "",
      memberID: claim.memberID || "",
      status: claim.status || "in progress",
      receivedTime: claim.receivedTime || "",
      createdTime: claim.createdTime || "",
      type: claim.type || "claim",
      claimID: claim.claimID || "",
    };
    const params: PutCommandInput = {
      TableName: process.env.ClaimsTable || "",
      Item: item,
    };

    const putCommand = new PutCommand(params);
    const res = await dynamo.send(putCommand);
    if (!res.$metadata.httpStatusCode) {
      throw new Error("Failed to send database call");
    }
    return res.$metadata.httpStatusCode;
  } catch (err) {
    console.error((err as Error).message);
    throw err;
  }
}
