import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandInput,
  UpdateCommand,
  UpdateCommandInput,
} from "@aws-sdk/lib-dynamodb";

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
export async function updateClaim(claim: claimTableObject): Promise<number> {
  try {
    // Get by submission ID to confirm exists
    const getParams: GetCommandInput = {
      TableName: process.env.ClaimsTable || "",
      Key: {
        submissionID: claim.submissionID,
      },
    };
    const getCommand = new GetCommand(getParams);
    const getRes = await dynamo.send(getCommand);

    if (!getRes.Item) {
      throw new Error(
        `Claim with submission ID: ${claim.submissionID} was not found.`
      );
    }

    const params: PutCommandInput = {
      TableName: process.env.ClaimsTable || "",
      Item: claim,
    };

    const putCommand = new PutCommand(params);
    const res = await dynamo.send(putCommand);

    console.log(res);
    if (!res.$metadata.httpStatusCode) {
      throw new Error("Failed to send update database call");
    }
    return res.$metadata.httpStatusCode;
  } catch (err) {
    console.error((err as Error).message);
    throw err;
  }
}
